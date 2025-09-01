import { vi } from 'vitest';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from test.env file
config({ path: resolve(__dirname, 'test.env') });

// Make vi globally available
(globalThis as any).vi = vi;
