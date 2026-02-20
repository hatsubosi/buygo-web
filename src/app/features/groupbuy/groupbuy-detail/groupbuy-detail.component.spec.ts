import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupBuyDetailComponent } from './groupbuy-detail.component';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

describe('GroupBuyDetailComponent', () => {
  let component: GroupBuyDetailComponent;
  let fixture: ComponentFixture<GroupBuyDetailComponent>;

  const mockGroupBuyService = {
    currentGroupBuy: signal(null),
    isLoadingDetail: signal(false),
    myGroupBuyOrder: signal(null),
    cart: signal([]),
    loadGroupBuy: () => { },
    loadExistingOrderIntoCart: async () => { },
    addToCart: () => { },
    removeFromCart: () => { },
    updateCartQuantity: () => { },
    clearCart: () => { },
    editSubmittedOrder: () => { },
  };

  const mockAuthService = {
    user: signal(null),
    isAuthenticated: () => false,
  };

  const mockToastService = {
    show: () => { },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupBuyDetailComponent],
      providers: [
        { provide: GroupBuyService, useValue: mockGroupBuyService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: () => '123' }),
            snapshot: { paramMap: { get: () => '123' }, queryParamMap: { get: () => null } },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupBuyDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return false for canManage when no user or project', () => {
    expect(component.canManage()).toBe(false);
  });

  it('should return 0 from getQuantity when cart is empty', () => {
    const product = { id: 'p1', specs: [{ id: 's1' }] } as any;
    expect(component.getQuantity(product)).toBe(0);
  });

  describe('ngOnInit & Routing', () => {
    it('should initialize and load groupbuy and user data on route params', () => {
      const loadSpy = vi.spyOn(mockGroupBuyService, 'loadGroupBuy');

      component.ngOnInit();

      expect(loadSpy).toHaveBeenCalledWith('123'); // From ActivatedRoute stub
      // myGroupBuyOrder shouldn't be loaded automatically unless cart processing/editing starts, 
      // but loadGroupBuy definitely fires.
    });
  });

  describe('Cart Actions', () => {
    it('should call addToCart on service', () => {
      mockAuthService.isAuthenticated = () => true;
      const addSpy = vi.spyOn(mockGroupBuyService, 'addToCart');
      const prod = { id: 'p1', name: 'Product 1', specs: [{ id: 's1', name: 'Spec 1' }] } as any;

      component.addToCart('proj1', prod);
      // Since default spec selection takes 's1' if not set
      expect(addSpy).toHaveBeenCalledWith(prod, { id: 's1', name: 'Spec 1' }, 1);
    });

    it('should call removeFromCart on service when decreasing quantity to <= 0', () => {
      mockAuthService.isAuthenticated = () => true;
      const removeSpy = vi.spyOn(mockGroupBuyService, 'removeFromCart');
      const prod = { id: 'p1', name: 'Product 1', specs: [{ id: 's1', name: 'Spec 1' }] } as any;

      vi.spyOn(component, 'getQuantity').mockReturnValue(1); // Mocks current qty as 1
      component.updateProductQuantity(prod, -1); // 1 - 1 = 0

      expect(removeSpy).toHaveBeenCalledWith('p1', 's1');
    });

    it('should call updateCartQuantity on service when decreasing quantity but still > 0', () => {
      mockAuthService.isAuthenticated = () => true;
      const updateSpy = vi.spyOn(mockGroupBuyService, 'updateCartQuantity');
      const prod = { id: 'p1', name: 'Product 1', specs: [{ id: 's1', name: 'Spec 1' }] } as any;

      vi.spyOn(component, 'getQuantity').mockReturnValue(2); // Mocks current qty as 2
      component.updateProductQuantity(prod, -1); // 2 - 1 = 1

      expect(updateSpy).toHaveBeenCalledWith('p1', 's1', 1);
    });

    it('should call addToCart when increasing quantity from 0', () => {
      mockAuthService.isAuthenticated = () => true;
      const addSpy = vi.spyOn(mockGroupBuyService, 'addToCart');
      const prod = { id: 'p1', name: 'Product 1', specs: [{ id: 's1', name: 'Spec 1' }] } as any;

      vi.spyOn(component, 'getQuantity').mockReturnValue(0);
      component.updateProductQuantity(prod, 1);

      expect(addSpy).toHaveBeenCalledWith(prod, { id: 's1', name: 'Spec 1' }, 1);
    });
  });
});
