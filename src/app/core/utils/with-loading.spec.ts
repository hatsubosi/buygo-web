import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { withLoading } from './with-loading';

describe('withLoading', () => {
  it('sets loading lifecycle and returns value on success', async () => {
    const loading = signal(false);
    const error = signal<string | null>('old');

    const result = await withLoading(loading, error, async () => 42);

    expect(result).toBe(42);
    expect(loading()).toBe(false);
    expect(error()).toBeNull();
  });

  it('captures error without rethrow by default', async () => {
    const loading = signal(false);
    const error = signal<string | null>(null);

    const result = await withLoading(loading, error, async () => {
      throw new Error('boom');
    });

    expect(result).toBeUndefined();
    expect(loading()).toBe(false);
    expect(error()).toBe('boom');
  });

  it('rethrows when rethrow option is enabled', async () => {
    const loading = signal(false);
    const error = signal<string | null>(null);

    await expect(
      withLoading(
        loading,
        error,
        async () => {
          throw new Error('critical');
        },
        { rethrow: true },
      ),
    ).rejects.toThrow('critical');

    expect(loading()).toBe(false);
    expect(error()).toBe('critical');
  });

  it('calls onError callback when operation fails', async () => {
    const loading = signal(false);
    const error = signal<string | null>(null);
    const onError = vi.fn();

    await withLoading(
      loading,
      error,
      async () => {
        throw new Error('failed');
      },
      { onError },
    );

    expect(onError).toHaveBeenCalledTimes(1);
  });
});
