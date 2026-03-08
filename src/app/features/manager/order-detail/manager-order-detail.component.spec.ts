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
    loadGroupBuyOrders: vi.fn().mockResolvedValue(undefined),
    confirmPayment: vi.fn().mockResolvedValue(undefined),
  };

  const mockGroupBuyService = {
    currentGroupBuy: signal(null),
    currentProducts: signal<any[]>([]),
    loadGroupBuy: vi.fn(),
    updateOrder: vi.fn().mockResolvedValue(undefined),
  };

  const mockToastService = {
    show: vi.fn(),
  };

  beforeEach(async () => {
    // Reset signals and mocks before each test
    mockManagerService.orders.set([]);
    mockManagerService.isLoading.set(false);
    mockManagerService.loadGroupBuyOrders.mockReset().mockResolvedValue(undefined);
    mockManagerService.confirmPayment.mockReset().mockResolvedValue(undefined);
    mockGroupBuyService.currentProducts.set([]);
    mockGroupBuyService.loadGroupBuy.mockReset();
    mockGroupBuyService.updateOrder.mockReset().mockResolvedValue(undefined);
    mockToastService.show.mockReset();

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

  describe('computed signals', () => {
    it('should return undefined order when no orders match', () => {
      mockManagerService.orders.set([{ id: 'other', items: [] }]);
      component.orderId.set('nonexistent');
      expect(component.order()).toBeUndefined();
    });

    it('should find matching order by id', () => {
      const order = { id: 'o1', items: [], shippingFee: '0' };
      mockManagerService.orders.set([order as any]);
      component.orderId.set('o1');
      expect(component.order()).toBe(order);
    });

    it('should compute subtotal from order items', () => {
      mockManagerService.orders.set([
        {
          id: 'o1',
          items: [
            { productId: 'p1', specId: '', quantity: 2, price: BigInt(100), status: 1 },
            { productId: 'p2', specId: '', quantity: 3, price: BigInt(50), status: 1 },
          ],
          shippingFee: '0',
        },
      ] as any);
      component.orderId.set('o1');
      // 2*100 + 3*50 = 350
      expect(component.subtotal()).toBe(350);
    });

    it('should return 0 subtotal when no order', () => {
      expect(component.subtotal()).toBe(0);
    });

    it('should compute shippingFee from order', () => {
      mockManagerService.orders.set([{ id: 'o1', items: [], shippingFee: '25' }] as any);
      component.orderId.set('o1');
      expect(component.shippingFee()).toBe(25);
    });

    it('should return 0 shippingFee when no order', () => {
      expect(component.shippingFee()).toBe(0);
    });

    it('should compute total as subtotal + shippingFee', () => {
      mockManagerService.orders.set([
        {
          id: 'o1',
          items: [{ productId: 'p1', specId: '', quantity: 1, price: BigInt(100), status: 1 }],
          shippingFee: '30',
        },
      ] as any);
      component.orderId.set('o1');
      expect(component.total()).toBe(130);
    });

    it('should return order note when present', () => {
      mockManagerService.orders.set([
        { id: 'o1', items: [], shippingFee: '0', note: 'Please deliver quickly' },
      ] as any);
      component.orderId.set('o1');
      expect(component.orderNote()).toBe('Please deliver quickly');
    });

    it('should return "None" when order has no note', () => {
      mockManagerService.orders.set([{ id: 'o1', items: [], shippingFee: '0' }] as any);
      component.orderId.set('o1');
      expect(component.orderNote()).toBe('None');
    });

    it('should show isLoading when managerService is loading', () => {
      mockManagerService.isLoading.set(true);
      expect(component.isLoading()).toBe(true);
    });

    it('should show isLoading when orderId is set but order not found yet', () => {
      mockManagerService.isLoading.set(false);
      mockManagerService.orders.set([]);
      component.orderId.set('o1');
      expect(component.isLoading()).toBeTruthy();
    });

    it('should not show isLoading when order is found', () => {
      mockManagerService.isLoading.set(false);
      mockManagerService.orders.set([{ id: 'o1', items: [] } as any]);
      component.orderId.set('o1');
      expect(component.isLoading()).toBeFalsy();
    });
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

    it('should return 0 progress for order with empty items', () => {
      setOrder([]);
      expect(component.getShippingProgress()).toBe(0);
    });

    it('should return 50% progress', () => {
      setOrder([{ status: 6 }, { status: 2 }]);
      expect(component.getShippingProgress()).toBe(50);
    });

    it('should return 100% progress when all items shipped', () => {
      setOrder([{ status: 6 }, { status: 6 }, { status: 6 }]);
      expect(component.getShippingProgress()).toBe(100);
    });

    it('should return true for canShip when items not sent', () => {
      setOrder([{ status: 2 }]);
      expect(component.canShip()).toBe(true);
    });

    it('should return false for canShip when all sent', () => {
      setOrder([{ status: 6 }]);
      expect(component.canShip()).toBe(false);
    });

    it('should return false for canShip when no order', () => {
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

    it('should return false for isFullyShipped when no order', () => {
      expect(component.isFullyShipped()).toBe(false);
    });

    it('should return false for isFullyShipped with empty items', () => {
      setOrder([]);
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
          shippingFee: '5',
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

    it('should not add item when productId is empty', () => {
      component.editableItems.set([]);
      component.newItem = { productId: '', specId: '', quantity: 1 };
      component.addItem();
      expect(component.editableItems().length).toBe(0);
    });

    it('should not add item when quantity is less than 1', () => {
      component.editableItems.set([]);
      component.newItem = { productId: 'p1', specId: '', quantity: 0 };
      component.addItem();
      expect(component.editableItems().length).toBe(0);
    });

    it('should reset newItem form after successful addItem', () => {
      component.newItem = { productId: 'p1', specId: 's1', quantity: 3 };
      component.addItem();
      expect(component.newItem.productId).toBe('');
      expect(component.newItem.specId).toBe('');
      expect(component.newItem.quantity).toBe(1);
    });

    it('should set isDirty to true when markDirty is called', () => {
      expect(component.isDirty()).toBe(false);
      component.markDirty();
      expect(component.isDirty()).toBe(true);
    });

    it('should remove the correct item by index', () => {
      component.editableItems.set([
        { productId: 'a' } as any,
        { productId: 'b' } as any,
        { productId: 'c' } as any,
      ]);
      component.removeItem(1);
      const remaining = component.editableItems();
      expect(remaining.length).toBe(2);
      expect(remaining[0].productId).toBe('a');
      expect(remaining[1].productId).toBe('c');
    });

    it('should resolve product and spec names', () => {
      expect(component.getProductName('p1')).toBe('Prod-1');
      expect(component.getProductName('unknown')).toBe('Unknown Product');
      expect(component.getSpecName('p2', 's2')).toBe('Spec-2');
      expect(component.getSpecName('p2', '')).toBe('Default');
      expect(component.getSpecName('p2', 'none')).toBe('Unknown Spec');
      expect(component.getSpecs('p2').length).toBe(1);
    });

    it('should return empty specs for unknown product', () => {
      expect(component.getSpecs('unknown')).toEqual([]);
    });

    it('should save changes and reload orders', async () => {
      component.editableItems.set([{ productId: 'p1', specId: '', quantity: 2 } as any]);
      component.isDirty.set(true);

      await component.saveChanges();

      expect(mockGroupBuyService.updateOrder).toHaveBeenCalledWith('o1', component.editableItems());
      expect(mockManagerService.loadGroupBuyOrders).toHaveBeenCalledWith('g1');
      expect(component.isDirty()).toBe(false);
      expect(mockToastService.show).toHaveBeenCalledWith('Order updated successfully', 'success');
      expect(component.isSaving).toBe(false);
    });

    it('should not save when isDirty is false', async () => {
      component.isDirty.set(false);

      await component.saveChanges();

      expect(mockGroupBuyService.updateOrder).not.toHaveBeenCalled();
    });

    it('should show error toast when save changes fails', async () => {
      mockGroupBuyService.updateOrder.mockRejectedValueOnce(new Error('save failed'));
      component.editableItems.set([{ productId: 'p1', specId: '', quantity: 2 } as any]);
      component.isDirty.set(true);

      await component.saveChanges();

      expect(mockToastService.show).toHaveBeenCalledWith('save failed', 'error');
      expect(component.isSaving).toBe(false);
    });

    it('should show fallback error message when save fails without message', async () => {
      mockGroupBuyService.updateOrder.mockRejectedValueOnce({});
      component.editableItems.set([{ productId: 'p1', specId: '', quantity: 2 } as any]);
      component.isDirty.set(true);

      await component.saveChanges();

      expect(mockToastService.show).toHaveBeenCalledWith('Failed to update order', 'error');
      expect(component.isSaving).toBe(false);
    });
  });

  describe('confirmPayment', () => {
    beforeEach(() => {
      mockManagerService.orders.set([
        {
          id: 'o1',
          items: [{ productId: 'p1', specId: '', quantity: 1, status: 1, price: BigInt(10) }],
          shippingFee: '0',
          paymentStatus: 2,
        },
      ] as any);
      component.orderId.set('o1');
      component.groupBuyId.set('g1');
    });

    it('should confirm payment when dialog is accepted', async () => {
      // Mock the dialog ViewChild
      component.dialog = {
        open: vi.fn().mockResolvedValue(true),
      } as any;

      await component.confirmPayment();

      expect(component.dialog.open).toHaveBeenCalledWith({
        title: 'Confirm Payment',
        message: 'Confirm payment? This will lock the order from further edits.',
        confirmText: 'Confirm',
      });
      expect(mockManagerService.confirmPayment).toHaveBeenCalledWith('o1');
      expect(mockManagerService.loadGroupBuyOrders).toHaveBeenCalledWith('g1');
      expect(mockToastService.show).toHaveBeenCalledWith('Payment confirmed', 'success');
    });

    it('should not confirm payment when dialog is cancelled', async () => {
      component.dialog = {
        open: vi.fn().mockResolvedValue(false),
      } as any;

      await component.confirmPayment();

      expect(mockManagerService.confirmPayment).not.toHaveBeenCalled();
    });

    it('should show error toast when confirmPayment fails', async () => {
      component.dialog = {
        open: vi.fn().mockResolvedValue(true),
      } as any;
      mockManagerService.confirmPayment.mockRejectedValueOnce(new Error('payment error'));

      await component.confirmPayment();

      expect(mockToastService.show).toHaveBeenCalledWith('payment error', 'error');
    });
  });

  describe('markAsShipped', () => {
    beforeEach(() => {
      mockManagerService.orders.set([
        {
          id: 'o1',
          items: [
            { productId: 'p1', specId: '', quantity: 1, status: 2 },
            { productId: 'p2', specId: 's2', quantity: 3, status: 3 },
          ],
          shippingFee: '0',
        },
      ] as any);
      component.orderId.set('o1');
      component.groupBuyId.set('g1');
    });

    it('should mark all items as shipped when dialog is accepted', async () => {
      component.dialog = {
        open: vi.fn().mockResolvedValue(true),
      } as any;

      await component.markAsShipped();

      expect(component.dialog.open).toHaveBeenCalledWith({
        title: 'Mark as Shipped',
        message: 'Mark all items in this order as SENT?',
        confirmText: 'Mark Sent',
      });
      expect(mockGroupBuyService.updateOrder).toHaveBeenCalled();
      // Verify all items have status 6
      const callArgs = mockGroupBuyService.updateOrder.mock.calls[0];
      expect(callArgs[0]).toBe('o1');
      const updatedItems = callArgs[1];
      expect(updatedItems.length).toBe(2);
      updatedItems.forEach((item: any) => {
        expect(item.status).toBe(6);
      });

      expect(mockManagerService.loadGroupBuyOrders).toHaveBeenCalledWith('g1');
      expect(mockToastService.show).toHaveBeenCalledWith('Order marked as shipped!', 'success');
      expect(component.isSaving).toBe(false);
    });

    it('should not mark as shipped when dialog is cancelled', async () => {
      component.dialog = {
        open: vi.fn().mockResolvedValue(false),
      } as any;

      await component.markAsShipped();

      expect(mockGroupBuyService.updateOrder).not.toHaveBeenCalled();
    });

    it('should show error toast when markAsShipped fails', async () => {
      component.dialog = {
        open: vi.fn().mockResolvedValue(true),
      } as any;
      mockGroupBuyService.updateOrder.mockRejectedValueOnce(new Error('ship error'));

      await component.markAsShipped();

      expect(mockToastService.show).toHaveBeenCalledWith('Failed to update: ship error', 'error');
      expect(component.isSaving).toBe(false);
    });

    it('should preserve productId, specId and quantity when marking as shipped', async () => {
      component.dialog = {
        open: vi.fn().mockResolvedValue(true),
      } as any;

      await component.markAsShipped();

      const callArgs = mockGroupBuyService.updateOrder.mock.calls[0];
      const updatedItems = callArgs[1];
      expect(updatedItems[0].productId).toBe('p1');
      expect(updatedItems[0].specId).toBe('');
      expect(updatedItems[0].quantity).toBe(1);
      expect(updatedItems[1].productId).toBe('p2');
      expect(updatedItems[1].specId).toBe('s2');
      expect(updatedItems[1].quantity).toBe(3);
    });
  });

  describe('effect: sync order items to editableItems', () => {
    it('should populate editableItems when order loads with items', async () => {
      component.editableItems.set([]);
      mockManagerService.orders.set([
        {
          id: 'o1',
          items: [{ productId: 'p1', specId: 's1', quantity: 2, status: 3 }],
          shippingFee: '0',
        },
      ] as any);
      component.orderId.set('o1');

      // Trigger effect by running change detection
      fixture.detectChanges();
      await fixture.whenStable();

      const items = component.editableItems();
      expect(items.length).toBe(1);
      expect(items[0].productId).toBe('p1');
      expect(items[0].specId).toBe('s1');
      expect(items[0].quantity).toBe(2);
      expect(items[0].status).toBe(3);
    });

    it('should not overwrite editableItems if already populated', async () => {
      // Pre-populate editableItems
      component.editableItems.set([{ productId: 'existing' } as any]);

      mockManagerService.orders.set([
        {
          id: 'o1',
          items: [{ productId: 'p1', specId: '', quantity: 1, status: 1 }],
          shippingFee: '0',
        },
      ] as any);
      component.orderId.set('o1');

      fixture.detectChanges();
      await fixture.whenStable();

      // Should keep the existing items since editableItems is not empty
      expect(component.editableItems()[0].productId).toBe('existing');
    });
  });
});
