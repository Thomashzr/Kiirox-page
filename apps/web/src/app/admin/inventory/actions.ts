'use server';

import { neon } from '@neondatabase/serverless';
import { revalidatePath } from 'next/cache';
import { verifyAdminAccess } from '../../../lib/admin-auth';
import { InventoryMovementWithProduct, MovementType, PaginatedMovements } from '../../../types';

function getDb() {
  const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
  if (!dbUrl) {
    throw new Error('DATABASE_URL no configurada en las variables de entorno');
  }
  return neon(dbUrl);
}

export interface InventoryProductItem {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brand: string | null;
  price: number;
  currency: string;
  stock: number;
  low_stock_threshold: number;
  status: 'draft' | 'published' | 'archived';
  category_id: string;
  category_name?: string;
  image_url?: string | null;
  stock_status: 'out_of_stock' | 'low_stock' | 'optimal';
}

export interface InventoryStats {
  totalSkus: number;
  totalUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface InventoryOverviewData {
  products: InventoryProductItem[];
  stats: InventoryStats;
}

export async function getInventoryOverview(filters?: {
  search?: string;
  stock_filter?: 'all' | 'low_stock' | 'out_of_stock' | 'optimal';
  category_id?: string;
}): Promise<InventoryOverviewData> {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) throw new Error('No autorizado');

  const sql = getDb();

  const rows = await sql`
    SELECT 
      p.id, p.sku, p.name, p.slug, p.brand,
      p.price::float8 as price, p.currency, p.stock, p.low_stock_threshold,
      p.status, p.category_id,
      c.name as category_name,
      pi.public_url as image_url
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
    ORDER BY 
      CASE 
        WHEN p.stock = 0 THEN 0
        WHEN p.stock <= p.low_stock_threshold THEN 1
        ELSE 2
      END ASC,
      p.stock ASC,
      p.name ASC;
  `;

  const allItems: InventoryProductItem[] = rows.map((r: any) => {
    let stock_status: 'out_of_stock' | 'low_stock' | 'optimal' = 'optimal';
    if (r.stock === 0) {
      stock_status = 'out_of_stock';
    } else if (r.stock <= r.low_stock_threshold) {
      stock_status = 'low_stock';
    }

    return {
      id: r.id,
      sku: r.sku,
      name: r.name,
      slug: r.slug,
      brand: r.brand,
      price: r.price,
      currency: r.currency,
      stock: r.stock,
      low_stock_threshold: r.low_stock_threshold,
      status: r.status,
      category_id: r.category_id,
      category_name: r.category_name,
      image_url: r.image_url,
      stock_status,
    };
  });

  const stats: InventoryStats = {
    totalSkus: allItems.length,
    totalUnits: allItems.reduce((acc, item) => acc + item.stock, 0),
    lowStockCount: allItems.filter((i) => i.stock_status === 'low_stock').length,
    outOfStockCount: allItems.filter((i) => i.stock_status === 'out_of_stock').length,
  };

  let filtered = allItems;
  if (filters?.stock_filter && filters.stock_filter !== 'all') {
    filtered = filtered.filter((i) => i.stock_status === filters.stock_filter);
  }
  if (filters?.category_id && filters.category_id !== 'all') {
    filtered = filtered.filter((i) => i.category_id === filters.category_id);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    filtered = filtered.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        (i.brand && i.brand.toLowerCase().includes(q))
    );
  }

  return {
    products: filtered,
    stats,
  };
}

