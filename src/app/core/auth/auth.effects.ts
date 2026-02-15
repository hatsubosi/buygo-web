import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { Router } from '@angular/router';
import { switchMap, map, catchError, of, tap } from 'rxjs';
import { AuthActions } from './auth.actions';
import { TransportToken } from '../providers/transport.token';
import { createPromiseClient } from '@connectrpc/connect';
import { AuthService } from '../api/api/v1/auth_connect';
import { LoginResponse, User } from '../api/api/v1/auth_pb';

@Injectable()
export class AuthEffects {
    private actions$ = inject(Actions);
    private transport = inject(TransportToken);
    private router = inject(Router);

    // Create client using the generated Service definition
    private client = createPromiseClient(AuthService, this.transport);

    login$ = createEffect(() =>
        this.actions$.pipe(
            ofType(AuthActions.login),
            switchMap(({ provider, token }) =>
                // Using PromiseClient directly
                this.client.login({ idToken: token }).then(
                    (res: LoginResponse) => {
                        if (!res.user) {
                            throw new Error('No user returned');
                        }
                        // Checking Proto definition: message LoginResponse { string access_token = 1; User user = 2; }
                        return AuthActions.loginSuccess({ user: res.user, token: res.accessToken, redirect: true });
                    }
                ).catch((err: any) => AuthActions.loginFailure({ error: err.message }))
            )
        )
    );

    init$ = createEffect(() =>
        this.actions$.pipe(
            ofType(AuthActions.checkSession),
            map(() => {
                const token = localStorage.getItem('auth_token');
                const userJson = localStorage.getItem('auth_user');

                if (token && userJson) {
                    try {
                        const userObj = JSON.parse(userJson);
                        // Restore Proto instance
                        const user = User.fromJson(userObj);
                        // TODO: Verify token validity via API if critical
                        return AuthActions.loginSuccess({ user, token, redirect: false });
                    } catch {
                        localStorage.removeItem('auth_user'); // Clean up bad data
                        return { type: 'NOOP' };
                    }
                }
                return { type: 'NOOP' };
            })
        )
    );

    loginSuccess$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(AuthActions.loginSuccess),
                tap(({ user, token, redirect }) => {

                    localStorage.setItem('auth_token', token);
                    localStorage.setItem('auth_user', JSON.stringify(user.toJson()));

                    if (redirect !== false) {
                        // Check for returnUrl
                        const urlTree = this.router.parseUrl(this.router.url);
                        const returnUrl = urlTree.queryParams['returnUrl'] || '/project';
                        this.router.navigateByUrl(returnUrl);
                    }
                })
            ),
        { dispatch: false }
    );

    logout$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(AuthActions.logout),
                tap(() => {

                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('auth_user');

                    // Redirect to home only if on a protected page
                    const currentUrl = this.router.url;
                    const isProtected = currentUrl.startsWith('/user') ||
                        currentUrl.startsWith('/manager') ||
                        currentUrl.startsWith('/checkout') ||
                        currentUrl.startsWith('/order-confirmation');

                    if (isProtected) {
                        this.router.navigate(['/']);
                    } else {
                        // Stay on current page (force reload to ensure clean state)
                        window.location.reload();
                    }
                })
            ),
        { dispatch: false }
    );
}
