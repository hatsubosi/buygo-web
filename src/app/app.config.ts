import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { provideStore, Store } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideTransport } from './core/providers/transport.provider';
import { authReducer } from './core/auth/auth.reducer';
import { AuthEffects } from './core/auth/auth.effects';
import { AuthActions } from './core/auth/auth.actions';

import { projectReducer } from './core/project/project.reducer';
import { ProjectEffects } from './core/project/project.effects';

function initAuth(store: Store) {
  return () => new Promise<void>((resolve) => {
    store.dispatch(AuthActions.checkSession());
    resolve(); // Resolve immediately, let effect run async or return promise if checkSession was async
    // For simple local storage check, synchronous dispatch is fine, effect will handle state update.
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideTransport(),
    provideStore({
      auth: authReducer,
      project: projectReducer
    }),
    provideEffects([
      AuthEffects,
      ProjectEffects
    ]),
    {
      provide: APP_INITIALIZER,
      useFactory: (store: Store) => initAuth(store),
      deps: [Store],
      multi: true
    }
  ]
};
