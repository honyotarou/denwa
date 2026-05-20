import Database from 'better-sqlite3';
import { migrateExtensions } from './migrate-extensions.js';
import { SCHEMA_SQL } from './schema-sql.js';

export type ApplySchemaOptions = Readonly<{
  seed?: boolean;
}>;

const SEED_EXTENSIONS_SQL = `
INSERT OR IGNORE INTO extensions (number, display_name, secret, note) VALUES
  ('1001', 'Reception 1001', 'secret-1001', '受付'),
  ('1002', 'Doctor 1002',    'secret-1002', '診察室');
`;

export function applySchema(db: Database.Database, options: ApplySchemaOptions = {}): void {
  const { seed = false } = options;
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA_SQL);
  migrateExtensions(db);
  if (seed) {
    db.exec(SEED_EXTENSIONS_SQL);
  }
}

export function createInMemoryDb(options: ApplySchemaOptions = {}): Database.Database {
  const db = new Database(':memory:');
  applySchema(db, options);
  return db;
}

export function seedExtensions(db: Database.Database): void {
  db.exec(SEED_EXTENSIONS_SQL);
}
