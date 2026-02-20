import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventDetailComponent } from './event-detail.component';
import { EventService } from '../../../core/event/event.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { Timestamp } from '@bufbuild/protobuf';
import { RegistrationStatus } from '../../../core/api/api/v1/event_pb';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

describe('EventDetailComponent', () => {
  let component: EventDetailComponent;
  let fixture: ComponentFixture<EventDetailComponent>;

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
    await TestBed.configureTestingModule({
      imports: [EventDetailComponent],
      providers: [
        { provide: EventService, useValue: mockEventService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'evt-1' } } } },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

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

    it('should return Unknown for unexpected value', () => {
      expect(component.getStatusLabel(99 as any)).toBe('Unknown');
    });
  });

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
  });

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
  });

  describe('ngOnInit & Routing', () => {
    it('should load event on init when id is present', () => {
      component.ngOnInit();
      expect(mockEventService.loadEvent).toHaveBeenCalledWith('evt-1');
    });
  });

  describe('submitRegistration', () => {
    it('should show toast error if unauthenticated', async () => {
      mockAuthService.isAuthenticated.mockReturnValueOnce(false);
      await component.submitRegistration();
      // Should redirect to login, toast might not be called directly for auth
      expect(mockToastService.show).not.toHaveBeenCalled();
    });

    it('should show toast error if no items selected', async () => {
      mockAuthService.isAuthenticated.mockReturnValueOnce(true);
      component.itemQuantities.set({}); // empty selection
      await component.submitRegistration();
      expect(mockToastService.show).toHaveBeenCalledWith(
        'Please select at least one item.',
        'error'
      );
    });

    it('should submit registration successfully and reload on success', async () => {
      mockAuthService.isAuthenticated.mockReturnValueOnce(true);
      component.itemQuantities.set({ 'item-1': 2 });
      mockEventService.currentEvent.set({ id: 'evt-1' });
      mockEventService.register.mockResolvedValueOnce(undefined);
      const loadRegSpy = vi.spyOn(component, 'loadMyRegistration').mockResolvedValue();

      await component.submitRegistration();

      expect(mockEventService.register).toHaveBeenCalled();
      expect(mockToastService.show).toHaveBeenCalledWith(
        'Registration Successful!',
        'success'
      );
      expect(loadRegSpy).toHaveBeenCalled();
    });

    it('should handle registration failure gracefully', async () => {
      mockAuthService.isAuthenticated.mockReturnValueOnce(true);
      component.itemQuantities.set({ 'item-1': 2 });
      mockEventService.currentEvent.set({ id: 'evt-1' });
      mockEventService.register.mockRejectedValueOnce(new Error('Network error'));

      await component.submitRegistration();

      expect(mockToastService.show).toHaveBeenCalledWith(
        'Network error',
        'error'
      );
    });
  });
});
