import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainLayoutComponent } from './main-layout.component';
import { AuthService } from '../../auth/auth.service';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { By } from '@angular/platform-browser';

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;
  let mockAuthService: {
    user: ReturnType<typeof signal>;
    isAuthenticated: ReturnType<typeof signal>;
    isManager: ReturnType<typeof signal>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockAuthService = {
      user: signal<any>(null),
      isAuthenticated: signal(false),
      isManager: signal(false),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [{ provide: AuthService, useValue: mockAuthService }, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Computed signals ───────────────────────────────────────────────

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

    it('should return false when user is null', () => {
      mockAuthService.user.set(null);
      expect(component.canManage()).toBe(false);
    });

    it('should return false when role is undefined', () => {
      mockAuthService.user.set({ name: 'No Role' });
      expect(component.canManage()).toBe(false);
    });
  });

  describe('isAdmin computed', () => {
    it('should return true only for SysAdmin (role=3)', () => {
      mockAuthService.user.set({ role: 3 });
      expect(component.isAdmin()).toBe(true);
    });

    it('should return false for Creator (role=2)', () => {
      mockAuthService.user.set({ role: 2 });
      expect(component.isAdmin()).toBe(false);
    });

    it('should return false for regular User (role=1)', () => {
      mockAuthService.user.set({ role: 1 });
      expect(component.isAdmin()).toBe(false);
    });

    it('should return false when user is null', () => {
      mockAuthService.user.set(null);
      expect(component.isAdmin()).toBe(false);
    });
  });

  // ─── Methods ────────────────────────────────────────────────────────

  describe('toggleMobileMenu', () => {
    it('should open mobile menu when closed', () => {
      expect(component.mobileMenuOpen()).toBe(false);
      component.toggleMobileMenu();
      expect(component.mobileMenuOpen()).toBe(true);
    });

    it('should close mobile menu when open', () => {
      component.mobileMenuOpen.set(true);
      component.toggleMobileMenu();
      expect(component.mobileMenuOpen()).toBe(false);
    });
  });

  describe('closeMobileMenu', () => {
    it('should set mobileMenuOpen to false', () => {
      component.mobileMenuOpen.set(true);
      component.closeMobileMenu();
      expect(component.mobileMenuOpen()).toBe(false);
    });

    it('should remain false if already closed', () => {
      component.closeMobileMenu();
      expect(component.mobileMenuOpen()).toBe(false);
    });
  });

  describe('logout', () => {
    it('should call auth.logout and close mobile menu', () => {
      component.mobileMenuOpen.set(true);
      component.logout();
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(component.mobileMenuOpen()).toBe(false);
    });

    it('should call auth.logout even when mobile menu is already closed', () => {
      component.logout();
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(component.mobileMenuOpen()).toBe(false);
    });
  });

  // ─── Template: Navbar rendering ─────────────────────────────────────

  describe('navbar rendering', () => {
    it('should render the BuyGo logo text', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('BuyGo');
    });

    it('should render desktop nav links (Home, Projects, Events)', () => {
      const links = fixture.nativeElement.querySelectorAll('nav a');
      const texts = Array.from(links).map((a: any) => a.textContent.trim());
      expect(texts).toContain('Home');
      expect(texts).toContain('Projects');
      expect(texts).toContain('Events');
    });

    it('should render the mobile menu toggle button', () => {
      const btn = fixture.nativeElement.querySelector('button.md\\:hidden');
      expect(btn).toBeTruthy();
      expect(btn.textContent.trim()).toBe('menu');
    });
  });

  // ─── Template: Unauthenticated state ────────────────────────────────

  describe('when user is NOT authenticated', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.set(false);
      mockAuthService.user.set(null);
      fixture.detectChanges();
    });

    it('should show "Sign In" button', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Sign In');
    });

    it('should NOT show logout button', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).not.toContain('logout');
    });

    it('should NOT show user avatar or name', () => {
      const el = fixture.nativeElement as HTMLElement;
      // No avatar circle with user initial
      const avatars = el.querySelectorAll('.rounded-full');
      expect(avatars.length).toBe(0);
    });

    it('should NOT show the Manager Dashboard link', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).not.toContain('Manager Dashboard');
    });
  });

  // ─── Template: Authenticated state ──────────────────────────────────

  describe('when user IS authenticated', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.set(true);
      mockAuthService.user.set({ name: 'Alice', role: 1 });
      fixture.detectChanges();
    });

    it('should display user initial in avatar', () => {
      const el = fixture.nativeElement as HTMLElement;
      const avatars = el.querySelectorAll('.rounded-full');
      const hasInitial = Array.from(avatars).some((a: any) => a.textContent.trim() === 'A');
      expect(hasInitial).toBe(true);
    });

    it('should display user name', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Alice');
    });

    it('should show logout icon', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('logout');
    });

    it('should show Dashboard link', () => {
      const el = fixture.nativeElement as HTMLElement;
      const links = el.querySelectorAll('a[href="/user"]');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should NOT show "Sign In" button', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).not.toContain('Sign In');
    });

    it('should NOT show Manager Dashboard for regular users (role=1)', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).not.toContain('dashboard');
    });

    it('should show fallback initial "U" when user name is undefined', () => {
      mockAuthService.user.set({ role: 1 });
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const avatars = el.querySelectorAll('.rounded-full');
      const hasU = Array.from(avatars).some((a: any) => a.textContent.trim() === 'U');
      expect(hasU).toBe(true);
    });
  });

  // ─── Template: Manager / Admin role rendering ───────────────────────

  describe('when user is a Creator (role=2)', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.set(true);
      mockAuthService.user.set({ name: 'Bob', role: 2 });
      fixture.detectChanges();
    });

    it('should show the Manager Dashboard link', () => {
      const el = fixture.nativeElement as HTMLElement;
      const links = el.querySelectorAll('a[href="/manager"]');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('when user is a SysAdmin (role=3)', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.set(true);
      mockAuthService.user.set({ name: 'Charlie', role: 3 });
      fixture.detectChanges();
    });

    it('should show the Manager Dashboard link', () => {
      const el = fixture.nativeElement as HTMLElement;
      const links = el.querySelectorAll('a[href="/manager"]');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should display the user initial "C"', () => {
      const el = fixture.nativeElement as HTMLElement;
      const avatars = el.querySelectorAll('.rounded-full');
      const hasInitial = Array.from(avatars).some((a: any) => a.textContent.trim() === 'C');
      expect(hasInitial).toBe(true);
    });
  });

  // ─── Template: Mobile menu ──────────────────────────────────────────

  describe('mobile menu overlay', () => {
    it('should NOT render mobile overlay when menu is closed', () => {
      const overlay = fixture.nativeElement.querySelector('.fixed.inset-0');
      expect(overlay).toBeNull();
    });

    it('should render mobile overlay when menu is open', () => {
      component.toggleMobileMenu();
      fixture.detectChanges();
      const overlay = fixture.nativeElement.querySelector('.fixed.inset-0');
      expect(overlay).toBeTruthy();
    });

    it('should show mobile nav links when menu is open', () => {
      component.toggleMobileMenu();
      fixture.detectChanges();
      const overlay = fixture.nativeElement.querySelector('.fixed.inset-0');
      expect(overlay.textContent).toContain('Home');
      expect(overlay.textContent).toContain('Projects');
      expect(overlay.textContent).toContain('Events');
    });

    it('should show "close" icon when menu is open', () => {
      component.toggleMobileMenu();
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button.md\\:hidden');
      expect(btn.textContent.trim()).toBe('close');
    });

    it('should show Sign In in mobile menu when not authenticated', () => {
      mockAuthService.isAuthenticated.set(false);
      component.toggleMobileMenu();
      fixture.detectChanges();
      const overlay = fixture.nativeElement.querySelector('.fixed.inset-0');
      expect(overlay.textContent).toContain('Sign In');
    });

    it('should show Sign Out in mobile menu when authenticated', () => {
      mockAuthService.isAuthenticated.set(true);
      mockAuthService.user.set({ name: 'Dave', role: 1 });
      component.toggleMobileMenu();
      fixture.detectChanges();
      const overlay = fixture.nativeElement.querySelector('.fixed.inset-0');
      expect(overlay.textContent).toContain('Sign Out');
      expect(overlay.textContent).toContain('Dave');
    });

    it('should show Manager Dashboard in mobile menu for Creator', () => {
      mockAuthService.isAuthenticated.set(true);
      mockAuthService.user.set({ name: 'Eve', role: 2 });
      component.toggleMobileMenu();
      fixture.detectChanges();
      const overlay = fixture.nativeElement.querySelector('.fixed.inset-0');
      expect(overlay.textContent).toContain('Manager Dashboard');
    });

    it('should NOT show Manager Dashboard in mobile menu for regular user', () => {
      mockAuthService.isAuthenticated.set(true);
      mockAuthService.user.set({ name: 'Frank', role: 1 });
      component.toggleMobileMenu();
      fixture.detectChanges();
      const overlay = fixture.nativeElement.querySelector('.fixed.inset-0');
      expect(overlay.textContent).not.toContain('Manager Dashboard');
    });

    it('should close mobile menu when a mobile nav link calls closeMobileMenu', () => {
      component.toggleMobileMenu();
      expect(component.mobileMenuOpen()).toBe(true);
      component.closeMobileMenu();
      fixture.detectChanges();
      const overlay = fixture.nativeElement.querySelector('.fixed.inset-0');
      expect(overlay).toBeNull();
    });

    it('should call logout when mobile Sign Out button is clicked', () => {
      mockAuthService.isAuthenticated.set(true);
      mockAuthService.user.set({ name: 'Grace', role: 1 });
      component.toggleMobileMenu();
      fixture.detectChanges();

      const overlay = fixture.nativeElement.querySelector('.fixed.inset-0');
      const signOutBtn = overlay.querySelector('button');
      signOutBtn.click();
      fixture.detectChanges();

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(component.mobileMenuOpen()).toBe(false);
    });
  });

  // ─── Router integration ─────────────────────────────────────────────

  describe('router integration', () => {
    it('should inject Router and expose it for template use', () => {
      expect(component.router).toBeTruthy();
      expect(component.router).toBeInstanceOf(Router);
    });

    it('should use router.url in Sign In link queryParams', () => {
      mockAuthService.isAuthenticated.set(false);
      fixture.detectChanges();
      // The login link should exist with routerLink to /login
      const loginLinks = fixture.nativeElement.querySelectorAll('a');
      const loginLink = Array.from(loginLinks).find((a: any) =>
        a.getAttribute('href')?.includes('/login'),
      );
      expect(loginLink).toBeTruthy();
    });
  });

  // ─── Structural elements ────────────────────────────────────────────

  describe('structural elements', () => {
    it('should render the router-outlet for main content', () => {
      const outlet = fixture.debugElement.query(By.css('router-outlet'));
      expect(outlet).toBeTruthy();
    });

    it('should render the footer component', () => {
      const footer = fixture.debugElement.query(By.css('app-footer'));
      expect(footer).toBeTruthy();
    });

    it('should render the nav element', () => {
      const nav = fixture.debugElement.query(By.css('nav'));
      expect(nav).toBeTruthy();
    });

    it('should render main element with pt-16 class', () => {
      const main = fixture.debugElement.query(By.css('main.pt-16'));
      expect(main).toBeTruthy();
    });
  });
});
