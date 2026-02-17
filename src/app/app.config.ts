import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { filter, take } from 'rxjs';

import { routes } from './app.routes';
import { provideStore, Store } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideTransport } from './core/providers/transport.provider';
import { authReducer } from './core/auth/auth.reducer';
import { AuthEffects } from './core/auth/auth.effects';
import { AuthActions } from './core/auth/auth.actions';
import { selectIsLoading } from './core/auth/auth.selectors';

import { groupBuyReducer } from './core/groupbuy/groupbuy.reducer';
import { GroupBuyEffects } from './core/groupbuy/groupbuy.effects';

function initAuth(store: Store) {
  return () => new Promise<void>((resolve) => {
    store.dispatch(AuthActions.checkSession());
    store.select(selectIsLoading).pipe(
      filter(loading => !loading),
      take(1)
    ).subscribe(() => resolve());
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideTransport(),
    provideStore({
      auth: authReducer,
      groupbuy: groupBuyReducer
    }),
    provideEffects([
      AuthEffects,
      GroupBuyEffects
    ]),
    {
      provide: APP_INITIALIZER,
      useFactory: (store: Store) => initAuth(store),
      deps: [Store],
      multi: true
    }
  ]
};
