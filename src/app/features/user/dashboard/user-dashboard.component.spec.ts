import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserDashboardComponent } from './user-dashboard.component';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { EventService } from '../../../core/event/event.service';
import { AuthService } from '../../../core/auth/auth.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { PaymentStatus, OrderItemStatus } from '../../../core/api/api/v1/groupbuy_pb';
import { RegistrationStatus } from '../../../core/api/api/v1/event_pb';

describe('UserDashboardComponent', () => {
    let component: UserDashboardComponent;
    let fixture: ComponentFixture<UserDashboardComponent>;

    const mockGroupBuyService = {
        myOrders: signal([]),
        loadMyOrders: async () => { }
    };

    const mockEventService = {
        getMyRegistrations: async () => []
    };

    const mockAuthService = {
        user: signal({ id: 'test-user', name: 'Test' })
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UserDashboardComponent],
            providers: [
                { provide: GroupBuyService, useValue: mockGroupBuyService },
                { provide: EventService, useValue: mockEventService },
                { provide: AuthService, useValue: mockAuthService },
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(UserDashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return correct payment status labels', () => {
        expect(component.getPaymentStatusLabel(PaymentStatus.CONFIRMED)).toBe('Paid');
        expect(component.getPaymentStatusLabel(PaymentStatus.SUBMITTED)).toBe('Submitted');
        expect(component.getPaymentStatusLabel(PaymentStatus.UNSET)).toBe('Unpaid');
    });

    it('should return correct item status labels', () => {
        expect(component.getItemStatusLabel(OrderItemStatus.ITEM_STATUS_ORDERED)).toBe('Ordered');
        expect(component.getItemStatusLabel(OrderItemStatus.ITEM_STATUS_READY_FOR_PICKUP)).toBe('Ready');
        expect(component.getItemStatusLabel(OrderItemStatus.ITEM_STATUS_SENT)).toBe('Sent/Picked Up');
    });

    it('should return correct registration status labels', () => {
        expect(component.getRegStatusLabel(RegistrationStatus.PENDING)).toBe('Pending');
        expect(component.getRegStatusLabel(RegistrationStatus.CONFIRMED)).toBe('Confirmed');
    });
});
