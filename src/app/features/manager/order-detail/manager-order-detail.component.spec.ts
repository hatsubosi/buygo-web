import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManagerOrderDetailComponent } from './manager-order-detail.component';
import { ManagerService } from '../../../core/manager/manager.service';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { PaymentStatus } from '../../../core/api/api/v1/groupbuy_pb';
import { vi } from 'vitest';

describe('ManagerOrderDetailComponent', () => {
  let component: ManagerOrderDetailComponent;
  let fixture: ComponentFixture<ManagerOrderDetailComponent>;

  const mockManagerService = {
    orders: signal<any[]>([]),
    isLoading: signal(false),
    loadGroupBuyOrders: async () => {},
    confirmPayment: async () => {},
  };

  const mockGroupBuyService = {
    currentGroupBuy: signal(null),
    currentProducts: signal([]),
    loadGroupBuy: () => {},
    updateOrder: async () => {},
  };

  const mockToastService = {
    show: () => {},
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerOrderDetailComponent],
      providers: [
        { provide: ManagerService, useValue: mockManagerService },
        { provide: GroupBuyService, useValue: mockGroupBuyService },
        { provide: ToastService, useValue: mockToastService },
        provideRouter([{ path: '**', component: ManagerOrderDetailComponent }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerOrderDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct payment labels', () => {
    expect(component.getPaymentLabel(PaymentStatus.UNSET)).toBe('Unpaid');
    expect(component.getPaymentLabel(PaymentStatus.SUBMITTED)).toBe('Submitted');
    expect(component.getPaymentLabel(PaymentStatus.CONFIRMED)).toBe('Paid');
    expect(component.getPaymentLabel(PaymentStatus.REJECTED)).toBe('Rejected');
    expect(component.getPaymentLabel(99)).toBe('Unknown');
  });

  describe('shipping helpers', () => {
    function setOrder(items: any[]) {
      mockManagerService.orders.set([{ id: 'o1', items } as any]);
      component.orderId.set('o1');
    }

    it('should return Empty for no order', () => {
      expect(component.getShippingStatusLabel()).toBe('Empty');
    });

    it('should return Shipped when all items sent', () => {
      setOrder([{ status: 6 }, { status: 6 }]);
      expect(component.getShippingStatusLabel()).toBe('Shipped');
    });

    it('should return Ready to Ship', () => {
      setOrder([{ status: 5 }, { status: 2 }]);
      expect(component.getShippingStatusLabel()).toBe('Ready to Ship');
    });

    it('should return Arrived Domestic', () => {
      setOrder([{ status: 4 }]);
      expect(component.getShippingStatusLabel()).toBe('Arrived Domestic');
    });

    it('should return 0 progress for no order', () => {
      expect(component.getShippingProgress()).toBe(0);
    });

    it('should return 50% progress', () => {
      setOrder([{ status: 6 }, { status: 2 }]);
      expect(component.getShippingProgress()).toBe(50);
    });

    it('should return true for canShip when items not sent', () => {
      setOrder([{ status: 2 }]);
      expect(component.canShip()).toBe(true);
    });

    it('should return false for canShip when all sent', () => {
      setOrder([{ status: 6 }]);
      expect(component.canShip()).toBe(false);
    });

    it('should detect fully shipped', () => {
      setOrder([{ status: 6 }, { status: 6 }]);
      expect(component.isFullyShipped()).toBe(true);
    });

    it('should detect not fully shipped', () => {
      setOrder([{ status: 6 }, { status: 2 }]);
      expect(component.isFullyShipped()).toBe(false);
    });
  });

  describe('edit flows', () => {
    beforeEach(() => {
      mockManagerService.orders.set([
        {
          id: 'o1',
          groupBuyId: 'g1',
          items: [
            { productId: 'p1', specId: '', quantity: 1, status: 1, price: BigInt(10) },
            { productId: 'p2', specId: 's2', quantity: 2, status: 2, price: BigInt(20) },
          ],
        },
      ] as any);
      mockGroupBuyService.currentProducts.set([
        { id: 'p1', name: 'Prod-1', specs: [] },
        { id: 'p2', name: 'Prod-2', specs: [{ id: 's2', name: 'Spec-2' }] },
      ] as any);
      component.orderId.set('o1');
      component.groupBuyId.set('g1');
    });

    it('should add and remove editable items', () => {
      component.newItem = { productId: 'p1', specId: '', quantity: 1 };
      component.addItem();
      expect(component.editableItems().length).toBe(1);
      expect(component.isDirty()).toBe(true);

      component.removeItem(0);
      expect(component.editableItems().length).toBe(0);
    });

    it('should resolve product and spec names', () => {
      expect(component.getProductName('p1')).toBe('Prod-1');
      expect(component.getProductName('unknown')).toBe('Unknown Product');
      expect(component.getSpecName('p2', 's2')).toBe('Spec-2');
      expect(component.getSpecName('p2', '')).toBe('Default');
      expect(component.getSpecName('p2', 'none')).toBe('Unknown Spec');
      expect(component.getSpecs('p2').length).toBe(1);
    });

    it('should save changes and reload orders', async () => {
      const updateSpy = vi.spyOn(mockGroupBuyService, 'updateOrder').mockResolvedValue(undefined);
      const reloadSpy = vi
        .spyOn(mockManagerService, 'loadGroupBuyOrders')
        .mockResolvedValue(undefined);
      const toastSpy = vi.spyOn(mockToastService, 'show');
      component.editableItems.set([{ productId: 'p1', specId: '', quantity: 2 } as any]);
      component.isDirty.set(true);

      await component.saveChanges();

      expect(updateSpy).toHaveBeenCalled();
      expect(reloadSpy).toHaveBeenCalledWith('g1');
      expect(component.isDirty()).toBe(false);
      expect(toastSpy).toHaveBeenCalledWith('Order updated successfully', 'success');
      expect(component.isSaving).toBe(false);
    });

    it('should show error toast when save changes fails', async () => {
      vi.spyOn(mockGroupBuyService, 'updateOrder').mockRejectedValue(new Error('save failed'));
      const toastSpy = vi.spyOn(mockToastService, 'show');
      component.editableItems.set([{ productId: 'p1', specId: '', quantity: 2 } as any]);
      component.isDirty.set(true);

      await component.saveChanges();

      expect(toastSpy).toHaveBeenCalledWith('save failed', 'error');
      expect(component.isSaving).toBe(false);
    });
  });
});
