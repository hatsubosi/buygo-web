import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManagerOrderDetailComponent } from './manager-order-detail.component';
import { ManagerService } from '../../../core/manager/manager.service';
import { ProjectService } from '../../../core/project/project.service';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { PaymentStatus } from '../../../core/api/api/v1/project_pb';

describe('ManagerOrderDetailComponent', () => {
    let component: ManagerOrderDetailComponent;
    let fixture: ComponentFixture<ManagerOrderDetailComponent>;

    const mockManagerService = {
        orders: signal<any[]>([]),
        isLoading: signal(false),
        loadProjectOrders: async () => { },
        confirmPayment: async () => { }
    };

    const mockProjectService = {
        currentProject: signal(null),
        currentProducts: signal([]),
        loadProject: async () => { },
        updateOrder: async () => { }
    };

    const mockToastService = {
        show: () => { }
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ManagerOrderDetailComponent],
            providers: [
                { provide: ManagerService, useValue: mockManagerService },
                { provide: ProjectService, useValue: mockProjectService },
                { provide: ToastService, useValue: mockToastService },
                provideRouter([{ path: '**', component: ManagerOrderDetailComponent }])
            ]
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
});
