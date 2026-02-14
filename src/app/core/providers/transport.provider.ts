import { EnvironmentProviders, makeEnvironmentProviders, inject } from '@angular/core';
import { createConnectTransport } from '@connectrpc/connect-web';
import { Transport } from '@connectrpc/connect';
import { TransportToken } from './transport.token';
import { Store } from '@ngrx/store';
import { authInterceptor } from '../auth/auth.interceptor';
import { environment } from '../../../environments/environment';

export function provideTransport(): EnvironmentProviders {
    return makeEnvironmentProviders([
        {
            provide: TransportToken,
            useFactory: (): Transport => {
                const store = inject(Store);
                return createConnectTransport({
                    baseUrl: environment.apiUrl,
                    useBinaryFormat: true,
                    interceptors: [authInterceptor(store)],
                });
            },
        },
    ]);
}
