import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from './auth.service';
import { UserRole } from '../api/api/v1/auth_pb';

describe('roleGuard', () => {
  let mockAuthService: { user: ReturnType<typeof vi.fn> };
  let mockRouter: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAuthService = { user: vi.fn() };
    mockRouter = { createUrlTree: vi.fn().mockReturnValue('home-url-tree') };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('should allow access for Creator role', () => {
    mockAuthService.user.mockReturnValue({ role: UserRole.CREATOR });

    const result = TestBed.runInInjectionContext(() =>
      roleGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('should allow access for SysAdmin role', () => {
    mockAuthService.user.mockReturnValue({ role: UserRole.SYS_ADMIN });

    const result = TestBed.runInInjectionContext(() =>
      roleGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('should redirect User role to /', () => {
    mockAuthService.user.mockReturnValue({ role: UserRole.USER });

    const result = TestBed.runInInjectionContext(() =>
      roleGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/']);
    expect(result).toBe('home-url-tree');
  });

  it('should redirect when user is null', () => {
    mockAuthService.user.mockReturnValue(null);

    const result = TestBed.runInInjectionContext(() =>
      roleGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/']);
    expect(result).toBe('home-url-tree');
  });
});
