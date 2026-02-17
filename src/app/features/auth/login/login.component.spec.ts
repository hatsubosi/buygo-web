import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  const mockAuthService = {
    login: async () => {},
    loginWithGoogle: async () => {},
    loginWithLine: async () => {},
    isLoading: signal(false),
    error: signal(null),
  };

  const mockRouter = {
    navigate: () => {},
  };

  const mockActivatedRoute = {
    snapshot: {
      queryParams: {},
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call auth.login with mock token', () => {
    const loginSpy = vi.spyOn(mockAuthService, 'login');
    component.login('google');
    expect(loginSpy).toHaveBeenCalledWith('google', 'mock-token-google');
  });

  it('should track activeProvider', () => {
    component.login('line');
    expect(component.activeProvider).toBe('line');
    component.login('dev');
    expect(component.activeProvider).toBe('dev');
  });
});
