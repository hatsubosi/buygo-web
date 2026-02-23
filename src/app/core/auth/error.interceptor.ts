import { Interceptor, ConnectError, Code } from '@connectrpc/connect';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/ui/ui-toast/toast.service';

const errorMessages: Partial<Record<Code, string>> = {
  [Code.NotFound]: 'Resource not found',
  [Code.PermissionDenied]: 'Access denied',
  [Code.Internal]: 'Server error, please try again',
  [Code.Unavailable]: 'Service unavailable, please try again later',
};

/** Handles Connect RPC errors globally: auto-logout on 401, toast on others. */
export const errorInterceptor = (
  authService: AuthService,
  router: Router,
  toast: ToastService,
): Interceptor => {
  return (next) => async (req) => {
    try {
      return await next(req);
    } catch (err) {
      if (err instanceof ConnectError) {
        if (err.code === Code.Unauthenticated) {
          authService.logout();
          router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
        } else {
          const msg = errorMessages[err.code] ?? err.message;
          toast.show(msg, 'error');
        }
      }
      throw err;
    }
  };
};
