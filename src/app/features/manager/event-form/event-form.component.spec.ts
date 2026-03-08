import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventFormComponent } from './event-form.component';
import { EventService } from '../../../core/event/event.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

describe('EventFormComponent', () => {
  let component: EventFormComponent;
  let fixture: ComponentFixture<EventFormComponent>;

  const mockEventService = {
    currentEvent: signal(null),
    events: signal([]),
    actionError: signal<string | null>(null),
    actionLoading: signal(false),
    loadEvent: async () => undefined,
    createEvent: async () => undefined,
    updateEvent: async () => undefined,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventFormComponent],
      providers: [{ provide: EventService, useValue: mockEventService }, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EventFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form initially', () => {
    expect(component.form.valid).toBeFalsy();
  });

  it('should add and remove items', () => {
    expect(component.items.length).toBe(0);
    component.addItem();
    expect(component.items.length).toBe(1);
    component.removeItem(0);
    expect(component.items.length).toBe(0);
  });

  it('should add and remove discounts', () => {
    expect(component.discounts.length).toBe(0);
    component.addDiscount();
    expect(component.discounts.length).toBe(1);
    component.removeDiscount(0);
    expect(component.discounts.length).toBe(0);
  });

  describe('template rendering', () => {
    it('should show "Create New Event" header in create mode', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Create New Event');
    });

    it('should show "Edit Event" header in edit mode', () => {
      component.isEditMode.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Edit Event');
    });

    it('should show title validation error when touched and empty', () => {
      component.form.get('title')?.markAsTouched();
      component.form.get('title')?.setValue('');
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Title is required');
    });

    it('should show start time validation error when touched and empty', () => {
      component.form.get('startTime')?.markAsTouched();
      component.form.get('startTime')?.setValue('');
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Start time is required');
    });

    it('should show "No items added yet" when items array is empty', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No items added yet.');
    });

    it('should render item card after adding one', () => {
      component.addItem();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Item #1');
    });

    it('should show "No discount rules set" when discounts are empty', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No discount rules set.');
    });

    it('should render discount row after adding one', () => {
      component.addDiscount();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Min Total Qty');
      expect(fixture.nativeElement.textContent).toContain('Discount Amount');
    });

    it('should show Managers section only in edit mode', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).not.toContain('Managers');

      component.isEditMode.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Managers');
    });

    it('should show error message when actionError is set', () => {
      mockEventService.actionError.set('Event creation failed');
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Event creation failed');
    });

    it('should show "Create Event" submit button in create mode', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Create Event');
    });

    it('should show "Save Changes" submit button in edit mode', () => {
      component.isEditMode.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Save Changes');
    });

    it('should show manager modal when opened in edit mode', () => {
      component.isEditMode.set(true);
      component.isManagerModalOpen.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Manage Co-Managers');
    });

    it('should render Allow Exceptions toggle', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Allow Exceptions');
    });

    it('should show multiple items when added', () => {
      component.addItem();
      component.addItem();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Item #1');
      expect(fixture.nativeElement.textContent).toContain('Item #2');
    });
  });
});
