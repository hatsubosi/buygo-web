import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManagerGroupBuyDetailComponent } from './manager-project-detail.component';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ManagerService } from '../../../core/manager/manager.service';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

describe('ManagerGroupBuyDetailComponent', () => {
    let component: ManagerGroupBuyDetailComponent;
    let fixture: ComponentFixture<ManagerGroupBuyDetailComponent>;

    const mockProjectService = {
        currentProject: signal(null),
        currentProducts: signal([]),
        loadProject: async () => { },
        updateProject: async () => { }
    };

    const mockAuthService = {
        user: signal(null)
    };

    const mockManagerService = {
        orders: signal([]),
        loadProjectOrders: async () => { }
    };

    const mockToastService = {
        show: () => { }
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ManagerGroupBuyDetailComponent],
            providers: [
                { provide: GroupBuyService, useValue: mockProjectService },
                { provide: AuthService, useValue: mockAuthService },
                { provide: ManagerService, useValue: mockManagerService },
                { provide: ToastService, useValue: mockToastService },
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ManagerGroupBuyDetailComponent);
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

    it('should convert timestamp to Date', () => {
        const mockTs = { toDate: () => new Date('2026-01-01') };
        expect(component.toDate(mockTs)).toEqual(new Date('2026-01-01'));
        expect(component.toDate(null)).toBeNull();
    });
});
