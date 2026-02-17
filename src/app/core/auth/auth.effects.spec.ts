import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, firstValueFrom } from 'rxjs';
import { Action } from '@ngrx/store';
import { Router } from '@angular/router';

import { AuthEffects } from './auth.effects';
import { AuthActions } from './auth.actions';
import { TransportToken } from '../providers/transport.token';
import { LoginResponse, User, UserRole } from '../api/api/v1/auth_pb';

describe('AuthEffects', () => {
    let effects: AuthEffects;
    let actions$: Observable<Action>;
    let mockRouter: { navigate: ReturnType<typeof vi.fn>; navigateByUrl: ReturnType<typeof vi.fn>; url: string; parseUrl: ReturnType<typeof vi.fn> };
    let mockStorage: Record<string, string>;

    const testUser = new User({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        photoUrl: 'https://example.com/photo.png',
        role: UserRole.USER,
    });

    // Helper to create a fake JWT with a given exp (Unix seconds)
    function fakeJwt(exp: number): string {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({ sub: 'user-1', exp }));
        return `${header}.${payload}.fake-signature`;
    }

    beforeEach(() => {
        // Mock localStorage using a simple object store
        mockStorage = {};
        vi.stubGlobal('localStorage', {
            getItem: vi.fn((key: string) => mockStorage[key] ?? null),
            setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
            removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
            clear: vi.fn(() => { mockStorage = {}; }),
            length: 0,
            key: vi.fn(() => null),
        });

        mockRouter = {
            navigate: vi.fn(),
            navigateByUrl: vi.fn(),
            url: '/',
            parseUrl: vi.fn().mockReturnValue({ queryParams: {} }),
        };

        TestBed.configureTestingModule({
            providers: [
                AuthEffects,
                provideMockActions(() => actions$),
                { provide: TransportToken, useValue: {} },
                { provide: Router, useValue: mockRouter },
            ],
        });

        effects = TestBed.inject(AuthEffects);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('login$', () => {
        it('should dispatch loginSuccess on successful login', async () => {
            const loginResponse = new LoginResponse({
                accessToken: 'new-access-token',
                user: testUser,
            });
            vi.spyOn((effects as any).client, 'login').mockResolvedValue(loginResponse);

            actions$ = of(AuthActions.login({ provider: 'google', token: 'id-token-123' }));

            const result = await firstValueFrom(effects.login$);
            expect(result).toEqual(
                AuthActions.loginSuccess({
                    user: testUser,
                    token: 'new-access-token',
                    redirect: true,
                })
            );
        });

        it('should dispatch loginFailure when login throws an error', async () => {
            vi.spyOn((effects as any).client, 'login').mockRejectedValue(new Error('Network error'));

            actions$ = of(AuthActions.login({ provider: 'google', token: 'id-token-123' }));

            const result = await firstValueFrom(effects.login$);
            expect(result).toEqual(
                AuthActions.loginFailure({ error: 'Network error' })
            );
        });

        it('should dispatch loginFailure when response has no user', async () => {
            const loginResponse = new LoginResponse({
                accessToken: 'token',
            });
            vi.spyOn((effects as any).client, 'login').mockResolvedValue(loginResponse);

            actions$ = of(AuthActions.login({ provider: 'google', token: 'id-token-123' }));

            const result = await firstValueFrom(effects.login$);
            expect(result).toEqual(
                AuthActions.loginFailure({ error: 'No user returned' })
            );
        });
    });

    describe('init$ (checkSession)', () => {
        it('should dispatch loginSuccess when valid session exists in localStorage', async () => {
            const userJson = JSON.stringify(testUser.toJson());
            const validToken = fakeJwt(Math.floor(Date.now() / 1000) + 3600); // expires in 1 hour
            mockStorage['auth_token'] = validToken;
            mockStorage['auth_user'] = userJson;

            actions$ = of(AuthActions.checkSession());

            const result = await firstValueFrom(effects.init$);
            expect(result.type).toBe(AuthActions.loginSuccess.type);
            if (result.type === AuthActions.loginSuccess.type) {
                const payload = result as ReturnType<typeof AuthActions.loginSuccess>;
                expect(payload.token).toBe(validToken);
                expect(payload.redirect).toBe(false);
            }
        });

        it('should dispatch sessionCheckDone and clear storage when token is expired', async () => {
            const userJson = JSON.stringify(testUser.toJson());
            const expiredToken = fakeJwt(Math.floor(Date.now() / 1000) - 3600); // expired 1 hour ago
            mockStorage['auth_token'] = expiredToken;
            mockStorage['auth_user'] = userJson;

            actions$ = of(AuthActions.checkSession());

            const result = await firstValueFrom(effects.init$);
            expect(result).toEqual(AuthActions.sessionCheckDone());
            expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
            expect(localStorage.removeItem).toHaveBeenCalledWith('auth_user');
        });

        it('should dispatch sessionCheckDone when no token in localStorage', async () => {
            // mockStorage is already empty

            actions$ = of(AuthActions.checkSession());

            const result = await firstValueFrom(effects.init$);
            expect(result).toEqual(AuthActions.sessionCheckDone());
        });

        it('should dispatch sessionCheckDone when token exists but no user', async () => {
            mockStorage['auth_token'] = 'stored-token';

            actions$ = of(AuthActions.checkSession());

            const result = await firstValueFrom(effects.init$);
            expect(result).toEqual(AuthActions.sessionCheckDone());
        });

        it('should dispatch sessionCheckDone and clean up when user JSON is invalid', async () => {
            mockStorage['auth_token'] = 'stored-token';
            mockStorage['auth_user'] = 'invalid-json{{';

            actions$ = of(AuthActions.checkSession());

            const result = await firstValueFrom(effects.init$);
            expect(result).toEqual(AuthActions.sessionCheckDone());
            expect(localStorage.removeItem).toHaveBeenCalledWith('auth_user');
        });
    });

    describe('loginSuccess$', () => {
        it('should save token and user to localStorage', async () => {
            // localStorage is already mocked via stubGlobal

            actions$ = of(AuthActions.loginSuccess({ user: testUser, token: 'access-token', redirect: false }));

            await firstValueFrom(effects.loginSuccess$);
            expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'access-token');
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'auth_user',
                JSON.stringify(testUser.toJson())
            );
        });

        it('should navigate to returnUrl when redirect is true', async () => {
            // localStorage is already mocked via stubGlobal
            mockRouter.parseUrl.mockReturnValue({ queryParams: { returnUrl: '/dashboard' } });

            actions$ = of(AuthActions.loginSuccess({ user: testUser, token: 'access-token', redirect: true }));

            await firstValueFrom(effects.loginSuccess$);
            expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/dashboard');
        });

        it('should navigate to /groupbuy when redirect is true and no returnUrl', async () => {
            // localStorage is already mocked via stubGlobal
            mockRouter.parseUrl.mockReturnValue({ queryParams: {} });

            actions$ = of(AuthActions.loginSuccess({ user: testUser, token: 'access-token', redirect: true }));

            await firstValueFrom(effects.loginSuccess$);
            expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/groupbuy');
        });

        it('should not navigate when redirect is false', async () => {
            // localStorage is already mocked via stubGlobal

            actions$ = of(AuthActions.loginSuccess({ user: testUser, token: 'access-token', redirect: false }));

            await firstValueFrom(effects.loginSuccess$);
            expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
        });
    });

    describe('logout$', () => {
        it('should remove token and user from localStorage', async () => {
            // Mock reload to prevent actual reload
            const mockReload = vi.fn();
            Object.defineProperty(window, 'location', {
                value: { ...window.location, reload: mockReload },
                writable: true,
                configurable: true,
            });

            actions$ = of(AuthActions.logout());

            await firstValueFrom(effects.logout$);
            expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
            expect(localStorage.removeItem).toHaveBeenCalledWith('auth_user');
        });

        it('should navigate to home when on a protected page', async () => {
            mockRouter.url = '/user/profile';

            actions$ = of(AuthActions.logout());

            await firstValueFrom(effects.logout$);
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
        });

        it('should reload the page when on a non-protected page', async () => {
            const mockReload = vi.fn();
            Object.defineProperty(window, 'location', {
                value: { ...window.location, reload: mockReload },
                writable: true,
                configurable: true,
            });
            mockRouter.url = '/shop';

            actions$ = of(AuthActions.logout());

            await firstValueFrom(effects.logout$);
            expect(mockReload).toHaveBeenCalled();
            expect(mockRouter.navigate).not.toHaveBeenCalled();
        });
    });
});
