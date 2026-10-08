#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;

if (!databaseUrl) {
  const envLocalPath = path.join(rootDir, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf-8');
    const match = envContent.match(/DATABASE_URL="([^"]+)"/);
    if (match) {
      databaseUrl = match[1];
    }
  }
}

if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL is not defined in environment or .env.local');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function runStockConcurrencyTest() {
  console.log('====================================================');
  console.log('🧪 KIIROX — Test de Concurrencia sobre Stock (Fase 9)');
  console.log('====================================================');

  const testCategoryId = 'c9999999-9999-9999-9999-999999999999';
  const testProductId = 'b9999999-9999-9999-9999-999999999999';
  const initialStock = 5;
  const concurrentAttempts = 15;

  try {
    // 1. Setup test fixture
    console.log('\n[1/4] Creando fixture efímero para la prueba...');
    await sql`
      INSERT INTO categories (id, name, slug, description, is_active, sort_order)
      VALUES (${testCategoryId}, 'Test Concurrencia Cat', 'test-concurrencia-cat', 'Cat temporal', true, 999)
      ON CONFLICT (id) DO NOTHING;
    `;

    await sql`
      INSERT INTO products (
        id, sku, name, slug, brand, price, currency, stock,
        low_stock_threshold, status, is_featured, is_new, sort_order, category_id
      )
      VALUES (
        ${testProductId}, 'TEST-CONCURRENCY-SKU', 'Producto Test Concurrencia',
        'producto-test-concurrencia', 'Kiirox Test', 1000.0, 'ARS', ${initialStock},
        2, 'draft', false, false, 999, ${testCategoryId}
      )
      ON CONFLICT (id) DO UPDATE SET stock = ${initialStock};
    `;

    console.log(`✓ Producto creado con stock inicial = ${initialStock} unidades.`);

    // 2. Launch concurrent deduction requests simultaneously
    console.log(`\n[2/4] Disparando ${concurrentAttempts} deducciones SIMULTÁNEAS de 1 unidad...`);
    const startTime = Date.now();

    const attempts = Array.from({ length: concurrentAttempts }, async (_, index) => {
      try {
        // Atomic deduction with check constraint and conditional WHERE
        const updated = await sql`
          UPDATE products
          SET stock = stock - 1, updated_at = NOW()
          WHERE id = ${testProductId} AND stock >= 1
          RETURNING id, stock;
        `;

        if (updated.length > 0) {
          // Record movement audit
          await sql`
            INSERT INTO inventory_movements (
              id, product_id, delta, movement_type, reason, created_at
            )
            VALUES (
              gen_random_uuid(), ${testProductId}, -1, 'sale',
              ${`Venta concurrente worker #${index + 1}`}, NOW()
            );
          `;
          return { worker: index + 1, status: 'SUCCESS', remainingStock: updated[0].stock };
        } else {
          return { worker: index + 1, status: 'REJECTED_INSUFFICIENT_STOCK' };
        }
      } catch (err) {
        return { worker: index + 1, status: 'ERROR', message: err.message };
      }
    });

    const results = await Promise.all(attempts);
    const duration = Date.now() - startTime;

    // 3. Analyze results
    console.log(`\n[3/4] Análisis de resultados en ${duration}ms:`);
    const successCount = results.filter((r) => r.status === 'SUCCESS').length;
    const rejectedCount = results.filter((r) => r.status === 'REJECTED_INSUFFICIENT_STOCK').length;
    const errorCount = results.filter((r) => r.status === 'ERROR').length;

    console.log(`  - Peticiones exitosas: ${successCount} (esperado: ${initialStock})`);
    console.log(`  - Peticiones rechazadas por stock insuficiente: ${rejectedCount} (esperado: ${concurrentAttempts - initialStock})`);
    console.log(`  - Errores de base de datos no capturados: ${errorCount}`);

    // Verify stock in database
    const finalRows = await sql`SELECT stock FROM products WHERE id = ${testProductId}`;
    const finalStock = finalRows[0]?.stock;
    console.log(`  - Stock final registrado en PostgreSQL: ${finalStock} (esperado: 0)`);

    const movementsCountRows = await sql`
      SELECT COUNT(*)::int as count FROM inventory_movements WHERE product_id = ${testProductId}
    `;
    const recordedMovements = movementsCountRows[0]?.count;
    console.log(`  - Movimientos auditados en Kardex: ${recordedMovements} (esperado: ${initialStock})`);

    // Assertions
    if (finalStock < 0) {
      throw new Error(`CRÍTICO: El stock final es NEGATIVO (${finalStock}). Falló la integridad referencial.`);
    }

    if (successCount !== initialStock) {
      throw new Error(`CRÍTICO: Éxitos (${successCount}) no coincide con stock inicial (${initialStock}).`);
    }

    if (finalStock !== 0) {
      throw new Error(`CRÍTICO: El stock final debería ser 0, pero es ${finalStock}.`);
    }

    if (recordedMovements !== initialStock) {
      throw new Error(`CRÍTICO: Movimientos en Kardex (${recordedMovements}) no coincide con éxitos (${initialStock}).`);
    }

    console.log('\n✅ ASSERTIONS APROBADAS:');
    console.log('  ✓ No se produjo sobreventa (overselling).');
    console.log('  ✓ El stock nunca fue negativo.');
    console.log('  ✓ La atomicidad SQL impidió condiciones de carrera (Race Conditions).');
    console.log('  ✓ El Kardex registró exactamente los movimientos concedidos.');

    // 4. Cleanup fixture
    console.log('\n[4/4] Limpiando fixture efímero...');
    await sql`DELETE FROM inventory_movements WHERE product_id = ${testProductId}`;
    await sql`DELETE FROM products WHERE id = ${testProductId}`;
    await sql`DELETE FROM categories WHERE id = ${testCategoryId}`;
    console.log('✓ Limpieza completada.');

    console.log('\n🎉 TEST DE CONCURRENCIA DE STOCK FINALIZADO CON ÉXITO.\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ ERROR EN EL TEST DE CONCURRENCIA:', err);
    // Cleanup attempt on failure
    try {
      await sql`DELETE FROM inventory_movements WHERE product_id = ${testProductId}`;
      await sql`DELETE FROM products WHERE id = ${testProductId}`;
      await sql`DELETE FROM categories WHERE id = ${testCategoryId}`;
    } catch (_) {}
    process.exit(1);
  }
}

runStockConcurrencyTest();
