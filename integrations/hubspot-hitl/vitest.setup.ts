import { vi } from 'vitest';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from test.env file
config({ path: resolve(__dirname, 'test.env') });

// Make vi globally available
(globalThis as any).vi = vi;
