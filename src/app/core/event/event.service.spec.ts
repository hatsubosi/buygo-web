import { TestBed } from '@angular/core/testing';
import { EventService } from './event.service';
import { provideMockStore } from '@ngrx/store/testing';
import { TransportToken } from '../providers/transport.token';
import { AuthService } from '../auth/auth.service';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('EventService', () => {
  let service: EventService;
  const mockTransport = {};
  const mockAuthService = {
    user: signal({ id: 'user1', name: 'Test User' }),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EventService,
        provideMockStore(),
        { provide: TransportToken, useValue: mockTransport },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    service = TestBed.inject(EventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Data Loading', () => {
    it('should load events and update signal', async () => {
      const mockEvents = [{ id: '1', title: 'Event 1' }];
      const clientSpy = vi
        .spyOn((service as any).client, 'listEvents')
        .mockResolvedValue({ events: mockEvents });

      await service.loadEvents();

      expect(clientSpy).toHaveBeenCalled();
      expect(service.events()).toEqual(mockEvents);
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('should load all event pages with nextPageToken', async () => {
      const clientSpy = vi
        .spyOn((service as any).client, 'listEvents')
        .mockResolvedValueOnce({ events: [{ id: '1', title: 'Event 1' }], nextPageToken: '100' })
        .mockResolvedValueOnce({ events: [{ id: '2', title: 'Event 2' }], nextPageToken: '' });

      await service.loadEvents();

      expect(clientSpy).toHaveBeenCalledTimes(2);
      expect(service.events().map((e: any) => e.id)).toEqual(['1', '2']);
    });

    it('should handle load events error', async () => {
      const errorMsg = 'Failed to load';
      vi.spyOn((service as any).client, 'listEvents').mockRejectedValue(new Error(errorMsg));

      await service.loadEvents();

      expect(service.events()).toEqual([]);
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBe(errorMsg);
    });

    it('should load single event', async () => {
      const mockEvent = { id: '1', title: 'Event 1' };
      const clientSpy = vi
        .spyOn((service as any).client, 'getEvent')
        .mockResolvedValue({ event: mockEvent });

      await service.loadEvent('1');

      expect(clientSpy).toHaveBeenCalledWith({ eventId: '1' });
      expect(service.currentEvent()).toEqual(mockEvent);
    });

    it('should load manager events across pages', async () => {
      const clientSpy = vi
        .spyOn((service as any).client, 'listManagerEvents')
        .mockResolvedValueOnce({
          events: [{ id: 'm1', title: 'Manager Event 1' }],
          nextPageToken: 'p2',
        })
        .mockResolvedValueOnce({
          events: [{ id: 'm2', title: 'Manager Event 2' }],
          nextPageToken: '',
        });

      await service.loadManagerEvents();

      expect(clientSpy).toHaveBeenCalledTimes(2);
      expect(service.managerEvents().map((e: any) => e.id)).toEqual(['m1', 'm2']);
      expect(service.error()).toBeNull();
    });
  });

  describe('Mutations', () => {
    it('should create event and update list', async () => {
      const mockEvent = { id: 'new', title: 'New Event', creator: { id: 'user1' } };
      const clientSpy = vi
        .spyOn((service as any).client, 'createEvent')
        .mockResolvedValue({ event: mockEvent });

      const startDate = new Date();
      const endDate = new Date();

      await service.createEvent('New Event', 'Desc', startDate, endDate);

      expect(clientSpy).toHaveBeenCalled();
      expect(service.events()).toContain(mockEvent);
      expect(service.actionLoading()).toBe(false);
    });

    it('should map createEvent items and discounts payload', async () => {
      const clientSpy = vi
        .spyOn((service as any).client, 'createEvent')
        .mockResolvedValue({ event: { id: 'mapped', title: 'Mapped Event' } });

      const startDate = new Date('2026-01-01T10:00:00.000Z');
      const endDate = new Date('2026-01-02T10:00:00.000Z');

      await service.createEvent(
        'Mapped Event',
        'Desc',
        startDate,
        endDate,
        [
          {
            name: 'Ticket A',
            price: 1200,
            minParticipants: 1,
            maxParticipants: 10,
            allowMultiple: true,
            startTime: '2026-01-01T10:00:00.000Z',
            endTime: '2026-01-01T12:00:00.000Z',
          },
          {
            name: 'Ticket B',
            price: 800,
            minParticipants: 1,
            maxParticipants: 5,
            allowMultiple: false,
          },
        ],
        [{ minQuantity: 2, minDistinctItems: 1, discountAmount: 100 }],
      );

      expect(clientSpy).toHaveBeenCalledTimes(1);
      const payload = clientSpy.mock.calls[0][0] as any;
      expect(payload.items).toHaveLength(2);
      expect(payload.items[0].startTime).toBeDefined();
      expect(payload.items[0].endTime).toBeDefined();
      expect(payload.items[1].startTime).toBeUndefined();
      expect(payload.items[1].endTime).toBeUndefined();
      expect(payload.discounts[0].discountAmount).toBe(BigInt(100));
    });

    it('should register for event', async () => {
      const clientSpy = vi.spyOn((service as any).client, 'registerEvent').mockResolvedValue({});

      await service.register('evt1', [], 'Contact', 'Notes');

      expect(clientSpy).toHaveBeenCalledWith({
        eventId: 'evt1',
        items: [],
        contactInfo: 'Contact',
        notes: 'Notes',
      });
    });

    it('should inject current user as creator when createEvent response has no creator', async () => {
      const clientSpy = vi
        .spyOn((service as any).client, 'createEvent')
        .mockResolvedValue({ event: { id: 'new2', title: 'No Creator Event' } });

      await service.createEvent('No Creator Event', 'Desc', new Date(), new Date());

      expect(clientSpy).toHaveBeenCalled();
      expect(service.events().at(-1)?.creator?.id).toBe('user1');
    });

    it('should set actionError and throw when createEvent fails', async () => {
      vi.spyOn((service as any).client, 'createEvent').mockRejectedValue(
        new Error('create failed'),
      );

      await expect(service.createEvent('title', 'desc', new Date(), new Date())).rejects.toThrow(
        'create failed',
      );

      expect(service.actionError()).toBe('create failed');
      expect(service.actionLoading()).toBe(false);
    });

    it('should reject register when quantity is not positive', async () => {
      const registerSpy = vi.spyOn((service as any).client, 'registerEvent');

      await expect(
        service.register('evt1', [{ itemId: 'item1', quantity: 0 } as any], 'Contact', 'Notes'),
      ).rejects.toThrow('Quantity must be positive');

      expect(registerSpy).not.toHaveBeenCalled();
      expect(service.error()).toBe('Quantity must be positive');
      expect(service.isLoading()).toBe(false);
    });

    it('should set error and throw when register API fails', async () => {
      vi.spyOn((service as any).client, 'registerEvent').mockRejectedValue(
        new Error('register failed'),
      );

      await expect(
        service.register('evt1', [{ itemId: 'item1', quantity: 1 } as any], 'Contact', 'Notes'),
      ).rejects.toThrow('register failed');

      expect(service.error()).toBe('register failed');
      expect(service.isLoading()).toBe(false);
    });

    it('should reject updateRegistration when quantity is not positive', async () => {
      const updateSpy = vi.spyOn((service as any).client, 'updateRegistration');

      await expect(
        service.updateRegistration(
          'reg1',
          [{ itemId: 'item1', quantity: 0 } as any],
          'Contact',
          'Notes',
        ),
      ).rejects.toThrow('Quantity must be positive');

      expect(updateSpy).not.toHaveBeenCalled();
      expect(service.error()).toBe('Quantity must be positive');
    });

    it('should update registration successfully', async () => {
      const updateSpy = vi
        .spyOn((service as any).client, 'updateRegistration')
        .mockResolvedValue({});

      await service.updateRegistration(
        'reg1',
        [{ eventItemId: 'item1', quantity: 1 } as any],
        'Contact',
        'Notes',
      );

      expect(updateSpy).toHaveBeenCalledWith({
        registrationId: 'reg1',
        items: [{ eventItemId: 'item1', quantity: 1 }],
        contactInfo: 'Contact',
        notes: 'Notes',
      });
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('should return my registrations', async () => {
      const registrations = [{ id: 'r1' }, { id: 'r2' }];
      vi.spyOn((service as any).client, 'getMyRegistrations').mockResolvedValue({ registrations });

      await expect(service.getMyRegistrations()).resolves.toEqual(registrations);
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('should throw and set error when getMyRegistrations fails', async () => {
      vi.spyOn((service as any).client, 'getMyRegistrations').mockRejectedValue(
        new Error('my-reg failed'),
      );

      await expect(service.getMyRegistrations()).rejects.toThrow('my-reg failed');
      expect(service.error()).toBe('my-reg failed');
      expect(service.isLoading()).toBe(false);
    });

    it('should set actionError and throw when cancelRegistration fails', async () => {
      vi.spyOn((service as any).client, 'cancelRegistration').mockRejectedValue(
        new Error('cancel failed'),
      );

      await expect(service.cancelRegistration('reg1')).rejects.toThrow('cancel failed');

      expect(service.actionError()).toBe('cancel failed');
      expect(service.actionLoading()).toBe(false);
    });

    it('should cancel registration successfully', async () => {
      const cancelSpy = vi
        .spyOn((service as any).client, 'cancelRegistration')
        .mockResolvedValue({});

      await service.cancelRegistration('reg1');

      expect(cancelSpy).toHaveBeenCalledWith({ registrationId: 'reg1' });
      expect(service.actionError()).toBeNull();
      expect(service.actionLoading()).toBe(false);
    });

    it('should set actionError and throw when updateRegistrationStatus fails', async () => {
      vi.spyOn((service as any).client, 'updateRegistrationStatus').mockRejectedValue(
        new Error('status failed'),
      );

      await expect(service.updateRegistrationStatus('reg1', 2, 3)).rejects.toThrow('status failed');

      expect(service.actionError()).toBe('status failed');
      expect(service.actionLoading()).toBe(false);
    });

    it('should update registration status successfully', async () => {
      const updateSpy = vi
        .spyOn((service as any).client, 'updateRegistrationStatus')
        .mockResolvedValue({});

      await service.updateRegistrationStatus('reg1', 2, 3);

      expect(updateSpy).toHaveBeenCalledWith({
        registrationId: 'reg1',
        status: 2,
        paymentStatus: 3,
      });
      expect(service.actionError()).toBeNull();
      expect(service.actionLoading()).toBe(false);
    });

    it('should update event status successfully', async () => {
      const updateSpy = vi
        .spyOn((service as any).client, 'updateEventStatus')
        .mockResolvedValue({});

      await service.updateEventStatus('evt1', 2);

      expect(updateSpy).toHaveBeenCalledWith({ eventId: 'evt1', status: 2 });
      expect(service.actionError()).toBeNull();
      expect(service.actionLoading()).toBe(false);
    });

    it('should list event registrations', async () => {
      const registrations = [{ id: 'r1' }];
      const listSpy = vi
        .spyOn((service as any).client, 'listEventRegistrations')
        .mockResolvedValue({ registrations });

      await expect(service.listEventRegistrations('evt1')).resolves.toEqual(registrations);
      expect(listSpy).toHaveBeenCalledWith({ eventId: 'evt1' });
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('should throw and set error when listing event registrations fails', async () => {
      vi.spyOn((service as any).client, 'listEventRegistrations').mockRejectedValue(
        new Error('list-reg failed'),
      );

      await expect(service.listEventRegistrations('evt1')).rejects.toThrow('list-reg failed');
      expect(service.error()).toBe('list-reg failed');
      expect(service.isLoading()).toBe(false);
    });

    it('should throw and set actionError when updateEvent fails', async () => {
      vi.spyOn((service as any).client, 'updateEvent').mockRejectedValue(
        new Error('update failed'),
      );

      await expect(
        service.updateEvent('evt1', {
          title: 'title',
          description: 'desc',
          location: 'location',
          startTime: new Date(),
          endTime: new Date(),
          coverImageUrl: '',
          allowModification: true,
          items: [],
          managerIds: [],
          discounts: [],
        }),
      ).rejects.toThrow('update failed');

      expect(service.actionError()).toBe('update failed');
      expect(service.actionLoading()).toBe(false);
    });

    it('should call updateEvent with mapped payload', async () => {
      const updateSpy = vi.spyOn((service as any).client, 'updateEvent').mockResolvedValue({});
      const now = new Date();

      await service.updateEvent('evt1', {
        title: 'title',
        description: 'desc',
        location: 'location',
        startTime: now.toISOString(),
        endTime: now.toISOString(),
        coverImageUrl: 'img',
        allowModification: false,
        items: [
          {
            id: 'item1',
            name: 'item',
            price: 100,
            minParticipants: 1,
            maxParticipants: 10,
            startTime: now.toISOString(),
            endTime: now.toISOString(),
            allowMultiple: true,
          },
        ],
        managerIds: ['u1'],
        discounts: [{ minQuantity: 2, minDistinctItems: 1, discountAmount: 10 }],
      });

      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(service.actionError()).toBeNull();
      expect(service.actionLoading()).toBe(false);
    });

    it('should set actionError and throw when updateEventStatus fails', async () => {
      vi.spyOn((service as any).client, 'updateEventStatus').mockRejectedValue(
        new Error('update-status failed'),
      );

      await expect(service.updateEventStatus('evt1', 2)).rejects.toThrow('update-status failed');
      expect(service.actionError()).toBe('update-status failed');
      expect(service.actionLoading()).toBe(false);
    });
  });
});
