import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { TransportToken } from '../providers/transport.token';
import { UserRole } from '../api/api/v1/auth_pb';
import { vi } from 'vitest';
import { provideRouter } from '@angular/router';

describe('AuthService', () => {
  let service: AuthService;
  const mockTransport = {};


  beforeEach(() => {
    // Reset localStorage to an empty real implementation for each test
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => { store[key] = val; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    });
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideRouter([]),
        { provide: TransportToken, useValue: mockTransport },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial state', () => {
    it('should start with null user and loading=true before checkSession', () => {
      expect(service.user()).toBeNull();
      expect(service.token()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('checkSession', () => {
    it('should set loading=false when auth_user JSON is malformed', () => {
      const fakePayload = { exp: Math.floor(Date.now() / 1000) + 3600 };
      const encoded = btoa(JSON.stringify(fakePayload));
      localStorage.setItem('auth_token', `header.${encoded}.sig`);
      localStorage.setItem('auth_user', 'not-valid-json{{{');

      service.checkSession();

      expect(service.isLoading()).toBe(false);
      expect(service.user()).toBeNull();
      // Bad auth_user JSON should be cleared
      expect(localStorage.getItem('auth_user')).toBeNull();
    });

    it('should set loading=false with null token when no localStorage data', () => {
      service.checkSession();
      expect(service.isLoading()).toBe(false);
      expect(service.user()).toBeNull();
    });

    it('should clear expired token and set loading=false', () => {
      const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 10 };
      const encoded = btoa(JSON.stringify(expiredPayload));
      localStorage.setItem('auth_token', `header.${encoded}.sig`);
      localStorage.setItem('auth_user', JSON.stringify({ id: 'u1' }));

      service.checkSession();

      expect(service.user()).toBeNull();
      expect(service.isLoading()).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });


  describe('logout', () => {
    it('should clear user and token signals', () => {
      (service as any).user.set({ id: 'u1' });
      (service as any).token.set('tok');
      localStorage.setItem('auth_token', 'tok');
      localStorage.setItem('auth_user', '{}');

      // In JSDOM, window.location.reload is non-configurable so we stub the whole object
      const mockReload = vi.fn();
      vi.stubGlobal('location', { ...window.location, reload: mockReload, href: '/' });

      service.logout();

      expect(service.user()).toBeNull();
      expect(service.token()).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('auth_user')).toBeNull();

      vi.unstubAllGlobals();
    });
  });


  describe('Admin API Calls', () => {
    it('should call listUsers on client', async () => {
      const mockResponse = { users: [], nextPageToken: '' };
      const clientSpy = vi
        .spyOn((service as any).client, 'listUsers')
        .mockResolvedValue(mockResponse);

      await service.listUsers(1, 10);
      expect(clientSpy).toHaveBeenCalledWith({ pageSize: 10, pageToken: '0' });
    });

    it('should call listUsers on client with token directly', async () => {
      const mockResponse = { users: [], nextPageToken: '' };
      const clientSpy = vi
        .spyOn((service as any).client, 'listUsers')
        .mockResolvedValue(mockResponse);

      await service.listUsers('40', 20);
      expect(clientSpy).toHaveBeenCalledWith({ pageSize: 20, pageToken: '40' });
    });

    it('should call updateUserRole on client', async () => {
      const clientSpy = vi.spyOn((service as any).client, 'updateUserRole').mockResolvedValue({});

      await service.updateUserRole('user1', UserRole.SYS_ADMIN);
      expect(clientSpy).toHaveBeenCalledWith({ userId: 'user1', role: UserRole.SYS_ADMIN });
    });

    it('should call listAssignableManagers on client', async () => {
      const mockResponse = { users: [] };
      const clientSpy = vi
        .spyOn((service as any).client, 'listAssignableManagers')
        .mockResolvedValue(mockResponse);

      await service.listAssignableManagers('search');
      expect(clientSpy).toHaveBeenCalledWith({ query: 'search' });
    });
  });
});
