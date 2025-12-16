import { ensureDatabaseInitialized } from './db-init';

let dbInitialized = false;
const initPromise = Promise.resolve();

export async function ensureDbInitialized() {
  if (!dbInitialized) {
    try {
      await ensureDatabaseInitialized();
      dbInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }
}
