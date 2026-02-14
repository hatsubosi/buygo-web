import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectListComponent } from './project-list.component';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { AuthService } from '../../../core/auth/auth.service';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { GroupBuyStatus } from '../../../core/api/api/v1/groupbuy_pb';

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;
  let router: Router;

  const mockProjectService = {
    projects: signal([]),
    isLoadingList: signal(false),
    loadProjects: () => { }
  };

  const mockAuthService = {
    user: signal(null),
    isAuthenticated: () => false
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectListComponent],
      providers: [
        { provide: GroupBuyService, useValue: mockProjectService },
        { provide: AuthService, useValue: mockAuthService },
        provideRouter([])
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct status labels', () => {
    expect(component.getStatusLabel(GroupBuyStatus.ACTIVE)).toBe('Active');
    expect(component.getStatusLabel(GroupBuyStatus.DRAFT)).toBe('Draft');
    expect(component.getStatusLabel(GroupBuyStatus.ENDED)).toBe('Ended');
    expect(component.getStatusLabel(GroupBuyStatus.ARCHIVED)).toBe('Archived');
    expect(component.getStatusLabel(99 as ProjectStatus)).toBe('Unknown');
  });

  it('should navigate to project detail', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.openProject('proj-123');
    expect(navigateSpy).toHaveBeenCalledWith(['/project', 'proj-123']);
  });
});
