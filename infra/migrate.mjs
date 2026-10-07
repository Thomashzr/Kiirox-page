#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables if not present
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

async function runMigrations() {
  console.log('=== KIIROX Neon Migration Runner ===');
  console.log(`Connecting to Neon database...`);

  // 1. Ensure migrations table exists
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // 2. Fetch applied migrations
  const appliedRows = await sql`SELECT version FROM schema_migrations;`;
  const applied = new Set(appliedRows.map((r) => r.version));

  // 3. Read migration files
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration file(s) in infra/migrations.`);

  let newlyApplied = 0;

  for (const file of files) {
    const version = path.parse(file).name;

    if (applied.has(version)) {
      console.log(`  - [UP TO DATE] ${file}`);
      continue;
    }

    console.log(`  > Applying ${file}...`);
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Execute migration SQL using raw execution
    // Neon HTTP query endpoint accepts raw strings via sql.query
    await sql.query(content);

    // Record in schema_migrations
    await sql`
      INSERT INTO schema_migrations (version)
      VALUES (${version})
      ON CONFLICT (version) DO NOTHING;
    `;

    console.log(`  ✓ Successfully applied ${file}`);
    newlyApplied++;
  }

  console.log(`=== Migrations Complete: ${newlyApplied} applied, ${files.length - newlyApplied} already present ===`);
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
