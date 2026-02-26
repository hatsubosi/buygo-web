import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManagerEventItemsComponent } from './manager-event-items.component';
import { EventService } from '../../../core/event/event.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

describe('ManagerEventItemsComponent', () => {
  let component: ManagerEventItemsComponent;
  let fixture: ComponentFixture<ManagerEventItemsComponent>;

  const mockEventService = {
    currentEvent: signal(null),
    loadEvent: async () => {},
    listEventRegistrations: async () => [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerEventItemsComponent],
      providers: [{ provide: EventService, useValue: mockEventService }, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerEventItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct registration status labels', () => {
    expect(component.getRegStatus(1)).toBe('Pending');
    expect(component.getRegStatus(2)).toBe('Confirmed');
    expect(component.getRegStatus(3)).toBe('Cancelled');
    expect(component.getRegStatus(99)).toBe('Unknown');
  });

  describe('itemGroups computed', () => {
    it('should return empty when no event', () => {
      expect(component.itemGroups()).toEqual([]);
    });

    it('should group registrations by event item', () => {
      component.event.set({
        items: [
          { id: 'item-1', name: 'T-Shirt', price: BigInt(500) },
          { id: 'item-2', name: 'Cap', price: BigInt(200) },
        ],
      } as any);
      component.registrations.set([
        { status: 2, selectedItems: [{ eventItemId: 'item-1', quantity: 3 }] },
        {
          status: 2,
          selectedItems: [
            { eventItemId: 'item-1', quantity: 2 },
            { eventItemId: 'item-2', quantity: 1 },
          ],
        },
      ] as any);

      const groups = component.itemGroups();
      expect(groups.length).toBe(2);
      expect(groups[0].totalQuantity).toBe(5); // 3 + 2
      expect(groups[1].totalQuantity).toBe(1);
    });

    it('should exclude cancelled registrations from quantity count', () => {
      component.event.set({
        items: [{ id: 'item-1', name: 'T-Shirt', price: BigInt(500) }],
      } as any);
      component.registrations.set([
        { status: 2, selectedItems: [{ eventItemId: 'item-1', quantity: 3 }] },
        { status: 3, selectedItems: [{ eventItemId: 'item-1', quantity: 5 }] }, // cancelled
      ] as any);

      const groups = component.itemGroups();
      expect(groups[0].totalQuantity).toBe(3); // only confirmed counted
      expect(groups[0].registrations.length).toBe(2); // both included in list
    });
  });

  describe('template rendering', () => {
    it('should show loading when no event', () => {
      component.event.set(undefined);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Loading...');
    });

    it('should show "No items found" when event has no items', () => {
      component.event.set({ id: 'evt-1', items: [] } as any);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No items found for this event.');
    });

    it('should render event header with back link and title', () => {
      component.event.set({ id: 'evt-1', items: [{ id: 'i1', name: 'Ticket', price: BigInt(300) }] } as any);
      fixture.detectChanges();
      const el = fixture.nativeElement;
      expect(el.textContent).toContain('Guests by Item');
      expect(el.textContent).toContain('Back to Event');
    });

    it('should render item group headers with name, price and sold count', () => {
      component.event.set({
        items: [{ id: 'i1', name: 'VIP Pass', price: BigInt(500) }],
      } as any);
      component.registrations.set([
        { id: 'r1', status: 2, user: { name: 'Alice', email: 'a@b.com' }, contactInfo: '', selectedItems: [{ eventItemId: 'i1', quantity: 3 }] },
      ] as any);
      fixture.detectChanges();
      const el = fixture.nativeElement;
      expect(el.textContent).toContain('VIP Pass');
      expect(el.textContent).toContain('3');
      expect(el.textContent).toContain('Sold');
    });

    it('should render registration rows with guest name, email and quantity', () => {
      component.event.set({
        items: [{ id: 'i1', name: 'Ticket', price: BigInt(100) }],
      } as any);
      component.registrations.set([
        { id: 'r1', status: 2, user: { name: 'Bob', email: 'bob@test.com' }, contactInfo: '', selectedItems: [{ eventItemId: 'i1', quantity: 2 }] },
        { id: 'r2', status: 1, user: { name: 'Carol', email: 'carol@test.com' }, contactInfo: '', selectedItems: [{ eventItemId: 'i1', quantity: 1 }] },
      ] as any);
      fixture.detectChanges();
      const el = fixture.nativeElement;
      expect(el.textContent).toContain('Bob');
      expect(el.textContent).toContain('bob@test.com');
      expect(el.textContent).toContain('Carol');
      expect(el.textContent).toContain('Confirmed');
      expect(el.textContent).toContain('Pending');
    });

    it('should show "No purchases" when item has no registrations', () => {
      component.event.set({
        items: [{ id: 'i1', name: 'Ticket', price: BigInt(100) }],
      } as any);
      component.registrations.set([]);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No purchases for this item yet.');
    });

    it('should render table headers', () => {
      component.event.set({
        items: [{ id: 'i1', name: 'Ticket', price: BigInt(100) }],
      } as any);
      fixture.detectChanges();
      const el = fixture.nativeElement;
      expect(el.textContent).toContain('Guest Name');
      expect(el.textContent).toContain('Quantity');
      expect(el.textContent).toContain('Status');
    });
  });
});
