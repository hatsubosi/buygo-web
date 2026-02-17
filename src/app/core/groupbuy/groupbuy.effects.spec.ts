import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Observable, of, firstValueFrom } from 'rxjs';
import { Action } from '@ngrx/store';

import { GroupBuyEffects } from './groupbuy.effects';
import { GroupBuyActions } from './groupbuy.actions';
import { TransportToken } from '../providers/transport.token';
import { GroupBuy, Product, Order } from '../api/api/v1/groupbuy_pb';

describe('GroupBuyEffects', () => {
    let effects: GroupBuyEffects;
    let actions$: Observable<Action>;
    const mockTransport = {} as any;

    // The effects use createPromiseClient internally. We spy on the client methods
    // after TestBed creates the effects instance.
    const setupEffect = (actionStream: Observable<Action>) => {
        actions$ = actionStream;

        TestBed.configureTestingModule({
            providers: [
                GroupBuyEffects,
                provideMockActions(() => actions$),
                provideMockStore(),
                { provide: TransportToken, useValue: mockTransport },
            ],
        });

        effects = TestBed.inject(GroupBuyEffects);
    };

    // ---- loadGroupBuys$ ----
    describe('loadGroupBuys$', () => {
        it('should dispatch loadGroupBuysSuccess on success', async () => {
            const groupBuys = [new GroupBuy({ id: '1', title: 'GB1' })];
            setupEffect(of(GroupBuyActions.loadGroupBuys()));

            vi.spyOn((effects as any).client, 'listGroupBuys').mockResolvedValue({ groupBuys });

            const result = await firstValueFrom(effects.loadGroupBuys$);
            expect(result).toEqual(GroupBuyActions.loadGroupBuysSuccess({ groupBuys }));
        });

        it('should dispatch loadGroupBuysFailure on error', async () => {
            setupEffect(of(GroupBuyActions.loadGroupBuys()));

            vi.spyOn((effects as any).client, 'listGroupBuys').mockRejectedValue(new Error('Network error'));

            const result = await firstValueFrom(effects.loadGroupBuys$);
            expect(result).toEqual(GroupBuyActions.loadGroupBuysFailure({ error: 'Network error' }));
        });
    });

    // ---- loadGroupBuyDetail$ ----
    describe('loadGroupBuyDetail$', () => {
        it('should dispatch loadGroupBuyDetailSuccess with groupBuy and products', async () => {
            const groupBuy = new GroupBuy({ id: 'gb1', title: 'Detail' });
            const products = [new Product({ id: 'p1', name: 'Prod' })];
            setupEffect(of(GroupBuyActions.loadGroupBuyDetail({ id: 'gb1' })));

            vi.spyOn((effects as any).client, 'getGroupBuy').mockResolvedValue({ groupBuy, products });

            const result = await firstValueFrom(effects.loadGroupBuyDetail$);
            expect(result).toEqual(GroupBuyActions.loadGroupBuyDetailSuccess({ groupBuy, products }));
        });

        it('should dispatch loadGroupBuyDetailFailure when groupBuy is null', async () => {
            setupEffect(of(GroupBuyActions.loadGroupBuyDetail({ id: 'gb1' })));

            vi.spyOn((effects as any).client, 'getGroupBuy').mockResolvedValue({ groupBuy: null, products: [] });

            const result = await firstValueFrom(effects.loadGroupBuyDetail$);
            expect(result).toEqual(GroupBuyActions.loadGroupBuyDetailFailure({ error: 'Project not found' }));
        });

        it('should dispatch loadGroupBuyDetailFailure on network error', async () => {
            setupEffect(of(GroupBuyActions.loadGroupBuyDetail({ id: 'gb1' })));

            vi.spyOn((effects as any).client, 'getGroupBuy').mockRejectedValue(new Error('timeout'));

            const result = await firstValueFrom(effects.loadGroupBuyDetail$);
            expect(result).toEqual(GroupBuyActions.loadGroupBuyDetailFailure({ error: 'timeout' }));
        });
    });

    // ---- submitOrder$ ----
    describe('submitOrder$', () => {
        it('should dispatch submitOrderSuccess and send cart items to API', async () => {
            const items = [
                { groupBuyId: 'gb1', productId: 'p1', specId: 's1', quantity: 2, productName: '', specName: '', price: 100, maxQuantity: 10 },
            ];
            setupEffect(of(GroupBuyActions.submitOrder({
                groupBuyId: 'gb1', contactInfo: 'John', shippingAddress: '123 St', items,
            })));

            const createOrderSpy = vi.spyOn((effects as any).client, 'createOrder').mockResolvedValue({ orderId: 'ord-1' });

            const result = await firstValueFrom(effects.submitOrder$);
            expect(result).toEqual(GroupBuyActions.submitOrderSuccess({ orderId: 'ord-1' }));
            expect(createOrderSpy).toHaveBeenCalledWith(expect.objectContaining({
                groupBuyId: 'gb1',
                contactInfo: 'John',
                shippingAddress: '123 St',
            }));
            // Verify items were mapped to CreateOrderItem instances
            const callArgs = createOrderSpy.mock.calls[0][0] as any;
            expect(callArgs.items.length).toBe(1);
            expect(callArgs.items[0].productId).toBe('p1');
            expect(callArgs.items[0].specId).toBe('s1');
            expect(callArgs.items[0].quantity).toBe(2);
        });

        it('should dispatch submitOrderFailure on error', async () => {
            setupEffect(of(GroupBuyActions.submitOrder({
                groupBuyId: 'gb1', contactInfo: 'c', shippingAddress: 'a', items: [],
            })));

            vi.spyOn((effects as any).client, 'createOrder').mockRejectedValue(new Error('order failed'));

            const result = await firstValueFrom(effects.submitOrder$);
            expect(result).toEqual(GroupBuyActions.submitOrderFailure({ error: 'order failed' }));
        });
    });

    // ---- createGroupBuy$ ----
    describe('createGroupBuy$', () => {
        it('should dispatch createGroupBuySuccess on success', async () => {
            const groupBuy = new GroupBuy({ id: 'new1', title: 'New' });
            setupEffect(of(GroupBuyActions.createGroupBuy({ title: 'New', description: 'Desc' })));

            vi.spyOn((effects as any).client, 'createGroupBuy').mockResolvedValue({ groupBuy });

            const result = await firstValueFrom(effects.createGroupBuy$);
            expect(result).toEqual(GroupBuyActions.createGroupBuySuccess({ groupBuy }));
        });

        it('should dispatch createGroupBuyFailure when no groupBuy returned', async () => {
            setupEffect(of(GroupBuyActions.createGroupBuy({ title: 'T', description: 'D' })));

            vi.spyOn((effects as any).client, 'createGroupBuy').mockResolvedValue({ groupBuy: null });

            const result = await firstValueFrom(effects.createGroupBuy$);
            expect(result).toEqual(GroupBuyActions.createGroupBuyFailure({ error: 'No project returned' }));
        });

        it('should dispatch createGroupBuyFailure on error', async () => {
            setupEffect(of(GroupBuyActions.createGroupBuy({ title: 'T', description: 'D' })));

            vi.spyOn((effects as any).client, 'createGroupBuy').mockRejectedValue(new Error('create err'));

            const result = await firstValueFrom(effects.createGroupBuy$);
            expect(result).toEqual(GroupBuyActions.createGroupBuyFailure({ error: 'create err' }));
        });
    });

    // ---- updateGroupBuy$ ----
    describe('updateGroupBuy$', () => {
        it('should dispatch updateGroupBuySuccess on success', async () => {
            const groupBuy = new GroupBuy({ id: '1', title: 'Updated' });
            setupEffect(of(GroupBuyActions.updateGroupBuy({
                id: '1', title: 'Updated', description: 'D', status: 1,
                products: [], coverImage: '', shippingConfigs: [],
            })));

            vi.spyOn((effects as any).client, 'updateGroupBuy').mockResolvedValue({ groupBuy });

            const result = await firstValueFrom(effects.updateGroupBuy$);
            expect(result).toEqual(GroupBuyActions.updateGroupBuySuccess({ groupBuy }));
        });

        it('should dispatch updateGroupBuyFailure when no groupBuy returned', async () => {
            setupEffect(of(GroupBuyActions.updateGroupBuy({
                id: '1', title: 'T', description: 'D', status: 1,
                products: [], coverImage: '', shippingConfigs: [],
            })));

            vi.spyOn((effects as any).client, 'updateGroupBuy').mockResolvedValue({ groupBuy: null });

            const result = await firstValueFrom(effects.updateGroupBuy$);
            expect(result).toEqual(GroupBuyActions.updateGroupBuyFailure({ error: 'No project returned' }));
        });

        it('should dispatch updateGroupBuyFailure on error', async () => {
            setupEffect(of(GroupBuyActions.updateGroupBuy({
                id: '1', title: 'T', description: 'D', status: 1,
                products: [], coverImage: '', shippingConfigs: [],
            })));

            vi.spyOn((effects as any).client, 'updateGroupBuy').mockRejectedValue(new Error('update err'));

            const result = await firstValueFrom(effects.updateGroupBuy$);
            expect(result).toEqual(GroupBuyActions.updateGroupBuyFailure({ error: 'update err' }));
        });
    });

    // ---- addProduct$ ----
    describe('addProduct$', () => {
        it('should dispatch addProductSuccess on success', async () => {
            const product = new Product({ id: 'p1', name: 'New Prod' });
            setupEffect(of(GroupBuyActions.addProduct({
                groupBuyId: 'gb1', name: 'New Prod', priceOriginal: 1000,
                exchangeRate: 4.5, specs: ['S', 'M'],
            })));

            vi.spyOn((effects as any).client, 'addProduct').mockResolvedValue({ product });

            const result = await firstValueFrom(effects.addProduct$);
            expect(result).toEqual(GroupBuyActions.addProductSuccess({ product }));
        });

        it('should dispatch addProductFailure when no product returned', async () => {
            setupEffect(of(GroupBuyActions.addProduct({
                groupBuyId: 'gb1', name: 'P', priceOriginal: 100,
                exchangeRate: 1, specs: [],
            })));

            vi.spyOn((effects as any).client, 'addProduct').mockResolvedValue({ product: null });

            const result = await firstValueFrom(effects.addProduct$);
            expect(result).toEqual(GroupBuyActions.addProductFailure({ error: 'No product returned' }));
        });

        it('should dispatch addProductFailure on error', async () => {
            setupEffect(of(GroupBuyActions.addProduct({
                groupBuyId: 'gb1', name: 'P', priceOriginal: 100,
                exchangeRate: 1, specs: [],
            })));

            vi.spyOn((effects as any).client, 'addProduct').mockRejectedValue(new Error('add err'));

            const result = await firstValueFrom(effects.addProduct$);
            expect(result).toEqual(GroupBuyActions.addProductFailure({ error: 'add err' }));
        });
    });

    // ---- loadMyOrders$ ----
    describe('loadMyOrders$', () => {
        it('should dispatch loadMyOrdersSuccess on success', async () => {
            const orders = [new Order({ id: 'o1' }), new Order({ id: 'o2' })];
            setupEffect(of(GroupBuyActions.loadMyOrders()));

            vi.spyOn((effects as any).client, 'getMyOrders').mockResolvedValue({ orders });

            const result = await firstValueFrom(effects.loadMyOrders$);
            expect(result).toEqual(GroupBuyActions.loadMyOrdersSuccess({ orders }));
        });

        it('should dispatch loadMyOrdersFailure on error', async () => {
            setupEffect(of(GroupBuyActions.loadMyOrders()));

            vi.spyOn((effects as any).client, 'getMyOrders').mockRejectedValue(new Error('orders err'));

            const result = await firstValueFrom(effects.loadMyOrders$);
            expect(result).toEqual(GroupBuyActions.loadMyOrdersFailure({ error: 'orders err' }));
        });
    });

    // ---- updateUserOrder$ ----
    describe('updateUserOrder$', () => {
        it('should dispatch updateUserOrderSuccess on success', async () => {
            const order = new Order({ id: 'o1', groupBuyId: 'gb1' });
            const items = [
                { groupBuyId: 'gb1', productId: 'p1', specId: 's1', quantity: 3, productName: '', specName: '', price: 0, maxQuantity: 10 },
            ];
            setupEffect(of(GroupBuyActions.updateUserOrder({ orderId: 'o1', items, note: 'test note' })));

            const updateOrderSpy = vi.spyOn((effects as any).client, 'updateOrder').mockResolvedValue({ order });

            const result = await firstValueFrom(effects.updateUserOrder$);
            expect(result).toEqual(GroupBuyActions.updateUserOrderSuccess({ order }));
            // Verify the items and note were sent
            const callArgs = updateOrderSpy.mock.calls[0][0] as any;
            expect(callArgs.orderId).toBe('o1');
            expect(callArgs.note).toBe('test note');
            expect(callArgs.items.length).toBe(1);
            expect(callArgs.items[0].productId).toBe('p1');
            expect(callArgs.items[0].quantity).toBe(3);
        });

        it('should dispatch updateUserOrderFailure when no order returned', async () => {
            setupEffect(of(GroupBuyActions.updateUserOrder({ orderId: 'o1', items: [] })));

            vi.spyOn((effects as any).client, 'updateOrder').mockResolvedValue({ order: null });

            const result = await firstValueFrom(effects.updateUserOrder$);
            expect(result).toEqual(GroupBuyActions.updateUserOrderFailure({ error: 'No order returned' }));
        });

        it('should dispatch updateUserOrderFailure on error', async () => {
            setupEffect(of(GroupBuyActions.updateUserOrder({ orderId: 'o1', items: [] })));

            vi.spyOn((effects as any).client, 'updateOrder').mockRejectedValue(new Error('upd err'));

            const result = await firstValueFrom(effects.updateUserOrder$);
            expect(result).toEqual(GroupBuyActions.updateUserOrderFailure({ error: 'upd err' }));
        });
    });

    // ---- updatePaymentInfo$ ----
    describe('updatePaymentInfo$', () => {
        it('should dispatch updatePaymentInfoSuccess on success', async () => {
            const order = new Order({ id: 'o1' });
            setupEffect(of(GroupBuyActions.updatePaymentInfo({
                orderId: 'o1', method: 'bank_transfer', accountLast5: '12345',
            })));

            const spy = vi.spyOn((effects as any).client, 'updatePaymentInfo').mockResolvedValue({ order });

            const result = await firstValueFrom(effects.updatePaymentInfo$);
            expect(result).toEqual(GroupBuyActions.updatePaymentInfoSuccess({ order }));
            expect(spy).toHaveBeenCalledWith({
                orderId: 'o1',
                method: 'bank_transfer',
                accountLast5: '12345',
            });
        });

        it('should dispatch updatePaymentInfoFailure when no order returned', async () => {
            setupEffect(of(GroupBuyActions.updatePaymentInfo({
                orderId: 'o1', method: 'm', accountLast5: '00000',
            })));

            vi.spyOn((effects as any).client, 'updatePaymentInfo').mockResolvedValue({ order: null });

            const result = await firstValueFrom(effects.updatePaymentInfo$);
            expect(result).toEqual(GroupBuyActions.updatePaymentInfoFailure({ error: 'No order returned' }));
        });

        it('should dispatch updatePaymentInfoFailure on error', async () => {
            setupEffect(of(GroupBuyActions.updatePaymentInfo({
                orderId: 'o1', method: 'm', accountLast5: '00000',
            })));

            vi.spyOn((effects as any).client, 'updatePaymentInfo').mockRejectedValue(new Error('pay err'));

            const result = await firstValueFrom(effects.updatePaymentInfo$);
            expect(result).toEqual(GroupBuyActions.updatePaymentInfoFailure({ error: 'pay err' }));
        });
    });
});
