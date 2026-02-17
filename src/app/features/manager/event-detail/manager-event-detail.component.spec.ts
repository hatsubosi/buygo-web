import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManagerEventDetailComponent } from './manager-event-detail.component';
import { EventService } from '../../../core/event/event.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

describe('ManagerEventDetailComponent', () => {
  let component: ManagerEventDetailComponent;
  let fixture: ComponentFixture<ManagerEventDetailComponent>;

  const mockEventService = {
    currentEvent: signal(null),
    loadEvent: async () => {},
    listEventRegistrations: async () => [],
    updateRegistrationStatus: async () => {},
    updateEventStatus: async () => {},
  };

  const mockAuthService = {
    user: signal(null),
  };

  const mockToastService = {
    show: () => {},
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerEventDetailComponent],
      providers: [
        { provide: EventService, useValue: mockEventService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerEventDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

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
});
