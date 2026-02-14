import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserOrderDetailComponent } from './user-order-detail.component';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

describe('UserOrderDetailComponent', () => {
    let component: UserOrderDetailComponent;
    let fixture: ComponentFixture<UserOrderDetailComponent>;

    const mockProjectService = {
        currentProject: signal(null),
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
        clearCart: () => { }
    };

    const mockToastService = {
        show: () => { }
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UserOrderDetailComponent],
            providers: [
                { provide: GroupBuyService, useValue: mockProjectService },
                { provide: ToastService, useValue: mockToastService },
                provideRouter([])
            ]
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
});
