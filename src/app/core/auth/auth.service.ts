import { Injectable, inject, signal, computed } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { selectUser, selectIsAuthenticated, selectIsLoading, selectIsManager } from './auth.selectors';
import { TransportToken } from '../providers/transport.token';
import { createPromiseClient } from '@connectrpc/connect';
import { AuthService as AuthServiceDef } from '../api/api/v1/auth_connect';
import { Transport } from '@connectrpc/connect';
import { UserRole } from '../api/api/v1/auth_pb';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private store = inject(Store);
    private transport = inject(TransportToken) as Transport;
    private client = createPromiseClient(AuthServiceDef, this.transport);

    // Signals exposed to Components
    user = this.store.selectSignal(selectUser);
    isAuthenticated = this.store.selectSignal(selectIsAuthenticated);
    isLoading = this.store.selectSignal(selectIsLoading);
    isManager = this.store.selectSignal(selectIsManager);

    login(provider: string, token: string) {
        this.store.dispatch(AuthActions.login({ provider, token }));
    }

    logout() {
        this.store.dispatch(AuthActions.logout());
    }

    // Admin Methods
    async listUsers(page: number = 1, pageSize: number = 20) {
        return this.client.listUsers({ pageSize, pageToken: page.toString() }); // Simplified for now
    }

    async updateUserRole(userId: string, role: UserRole) {
        return this.client.updateUserRole({ userId, role });
    }

    async listAssignableManagers(query: string = '') {
        return this.client.listAssignableManagers({ query });
    }
}
