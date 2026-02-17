import { Interceptor, ConnectError, Code } from '@connectrpc/connect';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { AuthActions } from './auth.actions';

export const errorInterceptor = (store: Store, router: Router): Interceptor => {
  return (next) => async (req) => {
    try {
      return await next(req);
    } catch (err) {
      if (err instanceof ConnectError && err.code === Code.Unauthenticated) {
        store.dispatch(AuthActions.logout());
        router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }
      throw err;
    }
  };
};
