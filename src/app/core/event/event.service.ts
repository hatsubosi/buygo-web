import { Injectable, inject, signal } from '@angular/core';
import { TransportToken } from '../providers/transport.token';
import { createPromiseClient } from '@connectrpc/connect';
import { Timestamp } from '@bufbuild/protobuf';
import { EventService as EventServiceDef } from '../api/api/v1/event_connect';
import { Event, RegisterItem } from '../api/api/v1/event_pb';
import { Transport } from '@connectrpc/connect';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class EventService {
    private transport = inject(TransportToken) as Transport;
    private client = createPromiseClient(EventServiceDef, this.transport);

    // State
    events = signal<Event[]>([]);
    managerEvents = signal<Event[]>([]);
    currentEvent = signal<Event | null>(null);
    isLoading = signal<boolean>(false);
    error = signal<string | null>(null);

    // Action State
    actionLoading = signal<boolean>(false);
    actionError = signal<string | null>(null);

    async loadEvents() {
        this.isLoading.set(true);
        this.error.set(null);
        try {
            const res = await this.client['listEvents']({ pageSize: 100 });
            this.events.set(res.events);
        } catch (err: any) {
            this.error.set(err.message);
        } finally {
            this.isLoading.set(false);
        }
    }

    async loadManagerEvents() {
        this.isLoading.set(true);
        this.error.set(null);
        try {
            const res = await this.client['listManagerEvents']({ pageSize: 100 });
            this.managerEvents.set(res.events);
        } catch (err: any) {
            this.error.set(err.message);
        } finally {
            this.isLoading.set(false);
        }
    }

    async loadEvent(id: string) {
        this.isLoading.set(true);
        this.error.set(null);
        try {
            const res = await this.client['getEvent']({ eventId: id });
            this.currentEvent.set(res.event || null);
        } catch (err: any) {
            this.error.set(err.message);
        } finally {
            this.isLoading.set(false);
        }
    }

    private authService = inject(AuthService);

    async createEvent(title: string, description: string, start: Date, end: Date, items: any[] = [], discounts: any[] = []) {
        this.actionLoading.set(true);
        this.actionError.set(null);
        try {
            const res = await this.client['createEvent']({
                title,
                description,
                startTime: Timestamp.fromDate(start),
                endTime: Timestamp.fromDate(end),
                items: items.map(i => ({
                    name: i.name,
                    price: BigInt(i.price),
                    minParticipants: i.minParticipants,
                    maxParticipants: i.maxParticipants,
                    allowMultiple: i.allowMultiple,
                    startTime: i.startTime ? Timestamp.fromDate(new Date(i.startTime)) : undefined,
                    endTime: i.endTime ? Timestamp.fromDate(new Date(i.endTime)) : undefined
                })),
                discounts: discounts.map(d => ({
                    minQuantity: d.minQuantity,
                    minDistinctItems: d.minDistinctItems,
                    discountAmount: BigInt(d.discountAmount)
                }))
            });

            const newEvent = res.event!;
            // Manually populate creator if missing (backend might not return relation on create)
            if (!newEvent.creator && this.authService.user()) {
                newEvent.creator = this.authService.user()!;
            }

            // Optionally add to list immediately
            this.events.update(list => [...list, newEvent]);
        } catch (err: any) {
            this.actionError.set(err.message);
            throw err;
        } finally {
            this.actionLoading.set(false);
        }
    }

    async register(eventId: string, items: RegisterItem[], contactInfo: string, notes: string) {
        if (items.some(i => i.quantity <= 0)) {
            const err = new Error('Quantity must be positive');
            this.error.set(err.message);
            throw err;
        }
        this.isLoading.set(true);
        this.error.set(null);
        try {
            await this.client['registerEvent']({
                eventId,
                items,
                contactInfo,
                notes,
            });
        } catch (err: any) {
            this.error.set(err.message);
            throw err;
        } finally {
            this.isLoading.set(false);
        }
    }

    async updateRegistration(registrationId: string, items: RegisterItem[], contactInfo: string, notes: string) {
        if (items.some(i => i.quantity <= 0)) {
            const err = new Error('Quantity must be positive');
            this.error.set(err.message);
            throw err;
        }
        this.isLoading.set(true);
        this.error.set(null);
        try {
            await this.client['updateRegistration']({
                registrationId,
                items,
                contactInfo,
                notes,
            });
        } catch (err: any) {
            this.error.set(err.message);
            throw err;
        } finally {
            this.isLoading.set(false);
        }
    }

    async getMyRegistrations() {
        this.isLoading.set(true);
        this.error.set(null);
        try {
            const res = await this.client['getMyRegistrations']({});
            return res.registrations;
        } catch (err: any) {
            this.error.set(err.message);
            throw err;
        } finally {
            this.isLoading.set(false);
        }
    }

    async cancelRegistration(registrationId: string) {
        this.actionLoading.set(true);
        this.actionError.set(null);
        try {
            await this.client['cancelRegistration']({ registrationId });
        } catch (err: any) {
            this.actionError.set(err.message);
            throw err;
        } finally {
            this.actionLoading.set(false);
        }
    }

    async listEventRegistrations(eventId: string) {
        this.isLoading.set(true);
        this.error.set(null);
        try {
            const res = await this.client['listEventRegistrations']({ eventId });
            return res.registrations;
        } catch (err: any) {
            this.error.set(err.message);
            throw err;
        } finally {
            this.isLoading.set(false);
        }
    }

    async updateRegistrationStatus(registrationId: string, status: number, paymentStatus: number) {
        this.actionLoading.set(true);
        this.actionError.set(null);
        try {
            await this.client['updateRegistrationStatus']({
                registrationId,
                status,
                paymentStatus
            });
        } catch (err: any) {
            this.actionError.set(err.message);
            throw err;
        } finally {
            this.actionLoading.set(false);
        }
    }

    async updateEvent(id: string, eventData: any) { // Type as proper Request if possible, or any for now
        this.actionLoading.set(true);
        this.actionError.set(null);
        try {
            // Map simple object to Proto compatible struct
            // StartTime/EndTime need to be Timestamp
            await this.client['updateEvent']({
                eventId: id,
                title: eventData.title,
                description: eventData.description,
                location: eventData.location,
                startTime: Timestamp.fromDate(new Date(eventData.startTime)),
                endTime: Timestamp.fromDate(new Date(eventData.endTime)),
                coverImageUrl: eventData.coverImageUrl,
                allowModification: eventData.allowModification,
                items: eventData.items.map((i: any) => ({
                    id: i.id || '', // Empty for new
                    name: i.name,
                    price: BigInt(i.price),
                    minParticipants: i.minParticipants,
                    maxParticipants: i.maxParticipants,
                    startTime: i.startTime ? Timestamp.fromDate(new Date(i.startTime)) : undefined,
                    endTime: i.endTime ? Timestamp.fromDate(new Date(i.endTime)) : undefined,
                    allowMultiple: i.allowMultiple
                })),
                managerIds: eventData.managerIds,
                discounts: eventData.discounts?.map((d: any) => ({
                    minQuantity: d.minQuantity,
                    minDistinctItems: d.minDistinctItems,
                    discountAmount: BigInt(d.discountAmount)
                })) || []
            });
        } catch (err: any) {
            this.actionError.set(err.message);
            throw err;
        } finally {
            this.actionLoading.set(false);
        }
    }
    async updateEventStatus(id: string, status: number) {
        this.actionLoading.set(true);
        this.actionError.set(null);
        try {
            await this.client['updateEventStatus']({
                eventId: id,
                status
            });
        } catch (err: any) {
            this.actionError.set(err.message);
            throw err;
        } finally {
            this.actionLoading.set(false);
        }
    }
}
