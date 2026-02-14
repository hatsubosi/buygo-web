import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventListComponent } from './event-list.component';
import { EventService } from '../../../core/event/event.service';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { Timestamp } from '@bufbuild/protobuf';
import { provideRouter } from '@angular/router';

describe('EventListComponent', () => {
    let component: EventListComponent;
    let fixture: ComponentFixture<EventListComponent>;
    const mockEventService = {
        events: signal<any[]>([]),
        isLoading: signal(false),
        error: signal<string | null>(null),
        loadEvents: vi.fn()
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EventListComponent],
            providers: [
                { provide: EventService, useValue: mockEventService },
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(EventListComponent);
        component = fixture.componentInstance;
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
});
