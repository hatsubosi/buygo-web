import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ManagerEventDetailComponent } from './manager-event-detail.component';
import { EventService } from '../../../core/event/event.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { UserRole } from '../../../core/api/api/v1/auth_pb';

describe('ManagerEventDetailComponent', () => {
  let component: ManagerEventDetailComponent;
  let fixture: ComponentFixture<ManagerEventDetailComponent>;
  let router: Router;

  const mockEventService = {
    currentEvent: signal<any>(null),
    loadEvent: vi.fn().mockResolvedValue(undefined),
    listEventRegistrations: vi.fn().mockResolvedValue([]),
    updateRegistrationStatus: vi.fn().mockResolvedValue(undefined),
    updateEventStatus: vi.fn().mockResolvedValue(undefined),
  };

  const mockAuthService = {
    user: signal<any>(null),
  };

  const mockToastService = {
    show: vi.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks and signals between tests
    vi.clearAllMocks();
    mockEventService.currentEvent = signal<any>(null);
    mockEventService.listEventRegistrations.mockResolvedValue([]);
    mockAuthService.user = signal<any>(null);

    await TestBed.configureTestingModule({
      imports: [ManagerEventDetailComponent],
      providers: [
        { provide: EventService, useValue: mockEventService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
        provideRouter([
          { path: 'manager', component: ManagerEventDetailComponent },
        ]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(ManagerEventDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- Status mapping methods ---

  it('should return correct event status', () => {
    expect(component.getEventStatus(1)).toBe('Draft');
    expect(component.getEventStatus(2)).toBe('Active');
    expect(component.getEventStatus(3)).toBe('Cancelled');
    expect(component.getEventStatus(4)).toBe('Ended');
    expect(component.getEventStatus(99)).toBe('Unknown');
  });

  it('should return correct registration status', () => {
    expect(component.getRegStatus(1)).toBe('Pending');
    expect(component.getRegStatus(2)).toBe('Confirmed');
    expect(component.getRegStatus(3)).toBe('Cancelled');
    expect(component.getRegStatus(99)).toBe('Unknown');
  });

  it('should return correct payment status', () => {
    expect(component.getPaymentStatus(1)).toBe('Unpaid');
    expect(component.getPaymentStatus(2)).toBe('Submitted');
    expect(component.getPaymentStatus(3)).toBe('Paid');
    expect(component.getPaymentStatus(4)).toBe('Refunded');
    expect(component.getPaymentStatus(99)).toBe('Unknown');
  });

  // --- toDate ---

  it('should convert timestamp to Date', () => {
    const mockTs = { toDate: () => new Date('2026-01-01') };
    expect(component.toDate(mockTs)).toEqual(new Date('2026-01-01'));
  });

  it('should return null for null timestamp', () => {
    expect(component.toDate(null)).toBeNull();
    expect(component.toDate(undefined)).toBeNull();
  });

  // --- getItemName ---

  it('should return item name when item exists in event', () => {
    mockEventService.currentEvent.set({
      id: 'evt-1',
      items: [
        { id: 'item-1', name: 'VIP Ticket' },
        { id: 'item-2', name: 'Standard Ticket' },
      ],
      managers: [],
    });
    fixture.detectChanges();

    expect(component.getItemName('item-1')).toBe('VIP Ticket');
    expect(component.getItemName('item-2')).toBe('Standard Ticket');
  });

  it('should return "Unknown Item" when item is not found', () => {
    mockEventService.currentEvent.set({
      id: 'evt-1',
      items: [{ id: 'item-1', name: 'VIP Ticket' }],
      managers: [],
    });
    fixture.detectChanges();

    expect(component.getItemName('nonexistent')).toBe('Unknown Item');
  });

  it('should return "Unknown Item" when event is null', () => {
    mockEventService.currentEvent.set(null);
    expect(component.getItemName('item-1')).toBe('Unknown Item');
  });

  // --- loadRegistrations ---

  it('should load and sort registrations by user name', async () => {
    const mockRegs = [
      { id: 'r2', user: { name: 'Zara' } },
      { id: 'r1', user: { name: 'Alice' } },
      { id: 'r3', user: { name: 'Bob' } },
    ];
    mockEventService.listEventRegistrations.mockResolvedValue(mockRegs);
    mockEventService.currentEvent.set({
      id: 'evt-1',
      items: [],
      managers: [],
    });
    fixture.detectChanges();

    await component.loadRegistrations();

    const regs = component.registrations();
    expect(regs.length).toBe(3);
    expect(regs[0].user.name).toBe('Alice');
    expect(regs[1].user.name).toBe('Bob');
    expect(regs[2].user.name).toBe('Zara');
  });

  it('should sort by id when user names are the same', async () => {
    const mockRegs = [
      { id: 'r2', user: { name: 'Alice' } },
      { id: 'r1', user: { name: 'Alice' } },
    ];
    mockEventService.listEventRegistrations.mockResolvedValue(mockRegs);
    mockEventService.currentEvent.set({
      id: 'evt-1',
      items: [],
      managers: [],
    });
    fixture.detectChanges();

    await component.loadRegistrations();

    const regs = component.registrations();
    expect(regs[0].id).toBe('r1');
    expect(regs[1].id).toBe('r2');
  });

  it('should use "Guest" for registrations without user name when sorting', async () => {
    const mockRegs = [
      { id: 'r1', user: { name: 'Zara' } },
      { id: 'r2', user: null },
    ];
    mockEventService.listEventRegistrations.mockResolvedValue(mockRegs);
    mockEventService.currentEvent.set({
      id: 'evt-1',
      items: [],
      managers: [],
    });
    fixture.detectChanges();

    await component.loadRegistrations();

    const regs = component.registrations();
    // 'Guest' < 'Zara' alphabetically
    expect(regs[0].id).toBe('r2');
    expect(regs[1].id).toBe('r1');
  });

  it('should not load registrations when event is null', async () => {
    mockEventService.currentEvent.set(null);
    mockEventService.listEventRegistrations.mockClear();

    await component.loadRegistrations();

    expect(mockEventService.listEventRegistrations).not.toHaveBeenCalled();
  });

  it('should handle error when loading registrations fails', async () => {
    mockEventService.listEventRegistrations.mockRejectedValue(
      new Error('Network error')
    );
    mockEventService.currentEvent.set({
      id: 'evt-1',
      items: [],
      managers: [],
    });
    fixture.detectChanges();

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await component.loadRegistrations();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load regs',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it('should handle null response from listEventRegistrations', async () => {
    mockEventService.listEventRegistrations.mockResolvedValue(null);
    mockEventService.currentEvent.set({
      id: 'evt-1',
      items: [],
      managers: [],
    });
    fixture.detectChanges();

    await component.loadRegistrations();

    expect(component.registrations()).toEqual([]);
  });

  // --- updateStatus ---

  it('should call updateRegistrationStatus and refresh registrations', async () => {
    mockEventService.currentEvent.set({
      id: 'evt-1',
      items: [],
      managers: [],
    });
    fixture.detectChanges();

    const reg = { id: 'r1' };
    await component.updateStatus(reg, 2, 1);

    expect(mockEventService.updateRegistrationStatus).toHaveBeenCalledWith(
      'r1',
      2,
      1
    );
  });

  it('should convert string status values to numbers', async () => {
    mockEventService.currentEvent.set({
      id: 'evt-1',
      items: [],
      managers: [],
    });
    fixture.detectChanges();

    const reg = { id: 'r1' };
    await component.updateStatus(reg, '2' as any, '3' as any);

    expect(mockEventService.updateRegistrationStatus).toHaveBeenCalledWith(
      'r1',
      2,
      3
    );
  });

  it('should show error toast when updateStatus fails', async () => {
    mockEventService.updateRegistrationStatus.mockRejectedValueOnce(
      new Error('Server error')
    );
    mockEventService.currentEvent.set({
      id: 'evt-1',
      items: [],
      managers: [],
    });
    fixture.detectChanges();

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const reg = { id: 'r1' };
    await component.updateStatus(reg, 2, 1);

    expect(mockToastService.show).toHaveBeenCalledWith(
      'Error updating status',
      'error'
    );
    consoleSpy.mockRestore();
  });

  // --- changeEventStatus ---

  it('should open dialog and update event status on confirm (publish)', async () => {
    mockEventService.currentEvent.set({
      id: 'evt-1',
      status: 1,
      items: [],
      managers: [],
    });
    fixture.detectChanges();

    // Mock the dialog ViewChild
    component.dialog = {
      open: vi.fn().mockResolvedValue(true),
    } as any;

    await component.changeEventStatus(2);

    expect(component.dialog.open).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Confirm publish',
        type: 'default',
        confirmText: 'Yes, proceed',
        cancelText: 'Cancel',
      })
    );
    expect(mockEventService.updateEventStatus).toHaveBeenCalledWith(
      'evt-1',
      2
    );
    expect(mockEventService.loadEvent).toHaveBeenCalledWith('evt-1');
    expect(mockToastService.show).toHaveBeenCalledWith(
      'Event published successfully',
      'success'
    );
  });

  it('should use destructive dialog type for end (status 3)', async () => {
    mockEventService.currentEvent.set({
      id: 'evt-1',
      status: 2,
      items: [],
      managers: [],
    });
    fixture.detectChanges();

    component.dialog = {
      open: vi.fn().mockResolvedValue(true),
    } as any;

    await component.changeEventStatus(3);

    expect(component.dialog.open).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Confirm end',
        type: 'destructive',
      })
    );
    expect(mockEventService.updateEventStatus).toHaveBeenCalledWith(
      'evt-1',
      3
    );
    expect(mockToastService.show).toHaveBeenCalledWith(
      'Event ended successfully',
      'success'
    );
  });

  it('should use destructive dialog type for archive (status 4)', async () => {
    mockEventService.currentEvent.set({
      id: 'evt-1',
      status: 3,
      items: [],
      managers: [],
    });
    fixture.detectChanges();

    component.dialog = {
      open: vi.fn().mockResolvedValue(true),
    } as any;

    await component.changeEventStatus(4);

    expect(component.dialog.open).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Confirm archive',
        type: 'destructive',
      })
    );
    expect(mockEventService.updateEventStatus).toHaveBeenCalledWith(
      'evt-1',
      4
    );
    expect(mockToastService.show).toHaveBeenCalledWith(
      'Event archived successfully',
      'success'
    );
  });

  it('should not proceed when dialog is cancelled', async () => {
    mockEventService.currentEvent.set({
      id: 'evt-1',
      status: 1,
      items: [],
      managers: [],
    });
    fixture.detectChanges();

    component.dialog = {
      open: vi.fn().mockResolvedValue(false),
    } as any;

    await component.changeEventStatus(2);

    expect(mockEventService.updateEventStatus).not.toHaveBeenCalled();
  });

  it('should do nothing when event is null in changeEventStatus', async () => {
    mockEventService.currentEvent.set(null);
    fixture.detectChanges();

    component.dialog = {
      open: vi.fn(),
    } as any;

    await component.changeEventStatus(2);

    expect(component.dialog.open).not.toHaveBeenCalled();
  });

  it('should return early for unknown status in changeEventStatus', async () => {
    mockEventService.currentEvent.set({
      id: 'evt-1',
      items: [],
      managers: [],
    });
    fixture.detectChanges();

    component.dialog = {
      open: vi.fn(),
    } as any;

    await component.changeEventStatus(99);

    expect(component.dialog.open).not.toHaveBeenCalled();
  });

  it('should show error toast when updateEventStatus fails', async () => {
    mockEventService.currentEvent.set({
      id: 'evt-1',
      status: 1,
      items: [],
      managers: [],
    });
    fixture.detectChanges();

    component.dialog = {
      open: vi.fn().mockResolvedValue(true),
    } as any;

    mockEventService.updateEventStatus.mockRejectedValueOnce(
      new Error('Permission denied')
    );

    await component.changeEventStatus(2);

    expect(mockToastService.show).toHaveBeenCalledWith(
      'Permission denied',
      'error'
    );
  });

  it('should show generic error when updateEventStatus fails without message', async () => {
    mockEventService.currentEvent.set({
      id: 'evt-1',
      status: 1,
      items: [],
      managers: [],
    });
    fixture.detectChanges();

    component.dialog = {
      open: vi.fn().mockResolvedValue(true),
    } as any;

    mockEventService.updateEventStatus.mockRejectedValueOnce({});

    await component.changeEventStatus(2);

    expect(mockToastService.show).toHaveBeenCalledWith(
      'Failed to update status',
      'error'
    );
  });

  // --- copyPublicLink ---

  it('should copy public link to clipboard', async () => {
    mockEventService.currentEvent.set({
      id: 'evt-123',
      items: [],
      managers: [],
    });
    fixture.detectChanges();

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    component.copyPublicLink();

    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining('/event/evt-123')
    );

    // Wait for the promise to resolve to trigger the toast
    await vi.waitFor(() => {
      expect(mockToastService.show).toHaveBeenCalledWith(
        'Public link copied to clipboard!',
        'success'
      );
    });
  });

  // --- Effect: access control redirect ---

  it('should redirect non-creator non-manager users to /manager', async () => {
    mockEventService.currentEvent.set({
      id: 'evt-1',
      creator: { id: 'user-creator' },
      managers: [{ id: 'user-manager' }],
      items: [],
    });
    mockAuthService.user.set({
      id: 'user-random',
      role: UserRole.CREATOR,
    });

    // Trigger effects
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/manager']);
  });

  it('should NOT redirect if user is the event creator', async () => {
    (router.navigate as ReturnType<typeof vi.fn>).mockClear();

    mockEventService.currentEvent.set({
      id: 'evt-1',
      creator: { id: 'user-creator' },
      managers: [],
      items: [],
    });
    mockAuthService.user.set({
      id: 'user-creator',
      role: UserRole.CREATOR,
    });

    TestBed.flushEffects();
    fixture.detectChanges();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should NOT redirect if user is a manager of the event', async () => {
    (router.navigate as ReturnType<typeof vi.fn>).mockClear();

    mockEventService.currentEvent.set({
      id: 'evt-1',
      creator: { id: 'user-creator' },
      managers: [{ id: 'user-mgr' }],
      items: [],
    });
    mockAuthService.user.set({
      id: 'user-mgr',
      role: UserRole.CREATOR,
    });

    TestBed.flushEffects();
    fixture.detectChanges();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should NOT redirect if user is SYS_ADMIN', async () => {
    (router.navigate as ReturnType<typeof vi.fn>).mockClear();

    mockEventService.currentEvent.set({
      id: 'evt-1',
      creator: { id: 'user-creator' },
      managers: [],
      items: [],
    });
    mockAuthService.user.set({
      id: 'user-admin',
      role: UserRole.SYS_ADMIN,
    });

    TestBed.flushEffects();
    fixture.detectChanges();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  // --- Effect: load event by id ---

  it('should call loadEvent when id input is set', () => {
    mockEventService.loadEvent.mockClear();

    fixture.componentRef.setInput('id', 'evt-42');
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(mockEventService.loadEvent).toHaveBeenCalledWith('evt-42');
  });

  // --- toNumber ---

  it('should expose Number as toNumber', () => {
    expect((component as any).toNumber('42')).toBe(42);
    expect((component as any).toNumber(0)).toBe(0);
  });
});
