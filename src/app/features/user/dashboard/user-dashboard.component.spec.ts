import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UserDashboardComponent } from './user-dashboard.component';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { EventService } from '../../../core/event/event.service';
import { AuthService } from '../../../core/auth/auth.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { PaymentStatus, OrderItemStatus } from '../../../core/api/api/v1/groupbuy_pb';
import { RegistrationStatus } from '../../../core/api/api/v1/event_pb';

function makeOrder(overrides: Partial<{
  id: string;
  totalAmount: string;
  paymentStatus: number;
  items: any[];
}> = {}) {
  return {
    id: overrides.id ?? 'order-abc-12345678',
    totalAmount: overrides.totalAmount ?? '100',
    paymentStatus: overrides.paymentStatus ?? PaymentStatus.UNSET,
    items: overrides.items ?? [
      {
        id: 'item-1',
        productName: 'Widget',
        specName: 'Default',
        quantity: 2,
        price: '50',
        status: OrderItemStatus.ITEM_STATUS_ORDERED,
      },
    ],
  };
}

function makeRegistration(overrides: Partial<{
  id: string;
  eventId: string;
  status: number;
  selectedItems: any[];
}> = {}) {
  return {
    id: overrides.id ?? 'reg-abc-12345678',
    eventId: overrides.eventId ?? 'event-1',
    status: overrides.status ?? RegistrationStatus.CONFIRMED,
    selectedItems: overrides.selectedItems ?? [
      { eventItemId: 'item-abcd', quantity: 1 },
    ],
  };
}

