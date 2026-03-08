import { describe, expect, it, vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  const createMockRequest = () => ({
    header: new Headers(),
    url: 'http://test/api',
    method: 'POST' as const,
  });

  it('should add Authorization header when token exists', async () => {
    const mockAuthService = {
      token: vi.fn().mockReturnValue('test-token'),
    } as unknown as AuthService;
    const interceptor = authInterceptor(mockAuthService);
    const req = createMockRequest();
    const next = vi.fn().mockResolvedValue({ ok: true });

    await interceptor(next)(req as never);

    expect(req.header.get('Authorization')).toBe('Bearer test-token');
    expect(next).toHaveBeenCalledWith(req);
  });

  it('should not add Authorization header when token is null', async () => {
    const mockAuthService = { token: vi.fn().mockReturnValue(null) } as unknown as AuthService;
    const interceptor = authInterceptor(mockAuthService);
    const req = createMockRequest();
    const next = vi.fn().mockResolvedValue({ ok: true });

    await interceptor(next)(req as never);

    expect(req.header.has('Authorization')).toBe(false);
    expect(next).toHaveBeenCalledWith(req);
  });

  it('should not add Authorization header when token is empty string', async () => {
    const mockAuthService = { token: vi.fn().mockReturnValue('') } as unknown as AuthService;
    const interceptor = authInterceptor(mockAuthService);
    const req = createMockRequest();
    const next = vi.fn().mockResolvedValue({ ok: true });

    await interceptor(next)(req as never);

    expect(req.header.has('Authorization')).toBe(false);
  });

  it('should return the response from next', async () => {
    const mockAuthService = { token: vi.fn().mockReturnValue('token') } as unknown as AuthService;
    const interceptor = authInterceptor(mockAuthService);
    const req = createMockRequest();
    const expectedResponse = { ok: true, data: 'test' };
    const next = vi.fn().mockResolvedValue(expectedResponse);

    const result = await interceptor(next)(req as never);

    expect(result).toBe(expectedResponse);
  });
});
