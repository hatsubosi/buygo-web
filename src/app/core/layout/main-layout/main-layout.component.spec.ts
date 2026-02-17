import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainLayoutComponent } from './main-layout.component';
import { AuthService } from '../../auth/auth.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;

  const mockAuthService = {
    user: signal<any>(null),
    isAuthenticated: signal(false),
    isManager: signal(false),
    logout: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [{ provide: AuthService, useValue: mockAuthService }, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('canManage computed', () => {
    it('should return true for Creator (role=2)', () => {
      mockAuthService.user.set({ role: 2 });
      expect(component.canManage()).toBe(true);
    });

    it('should return true for SysAdmin (role=3)', () => {
      mockAuthService.user.set({ role: 3 });
      expect(component.canManage()).toBe(true);
    });

    it('should return false for User (role=1)', () => {
      mockAuthService.user.set({ role: 1 });
      expect(component.canManage()).toBe(false);
    });
  });

  describe('isAdmin computed', () => {
    it('should return true only for SysAdmin', () => {
      mockAuthService.user.set({ role: 3 });
      expect(component.isAdmin()).toBe(true);
      mockAuthService.user.set({ role: 2 });
      expect(component.isAdmin()).toBe(false);
    });
  });

  it('should toggle mobile menu', () => {
    expect(component.mobileMenuOpen()).toBe(false);
    component.toggleMobileMenu();
    expect(component.mobileMenuOpen()).toBe(true);
    component.closeMobileMenu();
    expect(component.mobileMenuOpen()).toBe(false);
  });

  it('should logout and close mobile menu', () => {
    component.mobileMenuOpen.set(true);
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(component.mobileMenuOpen()).toBe(false);
  });
});
