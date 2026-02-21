import { WritableSignal } from '@angular/core';

interface WithLoadingOptions {
  rethrow?: boolean;
  onError?: (error: unknown) => void;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Unexpected error';
}

export async function withLoading<T>(
  loading: WritableSignal<boolean>,
  error: WritableSignal<string | null>,
  operation: () => Promise<T>,
  options: WithLoadingOptions = {},
): Promise<T | undefined> {
  loading.set(true);
  error.set(null);
  try {
    return await operation();
  } catch (err) {
    error.set(errorMessage(err));
    options.onError?.(err);
    if (options.rethrow) throw err;
    return undefined;
  } finally {
    loading.set(false);
  }
}
