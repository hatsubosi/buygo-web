import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { TransportToken } from '../providers/transport.token';
import { AuthActions } from './auth.actions';
import { UserRole } from '../api/api/v1/auth_pb';
import { vi } from 'vitest';

describe('AuthService', () => {
    let service: AuthService;
    let store: MockStore;
    const mockTransport = {};

    const initialState = {
        auth: {
            user: null,
            token: null,
            loading: false,
            error: null
        }
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AuthService,
                provideMockStore({ initialState }),
                { provide: TransportToken, useValue: mockTransport }
            ]
        });

        service = TestBed.inject(AuthService);
        store = TestBed.inject(MockStore);
        vi.spyOn(store, 'dispatch');
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Authentication Actions', () => {
        it('should dispatch login action', () => {
            service.login('google', 'token123');
            expect(store.dispatch).toHaveBeenCalledWith(AuthActions.login({ provider: 'google', token: 'token123' }));
        });

        it('should dispatch logout action', () => {
            service.logout();
            expect(store.dispatch).toHaveBeenCalledWith(AuthActions.logout());
        });
    });

    describe('Admin API Calls', () => {
        it('should call listUsers on client', async () => {
            const mockResponse = { users: [], nextPageToken: '' };
            const clientSpy = vi.spyOn((service as any).client, 'listUsers').mockResolvedValue(mockResponse);

            await service.listUsers(1, 10);
            expect(clientSpy).toHaveBeenCalledWith({ pageSize: 10, pageToken: '1' });
        });

        it('should call updateUserRole on client', async () => {
            const clientSpy = vi.spyOn((service as any).client, 'updateUserRole').mockResolvedValue({});

            await service.updateUserRole('user1', UserRole.SYS_ADMIN);
            expect(clientSpy).toHaveBeenCalledWith({ userId: 'user1', role: UserRole.SYS_ADMIN });
        });

        it('should call listAssignableManagers on client', async () => {
            const mockResponse = { users: [] };
            const clientSpy = vi.spyOn((service as any).client, 'listAssignableManagers').mockResolvedValue(mockResponse);

            await service.listAssignableManagers('search');
            expect(clientSpy).toHaveBeenCalledWith({ query: 'search' });
        });
    });
});
