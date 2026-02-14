import { Injectable, inject, signal } from '@angular/core';
import { createPromiseClient } from '@connectrpc/connect';
import { TransportToken } from '../providers/transport.token';
import { GroupBuyService as GroupBuyServiceDef } from '../api/api/v1/groupbuy_connect';
import { Order, PaymentStatus } from '../api/api/v1/groupbuy_pb';

@Injectable({ providedIn: 'root' })
export class ManagerService {
    private transport = inject(TransportToken);
    private client = createPromiseClient(GroupBuyServiceDef, this.transport);

    // State
    orders = signal<Order[]>([]);
    isLoading = signal<boolean>(false);
    error = signal<string | null>(null);

    async loadGroupBuyOrders(groupBuyId: string) {
        this.isLoading.set(true);
        this.error.set(null);
        try {
            const res = await this.client['listGroupBuyOrders']({ groupBuyId });
            this.orders.set(res.orders);
        } catch (err: any) {
            this.error.set(err.message || 'Failed to list orders');
            this.orders.set([]);
        } finally {
            this.isLoading.set(false);
        }
    }

    async confirmPayment(orderId: string) {
        // Optimistic update? Or reload. Reload is safer for now.
        // Actually, we can update local state.
        try {
            await this.client.confirmPayment({ orderId, status: PaymentStatus.CONFIRMED });

            // Update local state
            this.orders.update(orders => orders.map(o => {
                if (o.id === orderId) {
                    return new Order({ ...o, paymentStatus: PaymentStatus.CONFIRMED });
                }
                return o;
            }));
        } catch (err: any) {
            alert('Failed to confirm payment: ' + err.message);
        }
    }
    async batchUpdateStatus(groupBuyId: string, specId: string, targetStatus: number, count: number) {
        try {
            const res = await this.client['batchUpdateStatus']({
                groupBuyId,
                specId,
                targetStatus,
                count
            });
            // Update local state?
            // We likely need to reload the orders to reflect changes in the UI or complex matrix update
            // For now, let the component handle reloading.
            return res;
        } catch (err: any) {
            throw new Error(err.message || 'Failed to update status');
        }
    }
}
