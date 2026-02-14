import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManagerDashboardComponent } from './manager-dashboard.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ProjectService } from '../../../core/project/project.service';
import { EventService } from '../../../core/event/event.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

describe('ManagerDashboardComponent', () => {
    let component: ManagerDashboardComponent;
    let fixture: ComponentFixture<ManagerDashboardComponent>;

    const mockAuthService = {
        user: signal(null),
        isAuthenticated: signal(false),
        isManager: signal(false)
    };

    const mockProjectService = {
        managerProjects: signal([]),
        loadManagerProjects: async () => { }
    };

    const mockEventService = {
        managerEvents: signal([]),
        loadManagerEvents: async () => { }
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ManagerDashboardComponent],
            providers: [
                { provide: AuthService, useValue: mockAuthService },
                { provide: ProjectService, useValue: mockProjectService },
                { provide: EventService, useValue: mockEventService },
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ManagerDashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return correct project status', () => {
        expect(component.getProjectStatus(1)).toBe('Draft');
        expect(component.getProjectStatus(2)).toBe('Active');
        expect(component.getProjectStatus(3)).toBe('Ended');
        expect(component.getProjectStatus(4)).toBe('Archived');
        expect(component.getProjectStatus(99)).toBe('Unknown');
    });

    it('should return correct event status', () => {
        expect(component.getEventStatus(1)).toBe('Draft');
        expect(component.getEventStatus(2)).toBe('Active');
        expect(component.getEventStatus(3)).toBe('Cancelled');
        expect(component.getEventStatus(4)).toBe('Ended');
        expect(component.getEventStatus(99)).toBe('Unknown');
    });

    it('should convert timestamp to Date', () => {
        const mockTs = { toDate: () => new Date('2026-01-01') };
        expect(component.toDate(mockTs)).toEqual(new Date('2026-01-01'));
        expect(component.toDate(null)).toBeNull();
    });
});
