import { TestBed } from '@angular/core/testing';
import { EventService } from './event.service';
import { provideMockStore } from '@ngrx/store/testing';
import { TransportToken } from '../providers/transport.token';
import { AuthService } from '../auth/auth.service';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { Timestamp } from '@bufbuild/protobuf';

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
  });
});
