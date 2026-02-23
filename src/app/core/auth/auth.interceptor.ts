import { Interceptor } from '@connectrpc/connect';
import { AuthService } from './auth.service';

/** Attaches the Bearer token from AuthService to every outgoing request. */
export const authInterceptor = (authService: AuthService): Interceptor => {
  return (next) => async (req) => {
    const token = authService.token();
    if (token) {
      req.header.set('Authorization', `Bearer ${token}`);
    }
    return next(req);
  };
};
