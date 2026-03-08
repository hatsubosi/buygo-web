import { Injectable, inject, signal } from '@angular/core';
import { TransportToken } from '../providers/transport.token';
import { createPromiseClient } from '@connectrpc/connect';
import { Timestamp } from '@bufbuild/protobuf';
import { EventService as EventServiceDef } from '../api/api/v1/event_connect';
import { DiscountRule, Event, EventItem, RegisterItem } from '../api/api/v1/event_pb';
import { Transport } from '@connectrpc/connect';
import { AuthService } from '../auth/auth.service';
import { withLoading } from '../utils/with-loading';
import { paginateAll } from '../utils/paginate-all';

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
    await withLoading(this.isLoading, this.error, async () => {
      const all = await paginateAll(
        (pageToken) => this.client.listEvents({ pageSize: 100, pageToken }),
        (res) => res.events,
      );
      this.events.set(all);
    });
  }

  async loadManagerEvents() {
    await withLoading(this.isLoading, this.error, async () => {
      const all = await paginateAll(
        (pageToken) => this.client.listManagerEvents({ pageSize: 100, pageToken }),
        (res) => res.events,
      );
      this.managerEvents.set(all);
    });
  }

  async loadEvent(id: string) {
    await withLoading(this.isLoading, this.error, async () => {
      const res = await this.client.getEvent({ eventId: id });
      this.currentEvent.set(res.event || null);
    });
  }

  private authService = inject(AuthService);

  private toErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : 'Unknown error';
  }

  private mapEventItemInput(item: EventItemInput): EventItem {
    return new EventItem({
      id: item.id ?? '',
      name: item.name,
      price: BigInt(item.price),
      minParticipants: item.minParticipants,
      maxParticipants: item.maxParticipants,
      allowMultiple: item.allowMultiple,
      startTime: item.startTime ? Timestamp.fromDate(new Date(item.startTime)) : undefined,
      endTime: item.endTime ? Timestamp.fromDate(new Date(item.endTime)) : undefined,
    });
  }

  private mapDiscountInput(rule: DiscountRuleInput): DiscountRule {
    return new DiscountRule({
      minQuantity: rule.minQuantity,
      minDistinctItems: rule.minDistinctItems,
      discountAmount: BigInt(rule.discountAmount),
    });
  }

  async createEvent(
    title: string,
    description: string,
    start: Date,
    end: Date,
    items: EventItemInput[] = [],
    discounts: DiscountRuleInput[] = [],
  ) {
    this.actionLoading.set(true);
    this.actionError.set(null);
    try {
      const res = await this.client.createEvent({
        title,
        description,
        startTime: Timestamp.fromDate(start),
        endTime: Timestamp.fromDate(end),
        items: items.map((i) => this.mapEventItemInput(i)),
        discounts: discounts.map((d) => this.mapDiscountInput(d)),
      });

      const newEvent = res.event;
      if (!newEvent) {
        throw new Error('Create event response missing event');
      }
      // Manually populate creator if missing (backend might not return relation on create)
      const currentUser = this.authService.user();
      if (!newEvent.creator && currentUser) {
        newEvent.creator = currentUser;
      }

      // Optionally add to list immediately
      this.events.update((list) => [...list, newEvent]);
    } catch (err: unknown) {
      this.actionError.set(this.toErrorMessage(err));
      throw err;
    } finally {
      this.actionLoading.set(false);
    }
  }

  async register(eventId: string, items: RegisterItem[], contactInfo: string, notes: string) {
    if (items.some((i) => i.quantity <= 0)) {
      const err = new Error('Quantity must be positive');
      this.error.set(err.message);
      throw err;
    }
    await withLoading(
      this.isLoading,
      this.error,
      async () => {
        await this.client.registerEvent({ eventId, items, contactInfo, notes });
      },
      { rethrow: true },
    );
  }

  async updateRegistration(
    registrationId: string,
    items: RegisterItem[],
    contactInfo: string,
    notes: string,
  ) {
    if (items.some((i) => i.quantity <= 0)) {
      const err = new Error('Quantity must be positive');
      this.error.set(err.message);
      throw err;
    }
    await withLoading(
      this.isLoading,
      this.error,
      async () => {
        await this.client.updateRegistration({ registrationId, items, contactInfo, notes });
      },
      { rethrow: true },
    );
  }

  async getMyRegistrations() {
    return withLoading(
      this.isLoading,
      this.error,
      async () => {
        const res = await this.client.getMyRegistrations({});
        return res.registrations;
      },
      { rethrow: true },
    );
  }

  async cancelRegistration(registrationId: string) {
    this.actionLoading.set(true);
    this.actionError.set(null);
    try {
      await this.client.cancelRegistration({ registrationId });
    } catch (err: unknown) {
      this.actionError.set(this.toErrorMessage(err));
      throw err;
    } finally {
      this.actionLoading.set(false);
    }
  }

  async listEventRegistrations(eventId: string) {
    return withLoading(
      this.isLoading,
      this.error,
      async () => {
        const res = await this.client.listEventRegistrations({ eventId });
        return res.registrations;
      },
      { rethrow: true },
    );
  }

  async updateRegistrationStatus(registrationId: string, status: number, paymentStatus: number) {
    this.actionLoading.set(true);
    this.actionError.set(null);
    try {
      await this.client.updateRegistrationStatus({
        registrationId,
        status,
        paymentStatus,
      });
    } catch (err: unknown) {
      this.actionError.set(this.toErrorMessage(err));
      throw err;
    } finally {
      this.actionLoading.set(false);
    }
  }

  async updateEvent(id: string, eventData: EventUpdateInput) {
    this.actionLoading.set(true);
    this.actionError.set(null);
    try {
      await this.client.updateEvent({
        eventId: id,
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        startTime: Timestamp.fromDate(new Date(eventData.startTime)),
        endTime: Timestamp.fromDate(new Date(eventData.endTime)),
        coverImageUrl: eventData.coverImageUrl,
        allowModification: eventData.allowModification,
        items: eventData.items.map((i) => this.mapEventItemInput(i)),
        managerIds: eventData.managerIds,
        discounts: eventData.discounts?.map((d) => this.mapDiscountInput(d)) || [],
      });
    } catch (err: unknown) {
      this.actionError.set(this.toErrorMessage(err));
      throw err;
    } finally {
      this.actionLoading.set(false);
    }
  }
  async updateEventStatus(id: string, status: number) {
    this.actionLoading.set(true);
    this.actionError.set(null);
    try {
      await this.client.updateEventStatus({
        eventId: id,
        status,
      });
    } catch (err: unknown) {
      this.actionError.set(this.toErrorMessage(err));
      throw err;
    } finally {
      this.actionLoading.set(false);
    }
  }
}

type DateLike = Date | string;

interface EventItemInput {
  id?: string;
  name: string;
  price: bigint | number | string;
  minParticipants: number;
  maxParticipants: number;
  allowMultiple: boolean;
  startTime?: DateLike;
  endTime?: DateLike;
}

interface DiscountRuleInput {
  minQuantity: number;
  minDistinctItems: number;
  discountAmount: bigint | number | string;
}

interface EventUpdateInput {
  title: string;
  description: string;
  location: string;
  startTime: DateLike;
  endTime: DateLike;
  coverImageUrl: string;
  allowModification: boolean;
  items: EventItemInput[];
  managerIds: string[];
  discounts?: DiscountRuleInput[];
}
