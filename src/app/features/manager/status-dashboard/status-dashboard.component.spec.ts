import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { StatusDashboardComponent } from './status-dashboard.component';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { ManagerService } from '../../../core/manager/manager.service';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('StatusDashboardComponent', () => {
  let component: StatusDashboardComponent;
  let fixture: ComponentFixture<StatusDashboardComponent>;

  const mockGroupBuyService = {
    currentGroupBuy: signal(null),
    currentProducts: signal<any[]>([]),
    loadProject: vi.fn().mockResolvedValue(undefined),
    loadGroupBuy: vi.fn().mockResolvedValue(undefined),
  };

  const mockManagerService = {
    orders: signal<any[]>([]),
    loadProjectOrders: vi.fn().mockResolvedValue(undefined),
    loadGroupBuyOrders: vi.fn().mockResolvedValue(undefined),
    batchUpdateStatus: vi.fn().mockResolvedValue({}),
  };

  const mockToastService = {
    show: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusDashboardComponent],
      providers: [
        { provide: GroupBuyService, useValue: mockGroupBuyService },
        { provide: ManagerService, useValue: mockManagerService },
        { provide: ToastService, useValue: mockToastService },
        provideRouter([]),
      ],
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
    const action = component.selectedAction;
    expect(action).toBeTruthy();
    if (!action) return;
    expect(action.maxCount).toBe(5);
    expect(action.targetStatus).toBe(2);
    expect(action.fromStatus).toBe(1);
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

  // ── matrix computed signal tests ──────────────────────────────

  describe('matrix computed signal', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return empty array when no products', () => {
      mockGroupBuyService.currentProducts.set([]);
      mockManagerService.orders.set([]);
      expect(component.matrix()).toEqual([]);
    });

    it('should create rows for products without specs (one row per product with specName=Default)', () => {
      mockGroupBuyService.currentProducts.set([
        { id: 'p1', name: 'Product A', specs: [] },
        { id: 'p2', name: 'Product B', specs: [] },
      ]);
      mockManagerService.orders.set([]);

      const result = component.matrix();
      expect(result.length).toBe(2);
      expect(result[0].productId).toBe('p1');
      expect(result[0].specName).toBe('Default');
      expect(result[0].specId).toBe('');
      expect(result[1].productId).toBe('p2');
      expect(result[1].specName).toBe('Default');
    });

    it('should create rows for each spec of a product', () => {
      mockGroupBuyService.currentProducts.set([
        {
          id: 'p1',
          name: 'Product A',
          specs: [
            { id: 's1', name: 'Red' },
            { id: 's2', name: 'Blue' },
          ],
        },
      ]);
      mockManagerService.orders.set([]);

      const result = component.matrix();
      expect(result.length).toBe(2);
      expect(result[0].specId).toBe('s1');
      expect(result[0].specName).toBe('Red');
      expect(result[1].specId).toBe('s2');
      expect(result[1].specName).toBe('Blue');
    });

    it('should aggregate order item quantities into correct status cells', () => {
      mockGroupBuyService.currentProducts.set([
        { id: 'p1', name: 'Product A', specs: [{ id: 's1', name: 'Red' }] },
      ]);
      mockManagerService.orders.set([
        {
          paymentStatus: 1,
          items: [
            {
              productId: 'p1',
              specId: 's1',
              status: 1,
              quantity: 3,
              productName: 'Product A',
              specName: 'Red',
            },
          ],
        },
        {
          paymentStatus: 2,
          items: [
            {
              productId: 'p1',
              specId: 's1',
              status: 1,
              quantity: 2,
              productName: 'Product A',
              specName: 'Red',
            },
            {
              productId: 'p1',
              specId: 's1',
              status: 2,
              quantity: 5,
              productName: 'Product A',
              specName: 'Red',
            },
          ],
        },
      ]);

      const result = component.matrix();
      expect(result[0].cells[1].count).toBe(5); // 3 + 2
      expect(result[0].cells[2].count).toBe(5);
    });

    it('should ignore rejected orders (paymentStatus === 4)', () => {
      mockGroupBuyService.currentProducts.set([
        { id: 'p1', name: 'Product A', specs: [{ id: 's1', name: 'Red' }] },
      ]);
      mockManagerService.orders.set([
        {
          paymentStatus: 4,
          items: [
            {
              productId: 'p1',
              specId: 's1',
              status: 1,
              quantity: 10,
              productName: 'Product A',
              specName: 'Red',
            },
          ],
        },
        {
          paymentStatus: 1,
          items: [
            {
              productId: 'p1',
              specId: 's1',
              status: 1,
              quantity: 3,
              productName: 'Product A',
              specName: 'Red',
            },
          ],
        },
      ]);

      const result = component.matrix();
      expect(result[0].cells[1].count).toBe(3); // rejected order's 10 is ignored
    });

    it('should default item status to 1 (Unordered) when status is falsy', () => {
      mockGroupBuyService.currentProducts.set([
        { id: 'p1', name: 'Product A', specs: [{ id: 's1', name: 'Red' }] },
      ]);
      mockManagerService.orders.set([
        {
          paymentStatus: 1,
          items: [
            {
              productId: 'p1',
              specId: 's1',
              status: 0,
              quantity: 4,
              productName: 'Product A',
              specName: 'Red',
            },
          ],
        },
      ]);

      const result = component.matrix();
      expect(result[0].cells[1].count).toBe(4); // status 0 defaults to 1
    });
  });

  // ── confirmAction tests ───────────────────────────────────────

  describe('confirmAction', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should call batchUpdateStatus, reload orders, close dialog, and show success toast', async () => {
      const row = component.createEmptyRow('p1', 'Product', 's1', 'Spec');
      row.cells[1].count = 5;
      component.openDialog(row, 2, 1);
      component.moveCount = 3;

      await component.confirmAction();

      expect(mockManagerService.batchUpdateStatus).toHaveBeenCalledWith(
        undefined, // id() is undefined in test since input is not set
        's1',
        2,
        3,
      );
      expect(mockManagerService.loadGroupBuyOrders).toHaveBeenCalled();
      expect(component.selectedAction).toBeNull();
      expect(mockToastService.show).toHaveBeenCalledWith('Status updated successfully', 'success');
    });

    it('should show error toast on failure', async () => {
      const row = component.createEmptyRow('p1', 'Product', 's1', 'Spec');
      row.cells[1].count = 5;
      component.openDialog(row, 2, 1);

      mockManagerService.batchUpdateStatus.mockRejectedValueOnce(new Error('Network error'));

      await component.confirmAction();

      expect(mockToastService.show).toHaveBeenCalledWith('Network error', 'error');
    });

    it('should do nothing if selectedAction is null', async () => {
      component.selectedAction = null;

      await component.confirmAction();

      expect(mockManagerService.batchUpdateStatus).not.toHaveBeenCalled();
    });

    it('should set isLoading true during operation and false after', async () => {
      const row = component.createEmptyRow('p1', 'Product', 's1', 'Spec');
      row.cells[1].count = 5;
      component.openDialog(row, 2, 1);

      let loadingDuringCall = false;
      mockManagerService.batchUpdateStatus.mockImplementationOnce(async () => {
        loadingDuringCall = component.isLoading;
        return {};
      });

      await component.confirmAction();

      expect(loadingDuringCall).toBe(true);
      expect(component.isLoading).toBe(false);
    });
  });

  // ── Template rendering tests ──────────────────────────────────

  describe('template rendering', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should show "No items found" when matrix is empty', () => {
      mockGroupBuyService.currentProducts.set([]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('No items found');
    });

    it('should render product rows when matrix has data', () => {
      mockGroupBuyService.currentProducts.set([
        { id: 'p1', name: 'Widget', specs: [{ id: 's1', name: 'Small' }] },
      ]);
      mockManagerService.orders.set([]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Widget');
      expect(el.textContent).toContain('Small');
    });

    it('should show "Fulfillment Dashboard" header', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Fulfillment Dashboard');
    });

    it('should show "Update Status" dialog when selectedAction is set', () => {
      const row = component.createEmptyRow('p1', 'Product', 's1', 'Spec');
      row.cells[1].count = 5;
      component.openDialog(row, 2, 1);
      const cdr = fixture.debugElement.injector.get(ChangeDetectorRef);
      cdr.markForCheck();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Update Status');
      expect(el.textContent).toContain('Confirm Move');
    });

    it('should hide dialog when selectedAction is null', () => {
      component.selectedAction = null;
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).not.toContain('Confirm Move');
    });
  });
});
