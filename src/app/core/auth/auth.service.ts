import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { createPromiseClient, Transport } from '@connectrpc/connect';
import { TransportToken } from '../providers/transport.token';
import { AuthService as AuthServiceDef } from '../api/api/v1/auth_connect';
import { User } from '../api/api/v1/auth_pb';
import { UserRole } from '../api/api/v1/auth_pb';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private transport = inject(TransportToken) as Transport;
  private router = inject(Router);
  private client = createPromiseClient(AuthServiceDef, this.transport);

  // State
  readonly user = signal<User | null>(null);
  readonly token = signal<string | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  // Derived
  readonly isAuthenticated = computed(() => !!this.user());
  readonly isManager = computed(() => {
    const role = this.user()?.role;
    return role === UserRole.CREATOR || role === UserRole.SYS_ADMIN;
  });

  async login(provider: string, idToken: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const res = await this.client.login({ idToken });
      if (!res.user) throw new Error('No user returned');
      this._setSession(res.user, res.accessToken);

      // Navigate to returnUrl or default
      const urlTree = this.router.parseUrl(this.router.url);
      const returnUrl = urlTree.queryParams['returnUrl'] || '/groupbuy';
      this.router.navigateByUrl(returnUrl);
    } catch (err: any) {
      this.error.set(err.message || 'Login failed');
    } finally {
      this.isLoading.set(false);
    }
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.user.set(null);
    this.token.set(null);
    this.error.set(null);

    const currentUrl = this.router.url;
    const isProtected =
      currentUrl.startsWith('/user') ||
      currentUrl.startsWith('/manager') ||
      currentUrl.includes('/checkout') ||
      currentUrl.includes('/order-confirmation');

    if (isProtected) {
      this.router.navigate(['/']);
    } else {
      window.location.reload();
    }
  }

  /** Called once at app init to restore session from localStorage. */
  checkSession(): void {
    const storedToken = localStorage.getItem('auth_token');
    const userJson = localStorage.getItem('auth_user');

    if (storedToken && userJson) {
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          this.isLoading.set(false);
          return;
        }
        const userObj = JSON.parse(userJson);
        const user = User.fromJson(userObj);
        this._setSession(user, storedToken, /* persist */ false);
      } catch {
        localStorage.removeItem('auth_user');
      }
    }
    this.isLoading.set(false);
  }

  // Admin Methods
  async listUsers(pageOrToken: number | string = 1, pageSize = 20) {
    const pageToken =
      typeof pageOrToken === 'number'
        ? Math.max(0, (pageOrToken - 1) * pageSize).toString()
        : pageOrToken;
    return this.client.listUsers({ pageSize, pageToken });
  }

  async updateUserRole(userId: string, role: UserRole) {
    return this.client.updateUserRole({ userId, role });
  }

  async listAssignableManagers(query = '') {
    return this.client.listAssignableManagers({ query });
  }

  private _setSession(user: User, accessToken: string, persist = true): void {
    this.user.set(user);
    this.token.set(accessToken);
    if (persist) {
      localStorage.setItem('auth_token', accessToken);
      localStorage.setItem('auth_user', JSON.stringify(user.toJson()));
    }
  }
}
