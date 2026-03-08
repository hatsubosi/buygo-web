import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventDetailComponent } from './event-detail.component';
import { EventService } from '../../../core/event/event.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Timestamp } from '@bufbuild/protobuf';
import { RegistrationStatus } from '../../../core/api/api/v1/event_pb';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';

describe('EventDetailComponent', () => {
  let component: EventDetailComponent;
  let fixture: ComponentFixture<EventDetailComponent>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn>; url: string };

  const mockEventService = {
    currentEvent: signal<any>(null),
    events: signal<any[]>([]),
    isLoading: signal(false),
    error: signal<string | null>(null),
    actionLoading: signal(false),
    loadEvent: vi.fn(),
    getMyRegistrations: vi.fn().mockResolvedValue([]),
    register: vi.fn(),
    updateRegistration: vi.fn(),
    cancelRegistration: vi.fn(),
  };

  const mockAuthService = {
    user: signal<any>(null),
    isAuthenticated: vi.fn().mockReturnValue(false),
  };

  const mockToastService = {
    show: vi.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    mockEventService.currentEvent.set(null);
    mockEventService.isLoading.set(false);
    mockEventService.error.set(null);
    mockAuthService.user.set(null);
    mockAuthService.isAuthenticated.mockReturnValue(false);
    mockEventService.getMyRegistrations.mockResolvedValue([]);

    await TestBed.configureTestingModule({
      imports: [EventDetailComponent],
      providers: [
        { provide: EventService, useValue: mockEventService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: vi.fn().mockImplementation((key) => (key === 'id' ? 'evt-1' : null)),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventDetailComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as any;
    // Spy on router.navigate
    vi.spyOn(mockRouter, 'navigate').mockResolvedValue(true);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── ngOnInit & Routing ─────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should load event on init when id is present', () => {
      component.ngOnInit();
      expect(mockEventService.loadEvent).toHaveBeenCalledWith('evt-1');
    });

    it('should not load event when id is missing', () => {
      const route = TestBed.inject(ActivatedRoute);
      (route.snapshot.paramMap.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
      component.ngOnInit();
      // loadEvent should not have been called (it was cleared in beforeEach)
      expect(mockEventService.loadEvent).not.toHaveBeenCalled();
    });
  });

  // ─── toDate ─────────────────────────────────────────────────────────

  describe('toDate', () => {
    it('should convert Timestamp to Date', () => {
      const ts = Timestamp.fromDate(new Date('2026-06-01T12:00:00Z'));
      const result = component.toDate(ts);
      expect(result).toBeInstanceOf(Date);
      expect(result!.getFullYear()).toBe(2026);
    });

    it('should return null for undefined', () => {
      expect(component.toDate(undefined)).toBeNull();
    });
  });

  // ─── formatPrice ────────────────────────────────────────────────────

  describe('formatPrice', () => {
    it('should format a number price', () => {
      expect(component.formatPrice(500)).toBe('$500');
    });

    it('should return Free for zero', () => {
      expect(component.formatPrice(0)).toBe('Free');
    });

    it('should return Free for undefined', () => {
      expect(component.formatPrice(undefined)).toBe('Free');
    });

    it('should handle bigint', () => {
      expect(component.formatPrice(BigInt(250))).toBe('$250');
    });
  });

  // ─── getStatusLabel ─────────────────────────────────────────────────

  describe('getStatusLabel', () => {
    it('should return Pending', () => {
      expect(component.getStatusLabel(RegistrationStatus.PENDING)).toBe('Pending');
    });

    it('should return Confirmed', () => {
      expect(component.getStatusLabel(RegistrationStatus.CONFIRMED)).toBe('Confirmed');
    });

    it('should return Cancelled', () => {
      expect(component.getStatusLabel(RegistrationStatus.CANCELLED)).toBe('Cancelled');
    });

    it('should return Unspecified', () => {
      expect(component.getStatusLabel(RegistrationStatus.UNSPECIFIED)).toBe('Unspecified');
    });

    it('should return Unknown for unexpected value', () => {
      expect(component.getStatusLabel(99 as any)).toBe('Unknown');
    });
  });

  // ─── Item quantity management ───────────────────────────────────────

  describe('item quantity management', () => {
    it('should return 0 for unselected item', () => {
      expect(component.getItemQuantity('item-x')).toBe(0);
    });

    it('should toggle item on', () => {
      component.toggleItem('item-1');
      expect(component.getItemQuantity('item-1')).toBe(1);
    });

    it('should toggle item off', () => {
      component.toggleItem('item-1');
      component.toggleItem('item-1');
      expect(component.getItemQuantity('item-1')).toBe(0);
    });

    it('should increment quantity', () => {
      component.toggleItem('item-1'); // 1
      component.updateQuantity('item-1', 1); // 2
      expect(component.getItemQuantity('item-1')).toBe(2);
    });

    it('should remove when decremented to 0', () => {
      component.toggleItem('item-1'); // 1
      component.updateQuantity('item-1', -1); // 0 → removed
      expect(component.getItemQuantity('item-1')).toBe(0);
    });

    it('should remove item when decremented below 0 from non-existent', () => {
      component.updateQuantity('item-x', -1);
      expect(component.getItemQuantity('item-x')).toBe(0);
    });
  });

  // ─── totalQuantity ──────────────────────────────────────────────────

  describe('totalQuantity', () => {
    it('should return 0 when no items selected', () => {
      expect(component.totalQuantity()).toBe(0);
    });

    it('should sum all item quantities', () => {
      component.itemQuantities.set({ 'item-1': 2, 'item-2': 3 });
      expect(component.totalQuantity()).toBe(5);
    });
  });

  // ─── subtotalPrice ──────────────────────────────────────────────────

  describe('subtotalPrice', () => {
    it('should return 0 when no event is set', () => {
      mockEventService.currentEvent.set(null);
      component.itemQuantities.set({ 'item-1': 2 });
      expect(component.subtotalPrice()).toBe(0);
    });

    it('should calculate subtotal from selected items and event prices', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        items: [
          { id: 'item-1', name: 'Lunch', price: BigInt(100) },
          { id: 'item-2', name: 'Dinner', price: BigInt(200) },
        ],
        discounts: [],
      });
      component.itemQuantities.set({ 'item-1': 2, 'item-2': 1 });
      // 100*2 + 200*1 = 400
      expect(component.subtotalPrice()).toBe(400);
    });

    it('should skip items not found in event', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        items: [{ id: 'item-1', name: 'Lunch', price: BigInt(100) }],
        discounts: [],
      });
      component.itemQuantities.set({ 'item-1': 1, 'item-nonexistent': 3 });
      expect(component.subtotalPrice()).toBe(100);
    });
  });

  // ─── discountAmount ─────────────────────────────────────────────────

  describe('discountAmount', () => {
    it('should return 0 when no event', () => {
      mockEventService.currentEvent.set(null);
      expect(component.discountAmount()).toBe(0);
    });

    it('should return 0 when no discounts on event', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        items: [{ id: 'item-1', price: BigInt(100) }],
        discounts: [],
      });
      component.itemQuantities.set({ 'item-1': 2 });
      expect(component.discountAmount()).toBe(0);
    });

    it('should return 0 when discounts is undefined', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        items: [{ id: 'item-1', price: BigInt(100) }],
      });
      component.itemQuantities.set({ 'item-1': 2 });
      expect(component.discountAmount()).toBe(0);
    });

    it('should apply the best matching discount', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        items: [{ id: 'item-1', price: BigInt(100) }],
        discounts: [
          { minQuantity: 2, discountAmount: BigInt(10) },
          { minQuantity: 5, discountAmount: BigInt(50) },
        ],
      });
      // totalQuantity = 3, only first discount qualifies
      component.itemQuantities.set({ 'item-1': 3 });
      expect(component.discountAmount()).toBe(10);
    });

    it('should pick highest qualifying discount', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        items: [{ id: 'item-1', price: BigInt(100) }],
        discounts: [
          { minQuantity: 2, discountAmount: BigInt(10) },
          { minQuantity: 3, discountAmount: BigInt(30) },
          { minQuantity: 5, discountAmount: BigInt(50) },
        ],
      });
      component.itemQuantities.set({ 'item-1': 4 });
      // Qualifies for minQty 2 (10) and minQty 3 (30), max is 30
      expect(component.discountAmount()).toBe(30);
    });

    it('should cap discount at subtotal', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        items: [{ id: 'item-1', price: BigInt(10) }],
        discounts: [{ minQuantity: 1, discountAmount: BigInt(9999) }],
      });
      component.itemQuantities.set({ 'item-1': 1 });
      // subtotal = 10, discount = 9999, should cap at 10
      expect(component.discountAmount()).toBe(10);
    });

    it('should return 0 when quantity does not meet any minimum', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        items: [{ id: 'item-1', price: BigInt(100) }],
        discounts: [{ minQuantity: 10, discountAmount: BigInt(50) }],
      });
      component.itemQuantities.set({ 'item-1': 2 });
      expect(component.discountAmount()).toBe(0);
    });
  });

  // ─── totalPrice ─────────────────────────────────────────────────────

  describe('totalPrice', () => {
    it('should equal subtotal minus discount', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        items: [{ id: 'item-1', price: BigInt(100) }],
        discounts: [{ minQuantity: 2, discountAmount: BigInt(20) }],
      });
      component.itemQuantities.set({ 'item-1': 3 });
      // subtotal = 300, discount = 20, total = 280
      expect(component.totalPrice()).toBe(280);
    });

    it('should equal subtotal when no discount applies', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        items: [{ id: 'item-1', price: BigInt(50) }],
        discounts: [],
      });
      component.itemQuantities.set({ 'item-1': 2 });
      expect(component.totalPrice()).toBe(100);
    });
  });

  // ─── getSelectedItemsList ───────────────────────────────────────────

  describe('getSelectedItemsList', () => {
    it('should return empty array when no event', () => {
      mockEventService.currentEvent.set(null);
      component.itemQuantities.set({ 'item-1': 2 });
      expect(component.getSelectedItemsList()).toEqual([]);
    });

    it('should return selected items with name, quantity, and total', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        items: [
          { id: 'item-1', name: 'Lunch', price: BigInt(100) },
          { id: 'item-2', name: 'Dinner', price: BigInt(200) },
        ],
      });
      component.itemQuantities.set({ 'item-1': 2, 'item-2': 1 });

      const result = component.getSelectedItemsList();
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ name: 'Lunch', quantity: 2, total: 200 });
      expect(result).toContainEqual({ name: 'Dinner', quantity: 1, total: 200 });
    });

    it('should handle item not found in event items', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        items: [],
      });
      component.itemQuantities.set({ 'item-missing': 1 });

      const result = component.getSelectedItemsList();
      expect(result).toEqual([{ name: 'Unknown', quantity: 1, total: 0 }]);
    });
  });

  // ─── canManage ──────────────────────────────────────────────────────

  describe('canManage', () => {
    it('should return false when no user', () => {
      mockAuthService.user.set(null);
      mockEventService.currentEvent.set({ id: 'evt-1', creator: { id: 'u1' }, managers: [] });
      expect(component.canManage()).toBe(false);
    });

    it('should return false when no event', () => {
      mockAuthService.user.set({ id: 'u1' });
      mockEventService.currentEvent.set(null);
      expect(component.canManage()).toBe(false);
    });

    it('should return true when user is the creator', () => {
      mockAuthService.user.set({ id: 'u1' });
      mockEventService.currentEvent.set({ id: 'evt-1', creator: { id: 'u1' }, managers: [] });
      expect(component.canManage()).toBe(true);
    });

    it('should return true when user is a manager', () => {
      mockAuthService.user.set({ id: 'u2' });
      mockEventService.currentEvent.set({
        id: 'evt-1',
        creator: { id: 'u1' },
        managers: [{ id: 'u2' }],
      });
      expect(component.canManage()).toBe(true);
    });

    it('should return false when user is neither creator nor manager', () => {
      mockAuthService.user.set({ id: 'u99' });
      mockEventService.currentEvent.set({
        id: 'evt-1',
        creator: { id: 'u1' },
        managers: [{ id: 'u2' }],
      });
      expect(component.canManage()).toBe(false);
    });
  });

  // ─── shouldShowTime ─────────────────────────────────────────────────

  describe('shouldShowTime', () => {
    it('should return false when no start/end time', () => {
      const item = { startTime: undefined, endTime: undefined } as any;
      expect(component.shouldShowTime(item)).toBe(false);
    });

    it('should return true for valid times', () => {
      const item = {
        startTime: Timestamp.fromDate(new Date('2026-03-01')),
        endTime: Timestamp.fromDate(new Date('2026-03-02')),
      } as any;
      expect(component.shouldShowTime(item)).toBe(true);
    });

    it('should return false for epoch 0 times', () => {
      const item = {
        startTime: new Timestamp({ seconds: BigInt(0), nanos: 0 }),
        endTime: new Timestamp({ seconds: BigInt(0), nanos: 0 }),
      } as any;
      expect(component.shouldShowTime(item)).toBe(false);
    });

    it('should return false when start time is missing but end time exists', () => {
      const item = {
        startTime: undefined,
        endTime: Timestamp.fromDate(new Date('2026-03-02')),
      } as any;
      expect(component.shouldShowTime(item)).toBe(false);
    });

    it('should return false when end time is missing but start time exists', () => {
      const item = {
        startTime: Timestamp.fromDate(new Date('2026-03-01')),
        endTime: undefined,
      } as any;
      expect(component.shouldShowTime(item)).toBe(false);
    });
  });

  // ─── loadMyRegistration ─────────────────────────────────────────────

  describe('loadMyRegistration', () => {
    it('should return early if no event', async () => {
      mockEventService.currentEvent.set(null);
      mockAuthService.user.set({ id: 'u1' });
      await component.loadMyRegistration();
      expect(mockEventService.getMyRegistrations).not.toHaveBeenCalled();
    });

    it('should return early if no user', async () => {
      mockEventService.currentEvent.set({ id: 'evt-1' });
      mockAuthService.user.set(null);
      await component.loadMyRegistration();
      expect(mockEventService.getMyRegistrations).not.toHaveBeenCalled();
    });

    it('should load and set registration when found', async () => {
      mockEventService.currentEvent.set({ id: 'evt-1' });
      mockAuthService.user.set({ id: 'u1' });

      const mockRegistration = {
        id: 'reg-1',
        eventId: 'evt-1',
        notes: 'My notes',
        selectedItems: [
          { eventItemId: 'item-1', quantity: 2 },
          { eventItemId: 'item-2', quantity: 1 },
        ],
      };
      mockEventService.getMyRegistrations.mockResolvedValueOnce([mockRegistration]);

      await component.loadMyRegistration();

      expect(component.myRegistration()).toEqual(mockRegistration);
      expect(component.notes).toBe('My notes');
      expect(component.getItemQuantity('item-1')).toBe(2);
      expect(component.getItemQuantity('item-2')).toBe(1);
    });

    it('should not set registration when none match the event', async () => {
      mockEventService.currentEvent.set({ id: 'evt-1' });
      mockAuthService.user.set({ id: 'u1' });

      mockEventService.getMyRegistrations.mockResolvedValueOnce([
        { id: 'reg-2', eventId: 'evt-other', notes: '', selectedItems: [] },
      ]);

      await component.loadMyRegistration();

      expect(component.myRegistration()).toBeNull();
    });

    it('should handle null returned from getMyRegistrations', async () => {
      mockEventService.currentEvent.set({ id: 'evt-1' });
      mockAuthService.user.set({ id: 'u1' });

      mockEventService.getMyRegistrations.mockResolvedValueOnce(null);

      await component.loadMyRegistration();

      expect(component.myRegistration()).toBeNull();
    });

    it('should handle error from getMyRegistrations gracefully', async () => {
      mockEventService.currentEvent.set({ id: 'evt-1' });
      mockAuthService.user.set({ id: 'u1' });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockEventService.getMyRegistrations.mockRejectedValueOnce(new Error('Network fail'));

      await component.loadMyRegistration();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load registrations', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  // ─── submitRegistration ─────────────────────────────────────────────

  describe('submitRegistration', () => {
    it('should redirect to login if unauthenticated', async () => {
      mockAuthService.isAuthenticated.mockReturnValueOnce(false);
      await component.submitRegistration();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: expect.any(String) },
      });
      expect(mockToastService.show).not.toHaveBeenCalled();
    });

    it('should return early if no event', async () => {
      mockAuthService.isAuthenticated.mockReturnValueOnce(true);
      mockEventService.currentEvent.set(null);
      await component.submitRegistration();
      expect(mockEventService.register).not.toHaveBeenCalled();
    });

    it('should show toast error if no items selected', async () => {
      mockAuthService.isAuthenticated.mockReturnValueOnce(true);
      mockEventService.currentEvent.set({ id: 'evt-1' });
      component.itemQuantities.set({}); // empty selection
      await component.submitRegistration();
      expect(mockToastService.show).toHaveBeenCalledWith(
        'Please select at least one item.',
        'error',
      );
    });

    it('should submit new registration successfully', async () => {
      mockAuthService.isAuthenticated.mockReturnValueOnce(true);
      component.itemQuantities.set({ 'item-1': 2 });
      component.notes = 'test notes';
      mockEventService.currentEvent.set({ id: 'evt-1' });
      mockEventService.register.mockResolvedValueOnce(undefined);
      const loadRegSpy = vi.spyOn(component, 'loadMyRegistration').mockResolvedValue();

      await component.submitRegistration();

      expect(mockEventService.register).toHaveBeenCalledWith(
        'evt-1',
        expect.any(Array),
        JSON.stringify({ note: 'Web RSVP' }),
        'test notes',
      );
      expect(mockToastService.show).toHaveBeenCalledWith('Registration Successful!', 'success');
      expect(loadRegSpy).toHaveBeenCalled();
    });

    it('should update existing registration', async () => {
      mockAuthService.isAuthenticated.mockReturnValueOnce(true);
      component.itemQuantities.set({ 'item-1': 1 });
      component.notes = 'updated notes';
      mockEventService.currentEvent.set({ id: 'evt-1' });
      component.myRegistration.set({
        id: 'reg-1',
        eventId: 'evt-1',
        contactInfo: 'contact@test.com',
      } as any);
      mockEventService.updateRegistration.mockResolvedValueOnce(undefined);
      const loadRegSpy = vi.spyOn(component, 'loadMyRegistration').mockResolvedValue();

      await component.submitRegistration();

      expect(mockEventService.updateRegistration).toHaveBeenCalledWith(
        'reg-1',
        expect.any(Array),
        'contact@test.com',
        'updated notes',
      );
      expect(mockToastService.show).toHaveBeenCalledWith('Registration Updated!', 'success');
      expect(loadRegSpy).toHaveBeenCalled();
    });

    it('should handle registration failure gracefully', async () => {
      mockAuthService.isAuthenticated.mockReturnValueOnce(true);
      component.itemQuantities.set({ 'item-1': 2 });
      mockEventService.currentEvent.set({ id: 'evt-1' });
      mockEventService.register.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await component.submitRegistration();

      expect(mockToastService.show).toHaveBeenCalledWith('Network error', 'error');
      consoleSpy.mockRestore();
    });

    it('should handle registration failure with no message', async () => {
      mockAuthService.isAuthenticated.mockReturnValueOnce(true);
      component.itemQuantities.set({ 'item-1': 2 });
      mockEventService.currentEvent.set({ id: 'evt-1' });
      mockEventService.register.mockRejectedValueOnce({});

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await component.submitRegistration();

      expect(mockToastService.show).toHaveBeenCalledWith('Operation failed', 'error');
      consoleSpy.mockRestore();
    });

    it('should handle update registration failure', async () => {
      mockAuthService.isAuthenticated.mockReturnValueOnce(true);
      component.itemQuantities.set({ 'item-1': 1 });
      mockEventService.currentEvent.set({ id: 'evt-1' });
      component.myRegistration.set({
        id: 'reg-1',
        eventId: 'evt-1',
        contactInfo: '',
      } as any);
      mockEventService.updateRegistration.mockRejectedValueOnce(new Error('Update failed'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await component.submitRegistration();

      expect(mockToastService.show).toHaveBeenCalledWith('Update failed', 'error');
      consoleSpy.mockRestore();
    });
  });

  // ─── cancelRegistration ─────────────────────────────────────────────

  describe('cancelRegistration', () => {
    it('should return early if no registration exists', async () => {
      component.myRegistration.set(null);
      await component.cancelRegistration();
      // No dialog should be opened, no service calls
      expect(mockEventService.cancelRegistration).not.toHaveBeenCalled();
    });

    it('should not cancel if user declines confirmation', async () => {
      component.myRegistration.set({ id: 'reg-1' } as any);
      // Mock the dialog to return false (user declined)
      component.dialog = { open: vi.fn().mockResolvedValue(false) } as any;

      await component.cancelRegistration();

      expect(mockEventService.cancelRegistration).not.toHaveBeenCalled();
    });

    it('should cancel registration successfully when confirmed', async () => {
      component.myRegistration.set({ id: 'reg-1' } as any);
      component.dialog = { open: vi.fn().mockResolvedValue(true) } as any;
      mockEventService.cancelRegistration.mockResolvedValueOnce(undefined);
      const loadRegSpy = vi.spyOn(component, 'loadMyRegistration').mockResolvedValue();

      await component.cancelRegistration();

      expect(mockEventService.cancelRegistration).toHaveBeenCalledWith('reg-1');
      expect(mockToastService.show).toHaveBeenCalledWith('Registration Cancelled', 'info');
      expect(loadRegSpy).toHaveBeenCalled();
    });

    it('should show correct dialog options', async () => {
      component.myRegistration.set({ id: 'reg-1' } as any);
      const dialogOpenMock = vi.fn().mockResolvedValue(false);
      component.dialog = { open: dialogOpenMock } as any;

      await component.cancelRegistration();

      expect(dialogOpenMock).toHaveBeenCalledWith({
        title: 'Cancel Registration',
        message: 'Are you sure you want to cancel your registration? This action cannot be undone.',
        type: 'destructive',
        confirmText: 'Yes, Cancel',
        cancelText: 'Keep Registration',
      });
    });

    it('should handle cancel failure gracefully', async () => {
      component.myRegistration.set({ id: 'reg-1' } as any);
      component.dialog = { open: vi.fn().mockResolvedValue(true) } as any;
      mockEventService.cancelRegistration.mockRejectedValueOnce(new Error('Cancel failed'));

      await component.cancelRegistration();

      expect(mockToastService.show).toHaveBeenCalledWith('Cancel failed', 'error');
    });

    it('should handle cancel failure with no message', async () => {
      component.myRegistration.set({ id: 'reg-1' } as any);
      component.dialog = { open: vi.fn().mockResolvedValue(true) } as any;
      mockEventService.cancelRegistration.mockRejectedValueOnce({});

      await component.cancelRegistration();

      expect(mockToastService.show).toHaveBeenCalledWith('Failed to cancel', 'error');
    });
  });

  // ─── Template Rendering ───────────────────────────────────────────
  describe('template rendering', () => {
    it('should show loading spinner when isLoading is true', () => {
      mockEventService.isLoading.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.animate-spin')).toBeTruthy();
    });

    it('should show "Event not found" when no event and not loading', () => {
      mockEventService.currentEvent.set(null);
      mockEventService.isLoading.set(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Event not found.');
    });

    it('should not show "Event not found" when loading', () => {
      mockEventService.currentEvent.set(null);
      mockEventService.isLoading.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).not.toContain('Event not found.');
    });

    it('should render event title and description when event is loaded', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        title: 'Keyboard Meetup',
        description: 'A fun event',
        location: 'Taipei',
        coverImageUrl: '',
        startTime: Timestamp.fromDate(new Date('2026-06-01T10:00:00Z')),
        endTime: Timestamp.fromDate(new Date('2026-06-01T18:00:00Z')),
        creator: { id: 'u1' },
        managers: [],
        items: [],
        discounts: [],
      } as any);
      fixture.detectChanges();
      const el = fixture.nativeElement;
      expect(el.querySelector('h1').textContent).toContain('Keyboard Meetup');
      expect(el.textContent).toContain('A fun event');
      expect(el.textContent).toContain('Taipei');
    });

    it('should show cover image when coverImageUrl is set', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        title: 'Test',
        description: '',
        location: '',
        coverImageUrl: 'https://example.com/cover.jpg',
        startTime: Timestamp.fromDate(new Date('2026-06-01T10:00:00Z')),
        endTime: Timestamp.fromDate(new Date('2026-06-01T18:00:00Z')),
        creator: { id: 'u1' },
        managers: [],
        items: [],
        discounts: [],
      } as any);
      fixture.detectChanges();
      const img = fixture.nativeElement.querySelector('img[class*="object-cover"]');
      expect(img).toBeTruthy();
      expect(img.src).toContain('cover.jpg');
    });

    it('should show placeholder when no cover image', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        title: 'Test',
        description: '',
        location: '',
        coverImageUrl: '',
        startTime: Timestamp.fromDate(new Date('2026-06-01T10:00:00Z')),
        endTime: Timestamp.fromDate(new Date('2026-06-01T18:00:00Z')),
        creator: { id: 'u1' },
        managers: [],
        items: [],
        discounts: [],
      } as any);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.bg-gray-900')).toBeTruthy();
    });

    it('should show Manage Event button when user canManage', () => {
      mockAuthService.user.set({ id: 'u1' } as any);
      mockEventService.currentEvent.set({
        id: 'evt-1',
        title: 'Test',
        description: '',
        location: '',
        coverImageUrl: '',
        startTime: Timestamp.fromDate(new Date('2026-06-01T10:00:00Z')),
        endTime: Timestamp.fromDate(new Date('2026-06-01T18:00:00Z')),
        creator: { id: 'u1' },
        managers: [],
        items: [],
        discounts: [],
      } as any);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Manage Event');
    });

    it('should not show Manage Event button when user is not manager', () => {
      mockAuthService.user.set({ id: 'u99' } as any);
      mockEventService.currentEvent.set({
        id: 'evt-1',
        title: 'Test',
        description: '',
        location: '',
        coverImageUrl: '',
        startTime: Timestamp.fromDate(new Date('2026-06-01T10:00:00Z')),
        endTime: Timestamp.fromDate(new Date('2026-06-01T18:00:00Z')),
        creator: { id: 'u1' },
        managers: [],
        items: [],
        discounts: [],
      } as any);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).not.toContain('Manage Event');
    });

    it('should render event items with name and price', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        title: 'Test',
        description: '',
        location: '',
        coverImageUrl: '',
        startTime: Timestamp.fromDate(new Date('2026-06-01T10:00:00Z')),
        endTime: Timestamp.fromDate(new Date('2026-06-01T18:00:00Z')),
        creator: { id: 'u1' },
        managers: [],
        items: [
          {
            id: 'i1',
            name: 'VIP Ticket',
            price: BigInt(500),
            maxParticipants: 50,
            allowMultiple: false,
          },
          { id: 'i2', name: 'Regular', price: BigInt(0), maxParticipants: 0, allowMultiple: true },
        ],
        discounts: [],
      } as any);
      fixture.detectChanges();
      const el = fixture.nativeElement;
      expect(el.textContent).toContain('VIP Ticket');
      expect(el.textContent).toContain('$500');
      expect(el.textContent).toContain('Regular');
      expect(el.textContent).toContain('Free');
    });

    it('should show participant limit badge when maxParticipants > 0', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        title: 'Test',
        description: '',
        location: '',
        coverImageUrl: '',
        startTime: Timestamp.fromDate(new Date('2026-06-01T10:00:00Z')),
        endTime: Timestamp.fromDate(new Date('2026-06-01T18:00:00Z')),
        creator: { id: 'u1' },
        managers: [],
        items: [
          { id: 'i1', name: 'VIP', price: BigInt(100), maxParticipants: 30, allowMultiple: false },
        ],
        discounts: [],
      } as any);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Limit: 30');
    });

    it('should show checkbox for single-select items and +/- for multi-select', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        title: 'Test',
        description: '',
        location: '',
        coverImageUrl: '',
        startTime: Timestamp.fromDate(new Date('2026-06-01T10:00:00Z')),
        endTime: Timestamp.fromDate(new Date('2026-06-01T18:00:00Z')),
        creator: { id: 'u1' },
        managers: [],
        items: [
          {
            id: 'i1',
            name: 'Single',
            price: BigInt(100),
            maxParticipants: 0,
            allowMultiple: false,
          },
          { id: 'i2', name: 'Multi', price: BigInt(200), maxParticipants: 0, allowMultiple: true },
        ],
        discounts: [],
      } as any);
      fixture.detectChanges();
      const checkboxes = fixture.nativeElement.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBeGreaterThanOrEqual(1);
      // Multi items should have +/- buttons
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const minusBtn = Array.from(buttons).find((b: any) => b.textContent.trim() === '-');
      const plusBtn = Array.from(buttons).find((b: any) => b.textContent.trim() === '+');
      expect(minusBtn).toBeTruthy();
      expect(plusBtn).toBeTruthy();
    });

    it('should show summary when items are selected', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        title: 'Test',
        description: '',
        location: '',
        coverImageUrl: '',
        startTime: Timestamp.fromDate(new Date('2026-06-01T10:00:00Z')),
        endTime: Timestamp.fromDate(new Date('2026-06-01T18:00:00Z')),
        creator: { id: 'u1' },
        managers: [],
        items: [
          { id: 'i1', name: 'Lunch', price: BigInt(100), maxParticipants: 0, allowMultiple: true },
        ],
        discounts: [],
      } as any);
      component.itemQuantities.set({ i1: 2 });
      fixture.detectChanges();
      const el = fixture.nativeElement;
      expect(el.textContent).toContain('Summary');
      expect(el.textContent).toContain('Lunch (x2)');
      expect(el.textContent).toContain('$200');
    });

    it('should show discount when applicable', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        title: 'Test',
        description: '',
        location: '',
        coverImageUrl: '',
        startTime: Timestamp.fromDate(new Date('2026-06-01T10:00:00Z')),
        endTime: Timestamp.fromDate(new Date('2026-06-01T18:00:00Z')),
        creator: { id: 'u1' },
        managers: [],
        items: [
          { id: 'i1', name: 'Item', price: BigInt(100), maxParticipants: 0, allowMultiple: true },
        ],
        discounts: [{ minQuantity: 2, discountAmount: BigInt(30) }],
      } as any);
      component.itemQuantities.set({ i1: 3 });
      fixture.detectChanges();
      const el = fixture.nativeElement;
      expect(el.textContent).toContain('Discount Applied');
      expect(el.textContent).toContain('-$30');
    });

    it('should show "Register Now" button when no existing registration', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        title: 'Test',
        description: '',
        location: '',
        coverImageUrl: '',
        startTime: Timestamp.fromDate(new Date('2026-06-01T10:00:00Z')),
        endTime: Timestamp.fromDate(new Date('2026-06-01T18:00:00Z')),
        creator: { id: 'u1' },
        managers: [],
        items: [],
        discounts: [],
      } as any);
      component.myRegistration.set(null);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Register Now');
    });

    it('should show "Update Registration" button when registration exists', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        title: 'Test',
        description: '',
        location: '',
        coverImageUrl: '',
        startTime: Timestamp.fromDate(new Date('2026-06-01T10:00:00Z')),
        endTime: Timestamp.fromDate(new Date('2026-06-01T18:00:00Z')),
        creator: { id: 'u1' },
        managers: [],
        items: [],
        discounts: [],
      } as any);
      component.myRegistration.set({ id: 'reg-1', status: 1 } as any);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Update');
      expect(fixture.nativeElement.textContent).toContain('Cancel Registration');
    });

    it('should show status badge for existing registration', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        title: 'Test',
        description: '',
        location: '',
        coverImageUrl: '',
        startTime: Timestamp.fromDate(new Date('2026-06-01T10:00:00Z')),
        endTime: Timestamp.fromDate(new Date('2026-06-01T18:00:00Z')),
        creator: { id: 'u1' },
        managers: [],
        items: [],
        discounts: [],
      } as any);
      component.myRegistration.set({ id: 'reg-1', status: 2 } as any);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Confirmed');
    });

    it('should not show cancel button for cancelled registration', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        title: 'Test',
        description: '',
        location: '',
        coverImageUrl: '',
        startTime: Timestamp.fromDate(new Date('2026-06-01T10:00:00Z')),
        endTime: Timestamp.fromDate(new Date('2026-06-01T18:00:00Z')),
        creator: { id: 'u1' },
        managers: [],
        items: [],
        discounts: [],
      } as any);
      component.myRegistration.set({ id: 'reg-1', status: 3 } as any);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).not.toContain('Cancel Registration');
    });

    it('should show error message when error signal is set', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        title: 'Test',
        description: '',
        location: '',
        coverImageUrl: '',
        startTime: Timestamp.fromDate(new Date('2026-06-01T10:00:00Z')),
        endTime: Timestamp.fromDate(new Date('2026-06-01T18:00:00Z')),
        creator: { id: 'u1' },
        managers: [],
        items: [],
        discounts: [],
      } as any);
      mockEventService.error.set('Something went wrong');
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Something went wrong');
    });

    it('should show notes textarea', () => {
      mockEventService.currentEvent.set({
        id: 'evt-1',
        title: 'Test',
        description: '',
        location: '',
        coverImageUrl: '',
        startTime: Timestamp.fromDate(new Date('2026-06-01T10:00:00Z')),
        endTime: Timestamp.fromDate(new Date('2026-06-01T18:00:00Z')),
        creator: { id: 'u1' },
        managers: [],
        items: [],
        discounts: [],
      } as any);
      fixture.detectChanges();
      const textarea = fixture.nativeElement.querySelector('textarea');
      expect(textarea).toBeTruthy();
      expect(textarea.placeholder).toContain('dietary');
    });
  });
});
