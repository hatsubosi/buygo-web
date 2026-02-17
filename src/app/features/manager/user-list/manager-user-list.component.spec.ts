import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManagerUserListComponent } from './manager-user-list.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { UserRole } from '../../../core/api/api/v1/auth_pb';

describe('ManagerUserListComponent', () => {
  let component: ManagerUserListComponent;
  let fixture: ComponentFixture<ManagerUserListComponent>;

  const mockAuthService = {
    user: signal(null),
    listUsers: async () => ({ users: [], nextPageToken: '' }),
    updateUserRole: async () => {},
  };

  const mockToastService = {
    show: () => {},
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerUserListComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerUserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct role names', () => {
    expect(component.getRoleName(UserRole.USER)).toBe('User');
    expect(component.getRoleName(UserRole.CREATOR)).toBe('Creator');
    expect(component.getRoleName(UserRole.SYS_ADMIN)).toBe('System Admin');
    expect(component.getRoleName(99)).toBe('Guest');
  });

  it('should return correct role badge classes', () => {
    expect(component.getRoleBadgeClass(UserRole.SYS_ADMIN)).toContain('red');
    expect(component.getRoleBadgeClass(UserRole.CREATOR)).toContain('blue');
    expect(component.getRoleBadgeClass(UserRole.USER)).toContain('gray');
  });

  describe('pagination', () => {
    it('should increment page on nextPage', () => {
      component.nextPageToken.set('20');
      const before = component.page();
      component.nextPage();
      expect(component.page()).toBe(before + 1);
    });

    it('should decrement page on prevPage', () => {
      component.nextPageToken.set('20');
      component.nextPage(); // page = 2
      component.prevPage();
      expect(component.page()).toBe(1);
    });

    it('should not go below page 1', () => {
      component.prevPage();
      expect(component.page()).toBe(1);
    });

    it('should use nextPageToken as next page cursor', () => {
      component.nextPageToken.set('20');
      component.nextPage();
      expect(component.currentPageToken()).toBe('20');
    });
  });
});
