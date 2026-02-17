import { Interceptor } from '@connectrpc/connect';
import { Store } from '@ngrx/store';
import { selectToken } from './auth.selectors';
import { firstValueFrom } from 'rxjs'; // For simple one-shot signal/observable read in interceptor

// Since ConnectRPC interceptors are functions, we can create a factory
export const authInterceptor = (store: Store): Interceptor => {
  return (next) => async (req) => {
    const token = await firstValueFrom(store.select(selectToken));
    if (token) {
      req.header.set('Authorization', `Bearer ${token}`);
    }
    return next(req);
  };
};
