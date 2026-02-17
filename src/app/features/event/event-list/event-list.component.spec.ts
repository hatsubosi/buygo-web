import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventListComponent } from './event-list.component';
import { EventService } from '../../../core/event/event.service';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { Timestamp } from '@bufbuild/protobuf';
import { provideRouter, Router } from '@angular/router';

describe('EventListComponent', () => {
  let component: EventListComponent;
  let fixture: ComponentFixture<EventListComponent>;
  let router: Router;
  const mockEventService = {
    events: signal<any[]>([]),
    isLoading: signal(false),
    error: signal<string | null>(null),
    loadEvents: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventListComponent],
      providers: [{ provide: EventService, useValue: mockEventService }, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EventListComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadEvents on init', () => {
    fixture.detectChanges();
    expect(mockEventService.loadEvents).toHaveBeenCalled();
  });

  it('should convert Timestamp to Date', () => {
    const ts = Timestamp.fromDate(new Date('2026-01-15T00:00:00Z'));
    const result = component.toDate(ts);
    expect(result).toBeInstanceOf(Date);
    expect(result!.getFullYear()).toBe(2026);
  });

  it('should return null for undefined timestamp', () => {
    expect(component.toDate(undefined)).toBeNull();
  });

  it('should paginate events', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    const events = Array.from({ length: 10 }).map((_, i) => ({ id: `e-${i}`, title: `E${i}` }));
    mockEventService.events.set(events);
    fixture.detectChanges();

    expect(component.totalPages()).toBe(2);
    expect(component.pagedEvents().length).toBe(9);
    component.nextPage();
    expect(component.page()).toBe(2);
    expect(component.pagedEvents().length).toBe(1);
    component.prevPage();
    expect(component.page()).toBe(1);
    expect(navigateSpy).toHaveBeenCalled();
    const lastCall = navigateSpy.mock.calls.at(-1)!;
    expect(lastCall[0]).toEqual([]);
    expect((lastCall[1] as any)?.queryParams?.page).toBe(1);
  });
});
