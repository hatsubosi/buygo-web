import { EnvironmentProviders, makeEnvironmentProviders, inject } from '@angular/core';
import { createConnectTransport } from '@connectrpc/connect-web';
import { Transport } from '@connectrpc/connect';
import { Router } from '@angular/router';
import { TransportToken } from './transport.token';
import { AuthService } from '../auth/auth.service';
import { authInterceptor } from '../auth/auth.interceptor';
import { errorInterceptor } from '../auth/error.interceptor';
import { ToastService } from '../../shared/ui/ui-toast/toast.service';
import { environment } from '../../../environments/environment';

export function provideTransport(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: TransportToken,
      useFactory: (): Transport => {
        const authService = inject(AuthService);
        const router = inject(Router);
        const toast = inject(ToastService);
        return createConnectTransport({
          baseUrl: environment.apiUrl,
          useBinaryFormat: true,
          interceptors: [
            authInterceptor(authService),
            errorInterceptor(authService, router, toast),
          ],
        });
      },
    },
  ]);
}
