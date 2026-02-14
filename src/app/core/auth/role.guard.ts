import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from '../api/api/v1/auth_pb';

export const roleGuard: CanActivateFn = (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.user();

    if (user && (user.role === UserRole.CREATOR || user.role === UserRole.SYS_ADMIN)) {
        return true;
    }

    // Redirect to home if not authorized
    return router.createUrlTree(['/']);
};
