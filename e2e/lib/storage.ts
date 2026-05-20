import path from 'node:path';
import { fileURLToPath } from 'node:url';

const E2E_DIR = path.dirname(fileURLToPath(import.meta.url));

export const ADMIN_STORAGE = path.join(E2E_DIR, '../.auth/admin.json');
