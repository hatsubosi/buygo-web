import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusDashboardComponent } from './status-dashboard.component';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { ManagerService } from '../../../core/manager/manager.service';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

describe('StatusDashboardComponent', () => {
    let component: StatusDashboardComponent;
    let fixture: ComponentFixture<StatusDashboardComponent>;

    const mockProjectService = {
        currentProject: signal(null),
        currentProducts: signal([]),
        loadProject: async () => { }
    };

    const mockManagerService = {
        orders: signal([]),
        loadProjectOrders: async () => { },
        batchUpdateStatus: async () => ({})
    };

    const mockToastService = {
        show: () => { }
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StatusDashboardComponent],
            providers: [
                { provide: GroupBuyService, useValue: mockProjectService },
                { provide: ManagerService, useValue: mockManagerService },
                { provide: ToastService, useValue: mockToastService },
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(StatusDashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return correct status labels', () => {
        expect(component.getStatusLabel(1)).toBe('Unordered');
        expect(component.getStatusLabel(2)).toBe('Ordered');
        expect(component.getStatusLabel(3)).toBe('Arrived Overseas');
        expect(component.getStatusLabel(4)).toBe('Arrived Domestic');
        expect(component.getStatusLabel(5)).toBe('Ready for Pickup');
        expect(component.getStatusLabel(6)).toBe('Sent');
        expect(component.getStatusLabel(7)).toBe('Failed/Cancelled');
        expect(component.getStatusLabel(99)).toBe('Unknown');
    });

    it('should create an empty row with 7 cells', () => {
        const row = component.createEmptyRow('p1', 'Product', 's1', 'Spec');
        expect(row.productId).toBe('p1');
        expect(row.specName).toBe('Spec');
        expect(Object.keys(row.cells).length).toBe(7);
        for (let i = 1; i <= 7; i++) {
            expect(row.cells[i].count).toBe(0);
            expect(row.cells[i].specId).toBe('s1');
        }
    });

    it('should open dialog with correct action', () => {
        const row = component.createEmptyRow('p1', 'Product', 's1', 'Spec');
        row.cells[1].count = 5;
        component.openDialog(row, 2, 1);
        expect(component.selectedAction).toBeTruthy();
        expect(component.selectedAction!.maxCount).toBe(5);
        expect(component.selectedAction!.targetStatus).toBe(2);
        expect(component.selectedAction!.fromStatus).toBe(1);
        expect(component.moveCount).toBe(5);
    });

    it('should not open dialog for 0-count cell', () => {
        const row = component.createEmptyRow('p1', 'Product', 's1', 'Spec');
        component.openDialog(row, 2, 1);
        expect(component.selectedAction).toBeNull();
    });

    it('should close dialog', () => {
        const row = component.createEmptyRow('p1', 'Product', 's1', 'Spec');
        row.cells[1].count = 3;
        component.openDialog(row, 2, 1);
        component.closeDialog();
        expect(component.selectedAction).toBeNull();
    });
});