export async function getInventoryMovements(params?: {
  product_id?: string;
  movement_type?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedMovements> {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) throw new Error('No autorizado');

  const sql = getDb();
  const page = Math.max(1, params?.page || 1);
  const pageSize = Math.min(100, Math.max(1, params?.page_size || 25));
  const offset = (page - 1) * pageSize;

  // Base query with joins
  const items = await sql`
    SELECT 
      im.id, im.product_id, im.delta, im.movement_type, im.reason,
      im.reference_type, im.reference_id, im.admin_user_id,
      im.created_at::text,
      p.name as product_name, p.sku as product_sku,
      au.email as admin_email
    FROM inventory_movements im
    JOIN products p ON im.product_id = p.id
    LEFT JOIN admin_users au ON im.admin_user_id = au.id
    WHERE 
      (${params?.product_id && params.product_id !== 'all' ? sql`im.product_id = ${params.product_id}` : sql`1=1`})
      AND (${params?.movement_type && params.movement_type !== 'all' ? sql`im.movement_type = ${params.movement_type}` : sql`1=1`})
    ORDER BY im.created_at DESC
    LIMIT ${pageSize} OFFSET ${offset};
  `;

  const countResult = await sql`
    SELECT COUNT(*)::int as total
    FROM inventory_movements im
    WHERE 
      (${params?.product_id && params.product_id !== 'all' ? sql`im.product_id = ${params.product_id}` : sql`1=1`})
      AND (${params?.movement_type && params.movement_type !== 'all' ? sql`im.movement_type = ${params.movement_type}` : sql`1=1`});
  `;

  const total = countResult[0]?.total || 0;

  return {
    data: items as InventoryMovementWithProduct[],
    pagination: {
      page,
      page_size: pageSize,
      total,
    },
  };
}

export async function recordStockAdjustmentAction(input: {
  product_id: string;
  delta: number;
  movement_type: MovementType;
  reason?: string;
}): Promise<{ success: boolean; new_stock: number }> {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) throw new Error('No autorizado');

  if (input.delta === 0) {
    throw new Error('El ajuste debe tener una variación distinta de cero.');
  }

  if (!input.reason || input.reason.trim().length === 0) {
    throw new Error('El motivo del ajuste o movimiento es obligatorio.');
  }

  const sql = getDb();

  // 1. Get current stock
  const productRows = await sql`
    SELECT id, stock, low_stock_threshold, name
    FROM products
    WHERE id = ${input.product_id}
    LIMIT 1;
  `;

  if (productRows.length === 0) {
    throw new Error('Producto no encontrado');
  }

  const currentProduct = productRows[0];
  const newStock = currentProduct.stock + input.delta;

  if (newStock < 0) {
    throw new Error(
      `Stock insuficiente: el stock actual es ${currentProduct.stock} y una salida de ${Math.abs(input.delta)} resultaría en saldo negativo (${newStock}).`
    );
  }

  // 2. Validate admin_user_id is a valid UUID or null
  let adminId: string | null = null;
  if (auth.admin.id && auth.admin.id.length === 36 && auth.admin.id.includes('-')) {
    adminId = auth.admin.id;
  }

  // 3. Insert movement
  await sql`
    INSERT INTO inventory_movements (
      id, product_id, delta, movement_type, reason, admin_user_id, created_at
    )
    VALUES (
      gen_random_uuid(),
      ${input.product_id},
      ${input.delta},
      ${input.movement_type},
      ${input.reason.trim()},
      ${adminId},
      NOW()
    );
  `;

  // 4. Update product stock
  await sql`
    UPDATE products
    SET stock = ${newStock}, updated_at = NOW()
    WHERE id = ${input.product_id};
  `;

  revalidatePath('/admin/inventory');
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${input.product_id}`);
  revalidatePath('/admin');
  revalidatePath('/productos');

  return { success: true, new_stock: newStock };
}

export async function getProductMovementHistory(
  productId: string,
  limit: number = 20
): Promise<InventoryMovementWithProduct[]> {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) throw new Error('No autorizado');

  const sql = getDb();

  const rows = await sql`
    SELECT 
      im.id, im.product_id, im.delta, im.movement_type, im.reason,
      im.reference_type, im.reference_id, im.admin_user_id,
      im.created_at::text,
      p.name as product_name, p.sku as product_sku,
      au.email as admin_email
    FROM inventory_movements im
    JOIN products p ON im.product_id = p.id
    LEFT JOIN admin_users au ON im.admin_user_id = au.id
    WHERE im.product_id = ${productId}
    ORDER BY im.created_at DESC
    LIMIT ${limit};
  `;

  return rows as InventoryMovementWithProduct[];
}
