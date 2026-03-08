import { describe, expect, it, vi } from 'vitest';
import { ConnectError, Code } from '@connectrpc/connect';
import { errorInterceptor } from './error.interceptor';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/ui/ui-toast/toast.service';

describe('errorInterceptor', () => {
  const createMocks = () => {
    const authService = { logout: vi.fn() } as any as AuthService;
    const router = {
      navigate: vi.fn(),
      url: '/current-page',
    } as any as Router;
    const toast = { show: vi.fn() } as any as ToastService;
    const req = { header: new Headers(), url: 'http://test/api' };
    return { authService, router, toast, req };
  };

  it('should pass through successful requests', async () => {
    const { authService, router, toast, req } = createMocks();
    const interceptor = errorInterceptor(authService, router, toast);
    const expectedResponse = { ok: true };
    const next = vi.fn().mockResolvedValue(expectedResponse);

    const result = await interceptor(next)(req as never);

    expect(result).toBe(expectedResponse);
    expect(authService.logout).not.toHaveBeenCalled();
    expect(toast.show).not.toHaveBeenCalled();
  });

  it('should logout and redirect on Unauthenticated error', async () => {
    const { authService, router, toast, req } = createMocks();
    const interceptor = errorInterceptor(authService, router, toast);
    const error = new ConnectError('unauthenticated', Code.Unauthenticated);
    const next = vi.fn().mockRejectedValue(error);

    await expect(interceptor(next)(req as never)).rejects.toThrow(error);

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/current-page' },
    });
    expect(toast.show).not.toHaveBeenCalled();
  });

  it('should show toast for NotFound error', async () => {
    const { authService, router, toast, req } = createMocks();
    const interceptor = errorInterceptor(authService, router, toast);
    const error = new ConnectError('not found', Code.NotFound);
    const next = vi.fn().mockRejectedValue(error);

    await expect(interceptor(next)(req as never)).rejects.toThrow(error);

    expect(toast.show).toHaveBeenCalledWith('Resource not found', 'error');
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('should show toast for PermissionDenied error', async () => {
    const { authService, router, toast, req } = createMocks();
    const interceptor = errorInterceptor(authService, router, toast);
    const error = new ConnectError('denied', Code.PermissionDenied);
    const next = vi.fn().mockRejectedValue(error);

    await expect(interceptor(next)(req as never)).rejects.toThrow(error);

    expect(toast.show).toHaveBeenCalledWith('Access denied', 'error');
  });

  it('should show toast for Internal error', async () => {
    const { authService, router, toast, req } = createMocks();
    const interceptor = errorInterceptor(authService, router, toast);
    const error = new ConnectError('internal', Code.Internal);
    const next = vi.fn().mockRejectedValue(error);

    await expect(interceptor(next)(req as never)).rejects.toThrow(error);

    expect(toast.show).toHaveBeenCalledWith('Server error, please try again', 'error');
  });

  it('should show toast for Unavailable error', async () => {
    const { authService, router, toast, req } = createMocks();
    const interceptor = errorInterceptor(authService, router, toast);
    const error = new ConnectError('unavailable', Code.Unavailable);
    const next = vi.fn().mockRejectedValue(error);

    await expect(interceptor(next)(req as never)).rejects.toThrow(error);

    expect(toast.show).toHaveBeenCalledWith('Service unavailable, please try again later', 'error');
  });

  it('should use error message as fallback for unmapped error codes', async () => {
    const { authService, router, toast, req } = createMocks();
    const interceptor = errorInterceptor(authService, router, toast);
    const error = new ConnectError('custom error message', Code.AlreadyExists);
    const next = vi.fn().mockRejectedValue(error);

    await expect(interceptor(next)(req as never)).rejects.toThrow(error);

    expect(toast.show).toHaveBeenCalledWith(
      expect.stringContaining('custom error message'),
      'error',
    );
  });

  it('should rethrow non-ConnectError without toast or logout', async () => {
    const { authService, router, toast, req } = createMocks();
    const interceptor = errorInterceptor(authService, router, toast);
    const error = new Error('network failure');
    const next = vi.fn().mockRejectedValue(error);

    await expect(interceptor(next)(req as never)).rejects.toThrow('network failure');

    expect(authService.logout).not.toHaveBeenCalled();
    expect(toast.show).not.toHaveBeenCalled();
  });
});
