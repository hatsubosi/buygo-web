import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { GroupBuyCheckoutComponent } from './groupbuy-checkout.component';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { ShippingType } from '../../../core/api/api/v1/groupbuy_pb';
import { vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';

describe('GroupBuyCheckoutComponent', () => {
  let component: GroupBuyCheckoutComponent;
  let fixture: ComponentFixture<GroupBuyCheckoutComponent>;
  let router: Router;

  let mockGroupBuyService: any;
  let mockToastService: any;
  let paramMapSubject: Subject<any>;

  function createMockGroupBuyService() {
    return {
      currentGroupBuy: signal<any>(null),
      currentProducts: signal<any[]>([]),
      cartItems: signal<any[]>([]),
      cartTotal: signal(0),
      cartCount: signal(0),
      lastCreatedOrderId: signal<string | null>(null),
      submitOrderError: signal<string | null>(null),
      isSubmitting: signal(false),
      isSubmittingOrder: signal(false),
      isLoadingDetail: signal(false),
      cart: signal<any[]>([]),
      loadGroupBuy: vi.fn().mockResolvedValue(undefined),
      submitOrder: vi.fn().mockResolvedValue(undefined),
      clearCart: vi.fn(),
      removeFromCart: vi.fn(),
      updateCartQuantity: vi.fn(),
      loadExistingOrderIntoCart: vi.fn().mockResolvedValue(null),
    };
  }

  beforeEach(async () => {
    mockGroupBuyService = createMockGroupBuyService();
    mockToastService = { show: vi.fn() };
    paramMapSubject = new Subject();

    await TestBed.configureTestingModule({
      imports: [GroupBuyCheckoutComponent],
      providers: [
        { provide: GroupBuyService, useValue: mockGroupBuyService },
        { provide: ToastService, useValue: mockToastService },
        provideRouter([{ path: '**', component: GroupBuyCheckoutComponent }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupBuyCheckoutComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();

    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Constructor behavior ────────────────────────────────────────

  it('should clear lastCreatedOrderId on construction', () => {
    // lastCreatedOrderId.set(null) is called in constructor.
    // After construction the signal should be null.
    expect(mockGroupBuyService.lastCreatedOrderId()).toBeNull();
  });

  // ── Getter: project ─────────────────────────────────────────────

  it('should return null when no currentGroupBuy', () => {
    expect(component.project).toBeNull();
  });

  it('should return the current group buy project', () => {
    const proj = { id: 'p1', shippingConfigs: [] };
    mockGroupBuyService.currentGroupBuy.set(proj);
    expect(component.project).toEqual(proj);
  });

  // ── Getter: shippingConfigs ─────────────────────────────────────

  it('should return empty array when project is null', () => {
    expect(component.shippingConfigs).toEqual([]);
  });

  it('should return shippingConfigs from project', () => {
    const configs = [{ id: 'sc1', type: ShippingType.DELIVERY, price: 50 }];
    mockGroupBuyService.currentGroupBuy.set({ id: 'p1', shippingConfigs: configs });
    expect(component.shippingConfigs).toEqual(configs);
  });

  it('should return empty array when project has no shippingConfigs', () => {
    mockGroupBuyService.currentGroupBuy.set({ id: 'p1' } as any);
    expect(component.shippingConfigs).toEqual([]);
  });

  // ── Getter: selectedConfig ──────────────────────────────────────

  it('should return undefined when no config is selected', () => {
    mockGroupBuyService.currentGroupBuy.set({
      id: 'p1',
      shippingConfigs: [{ id: 'sc1', type: ShippingType.DELIVERY }],
    });
    component.selectedShippingMethodId = '';
    expect(component.selectedConfig).toBeUndefined();
  });

  it('should return the matching config when selected', () => {
    const config = { id: 'sc1', type: ShippingType.DELIVERY, price: 100 };
    mockGroupBuyService.currentGroupBuy.set({ id: 'p1', shippingConfigs: [config] });
    component.selectedShippingMethodId = 'sc1';
    expect(component.selectedConfig).toEqual(config);
  });

  // ── Getter: shippingFee ─────────────────────────────────────────

  it('should return 0 when no config is selected', () => {
    expect(component.shippingFee).toBe(0);
  });

  it('should return the price of the selected config', () => {
    mockGroupBuyService.currentGroupBuy.set({
      id: 'p1',
      shippingConfigs: [{ id: 'sc1', type: ShippingType.DELIVERY, price: 150 }],
    });
    component.selectedShippingMethodId = 'sc1';
    expect(component.shippingFee).toBe(150);
  });

  it('should handle BigInt price by converting to Number', () => {
    mockGroupBuyService.currentGroupBuy.set({
      id: 'p1',
      shippingConfigs: [{ id: 'sc1', type: ShippingType.DELIVERY, price: BigInt(200) }],
    });
    component.selectedShippingMethodId = 'sc1';
    expect(component.shippingFee).toBe(200);
  });

  // ── Getter: totalAmount ─────────────────────────────────────────

  it('should return cartTotal when no shipping fee', () => {
    mockGroupBuyService.cartTotal.set(500);
    expect(component.totalAmount).toBe(500);
  });

  it('should add shipping fee to cartTotal', () => {
    mockGroupBuyService.cartTotal.set(500);
    mockGroupBuyService.currentGroupBuy.set({
      id: 'p1',
      shippingConfigs: [{ id: 'sc1', type: ShippingType.DELIVERY, price: 100 }],
    });
    component.selectedShippingMethodId = 'sc1';
    expect(component.totalAmount).toBe(600);
  });

  // ── getShippingTypeLabel ────────────────────────────────────────

  it('should return correct shipping type labels', () => {
    expect(component.getShippingTypeLabel(ShippingType.MEETUP)).toBe('Meetup');
    expect(component.getShippingTypeLabel(ShippingType.DELIVERY)).toBe('Delivery');
    expect(component.getShippingTypeLabel(ShippingType.STORE_PICKUP)).toBe('Store Pickup');
    expect(component.getShippingTypeLabel(99)).toBe('Standard');
  });

  it('should return Standard for UNSPECIFIED shipping type', () => {
    expect(component.getShippingTypeLabel(ShippingType.UNSPECIFIED)).toBe('Standard');
  });

  // ── isMeetup ────────────────────────────────────────────────────

  it('should return false when no config is selected', () => {
    expect(component.isMeetup()).toBe(false);
  });

  it('should return true when selected config type is MEETUP', () => {
    mockGroupBuyService.currentGroupBuy.set({
      id: 'p1',
      shippingConfigs: [{ id: 'sc1', type: ShippingType.MEETUP }],
    });
    component.selectedShippingMethodId = 'sc1';
    expect(component.isMeetup()).toBe(true);
  });

  it('should return false when selected config type is DELIVERY', () => {
    mockGroupBuyService.currentGroupBuy.set({
      id: 'p1',
      shippingConfigs: [{ id: 'sc1', type: ShippingType.DELIVERY }],
    });
    component.selectedShippingMethodId = 'sc1';
    expect(component.isMeetup()).toBe(false);
  });

  // ── shouldShowAddress ───────────────────────────────────────────

  it('should always return true', () => {
    expect(component.shouldShowAddress()).toBe(true);
  });

  // ── addressLabel ────────────────────────────────────────────────

  it('should return Shipping Address when no config selected', () => {
    expect(component.addressLabel()).toBe('Shipping Address');
  });

  it('should return meetup label when config is MEETUP', () => {
    mockGroupBuyService.currentGroupBuy.set({
      id: 'p1',
      shippingConfigs: [{ id: 'sc1', type: ShippingType.MEETUP }],
    });
    component.selectedShippingMethodId = 'sc1';
    expect(component.addressLabel()).toBe('Notes / Meetup Details (Optional)');
  });

  it('should return Delivery Address when config is DELIVERY', () => {
    mockGroupBuyService.currentGroupBuy.set({
      id: 'p1',
      shippingConfigs: [{ id: 'sc1', type: ShippingType.DELIVERY }],
    });
    component.selectedShippingMethodId = 'sc1';
    expect(component.addressLabel()).toBe('Delivery Address');
  });

  it('should return Pickup Store label when config is STORE_PICKUP', () => {
    mockGroupBuyService.currentGroupBuy.set({
      id: 'p1',
      shippingConfigs: [{ id: 'sc1', type: ShippingType.STORE_PICKUP }],
    });
    component.selectedShippingMethodId = 'sc1';
    expect(component.addressLabel()).toBe('Pickup Store (Name/Code)');
  });

  // ── addressPlaceholder ──────────────────────────────────────────

  it('should return default placeholder when no config selected', () => {
    expect(component.addressPlaceholder()).toBe('e.g. Address or Store Info');
  });

  it('should return meetup placeholder', () => {
    mockGroupBuyService.currentGroupBuy.set({
      id: 'p1',
      shippingConfigs: [{ id: 'sc1', type: ShippingType.MEETUP }],
    });
    component.selectedShippingMethodId = 'sc1';
    expect(component.addressPlaceholder()).toBe('e.g. Will arrive on time');
  });

  it('should return delivery placeholder', () => {
    mockGroupBuyService.currentGroupBuy.set({
      id: 'p1',
      shippingConfigs: [{ id: 'sc1', type: ShippingType.DELIVERY }],
    });
    component.selectedShippingMethodId = 'sc1';
    expect(component.addressPlaceholder()).toBe('e.g. 123 Main St, City');
  });

  it('should return store pickup placeholder', () => {
    mockGroupBuyService.currentGroupBuy.set({
      id: 'p1',
      shippingConfigs: [{ id: 'sc1', type: ShippingType.STORE_PICKUP }],
    });
    component.selectedShippingMethodId = 'sc1';
    expect(component.addressPlaceholder()).toBe('e.g. 7-11 Ximen Store (123456)');
  });

  // ── goBack ──────────────────────────────────────────────────────

  it('should navigate back one level', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.goBack();
    expect(navigateSpy).toHaveBeenCalledWith(['../'], { relativeTo: component.route });
  });

  // ── updateQuantity ──────────────────────────────────────────────

  describe('updateQuantity', () => {
    it('should remove item when new quantity is 0', () => {
      component.updateQuantity({ productId: 'p1', specId: 's1', quantity: 1 }, -1);
      expect(mockGroupBuyService.removeFromCart).toHaveBeenCalledWith('p1', 's1');
    });

    it('should remove item when new quantity goes negative', () => {
      component.updateQuantity({ productId: 'p1', specId: 's1', quantity: 0 }, -1);
      expect(mockGroupBuyService.removeFromCart).toHaveBeenCalledWith('p1', 's1');
    });

    it('should update quantity when result is above 0', () => {
      component.updateQuantity({ productId: 'p1', specId: 's1', quantity: 2 }, 1);
      expect(mockGroupBuyService.updateCartQuantity).toHaveBeenCalledWith('p1', 's1', 3);
    });

    it('should update quantity to 1 when incrementing from 0', () => {
      component.updateQuantity({ productId: 'p1', specId: 's1', quantity: 0 }, 1);
      expect(mockGroupBuyService.updateCartQuantity).toHaveBeenCalledWith('p1', 's1', 1);
    });

    it('should decrement quantity when result stays above 0', () => {
      component.updateQuantity({ productId: 'p1', specId: 's1', quantity: 3 }, -1);
      expect(mockGroupBuyService.updateCartQuantity).toHaveBeenCalledWith('p1', 's1', 2);
    });
  });

  // ── submitOrder ─────────────────────────────────────────────────

  describe('submitOrder', () => {
    it('should show error when contactInfo is empty', () => {
      component.contactInfo = '';
      component.submitOrder();
      expect(mockToastService.show).toHaveBeenCalledWith('Please fill in Contact Info', 'error');
      expect(mockGroupBuyService.submitOrder).not.toHaveBeenCalled();
    });

    it('should show error when contactInfo is empty string with whitespace trimming not applied', () => {
      component.contactInfo = '';
      component.shippingAddress = '123 Main St';
      component.submitOrder();
      expect(mockToastService.show).toHaveBeenCalledWith('Please fill in Contact Info', 'error');
    });

    it('should show error when shipping configs exist but none selected', () => {
      component.contactInfo = 'test@test.com';
      mockGroupBuyService.currentGroupBuy.set({
        id: 'p1',
        shippingConfigs: [{ id: 'sc1', name: 'Standard', type: ShippingType.DELIVERY, price: BigInt(100) }],
      });
      component.selectedShippingMethodId = '';
      component.submitOrder();
      expect(mockToastService.show).toHaveBeenCalledWith(
        'Please select a shipping method',
        'error',
      );
      expect(mockGroupBuyService.submitOrder).not.toHaveBeenCalled();
    });

    it('should NOT show shipping method error when no shipping configs exist', () => {
      component.contactInfo = 'test@test.com';
      component.shippingAddress = '';
      mockGroupBuyService.currentGroupBuy.set({ id: 'p1', shippingConfigs: [] });
      component.selectedShippingMethodId = '';
      component.submitOrder();
      // Should skip shipping method validation and hit address validation instead
      expect(mockToastService.show).toHaveBeenCalledWith(
        'Please fill in Shipping Address',
        'error',
      );
    });

    it('should show error when address missing for non-meetup shipping', () => {
      component.contactInfo = 'test@test.com';
      component.shippingAddress = '';
      mockGroupBuyService.currentGroupBuy.set({ id: 'p1', shippingConfigs: [] });
      component.submitOrder();
      expect(mockToastService.show).toHaveBeenCalledWith(
        'Please fill in Shipping Address',
        'error',
      );
      expect(mockGroupBuyService.submitOrder).not.toHaveBeenCalled();
    });

    it('should NOT require address when shipping type is MEETUP', () => {
      component.contactInfo = 'test@test.com';
      component.shippingAddress = '';
      mockGroupBuyService.currentGroupBuy.set({
        id: 'p1',
        shippingConfigs: [{ id: 'sc1', type: ShippingType.MEETUP, price: 0 }],
      });
      component.selectedShippingMethodId = 'sc1';
      component.submitOrder();
      expect(mockToastService.show).not.toHaveBeenCalled();
      expect(mockGroupBuyService.submitOrder).toHaveBeenCalled();
    });

    it('should not submit when projectId is missing', () => {
      component.contactInfo = 'test@test.com';
      component.shippingAddress = '123 Main St';
      mockGroupBuyService.currentGroupBuy.set(null);
      component.submitOrder();
      expect(mockGroupBuyService.submitOrder).not.toHaveBeenCalled();
    });

    it('should call submitOrder with all correct parameters', () => {
      const cartItems = [{ productId: 'p1', specId: 's1', quantity: 2 }];
      mockGroupBuyService.currentGroupBuy.set({
        id: 'proj-123',
        shippingConfigs: [{ id: 'sc1', type: ShippingType.DELIVERY, price: 100 }],
      });
      mockGroupBuyService.cart.set(cartItems);
      component.contactInfo = 'John 0912345678';
      component.shippingAddress = '123 Main St';
      component.selectedShippingMethodId = 'sc1';
      component.note = 'Please leave at door';

      component.submitOrder();

      expect(mockGroupBuyService.submitOrder).toHaveBeenCalledWith(
        'proj-123',
        'John 0912345678',
        '123 Main St',
        cartItems,
        'sc1',
        'Please leave at door',
      );
    });

    it('should submit with empty note when note is not provided', () => {
      mockGroupBuyService.currentGroupBuy.set({
        id: 'proj-123',
        shippingConfigs: [],
      });
      mockGroupBuyService.cart.set([]);
      component.contactInfo = 'test@test.com';
      component.shippingAddress = '123 Main St';
      component.selectedShippingMethodId = '';
      component.note = '';

      component.submitOrder();

      expect(mockGroupBuyService.submitOrder).toHaveBeenCalledWith(
        'proj-123',
        'test@test.com',
        '123 Main St',
        [],
        '',
        '',
      );
    });

    it('should require address for DELIVERY type', () => {
      component.contactInfo = 'test@test.com';
      component.shippingAddress = '';
      mockGroupBuyService.currentGroupBuy.set({
        id: 'p1',
        shippingConfigs: [{ id: 'sc1', type: ShippingType.DELIVERY, price: 50 }],
      });
      component.selectedShippingMethodId = 'sc1';
      component.submitOrder();
      expect(mockToastService.show).toHaveBeenCalledWith(
        'Please fill in Shipping Address',
        'error',
      );
      expect(mockGroupBuyService.submitOrder).not.toHaveBeenCalled();
    });

    it('should require address for STORE_PICKUP type', () => {
      component.contactInfo = 'test@test.com';
      component.shippingAddress = '';
      mockGroupBuyService.currentGroupBuy.set({
        id: 'p1',
        shippingConfigs: [{ id: 'sc1', type: ShippingType.STORE_PICKUP, price: 0 }],
      });
      component.selectedShippingMethodId = 'sc1';
      component.submitOrder();
      expect(mockToastService.show).toHaveBeenCalledWith(
        'Please fill in Shipping Address',
        'error',
      );
    });
  });

  // ── checkExistingOrder ──────────────────────────────────────────

  describe('checkExistingOrder', () => {
    it('should navigate to user orders when payment status > 2', async () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      mockGroupBuyService.loadExistingOrderIntoCart.mockResolvedValue({
        id: 'order-1',
        paymentStatus: 3,
        contactInfo: '',
        shippingAddress: '',
      });

      await component.checkExistingOrder('proj-1');

      expect(navigateSpy).toHaveBeenCalledWith(['/user/orders', 'order-1']);
    });

    it('should navigate to user orders when payment status is 4', async () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      mockGroupBuyService.loadExistingOrderIntoCart.mockResolvedValue({
        id: 'order-2',
        paymentStatus: 4,
        contactInfo: '',
        shippingAddress: '',
      });

      await component.checkExistingOrder('proj-1');

      expect(navigateSpy).toHaveBeenCalledWith(['/user/orders', 'order-2']);
    });

    it('should populate form fields from existing order with paymentStatus <= 2', async () => {
      mockGroupBuyService.loadExistingOrderIntoCart.mockResolvedValue({
        id: 'order-1',
        paymentStatus: 1,
        contactInfo: 'John Doe',
        shippingAddress: '456 Oak Ave',
        shippingMethodId: 'sc2',
        note: 'Ring doorbell',
      });

      await component.checkExistingOrder('proj-1');

      expect(component.contactInfo).toBe('John Doe');
      expect(component.shippingAddress).toBe('456 Oak Ave');
      expect(component.selectedShippingMethodId).toBe('sc2');
      expect(component.note).toBe('Ring doorbell');
    });

    it('should populate form without shippingMethodId when not present', async () => {
      mockGroupBuyService.loadExistingOrderIntoCart.mockResolvedValue({
        id: 'order-1',
        paymentStatus: 2,
        contactInfo: 'Jane',
        shippingAddress: '789 Elm St',
        shippingMethodId: '',
      });

      await component.checkExistingOrder('proj-1');

      expect(component.contactInfo).toBe('Jane');
      expect(component.shippingAddress).toBe('789 Elm St');
      expect(component.selectedShippingMethodId).toBe('');
    });

    it('should not populate form when no existing order', async () => {
      mockGroupBuyService.loadExistingOrderIntoCart.mockResolvedValue(null);

      component.contactInfo = 'original';
      component.shippingAddress = 'original address';

      await component.checkExistingOrder('proj-1');

      expect(component.contactInfo).toBe('original');
      expect(component.shippingAddress).toBe('original address');
    });

    it('should handle order with paymentStatus of exactly 2 (not redirecting)', async () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      mockGroupBuyService.loadExistingOrderIntoCart.mockResolvedValue({
        id: 'order-1',
        paymentStatus: 2,
        contactInfo: 'Test',
        shippingAddress: 'Test Addr',
        shippingMethodId: '',
      });

      await component.checkExistingOrder('proj-1');

      expect(navigateSpy).not.toHaveBeenCalledWith(['/user/orders', 'order-1']);
      expect(component.contactInfo).toBe('Test');
    });

    it('should not set note when order has no note property', async () => {
      mockGroupBuyService.loadExistingOrderIntoCart.mockResolvedValue({
        id: 'order-1',
        paymentStatus: 1,
        contactInfo: 'Test',
        shippingAddress: 'Addr',
        shippingMethodId: 'sc1',
      });

      component.note = '';
      await component.checkExistingOrder('proj-1');

      expect(component.note).toBe('');
    });

    it('should pre-select shipping method from existing order', async () => {
      mockGroupBuyService.loadExistingOrderIntoCart.mockResolvedValue({
        id: 'order-1',
        paymentStatus: 1,
        contactInfo: 'Test',
        shippingAddress: 'Addr',
        shippingMethodId: 'ship-method-42',
      });

      await component.checkExistingOrder('proj-1');

      expect(component.selectedShippingMethodId).toBe('ship-method-42');
    });
  });

  // ── ngOnInit ────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should load group buy when route has id param', () => {
      // Re-create with an ActivatedRoute that emits an id
      mockGroupBuyService = createMockGroupBuyService();
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [GroupBuyCheckoutComponent],
        providers: [
          { provide: GroupBuyService, useValue: mockGroupBuyService },
          { provide: ToastService, useValue: mockToastService },
          provideRouter([{ path: '**', component: GroupBuyCheckoutComponent }]),
          {
            provide: ActivatedRoute,
            useValue: { paramMap: of({ get: (key: string) => key === 'id' ? 'proj-99' : null }) },
          },
        ],
      }).compileComponents();

      const fix = TestBed.createComponent(GroupBuyCheckoutComponent);
      fix.detectChanges();

      expect(mockGroupBuyService.loadGroupBuy).toHaveBeenCalledWith('proj-99');
    });

    it('should not load group buy when route has no id param', () => {
      mockGroupBuyService = createMockGroupBuyService();
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [GroupBuyCheckoutComponent],
        providers: [
          { provide: GroupBuyService, useValue: mockGroupBuyService },
          { provide: ToastService, useValue: mockToastService },
          provideRouter([{ path: '**', component: GroupBuyCheckoutComponent }]),
          {
            provide: ActivatedRoute,
            useValue: { paramMap: of({ get: () => null }) },
          },
        ],
      }).compileComponents();

      const fix = TestBed.createComponent(GroupBuyCheckoutComponent);
      fix.detectChanges();

      expect(mockGroupBuyService.loadGroupBuy).not.toHaveBeenCalled();
    });
  });

  // ── Constructor effects ─────────────────────────────────────────

  describe('effect: lastCreatedOrderId redirect', () => {
    it('should navigate to order confirmation when lastCreatedOrderId and projectId are set', async () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      mockGroupBuyService.currentGroupBuy.set({ id: 'proj-abc', shippingConfigs: [] });
      mockGroupBuyService.lastCreatedOrderId.set('order-xyz');
      // Trigger change detection so effects run
      TestBed.flushEffects();

      expect(navigateSpy).toHaveBeenCalledWith([
        'groupbuy',
        'proj-abc',
        'order-confirmation',
        'order-xyz',
      ]);
    });

    it('should NOT navigate when lastCreatedOrderId is null', () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      mockGroupBuyService.currentGroupBuy.set({ id: 'proj-abc', shippingConfigs: [] });
      mockGroupBuyService.lastCreatedOrderId.set(null);
      TestBed.flushEffects();

      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('should NOT navigate when projectId is missing', () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      mockGroupBuyService.currentGroupBuy.set(null);
      mockGroupBuyService.lastCreatedOrderId.set('order-xyz');
      TestBed.flushEffects();

      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  // ── Multiple shipping configs ───────────────────────────────────

  describe('multiple shipping configs', () => {
    it('should select the correct config from multiple options', () => {
      const configs = [
        { id: 'sc1', type: ShippingType.DELIVERY, price: 100, name: 'Delivery' },
        { id: 'sc2', type: ShippingType.MEETUP, price: 0, name: 'Meetup' },
        { id: 'sc3', type: ShippingType.STORE_PICKUP, price: 50, name: 'Pickup' },
      ];
      mockGroupBuyService.currentGroupBuy.set({ id: 'p1', shippingConfigs: configs });

      component.selectedShippingMethodId = 'sc2';
      expect(component.selectedConfig).toEqual(configs[1]);
      expect(component.isMeetup()).toBe(true);
      expect(component.shippingFee).toBe(0);

      component.selectedShippingMethodId = 'sc3';
      expect(component.selectedConfig).toEqual(configs[2]);
      expect(component.isMeetup()).toBe(false);
      expect(component.shippingFee).toBe(50);
      expect(component.addressLabel()).toBe('Pickup Store (Name/Code)');
    });
  });

  // ── Integration: full valid submit flow ─────────────────────────

  describe('full submit flow', () => {
    it('should successfully submit with all fields filled', () => {
      const cartItems = [
        { productId: 'p1', specId: 's1', quantity: 2, price: 100, productName: 'Item A' },
      ];
      mockGroupBuyService.currentGroupBuy.set({
        id: 'proj-final',
        shippingConfigs: [{ id: 'sc1', type: ShippingType.DELIVERY, price: 60 }],
      });
      mockGroupBuyService.cart.set(cartItems);
      mockGroupBuyService.cartTotal.set(200);

      component.contactInfo = 'buyer@email.com';
      component.shippingAddress = '100 Market St';
      component.selectedShippingMethodId = 'sc1';
      component.note = 'Fragile items';

      // Verify total calculation before submit
      expect(component.totalAmount).toBe(260);

      component.submitOrder();

      expect(mockToastService.show).not.toHaveBeenCalled();
      expect(mockGroupBuyService.submitOrder).toHaveBeenCalledWith(
        'proj-final',
        'buyer@email.com',
        '100 Market St',
        cartItems,
        'sc1',
        'Fragile items',
      );
    });

    it('should successfully submit meetup order without address', () => {
      mockGroupBuyService.currentGroupBuy.set({
        id: 'proj-meetup',
        shippingConfigs: [{ id: 'sc1', type: ShippingType.MEETUP, price: 0 }],
      });
      mockGroupBuyService.cart.set([]);

      component.contactInfo = 'buyer@email.com';
      component.shippingAddress = '';
      component.selectedShippingMethodId = 'sc1';
      component.note = '';

      component.submitOrder();

      expect(mockToastService.show).not.toHaveBeenCalled();
      expect(mockGroupBuyService.submitOrder).toHaveBeenCalledWith(
        'proj-meetup',
        'buyer@email.com',
        '',
        [],
        'sc1',
        '',
      );
    });
  });

  // ── Template rendering tests ──────────────────────────────────

  describe('template rendering', () => {
    it('should show "Your cart is empty" when cartCount is 0 and not loading', () => {
      mockGroupBuyService.cartCount.set(0);
      mockGroupBuyService.isLoadingDetail.set(false);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Your cart is empty');
    });

    it('should show loading spinner when cartCount is 0 and isLoadingDetail is true', () => {
      mockGroupBuyService.cartCount.set(0);
      mockGroupBuyService.isLoadingDetail.set(true);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const spinner = el.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();
      expect(el.textContent).not.toContain('Your cart is empty');
    });

    it('should show cart items with product name and price when cart has items', () => {
      mockGroupBuyService.cartCount.set(2);
      mockGroupBuyService.cart.set([
        { productId: 'p1', specId: 's1', quantity: 2, price: 100, productName: 'Widget', specName: 'Red' },
        { productId: 'p2', specId: '', quantity: 1, price: 50, productName: 'Gadget', specName: '' },
      ]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Widget');
      expect(el.textContent).toContain('$100');
      expect(el.textContent).toContain('Gadget');
      expect(el.textContent).toContain('$50');
    });

    it('should show spec name when item has specName', () => {
      mockGroupBuyService.cartCount.set(1);
      mockGroupBuyService.cart.set([
        { productId: 'p1', specId: 's1', quantity: 1, price: 100, productName: 'Widget', specName: 'Red' },
      ]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Red');
    });

    it('should show quantity +/- buttons for each cart item', () => {
      mockGroupBuyService.cartCount.set(1);
      mockGroupBuyService.cart.set([
        { productId: 'p1', specId: 's1', quantity: 3, price: 100, productName: 'Widget', specName: 'Red' },
      ]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const buttons = el.querySelectorAll('button');
      const buttonTexts = Array.from(buttons).map((b) => b.textContent?.trim());
      expect(buttonTexts).toContain('-');
      expect(buttonTexts).toContain('+');
    });

    it('should show "Shipping Method" section when shippingConfigs exist', () => {
      mockGroupBuyService.cartCount.set(1);
      mockGroupBuyService.cart.set([
        { productId: 'p1', specId: 's1', quantity: 1, price: 100, productName: 'Widget', specName: '' },
      ]);
      mockGroupBuyService.currentGroupBuy.set({
        id: 'p1',
        shippingConfigs: [{ id: 'sc1', type: ShippingType.DELIVERY, price: 50, name: 'Standard' }],
      });
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Shipping Method');
    });

    it('should NOT show "Shipping Method" when no shippingConfigs', () => {
      mockGroupBuyService.cartCount.set(1);
      mockGroupBuyService.cart.set([
        { productId: 'p1', specId: 's1', quantity: 1, price: 100, productName: 'Widget', specName: '' },
      ]);
      mockGroupBuyService.currentGroupBuy.set({
        id: 'p1',
        shippingConfigs: [],
      });
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).not.toContain('Shipping Method');
    });

    it('should show "Contact Info" label', () => {
      mockGroupBuyService.cartCount.set(1);
      mockGroupBuyService.cart.set([
        { productId: 'p1', specId: 's1', quantity: 1, price: 100, productName: 'Widget', specName: '' },
      ]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Contact Info');
    });

    it('should show total amount', () => {
      mockGroupBuyService.cartCount.set(1);
      mockGroupBuyService.cart.set([
        { productId: 'p1', specId: 's1', quantity: 1, price: 100, productName: 'Widget', specName: '' },
      ]);
      mockGroupBuyService.cartTotal.set(250);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Total');
      expect(el.textContent).toContain('$250');
    });

    it('should show "Confirm Order" button', () => {
      mockGroupBuyService.cartCount.set(1);
      mockGroupBuyService.cart.set([
        { productId: 'p1', specId: 's1', quantity: 1, price: 100, productName: 'Widget', specName: '' },
      ]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Confirm Order');
    });

    it('should show error message when submitOrderError is set', () => {
      mockGroupBuyService.cartCount.set(1);
      mockGroupBuyService.cart.set([
        { productId: 'p1', specId: 's1', quantity: 1, price: 100, productName: 'Widget', specName: '' },
      ]);
      mockGroupBuyService.submitOrderError.set('Something went wrong');
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Something went wrong');
    });

    it('should show meetup helper text when shipping type is MEETUP', () => {
      mockGroupBuyService.cartCount.set(1);
      mockGroupBuyService.cart.set([
        { productId: 'p1', specId: 's1', quantity: 1, price: 100, productName: 'Widget', specName: '' },
      ]);
      mockGroupBuyService.currentGroupBuy.set({
        id: 'p1',
        shippingConfigs: [{ id: 'sc1', type: ShippingType.MEETUP, price: 0, name: 'Meetup' }],
      });
      component.selectedShippingMethodId = 'sc1';
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('For meetup, you can leave this blank');
    });
  });
});
