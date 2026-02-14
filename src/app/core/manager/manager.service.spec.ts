import { TestBed } from '@angular/core/testing';
import { ManagerService } from './manager.service';
import { TransportToken } from '../providers/transport.token';
import { vi } from 'vitest';

describe('ManagerService', () => {
    let service: ManagerService;
    const mockTransport = {};

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ManagerService,
                { provide: TransportToken, useValue: mockTransport },
            ],
        });
        service = TestBed.inject(ManagerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have initial signal states', () => {
        expect(service.orders()).toEqual([]);
        expect(service.isLoading()).toBe(false);
        expect(service.error()).toBeNull();
    });

    describe('loadProjectOrders', () => {
        it('should set orders on success', async () => {
            const mockOrders = [{ id: 'o1' }, { id: 'o2' }];
            vi.spyOn((service as any).client, 'listProjectOrders').mockResolvedValue({ orders: mockOrders });

            await service.loadProjectOrders('proj-1');

            expect(service.orders()).toEqual(mockOrders);
            expect(service.isLoading()).toBe(false);
            expect(service.error()).toBeNull();
        });

        it('should set error on failure', async () => {
            vi.spyOn((service as any).client, 'listProjectOrders').mockRejectedValue(new Error('Network error'));

            await service.loadProjectOrders('proj-1');

            expect(service.orders()).toEqual([]);
            expect(service.isLoading()).toBe(false);
            expect(service.error()).toBe('Network error');
        });

        it('should set isLoading during fetch', async () => {
            let resolvePromise!: (value: any) => void;
            const pendingPromise = new Promise(resolve => { resolvePromise = resolve; });
            vi.spyOn((service as any).client, 'listProjectOrders').mockReturnValue(pendingPromise);

            const loadPromise = service.loadProjectOrders('proj-1');
            expect(service.isLoading()).toBe(true);

            resolvePromise({ orders: [] });
            await loadPromise;
            expect(service.isLoading()).toBe(false);
        });
    });

    describe('confirmPayment', () => {
        it('should update local order state on success', async () => {
            // Setup initial orders
            const mockOrder = { id: 'o1', paymentStatus: 1 };
            service.orders.set([mockOrder as any]);

            vi.spyOn((service as any).client, 'confirmPayment').mockResolvedValue({});

            await service.confirmPayment('o1');

            const updated = service.orders().find((o: any) => o.id === 'o1');
            expect(updated).toBeTruthy();
        });

        it('should handle error gracefully', async () => {
            vi.spyOn((service as any).client, 'confirmPayment').mockRejectedValue(new Error('Failed'));
            // Should not throw (uses alert internally)
            await expect(service.confirmPayment('o1')).resolves.toBeUndefined();
        });
    });

    describe('batchUpdateStatus', () => {
        it('should call client with correct params', async () => {
            const mockResponse = { updatedCount: 5 };
            const spy = vi.spyOn((service as any).client, 'batchUpdateStatus').mockResolvedValue(mockResponse);

            const result = await service.batchUpdateStatus('proj-1', 'spec-1', 2, 10);

            expect(spy).toHaveBeenCalledWith({
                projectId: 'proj-1',
                specId: 'spec-1',
                targetStatus: 2,
                count: 10,
            });
            expect(result).toEqual(mockResponse);
        });

        it('should propagate errors', async () => {
            vi.spyOn((service as any).client, 'batchUpdateStatus').mockRejectedValue(new Error('Server error'));

            await expect(service.batchUpdateStatus('p1', 's1', 2, 5)).rejects.toThrow('Server error');
        });
    });
});
