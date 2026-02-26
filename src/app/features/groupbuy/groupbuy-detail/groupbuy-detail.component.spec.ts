import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupBuyDetailComponent } from './groupbuy-detail.component';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { PaymentStatus } from '../../../core/api/api/v1/groupbuy_pb';

describe('GroupBuyDetailComponent', () => {
  let component: GroupBuyDetailComponent;
  let fixture: ComponentFixture<GroupBuyDetailComponent>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn>; url: string };

  // Re-create writable signals for each test via factory
  function createMockGroupBuyService() {
    return {
      currentGroupBuy: signal(null as any),
      isLoadingDetail: signal(false),
      myGroupBuyOrder: signal(null as any),
      currentProducts: signal([] as any[]),
      cart: signal([] as any[]),
      cartCount: signal(0),
      cartTotal: signal(0),
      loadGroupBuy: vi.fn(),
      loadExistingOrderIntoCart: vi.fn().mockResolvedValue(null),
      addToCart: vi.fn(),
      removeFromCart: vi.fn(),
      updateCartQuantity: vi.fn(),
      clearCart: vi.fn(),
      editSubmittedOrder: vi.fn(),
    };
  }

  function createMockAuthService() {
    return {
      user: signal(null as any),
      isAuthenticated: vi.fn().mockReturnValue(false),
    };
  }

  function createMockToastService() {
    return {
      show: vi.fn(),
    };
  }

  let mockGroupBuyService: ReturnType<typeof createMockGroupBuyService>;
  let mockAuthService: ReturnType<typeof createMockAuthService>;
  let mockToastService: ReturnType<typeof createMockToastService>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockGroupBuyService = createMockGroupBuyService();
    mockAuthService = createMockAuthService();
    mockToastService = createMockToastService();
    mockActivatedRoute = {
      paramMap: of({ get: (key: string) => (key === 'id' ? '123' : null) }),
      snapshot: {
        paramMap: { get: (key: string) => (key === 'id' ? '123' : null) },
        queryParamMap: { get: () => null },
      },
    };

    await TestBed.configureTestingModule({
      imports: [GroupBuyDetailComponent],
      providers: [
        { provide: GroupBuyService, useValue: mockGroupBuyService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
        provideRouter([]),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    mockRouter = TestBed.inject(Router) as any;
    mockRouter.navigate = vi.fn();

    fixture = TestBed.createComponent(GroupBuyDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ──────────────────────────────────────────
  // canManage computed
  // ──────────────────────────────────────────
  describe('canManage', () => {
    it('should return false when no user or project', () => {
      expect(component.canManage()).toBe(false);
    });

    it('should return true when user is the creator', () => {
      mockAuthService.user.set({ id: 'user1', name: 'Test' } as any);
      mockGroupBuyService.currentGroupBuy.set({
        id: 'proj1',
        creator: { id: 'user1' },
        managers: [],
      } as any);
      expect(component.canManage()).toBe(true);
    });

    it('should return true when user is a manager', () => {
      mockAuthService.user.set({ id: 'user2', name: 'Test' } as any);
      mockGroupBuyService.currentGroupBuy.set({
        id: 'proj1',
        creator: { id: 'user1' },
        managers: [{ id: 'user2' }],
      } as any);
      expect(component.canManage()).toBe(true);
    });

    it('should return false when user is neither creator nor manager', () => {
      mockAuthService.user.set({ id: 'user3', name: 'Test' } as any);
      mockGroupBuyService.currentGroupBuy.set({
        id: 'proj1',
        creator: { id: 'user1' },
        managers: [{ id: 'user2' }],
      } as any);
      expect(component.canManage()).toBe(false);
    });

    it('should return false when project has no creator', () => {
      mockAuthService.user.set({ id: 'user1', name: 'Test' } as any);
      mockGroupBuyService.currentGroupBuy.set({
        id: 'proj1',
        creator: null,
        managers: [],
      } as any);
      expect(component.canManage()).toBe(false);
    });
  });

  // ──────────────────────────────────────────
  // isOrderSubmittedOrConfirmed computed
  // ──────────────────────────────────────────
  describe('isOrderSubmittedOrConfirmed', () => {
    it('should return false when no existing order', () => {
      expect(component.isOrderSubmittedOrConfirmed()).toBeFalsy();
    });

    it('should return false when order payment status is UNSET', () => {
      mockGroupBuyService.myGroupBuyOrder.set({
        id: 'o1',
        paymentStatus: PaymentStatus.UNSET,
      } as any);
      expect(component.isOrderSubmittedOrConfirmed()).toBeFalsy();
    });

    it('should return true when order payment status is SUBMITTED', () => {
      mockGroupBuyService.myGroupBuyOrder.set({
        id: 'o1',
        paymentStatus: PaymentStatus.SUBMITTED,
      } as any);
      expect(component.isOrderSubmittedOrConfirmed()).toBeTruthy();
    });

    it('should return true when order payment status is CONFIRMED', () => {
      mockGroupBuyService.myGroupBuyOrder.set({
        id: 'o1',
        paymentStatus: PaymentStatus.CONFIRMED,
      } as any);
      expect(component.isOrderSubmittedOrConfirmed()).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────
  // isOrderLocked computed
  // ──────────────────────────────────────────
  describe('isOrderLocked', () => {
    it('should return false when no existing order', () => {
      expect(component.isOrderLocked()).toBe(false);
    });

    it('should return true when payment status is CONFIRMED', () => {
      mockGroupBuyService.myGroupBuyOrder.set({
        id: 'o1',
        paymentStatus: PaymentStatus.CONFIRMED,
        items: [],
      } as any);
      expect(component.isOrderLocked()).toBe(true);
    });

    it('should return true when an item has status > 1', () => {
      mockGroupBuyService.myGroupBuyOrder.set({
        id: 'o1',
        paymentStatus: PaymentStatus.SUBMITTED,
        items: [{ status: 2 }],
      } as any);
      expect(component.isOrderLocked()).toBe(true);
    });

    it('should return false when payment is SUBMITTED and no items processed', () => {
      mockGroupBuyService.myGroupBuyOrder.set({
        id: 'o1',
        paymentStatus: PaymentStatus.SUBMITTED,
        items: [{ status: 0 }, { status: 1 }],
      } as any);
      expect(component.isOrderLocked()).toBe(false);
    });
  });

  // ──────────────────────────────────────────
  // ngOnInit
  // ──────────────────────────────────────────
  describe('ngOnInit', () => {
    it('should call loadGroupBuy and loadExistingOrderIntoCart with route id', () => {
      expect(mockGroupBuyService.loadGroupBuy).toHaveBeenCalledWith('123');
      expect(mockGroupBuyService.loadExistingOrderIntoCart).toHaveBeenCalledWith('123');
    });

    it('should set isEditing to false when no order returned', async () => {
      mockGroupBuyService.loadExistingOrderIntoCart.mockResolvedValue(null);
      component.ngOnInit();
      await vi.waitFor(() => {
        expect(component.isEditing).toBe(false);
      });
    });

    it('should enter edit mode when edit=true query param and order is submitted and not locked', async () => {
      const order = {
        id: 'o1',
        paymentStatus: PaymentStatus.SUBMITTED,
        items: [{ status: 0 }],
      };
      mockGroupBuyService.loadExistingOrderIntoCart.mockResolvedValue(order);

      // Rebuild with edit=true
      mockActivatedRoute.snapshot.queryParamMap.get = (key: string) =>
        key === 'edit' ? 'true' : null;

      component.ngOnInit();
      await vi.waitFor(() => {
        expect(component.isEditing).toBe(true);
        expect(mockGroupBuyService.editSubmittedOrder).toHaveBeenCalled();
      });
    });

    it('should NOT enter edit mode and show toast when edit=true but order is locked', async () => {
      const order = {
        id: 'o1',
        paymentStatus: PaymentStatus.CONFIRMED,
        items: [],
      };
      mockGroupBuyService.loadExistingOrderIntoCart.mockResolvedValue(order);
      mockActivatedRoute.snapshot.queryParamMap.get = (key: string) =>
        key === 'edit' ? 'true' : null;

      component.ngOnInit();
      await vi.waitFor(() => {
        expect(component.isEditing).toBe(false);
        expect(mockRouter.navigate).toHaveBeenCalledWith([], {
          queryParams: { edit: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
        expect(mockToastService.show).toHaveBeenCalledWith(
          'Order cannot be modified as it is being processed.',
          'error',
        );
      });
    });

    it('should set isEditing false when order exists but edit param is not set', async () => {
      const order = {
        id: 'o1',
        paymentStatus: PaymentStatus.SUBMITTED,
        items: [],
      };
      mockGroupBuyService.loadExistingOrderIntoCart.mockResolvedValue(order);
      mockActivatedRoute.snapshot.queryParamMap.get = () => null;

      component.ngOnInit();
      await vi.waitFor(() => {
        expect(component.isEditing).toBe(false);
      });
    });

    it('should not load when route param id is missing', async () => {
      mockGroupBuyService.loadGroupBuy.mockClear();
      mockGroupBuyService.loadExistingOrderIntoCart.mockClear();

      mockActivatedRoute.paramMap = of({ get: () => null });
      component.ngOnInit();

      // Give microtasks time to flush
      await new Promise((r) => setTimeout(r, 0));
      // loadGroupBuy should NOT have been called again (only once from beforeEach)
      expect(mockGroupBuyService.loadGroupBuy).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────
  // onSpecSelect
  // ──────────────────────────────────────────
  describe('onSpecSelect', () => {
    it('should store the selected spec id for the product', () => {
      const event = { target: { value: 'spec-42' } } as any;
      component.onSpecSelect('prod-1', event);
      expect(component.selectedSpecs['prod-1']).toBe('spec-42');
    });
  });

  // ──────────────────────────────────────────
  // checkAuth (tested indirectly through public methods)
  // ──────────────────────────────────────────
  describe('checkAuth via addToCart', () => {
    it('should redirect to login when not authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);
      const product = { id: 'p1', specs: [] } as any;
      component.addToCart('proj1', product);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: expect.any(String) },
      });
      expect(mockGroupBuyService.addToCart).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────
  // addToCart
  // ──────────────────────────────────────────
  describe('addToCart', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
    });

    it('should add product with first spec by default', () => {
      const product = {
        id: 'p1',
        specs: [
          { id: 's1', name: 'Red' },
          { id: 's2', name: 'Blue' },
        ],
      } as any;
      component.addToCart('proj1', product);
      expect(mockGroupBuyService.addToCart).toHaveBeenCalledWith(
        product,
        { id: 's1', name: 'Red' },
        1,
      );
      expect(mockToastService.show).toHaveBeenCalledWith('Added to order', 'success');
    });

    it('should use selectedSpecs when user has chosen a spec', () => {
      component.selectedSpecs['p1'] = 's2';
      const product = {
        id: 'p1',
        specs: [
          { id: 's1', name: 'Red' },
          { id: 's2', name: 'Blue' },
        ],
      } as any;
      component.addToCart('proj1', product);
      expect(mockGroupBuyService.addToCart).toHaveBeenCalledWith(
        product,
        { id: 's2', name: 'Blue' },
        1,
      );
    });

    it('should add product with no specs (specId empty, spec undefined)', () => {
      const product = { id: 'p1', specs: [] } as any;
      component.addToCart('proj1', product);
      expect(mockGroupBuyService.addToCart).toHaveBeenCalledWith(product, undefined, 1);
    });
  });

  // ──────────────────────────────────────────
  // getQuantity
  // ──────────────────────────────────────────
  describe('getQuantity', () => {
    it('should return 0 when cart is empty', () => {
      const product = { id: 'p1', specs: [{ id: 's1' }] } as any;
      expect(component.getQuantity(product)).toBe(0);
    });

    it('should return the quantity when item is in cart', () => {
      mockGroupBuyService.cart.set([{ productId: 'p1', specId: 's1', quantity: 3 }]);
      const product = { id: 'p1', specs: [{ id: 's1' }] } as any;
      expect(component.getQuantity(product)).toBe(3);
    });

    it('should use selected spec for lookup', () => {
      component.selectedSpecs['p1'] = 's2';
      mockGroupBuyService.cart.set([
        { productId: 'p1', specId: 's1', quantity: 1 },
        { productId: 'p1', specId: 's2', quantity: 5 },
      ]);
      const product = {
        id: 'p1',
        specs: [{ id: 's1' }, { id: 's2' }],
      } as any;
      expect(component.getQuantity(product)).toBe(5);
    });

    it('should return 0 for product with no specs and empty cart', () => {
      const product = { id: 'p1', specs: [] } as any;
      expect(component.getQuantity(product)).toBe(0);
    });

    it('should find item in cart when product has no specs using empty specId', () => {
      mockGroupBuyService.cart.set([{ productId: 'p1', specId: '', quantity: 2 }]);
      const product = { id: 'p1', specs: [] } as any;
      expect(component.getQuantity(product)).toBe(2);
    });
  });

  // ──────────────────────────────────────────
  // updateProductQuantity
  // ──────────────────────────────────────────
  describe('updateProductQuantity', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
    });

    it('should redirect to login when not authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);
      const product = { id: 'p1', specs: [{ id: 's1' }] } as any;
      component.updateProductQuantity(product, 1);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], expect.any(Object));
    });

    it('should add new item when current quantity is 0 and delta > 0', () => {
      const product = {
        id: 'p1',
        specs: [{ id: 's1', name: 'Red' }],
      } as any;
      // Cart is empty, so getQuantity returns 0
      component.updateProductQuantity(product, 1);
      expect(mockGroupBuyService.addToCart).toHaveBeenCalledWith(
        product,
        { id: 's1', name: 'Red' },
        1,
      );
      expect(mockToastService.show).toHaveBeenCalledWith('Added to order', 'success');
    });

    it('should remove item when new quantity would be <= 0', () => {
      mockGroupBuyService.cart.set([{ productId: 'p1', specId: 's1', quantity: 1 }]);
      const product = { id: 'p1', specs: [{ id: 's1' }] } as any;
      component.updateProductQuantity(product, -1);
      expect(mockGroupBuyService.removeFromCart).toHaveBeenCalledWith('p1', 's1');
    });

    it('should update quantity when result is > 0', () => {
      mockGroupBuyService.cart.set([{ productId: 'p1', specId: 's1', quantity: 2 }]);
      const product = { id: 'p1', specs: [{ id: 's1' }] } as any;
      component.updateProductQuantity(product, -1);
      expect(mockGroupBuyService.updateCartQuantity).toHaveBeenCalledWith('p1', 's1', 1);
    });

    it('should update quantity when increasing from existing item', () => {
      mockGroupBuyService.cart.set([{ productId: 'p1', specId: 's1', quantity: 2 }]);
      const product = { id: 'p1', specs: [{ id: 's1' }] } as any;
      component.updateProductQuantity(product, 1);
      expect(mockGroupBuyService.updateCartQuantity).toHaveBeenCalledWith('p1', 's1', 3);
    });

    it('should work with product having no specs', () => {
      const product = { id: 'p1', specs: [] } as any;
      component.updateProductQuantity(product, 1);
      expect(mockGroupBuyService.addToCart).toHaveBeenCalledWith(product, undefined, 1);
    });
  });

  // ──────────────────────────────────────────
  // viewOrder
  // ──────────────────────────────────────────
  describe('viewOrder', () => {
    it('should navigate to order detail when order exists', () => {
      mockGroupBuyService.myGroupBuyOrder.set({ id: 'order-1' } as any);
      component.viewOrder();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/user/orders', 'order-1']);
    });

    it('should not navigate when no existing order', () => {
      mockGroupBuyService.myGroupBuyOrder.set(null);
      component.viewOrder();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────
  // editOrder
  // ──────────────────────────────────────────
  describe('editOrder', () => {
    it('should set isEditing to true and call editSubmittedOrder', () => {
      component.editOrder();
      expect(component.isEditing).toBe(true);
      expect(mockGroupBuyService.editSubmittedOrder).toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────
  // cancelEdit
  // ──────────────────────────────────────────
  describe('cancelEdit', () => {
    it('should set isEditing to false, clear cart, and remove edit query param', () => {
      component.isEditing = true;
      component.cancelEdit();
      expect(component.isEditing).toBe(false);
      expect(mockGroupBuyService.clearCart).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith([], {
        queryParams: { edit: null },
        queryParamsHandling: 'merge',
      });
    });
  });

  // ──────────────────────────────────────────
  // goToCheckout
  // ──────────────────────────────────────────
  describe('goToCheckout', () => {
    it('should navigate to checkout when authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      component.goToCheckout('proj-1');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['groupbuy', 'proj-1', 'checkout']);
    });

    it('should redirect to login when not authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);
      component.goToCheckout('proj-1');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: expect.any(String) },
      });
    });
  });

  // ──────────────────────────────────────────
  // Template Rendering
  // ──────────────────────────────────────────
  describe('template rendering', () => {
    it('should show loading spinner when isLoadingDetail is true', () => {
      mockGroupBuyService.isLoadingDetail.set(true);
      fixture.detectChanges();
      const spinner = fixture.nativeElement.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();
    });

    it('should not show loading spinner when isLoadingDetail is false', () => {
      mockGroupBuyService.isLoadingDetail.set(false);
      fixture.detectChanges();
      const spinner = fixture.nativeElement.querySelector('.animate-spin');
      expect(spinner).toBeFalsy();
    });

    it('should render project title and description when currentGroupBuy is set', () => {
      mockGroupBuyService.currentGroupBuy.set({
        id: 'gb-1',
        title: 'Test Group Buy',
        description: 'Test Description',
        coverImageUrl: '',
        creator: { id: 'u1' },
        managers: [],
        status: 1,
      } as any);
      fixture.detectChanges();
      const el = fixture.nativeElement;
      expect(el.querySelector('h1').textContent).toContain('Test Group Buy');
      expect(el.textContent).toContain('Test Description');
    });

    it('should show cover image when coverImageUrl is set', () => {
      mockGroupBuyService.currentGroupBuy.set({
        id: 'gb-1',
        title: 'Test',
        description: '',
        coverImageUrl: 'https://example.com/cover.jpg',
        creator: { id: 'u1' },
        managers: [],
      } as any);
      fixture.detectChanges();
      const img = fixture.nativeElement.querySelector('img[alt="Project Cover"]');
      expect(img).toBeTruthy();
    });

    it('should show placeholder when no cover image', () => {
      mockGroupBuyService.currentGroupBuy.set({
        id: 'gb-1',
        title: 'Test',
        description: '',
        coverImageUrl: '',
        creator: { id: 'u1' },
        managers: [],
      } as any);
      fixture.detectChanges();
      const placeholder = fixture.nativeElement.querySelector('.bg-gray-900');
      expect(placeholder).toBeTruthy();
    });

    it('should show Manage Project button when user canManage', () => {
      mockAuthService.user.set({ id: 'u1' } as any);
      mockGroupBuyService.currentGroupBuy.set({
        id: 'gb-1',
        title: 'Test',
        description: '',
        coverImageUrl: '',
        creator: { id: 'u1' },
        managers: [],
      } as any);
      fixture.detectChanges();
      const manageBtn = fixture.nativeElement.textContent;
      expect(manageBtn).toContain('Manage Project');
    });

    it('should not show Manage Project button when user cannot manage', () => {
      mockAuthService.user.set({ id: 'u99' } as any);
      mockGroupBuyService.currentGroupBuy.set({
        id: 'gb-1',
        title: 'Test',
        description: '',
        coverImageUrl: '',
        creator: { id: 'u1' },
        managers: [],
      } as any);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).not.toContain('Manage Project');
    });

    it('should show "No products available" when products list is empty', () => {
      mockGroupBuyService.currentGroupBuy.set({
        id: 'gb-1',
        title: 'Test',
        description: '',
        coverImageUrl: '',
        creator: { id: 'u1' },
        managers: [],
      } as any);
      mockGroupBuyService.currentProducts.set([]);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No products available yet.');
    });

    it('should render product cards when products exist', () => {
      mockGroupBuyService.currentGroupBuy.set({
        id: 'gb-1',
        title: 'Test',
        description: '',
        coverImageUrl: '',
        sourceCurrency: 'JPY',
        creator: { id: 'u1' },
        managers: [],
      } as any);
      mockGroupBuyService.currentProducts.set([
        {
          id: 'p1',
          name: 'Product One',
          description: 'Desc 1',
          imageUrl: '',
          priceOriginal: 1000,
          priceFinal: 230,
          exchangeRate: 0.23,
          specs: [],
        },
      ] as any);
      fixture.detectChanges();
      const el = fixture.nativeElement;
      expect(el.textContent).toContain('Product One');
      expect(el.textContent).toContain('NT$ 230');
    });

    it('should show "No Image" when product has no image', () => {
      mockGroupBuyService.currentGroupBuy.set({
        id: 'gb-1',
        title: 'Test',
        description: '',
        coverImageUrl: '',
        creator: { id: 'u1' },
        managers: [],
      } as any);
      mockGroupBuyService.currentProducts.set([
        { id: 'p1', name: 'P', description: '', imageUrl: '', priceOriginal: 0, priceFinal: 0, exchangeRate: 1, specs: [] },
      ] as any);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No Image');
    });

    it('should render spec dropdown when product has specs', () => {
      mockGroupBuyService.currentGroupBuy.set({
        id: 'gb-1',
        title: 'Test',
        description: '',
        coverImageUrl: '',
        creator: { id: 'u1' },
        managers: [],
      } as any);
      mockGroupBuyService.currentProducts.set([
        {
          id: 'p1',
          name: 'P',
          description: '',
          imageUrl: '',
          priceOriginal: 0,
          priceFinal: 0,
          exchangeRate: 1,
          specs: [
            { id: 's1', name: 'Red' },
            { id: 's2', name: 'Blue' },
          ],
        },
      ] as any);
      fixture.detectChanges();
      const select = fixture.nativeElement.querySelector('select');
      expect(select).toBeTruthy();
      const options = select.querySelectorAll('option');
      expect(options.length).toBe(2);
      expect(options[0].textContent.trim()).toBe('Red');
      expect(options[1].textContent.trim()).toBe('Blue');
    });

    it('should show "Add to Order" button when no existing order', () => {
      mockGroupBuyService.currentGroupBuy.set({
        id: 'gb-1',
        title: 'Test',
        description: '',
        coverImageUrl: '',
        creator: { id: 'u1' },
        managers: [],
      } as any);
      mockGroupBuyService.currentProducts.set([
        { id: 'p1', name: 'P', description: '', imageUrl: '', priceOriginal: 0, priceFinal: 0, exchangeRate: 1, specs: [] },
      ] as any);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Add to Order');
    });

    it('should show quantity stepper when item is in cart', () => {
      mockGroupBuyService.currentGroupBuy.set({
        id: 'gb-1',
        title: 'Test',
        description: '',
        coverImageUrl: '',
        creator: { id: 'u1' },
        managers: [],
      } as any);
      mockGroupBuyService.currentProducts.set([
        { id: 'p1', name: 'P', description: '', imageUrl: '', priceOriginal: 0, priceFinal: 0, exchangeRate: 1, specs: [{ id: 's1' }] },
      ] as any);
      mockGroupBuyService.cart.set([{ productId: 'p1', specId: 's1', quantity: 3 }]);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('3');
    });

    it('should show "Order Placed" when order is submitted', () => {
      mockGroupBuyService.currentGroupBuy.set({
        id: 'gb-1',
        title: 'Test',
        description: '',
        coverImageUrl: '',
        creator: { id: 'u1' },
        managers: [],
      } as any);
      mockGroupBuyService.currentProducts.set([
        { id: 'p1', name: 'P', description: '', imageUrl: '', priceOriginal: 0, priceFinal: 0, exchangeRate: 1, specs: [] },
      ] as any);
      mockGroupBuyService.myGroupBuyOrder.set({
        id: 'o1',
        paymentStatus: 2, // SUBMITTED
        totalAmount: 500,
        items: [{ status: 0 }],
      } as any);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Order Placed');
    });

    it('should show bottom action bar with cart count and total', () => {
      mockGroupBuyService.currentGroupBuy.set({
        id: 'gb-1',
        title: 'Test',
        description: '',
        coverImageUrl: '',
        creator: { id: 'u1' },
        managers: [],
      } as any);
      mockGroupBuyService.currentProducts.set([]);
      mockGroupBuyService.cartCount.set(3);
      mockGroupBuyService.cartTotal.set(750);
      fixture.detectChanges();
      const el = fixture.nativeElement;
      expect(el.textContent).toContain('3');
      expect(el.textContent).toContain('NT$ 750');
      expect(el.textContent).toContain('Review Order');
    });

    it('should show "Edit Order" button when order is submitted but not locked', () => {
      mockGroupBuyService.currentGroupBuy.set({
        id: 'gb-1',
        title: 'Test',
        description: '',
        coverImageUrl: '',
        creator: { id: 'u1' },
        managers: [],
      } as any);
      mockGroupBuyService.currentProducts.set([]);
      mockGroupBuyService.myGroupBuyOrder.set({
        id: 'o1',
        paymentStatus: 2, // SUBMITTED
        totalAmount: 500,
        items: [{ status: 0 }],
      } as any);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Edit Order');
      expect(fixture.nativeElement.textContent).not.toContain('Order Locked');
    });

    it('should show "Order Locked" when order is locked', () => {
      mockGroupBuyService.currentGroupBuy.set({
        id: 'gb-1',
        title: 'Test',
        description: '',
        coverImageUrl: '',
        creator: { id: 'u1' },
        managers: [],
      } as any);
      mockGroupBuyService.currentProducts.set([]);
      mockGroupBuyService.myGroupBuyOrder.set({
        id: 'o1',
        paymentStatus: 3, // CONFIRMED
        totalAmount: 500,
        items: [],
      } as any);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Order Locked');
      expect(fixture.nativeElement.textContent).not.toContain('Edit Order');
    });

    it('should show cancel and review buttons when editing', () => {
      mockGroupBuyService.currentGroupBuy.set({
        id: 'gb-1',
        title: 'Test',
        description: '',
        coverImageUrl: '',
        creator: { id: 'u1' },
        managers: [],
      } as any);
      mockGroupBuyService.currentProducts.set([]);
      mockGroupBuyService.myGroupBuyOrder.set({
        id: 'o1',
        paymentStatus: 2,
        totalAmount: 500,
        items: [{ status: 0 }],
      } as any);
      mockGroupBuyService.cartCount.set(2);
      component.isEditing = true;
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Cancel');
      expect(fixture.nativeElement.textContent).toContain('Review Order');
    });

    it('should show original price when product has currency conversion', () => {
      mockGroupBuyService.currentGroupBuy.set({
        id: 'gb-1',
        title: 'Test',
        description: '',
        coverImageUrl: '',
        sourceCurrency: 'JPY',
        creator: { id: 'u1' },
        managers: [],
      } as any);
      mockGroupBuyService.currentProducts.set([
        {
          id: 'p1',
          name: 'Keycap',
          description: '',
          imageUrl: '',
          priceOriginal: 5000,
          priceFinal: 1150,
          exchangeRate: 0.23,
          specs: [],
        },
      ] as any);
      fixture.detectChanges();
      const el = fixture.nativeElement;
      expect(el.textContent).toContain('5000');
      expect(el.textContent).toContain('NT$ 1150');
    });
  });
});
