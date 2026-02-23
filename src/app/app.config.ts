import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { provideTransport } from './core/providers/transport.provider';
import { AuthService } from './core/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideTransport(),
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => () => auth.checkSession(),
      deps: [AuthService],
      multi: true,
    },
  ],
};
