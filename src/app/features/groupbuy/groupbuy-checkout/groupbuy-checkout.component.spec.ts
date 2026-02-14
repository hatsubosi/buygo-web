import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupBuyCheckoutComponent } from './groupbuy-checkout.component';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ShippingType } from '../../../core/api/api/v1/groupbuy_pb';
import { vi } from 'vitest';

describe('GroupBuyCheckoutComponent', () => {
    let component: GroupBuyCheckoutComponent;
    let fixture: ComponentFixture<GroupBuyCheckoutComponent>;

    const mockProjectService = {
        currentGroupBuy: signal(null),
        currentProducts: signal([]),
        cartItems: signal([]),
        cartTotal: signal(0),
        cartCount: signal(0),
        lastCreatedOrderId: signal(null),
        submitOrderError: signal(null),
        isSubmitting: signal(false),
        isLoadingDetail: signal(false),
        cart: signal([]),
        loadProject: async () => { },
        submitOrder: async () => { },
        clearCart: () => { },
        removeFromCart: vi.fn(),
        updateCartQuantity: vi.fn(),
        loadExistingOrderIntoCart: async () => null
    };

    const mockToastService = {
        show: vi.fn()
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GroupBuyCheckoutComponent],
            providers: [
                { provide: GroupBuyService, useValue: mockProjectService },
                { provide: ToastService, useValue: mockToastService },
                provideRouter([{ path: '**', component: GroupBuyCheckoutComponent }])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(GroupBuyCheckoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        vi.clearAllMocks();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return correct shipping type labels', () => {
        expect(component.getShippingTypeLabel(ShippingType.MEETUP)).toBe('Meetup');
        expect(component.getShippingTypeLabel(ShippingType.DELIVERY)).toBe('Delivery');
        expect(component.getShippingTypeLabel(ShippingType.STORE_PICKUP)).toBe('Store Pickup');
        expect(component.getShippingTypeLabel(99)).toBe('Standard');
    });

    it('should return correct address label when no config selected', () => {
        expect(component.addressLabel()).toBe('Shipping Address');
    });

    it('should return correct address placeholder when no config selected', () => {
        expect(component.addressPlaceholder()).toBe('e.g. Address or Store Info');
    });

    it('should show address by default', () => {
        expect(component.shouldShowAddress()).toBe(true);
    });

    describe('submitOrder validation', () => {
        it('should show error when contactInfo is empty', () => {
            component.contactInfo = '';
            component.submitOrder();
            expect(mockToastService.show).toHaveBeenCalledWith('Please fill in Contact Info', 'error');
        });

        it('should show error when shipping method not selected', () => {
            component.contactInfo = 'test@test.com';
            mockProjectService.currentGroupBuy.set({
                id: 'p1',
                shippingConfigs: [{ id: 'sc1', name: 'Standard', type: 2, price: BigInt(100) }]
            } as any);
            component.selectedShippingMethodId = '';
            component.submitOrder();
            expect(mockToastService.show).toHaveBeenCalledWith('Please select a shipping method', 'error');
        });

        it('should show error when address missing for non-meetup', () => {
            component.contactInfo = 'test@test.com';
            component.shippingAddress = '';
            mockProjectService.currentGroupBuy.set({ id: 'p1', shippingConfigs: [] } as any);
            component.submitOrder();
            expect(mockToastService.show).toHaveBeenCalledWith('Please fill in Shipping Address', 'error');
        });
    });

    describe('updateQuantity', () => {
        it('should remove item when quantity reaches 0', () => {
            component.updateQuantity({ productId: 'p1', specId: 's1', quantity: 1 }, -1);
            expect(mockProjectService.removeFromCart).toHaveBeenCalledWith('p1', 's1');
        });

        it('should update quantity when above 0', () => {
            component.updateQuantity({ productId: 'p1', specId: 's1', quantity: 2 }, 1);
            expect(mockProjectService.updateCartQuantity).toHaveBeenCalledWith('p1', 's1', 3);
        });
    });

    describe('isMeetup and address labels', () => {
        it('should detect meetup config', () => {
            mockProjectService.currentGroupBuy.set({
                id: 'p1',
                shippingConfigs: [{ id: 'sc1', type: ShippingType.MEETUP }]
            } as any);
            component.selectedShippingMethodId = 'sc1';
            expect(component.isMeetup()).toBe(true);
        });

        it('should return delivery address label', () => {
            mockProjectService.currentGroupBuy.set({
                id: 'p1',
                shippingConfigs: [{ id: 'sc1', type: ShippingType.DELIVERY }]
            } as any);
            component.selectedShippingMethodId = 'sc1';
            expect(component.addressLabel()).toBe('Delivery Address');
        });

        it('should return store pickup placeholder', () => {
            mockProjectService.currentGroupBuy.set({
                id: 'p1',
                shippingConfigs: [{ id: 'sc1', type: ShippingType.STORE_PICKUP }]
            } as any);
            component.selectedShippingMethodId = 'sc1';
            expect(component.addressPlaceholder()).toBe('e.g. 7-11 Ximen Store (123456)');
        });
    });
});
