import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderListComponent } from './order-list.component';
import { ManagerService } from '../../../core/manager/manager.service';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { PaymentStatus } from '../../../core/api/api/v1/groupbuy_pb';

describe('OrderListComponent', () => {
  let component: OrderListComponent;
  let fixture: ComponentFixture<OrderListComponent>;

  const mockManagerService = {
    orders: signal([]),
    isLoading: signal(false),
    error: signal(null),
    loadProjectOrders: async () => {},
    confirmPayment: async () => {},
  };

  const mockToastService = {
    show: () => {},
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderListComponent],
      providers: [
        { provide: ManagerService, useValue: mockManagerService },
        { provide: ToastService, useValue: mockToastService },
        provideRouter([{ path: '**', component: OrderListComponent }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct payment status labels', () => {
    expect(component.getPaymentStatusLabel(PaymentStatus.UNSET)).toBe('Unpaid');
    expect(component.getPaymentStatusLabel(PaymentStatus.SUBMITTED)).toBe('Submitted');
    expect(component.getPaymentStatusLabel(PaymentStatus.CONFIRMED)).toBe('Paid');
    expect(component.getPaymentStatusLabel(PaymentStatus.REJECTED)).toBe('Rejected');
    expect(component.getPaymentStatusLabel(99 as any)).toBe('Unknown');
  });

  describe('isReadyToShip', () => {
    it('should return true when any item has status 5', () => {
      expect(component.isReadyToShip({ items: [{ status: 5 }, { status: 2 }] })).toBe(true);
    });

    it('should return false when no item has status 5', () => {
      expect(component.isReadyToShip({ items: [{ status: 2 }, { status: 6 }] })).toBe(false);
    });
  });

  describe('isFullyShipped', () => {
    it('should return true when all items have status 6', () => {
      expect(component.isFullyShipped({ items: [{ status: 6 }, { status: 6 }] })).toBe(true);
    });

    it('should return false when mixed statuses', () => {
      expect(component.isFullyShipped({ items: [{ status: 6 }, { status: 2 }] })).toBe(false);
    });

    it('should return false for empty items', () => {
      expect(component.isFullyShipped({ items: [] })).toBe(false);
    });
  });
});