describe('UserDashboardComponent', () => {
  let component: UserDashboardComponent;
  let fixture: ComponentFixture<UserDashboardComponent>;

  let mockMyOrders: ReturnType<typeof signal<any[]>>;
  let mockLoadingMyOrders: ReturnType<typeof signal<boolean>>;
  let mockUser: ReturnType<typeof signal<any>>;
  let mockIsLoading: ReturnType<typeof signal<boolean>>;

  let mockGroupBuyService: any;
  let mockEventService: any;
  let mockAuthService: any;

  beforeEach(async () => {
    mockMyOrders = signal<any[]>([]);
    mockLoadingMyOrders = signal(false);
    mockUser = signal({ id: 'test-user', name: 'Test' });
    mockIsLoading = signal(false);

    mockGroupBuyService = {
      myOrders: mockMyOrders,
      loadingMyOrders: mockLoadingMyOrders,
      loadMyOrders: vi.fn(),
    };

    mockEventService = {
      getMyRegistrations: vi.fn().mockResolvedValue([]),
      isLoading: mockIsLoading,
    };

    mockAuthService = {
      user: mockUser,
    };

    await TestBed.configureTestingModule({
      imports: [UserDashboardComponent],
      providers: [
        { provide: GroupBuyService, useValue: mockGroupBuyService },
        { provide: EventService, useValue: mockEventService },
        { provide: AuthService, useValue: mockAuthService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Constructor / effect ────────────────────────────────────────────

  it('should call loadMyOrders and loadRegistrations when user is present', () => {
    expect(mockGroupBuyService.loadMyOrders).toHaveBeenCalled();
    expect(mockEventService.getMyRegistrations).toHaveBeenCalled();
  });

  it('should not call loadMyOrders when user is null', async () => {
    mockGroupBuyService.loadMyOrders.mockClear();
    mockEventService.getMyRegistrations.mockClear();

    mockUser.set(null);

    // Re-create component with null user
    const fixture2 = TestBed.createComponent(UserDashboardComponent);
    fixture2.detectChanges();

    // The effect fires, but user is null so loadMyOrders should not be called again
    // (the previous calls were from the first component creation)
    // We cleared the mocks, so check that the new component's effect did not trigger loads
    // Actually effect runs synchronously during creation when user is already set.
    // With null user, it should not call.
    // But since we set null BEFORE creating the component, let's verify:
    expect(mockGroupBuyService.loadMyOrders).not.toHaveBeenCalled();
    expect(mockEventService.getMyRegistrations).not.toHaveBeenCalled();
  });

  // ── loadRegistrations ───────────────────────────────────────────────

  it('should set registrations from eventService.getMyRegistrations', async () => {
    const regs = [makeRegistration()];
    mockEventService.getMyRegistrations.mockResolvedValue(regs);

    await component.loadRegistrations();

    expect(component.registrations()).toEqual(regs);
  });

  it('should set registrations to empty array when getMyRegistrations returns null', async () => {
    mockEventService.getMyRegistrations.mockResolvedValue(null);

    await component.loadRegistrations();

    expect(component.registrations()).toEqual([]);
  });

  it('should set registrations to empty array when getMyRegistrations returns undefined', async () => {
    mockEventService.getMyRegistrations.mockResolvedValue(undefined);

    await component.loadRegistrations();

    expect(component.registrations()).toEqual([]);
  });

  it('should handle error in loadRegistrations gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockEventService.getMyRegistrations.mockRejectedValue(new Error('network error'));

    await component.loadRegistrations();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load registrations', expect.any(Error));
    consoleSpy.mockRestore();
  });

  // ── activeTab signal ────────────────────────────────────────────────

  it('should default activeTab to overview', () => {
    expect(component.activeTab()).toBe('overview');
  });

  it('should allow switching activeTab', () => {
    component.activeTab.set('orders');
    expect(component.activeTab()).toBe('orders');

    component.activeTab.set('events');
    expect(component.activeTab()).toBe('events');

    component.activeTab.set('settings');
    expect(component.activeTab()).toBe('settings');
  });

  // ── orders computed ─────────────────────────────────────────────────

  it('should reverse the myOrders from the service', () => {
    const o1 = makeOrder({ id: 'aaa' });
    const o2 = makeOrder({ id: 'bbb' });
    mockMyOrders.set([o1, o2]);

    expect(component.orders()).toEqual([o2, o1]);
  });

  it('should return empty array when no orders', () => {
    mockMyOrders.set([]);
    expect(component.orders()).toEqual([]);
  });

  // ── pendingPaymentCount computed ────────────────────────────────────

  it('should count orders with UNSET payment status', () => {
    mockMyOrders.set([
      makeOrder({ paymentStatus: PaymentStatus.UNSET }),
      makeOrder({ paymentStatus: PaymentStatus.CONFIRMED }),
      makeOrder({ paymentStatus: PaymentStatus.UNSET }),
      makeOrder({ paymentStatus: PaymentStatus.SUBMITTED }),
    ]);

    expect(component.pendingPaymentCount()).toBe(2);
  });

  it('should return 0 pending when all orders are paid', () => {
    mockMyOrders.set([
      makeOrder({ paymentStatus: PaymentStatus.CONFIRMED }),
    ]);
    expect(component.pendingPaymentCount()).toBe(0);
  });

  it('should return 0 pending when there are no orders', () => {
    mockMyOrders.set([]);
    expect(component.pendingPaymentCount()).toBe(0);
  });

  // ── activeRegistrationCount computed ────────────────────────────────

  it('should count CONFIRMED and PENDING registrations', () => {
    component.registrations.set([
      makeRegistration({ status: RegistrationStatus.CONFIRMED }),
      makeRegistration({ status: RegistrationStatus.PENDING }),
      makeRegistration({ status: RegistrationStatus.CANCELLED }),
      makeRegistration({ status: RegistrationStatus.UNSPECIFIED }),
    ]);

    expect(component.activeRegistrationCount()).toBe(2);
  });

  it('should return 0 active registrations when all cancelled', () => {
    component.registrations.set([
      makeRegistration({ status: RegistrationStatus.CANCELLED }),
    ]);
    expect(component.activeRegistrationCount()).toBe(0);
  });

  it('should return 0 when registrations is empty', () => {
    component.registrations.set([]);
    expect(component.activeRegistrationCount()).toBe(0);
  });

  // ── Number helper ───────────────────────────────────────────────────

  it('should convert string to number', () => {
    expect(component.Number('42')).toBe(42);
    expect(component.Number('0')).toBe(0);
    expect(component.Number(100)).toBe(100);
  });

  // ── getPaymentStatusLabel ───────────────────────────────────────────

  it('should return correct payment status labels', () => {
    expect(component.getPaymentStatusLabel(PaymentStatus.CONFIRMED)).toBe('Paid');
    expect(component.getPaymentStatusLabel(PaymentStatus.SUBMITTED)).toBe('Submitted');
    expect(component.getPaymentStatusLabel(PaymentStatus.UNSET)).toBe('Unpaid');
    expect(component.getPaymentStatusLabel(PaymentStatus.REJECTED)).toBe('Rejected');
  });

  // ── getPaymentStatusClass ───────────────────────────────────────────

  it('should return green class for CONFIRMED payment', () => {
    expect(component.getPaymentStatusClass(PaymentStatus.CONFIRMED)).toBe('bg-green-900/50 text-green-300');
  });

  it('should return yellow class for SUBMITTED payment', () => {
    expect(component.getPaymentStatusClass(PaymentStatus.SUBMITTED)).toBe('bg-yellow-900/50 text-yellow-300');
  });

  it('should return red class for UNSET payment', () => {
    expect(component.getPaymentStatusClass(PaymentStatus.UNSET)).toBe('bg-red-900/50 text-red-300');
  });

  it('should return dark red class for REJECTED payment', () => {
    expect(component.getPaymentStatusClass(PaymentStatus.REJECTED)).toBe('bg-red-900 text-red-100');
  });

  it('should return gray class for unknown payment status', () => {
    expect(component.getPaymentStatusClass(999)).toBe('bg-gray-800 text-gray-400');
  });

  it('should return gray class for UNSPECIFIED payment status', () => {
    expect(component.getPaymentStatusClass(PaymentStatus.UNSPECIFIED)).toBe('bg-gray-800 text-gray-400');
  });

  // ── getItemStatusLabel ──────────────────────────────────────────────

  it('should return correct item status labels', () => {
    expect(component.getItemStatusLabel(OrderItemStatus.ITEM_STATUS_ORDERED)).toBe('Ordered');
    expect(component.getItemStatusLabel(OrderItemStatus.ITEM_STATUS_READY_FOR_PICKUP)).toBe('Ready');
    expect(component.getItemStatusLabel(OrderItemStatus.ITEM_STATUS_SENT)).toBe('Sent/Picked Up');
  });

  // ── getRegStatusLabel ───────────────────────────────────────────────

  it('should return correct registration status labels', () => {
    expect(component.getRegStatusLabel(RegistrationStatus.PENDING)).toBe('Pending');
    expect(component.getRegStatusLabel(RegistrationStatus.CONFIRMED)).toBe('Confirmed');
  });

  it('should return Unknown for unrecognized registration status', () => {
    expect(component.getRegStatusLabel(999)).toBe('Unknown');
    expect(component.getRegStatusLabel(RegistrationStatus.UNSPECIFIED)).toBe('Unknown');
    expect(component.getRegStatusLabel(RegistrationStatus.CANCELLED)).toBe('Unknown');
  });

  // ── getRegStatusClass ───────────────────────────────────────────────

  it('should return green class for CONFIRMED registration', () => {
    expect(component.getRegStatusClass(RegistrationStatus.CONFIRMED)).toBe(
      'bg-green-500/10 text-green-400 border-green-500/20',
    );
  });

  it('should return yellow class for PENDING registration', () => {
    expect(component.getRegStatusClass(RegistrationStatus.PENDING)).toBe(
      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    );
  });

  it('should return gray class for unknown registration status', () => {
    expect(component.getRegStatusClass(999)).toBe(
      'bg-gray-500/10 text-gray-400 border-gray-500/20',
    );
  });

  it('should return gray class for CANCELLED registration status', () => {
    expect(component.getRegStatusClass(RegistrationStatus.CANCELLED)).toBe(
      'bg-gray-500/10 text-gray-400 border-gray-500/20',
    );
  });

  // ── Template rendering: overview tab ────────────────────────────────

  describe('overview tab rendering', () => {
    it('should display user name in welcome heading', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const heading = el.querySelector('h1');
      expect(heading?.textContent).toContain('Welcome back, Test');
    });

    it('should display pending payment count', () => {
      mockMyOrders.set([
        makeOrder({ paymentStatus: PaymentStatus.UNSET }),
        makeOrder({ paymentStatus: PaymentStatus.UNSET }),
      ]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('2');
      expect(el.textContent).toContain('Pending Payments');
    });

    it('should display total orders count', () => {
      mockMyOrders.set([makeOrder(), makeOrder(), makeOrder()]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Total Orders');
      expect(el.textContent).toContain('3');
    });

    it('should show "No recent orders." when orders is empty', () => {
      mockMyOrders.set([]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('No recent orders.');
    });

    it('should show "No event registrations." when registrations is empty', () => {
      component.registrations.set([]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('No event registrations.');
    });

    it('should render up to 3 recent orders in overview', () => {
      mockMyOrders.set([
        makeOrder({ id: 'aaaa1111-rest' }),
        makeOrder({ id: 'bbbb2222-rest' }),
        makeOrder({ id: 'cccc3333-rest' }),
        makeOrder({ id: 'dddd4444-rest' }),
      ]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      // The overview shows slice(0, 3) of the reversed orders
      // Reversed: dddd, cccc, bbbb, aaaa => first 3 shown
      expect(el.textContent).toContain('dddd4444');
      expect(el.textContent).toContain('cccc3333');
      expect(el.textContent).toContain('bbbb2222');
    });

    it('should show "View All Orders" button when more than 3 orders', () => {
      mockMyOrders.set([
        makeOrder({ id: 'a1111111' }),
        makeOrder({ id: 'b2222222' }),
        makeOrder({ id: 'c3333333' }),
        makeOrder({ id: 'd4444444' }),
      ]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('View All Orders');
    });

    it('should not show "View All Orders" button when 3 or fewer orders', () => {
      mockMyOrders.set([makeOrder(), makeOrder()]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const buttons = Array.from(el.querySelectorAll('button'));
      const viewAll = buttons.find(b => b.textContent?.includes('View All Orders'));
      expect(viewAll).toBeUndefined();
    });

    it('should render up to 3 registrations in overview', () => {
      component.registrations.set([
        makeRegistration({ id: 'reg-1111-rest' }),
        makeRegistration({ id: 'reg-2222-rest' }),
        makeRegistration({ id: 'reg-3333-rest' }),
        makeRegistration({ id: 'reg-4444-rest' }),
      ]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('View All Events');
    });

    it('should show "View Orders" link when pending payments > 0', () => {
      mockMyOrders.set([makeOrder({ paymentStatus: PaymentStatus.UNSET })]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('View Orders');
    });

    it('should show "View Events" link when active registrations > 0', () => {
      component.registrations.set([
        makeRegistration({ status: RegistrationStatus.CONFIRMED }),
      ]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('View Events');
    });
  });

  // ── Template rendering: orders tab ──────────────────────────────────

  describe('orders tab rendering', () => {
    beforeEach(() => {
      component.activeTab.set('orders');
    });

    it('should show loading text when loadingMyOrders is true', () => {
      mockLoadingMyOrders.set(true);
      mockMyOrders.set([]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Loading orders...');
    });

    it('should show empty state when no orders and not loading', () => {
      mockLoadingMyOrders.set(false);
      mockMyOrders.set([]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain("You haven't placed any orders yet.");
      expect(el.textContent).toContain('Browse Projects');
    });

    it('should render order cards when orders exist', () => {
      mockMyOrders.set([
        makeOrder({
          id: 'abcdefgh-1234',
          totalAmount: '500',
          paymentStatus: PaymentStatus.CONFIRMED,
          items: [
            {
              id: 'i1',
              productName: 'Gadget',
              specName: 'Blue',
              quantity: 3,
              price: '100',
              status: OrderItemStatus.ITEM_STATUS_ORDERED,
            },
          ],
        }),
      ]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('abcdefgh');
      expect(el.textContent).toContain('Gadget');
      expect(el.textContent).toContain('(Blue)');
      expect(el.textContent).toContain('x3');
      expect(el.textContent).toContain('Paid');
    });

    it('should not show specName when it is Default', () => {
      mockMyOrders.set([
        makeOrder({
          items: [
            {
              id: 'i1',
              productName: 'Widget',
              specName: 'Default',
              quantity: 1,
              price: '50',
              status: OrderItemStatus.ITEM_STATUS_ORDERED,
            },
          ],
        }),
      ]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Widget');
      expect(el.textContent).not.toContain('(Default)');
    });

    it('should show "+ N more items" when order has more than 3 items', () => {
      mockMyOrders.set([
        makeOrder({
          items: [
            { id: 'i1', productName: 'A', specName: 'Default', quantity: 1, price: '10', status: 0 },
            { id: 'i2', productName: 'B', specName: 'Default', quantity: 1, price: '10', status: 0 },
            { id: 'i3', productName: 'C', specName: 'Default', quantity: 1, price: '10', status: 0 },
            { id: 'i4', productName: 'D', specName: 'Default', quantity: 1, price: '10', status: 0 },
            { id: 'i5', productName: 'E', specName: 'Default', quantity: 1, price: '10', status: 0 },
          ],
        }),
      ]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('+ 2 more items');
    });

    it('should show View Details button for each order', () => {
      mockMyOrders.set([makeOrder()]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('View Details');
    });
  });

  // ── Template rendering: events tab ──────────────────────────────────

  describe('events tab rendering', () => {
    beforeEach(() => {
      component.activeTab.set('events');
    });

    it('should show loading text when event service is loading', () => {
      mockIsLoading.set(true);
      component.registrations.set([]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Loading registrations...');
    });

    it('should show empty state when no registrations and not loading', () => {
      mockIsLoading.set(false);
      component.registrations.set([]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain("You haven't registered for any events yet.");
      expect(el.textContent).toContain('Browse Events');
    });

    it('should render registration cards when registrations exist', () => {
      component.registrations.set([
        makeRegistration({
          id: 'regabcde-12345678',
          status: RegistrationStatus.PENDING,
          selectedItems: [
            { eventItemId: 'abcdefgh', quantity: 2 },
          ],
        }),
      ]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Event Registration');
      expect(el.textContent).toContain('Pending');
      expect(el.textContent).toContain('x2');
    });

    it('should show "+ N more items" when registration has more than 3 selected items', () => {
      component.registrations.set([
        makeRegistration({
          selectedItems: [
            { eventItemId: 'aaa1', quantity: 1 },
            { eventItemId: 'bbb2', quantity: 1 },
            { eventItemId: 'ccc3', quantity: 1 },
            { eventItemId: 'ddd4', quantity: 1 },
            { eventItemId: 'eee5', quantity: 1 },
          ],
        }),
      ]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('+ 2 more items');
    });

    it('should show View Event Details button for registrations', () => {
      component.registrations.set([makeRegistration()]);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('View Event Details');
    });
  });

  // ── Tab switching via template clicks ───────────────────────────────

  describe('tab navigation', () => {
    it('should switch to orders tab when Orders button is clicked', () => {
      const el: HTMLElement = fixture.nativeElement;
      const buttons = Array.from(el.querySelectorAll('button'));
      const ordersBtn = buttons.find(b => b.textContent?.trim() === 'My Orders');
      ordersBtn?.click();
      fixture.detectChanges();

      expect(component.activeTab()).toBe('orders');
    });

    it('should switch to events tab when Events button is clicked', () => {
      const el: HTMLElement = fixture.nativeElement;
      const buttons = Array.from(el.querySelectorAll('button'));
      const eventsBtn = buttons.find(b => b.textContent?.trim() === 'My Events');
      eventsBtn?.click();
      fixture.detectChanges();

      expect(component.activeTab()).toBe('events');
    });

    it('should switch back to overview tab when Overview button is clicked', () => {
      component.activeTab.set('orders');
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const buttons = Array.from(el.querySelectorAll('button'));
      const overviewBtn = buttons.find(b => b.textContent?.trim() === 'Overview');
      overviewBtn?.click();
      fixture.detectChanges();

      expect(component.activeTab()).toBe('overview');
    });
  });
});
