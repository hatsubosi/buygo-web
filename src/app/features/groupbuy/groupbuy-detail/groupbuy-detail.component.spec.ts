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
    editSubmittedOrder: () => { }
  };

  const mockAuthService = {
    user: signal(null),
    isAuthenticated: () => false
  };

  const mockToastService = {
    show: () => { }
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
            snapshot: { paramMap: { get: () => '123' }, queryParamMap: { get: () => null } }
          }
        }
      ]
    })
      .compileComponents();

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
});
