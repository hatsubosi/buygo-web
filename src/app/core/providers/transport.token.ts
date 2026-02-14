import { InjectionToken } from '@angular/core';
import { Transport } from '@connectrpc/connect';

export const TransportToken = new InjectionToken<Transport>('CONNECT_TRANSPORT');
