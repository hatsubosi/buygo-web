import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectListComponent } from './project-list.component';
import { ProjectService } from '../../../core/project/project.service';
import { AuthService } from '../../../core/auth/auth.service';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { ProjectStatus } from '../../../core/api/api/v1/project_pb';

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
        { provide: ProjectService, useValue: mockProjectService },
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
    expect(component.getStatusLabel(ProjectStatus.ACTIVE)).toBe('Active');
    expect(component.getStatusLabel(ProjectStatus.DRAFT)).toBe('Draft');
    expect(component.getStatusLabel(ProjectStatus.ENDED)).toBe('Ended');
    expect(component.getStatusLabel(ProjectStatus.ARCHIVED)).toBe('Archived');
    expect(component.getStatusLabel(99 as ProjectStatus)).toBe('Unknown');
  });

  it('should navigate to project detail', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.openProject('proj-123');
    expect(navigateSpy).toHaveBeenCalledWith(['/project', 'proj-123']);
  });
});
