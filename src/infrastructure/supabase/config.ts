export type PersistenceMode = 'memory' | 'supabase';

/**
 * Determines the active persistence mode based on environment configuration.
 * Defaults to 'memory' for safe in-memory test double operation.
 */
export function getPersistenceMode(): PersistenceMode {
  const mode =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_PERSISTENCE_MODE;
  if (mode === 'supabase') {
    return 'supabase';
  }
  return 'memory';
}
