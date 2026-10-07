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

function splitSqlStatements(sqlText) {
  const statements = [];
  let current = '';
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sqlText.length; i++) {
    const ch = sqlText[i];
    const next = sqlText[i + 1];

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      current += ch;
    } else if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        current += '*/';
        i++;
      } else {
        current += ch;
      }
    } else if (inString) {
      if (ch === "'" && next === "'") {
        current += "''";
        i++;
      } else if (ch === "'") {
        inString = false;
        current += ch;
      } else {
        current += ch;
      }
    } else {
      if (ch === '-' && next === '-') {
        inLineComment = true;
        current += '--';
        i++;
      } else if (ch === '/' && next === '*') {
        inBlockComment = true;
        current += '/*';
        i++;
      } else if (ch === ';') {
        const trimmed = current.trim();
        if (trimmed.length > 0) {
          statements.push(trimmed);
        }
        current = '';
      } else {
        current += ch;
      }
    }
  }

  const trimmed = current.trim();
  if (trimmed.length > 0) {
    statements.push(trimmed);
  }

  return statements;
}

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
    const statements = splitSqlStatements(content);

    for (const statement of statements) {
      await sql.query(statement);
    }

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
