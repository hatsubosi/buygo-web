import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventFormComponent } from './event-form.component';
import { EventService } from '../../../core/event/event.service';
import { provideRouter } from '@angular/router';
import { DatePipe } from '@angular/common';
import { signal } from '@angular/core';

describe('EventFormComponent', () => {
    let component: EventFormComponent;
    let fixture: ComponentFixture<EventFormComponent>;

    const mockEventService = {
        currentEvent: signal(null),
        events: signal([]),
        actionError: signal(null),
        actionLoading: signal(false),
        loadEvent: async () => { },
        createEvent: async () => { },
        updateEvent: async () => { }
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EventFormComponent],
            providers: [
                { provide: EventService, useValue: mockEventService },
                provideRouter([])
            ]
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
});
