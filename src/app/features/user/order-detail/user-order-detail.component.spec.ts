import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserOrderDetailComponent } from './user-order-detail.component';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('UserOrderDetailComponent', () => {
  let component: UserOrderDetailComponent;
  let fixture: ComponentFixture<UserOrderDetailComponent>;

  const mockGroupBuyService = {
    currentGroupBuy: signal(null),
    currentProducts: signal([]),
    myOrders: signal([]),
    loadingMyOrders: signal(false),
    updatingOrder: signal(false),
    updateOrderError: signal(null),
    loadProject: async () => { },
    loadMyOrders: async () => { },
    updatePaymentInfoAsync: async () => { },
    updateOrder: async () => { },
    updateUserOrder: async () => { },
    setCart: () => { },
    clearCart: () => { },
  };

  const mockToastService = {
    show: () => { },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserOrderDetailComponent],
      providers: [
        { provide: GroupBuyService, useValue: mockGroupBuyService },
        { provide: ToastService, useValue: mockToastService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserOrderDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle editing items on', () => {
    component.toggleEditItems();
    expect(component.isEditingItems()).toBe(true);
  });

  it('should cancel editing items', () => {
    component.toggleEditItems();
    component.cancelEditItems();
    expect(component.isEditingItems()).toBe(false);
  });

  describe('order logic', () => {
    beforeEach(() => {
      mockGroupBuyService.myOrders.set([
        {
          id: 'o1',
          groupBuyId: 'g1',
          paymentStatus: 1,
          shippingFee: BigInt(30),
          contactInfo: 'line:abc',
          shippingAddress: 'addr',
          note: 'memo',
          items: [
            {
              productId: 'p1',
              specId: '',
              productName: 'P1',
              specName: '',
              price: BigInt(100),
              quantity: 2,
              status: 1,
            },
          ],
        },
      ] as any);
      fixture.componentRef.setInput('id', 'o1');
      fixture.detectChanges();
    });

    it('should compute subtotal and total', () => {
      expect(component.subtotal()).toBe(200);
      expect(component.shippingFee()).toBe(30);
      expect(component.total()).toBe(230);
    });

    it('should evaluate editable state', () => {
      expect(component.isEditable()).toBe(true);

      mockGroupBuyService.myOrders.set([
        {
          id: 'o1',
          groupBuyId: 'g1',
          paymentStatus: 3,
          items: [{ status: 1 }],
        },
      ] as any);
      fixture.detectChanges();
      expect(component.isEditable()).toBe(false);
    });

    it('should update quantity and remove item at zero', () => {
      const first = component.currentItems()[0];
      component.updateQuantity(first, 1);
      expect(component.currentItems()[0].quantity).toBe(3);

      component.updateQuantity(component.currentItems()[0], -3);
      expect(component.currentItems().length).toBe(0);
    });

    it('should call updateUserOrder on saveItems', () => {
      const spy = vi.spyOn(mockGroupBuyService, 'updateUserOrder');
      component.saveItems();
      expect(spy).toHaveBeenCalledWith(
        'o1',
        expect.arrayContaining([
          expect.objectContaining({
            productId: 'p1',
            specId: '',
            quantity: 2,
          }),
        ]),
        'memo',
      );
    });

    it('should save payment and reload orders', async () => {
      const updateSpy = vi
        .spyOn(mockGroupBuyService, 'updatePaymentInfoAsync')
        .mockResolvedValue(undefined);
      const reloadSpy = vi.spyOn(mockGroupBuyService, 'loadMyOrders').mockResolvedValue(undefined);

      component.paymentMethod = 'bank';
      component.accountLast5 = '12345';
      component.paymentAmount = 200;
      component.paymentPaidAt = '2025-01-01T00:00';
      component.contactInfo = 'line:new';
      component.shippingAddress = 'new-addr';

      await component.savePayment();

      expect(updateSpy).toHaveBeenCalled();
      expect(reloadSpy).toHaveBeenCalled();
      expect(component.isEditingPayment()).toBe(false);
    });

    it('should show toast when save payment fails', async () => {
      vi.spyOn(mockGroupBuyService, 'updatePaymentInfoAsync').mockRejectedValue(new Error('fail'));
      const toastSpy = vi.spyOn(mockToastService, 'show');

      await component.savePayment();

      expect(toastSpy).toHaveBeenCalledWith('Failed to update payment info', 'error');
    });
  });

  describe('Routing Actions', () => {
    it('should navigate to project with edit flag', () => {
      fixture.componentRef.setInput('id', 'o1');
      mockGroupBuyService.myOrders.set([{ id: 'o1', groupBuyId: 'g1', items: [] }] as any);
      fixture.detectChanges();

      const routerSpy = vi.spyOn(component.router, 'navigate');
      component.navigateToProject();

      expect(routerSpy).toHaveBeenCalledWith(['/groupbuy', 'g1'], { queryParams: { edit: 'true' } });
    });
  });
});
