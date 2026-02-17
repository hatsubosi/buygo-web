import { describe, it, expect } from 'vitest';
import {
    selectAuthState,
    selectUser,
    selectIsAuthenticated,
    selectIsLoading,
    selectIsManager,
    selectToken,
} from './auth.selectors';
import { AuthState } from './auth.reducer';
import { User, UserRole } from '../api/api/v1/auth_pb';

describe('Auth Selectors', () => {
    const testUser = new User({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        photoUrl: 'https://example.com/photo.png',
        role: UserRole.USER,
    });

    const stateWithUser = {
        auth: {
            user: testUser,
            token: 'access-token-123',
            loading: false,
            error: null,
        } as AuthState,
    };

    const stateWithNullUser = {
        auth: {
            user: null,
            token: null,
            loading: true,
            error: null,
        } as AuthState,
    };

    describe('selectAuthState', () => {
        it('should select the auth feature state', () => {
            const result = selectAuthState(stateWithUser as any);
            expect(result).toBe(stateWithUser.auth);
        });
    });

    describe('selectUser', () => {
        it('should return the user when present', () => {
            const result = selectUser(stateWithUser as any);
            expect(result).toBe(testUser);
        });

        it('should return null when user is not set', () => {
            const result = selectUser(stateWithNullUser as any);
            expect(result).toBeNull();
        });
    });

    describe('selectIsAuthenticated', () => {
        it('should return true when user is present', () => {
            const result = selectIsAuthenticated(stateWithUser as any);
            expect(result).toBe(true);
        });

        it('should return false when user is null', () => {
            const result = selectIsAuthenticated(stateWithNullUser as any);
            expect(result).toBe(false);
        });
    });

    describe('selectIsLoading', () => {
        it('should return false when loading is false', () => {
            const result = selectIsLoading(stateWithUser as any);
            expect(result).toBe(false);
        });

        it('should return true when loading is true', () => {
            const result = selectIsLoading(stateWithNullUser as any);
            expect(result).toBe(true);
        });
    });

    describe('selectToken', () => {
        it('should return the token when present', () => {
            const result = selectToken(stateWithUser as any);
            expect(result).toBe('access-token-123');
        });

        it('should return null when token is not set', () => {
            const result = selectToken(stateWithNullUser as any);
            expect(result).toBeNull();
        });
    });

    describe('selectIsManager', () => {
        it('should return true when user role is CREATOR', () => {
            const creatorUser = new User({
                id: 'creator-1',
                name: 'Creator User',
                email: 'creator@example.com',
                role: UserRole.CREATOR,
            });
            const state = {
                auth: {
                    user: creatorUser,
                    token: 'token',
                    loading: false,
                    error: null,
                } as AuthState,
            };
            const result = selectIsManager(state as any);
            expect(result).toBe(true);
        });

        it('should return true when user role is SYS_ADMIN', () => {
            const adminUser = new User({
                id: 'admin-1',
                name: 'Admin User',
                email: 'admin@example.com',
                role: UserRole.SYS_ADMIN,
            });
            const state = {
                auth: {
                    user: adminUser,
                    token: 'token',
                    loading: false,
                    error: null,
                } as AuthState,
            };
            const result = selectIsManager(state as any);
            expect(result).toBe(true);
        });

        it('should return false when user role is USER', () => {
            const result = selectIsManager(stateWithUser as any);
            expect(result).toBe(false);
        });

        it('should return false when user is null', () => {
            const result = selectIsManager(stateWithNullUser as any);
            expect(result).toBe(false);
        });
    });
});
