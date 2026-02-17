import { describe, it, expect } from 'vitest';
import { groupBuyReducer, initialState, GroupBuyState, adapter } from './groupbuy.reducer';
import { GroupBuyActions, CartItem } from './groupbuy.actions';
import { GroupBuy, Product, Order } from '../api/api/v1/groupbuy_pb';

describe('GroupBuy Reducer', () => {
    // ---- Helpers ----
    const makeGroupBuy = (id: string, title = 'GB'): GroupBuy =>
        new GroupBuy({ id, title });

    const makeProduct = (id: string, name = 'Prod'): Product =>
        new Product({ id, name });

    const makeOrder = (id: string, groupBuyId = 'gb1'): Order =>
        new Order({ id, groupBuyId });

    const makeCartItem = (overrides: Partial<CartItem> = {}): CartItem => ({
        groupBuyId: 'gb1',
        productId: 'p1',
        specId: 's1',
        quantity: 1,
        productName: 'Product 1',
        specName: 'Spec 1',
        price: 100,
        maxQuantity: 10,
        ...overrides,
    });

    // ---- Initial state ----
    describe('initialState', () => {
        it('should return the initial state for an unknown action', () => {
            const action = { type: 'UNKNOWN' } as any;
            const state = groupBuyReducer(undefined, action);
            expect(state).toBe(initialState);
        });

        it('should have correct default values', () => {
            expect(initialState.loadingList).toBe(false);
            expect(initialState.listError).toBeNull();
            expect(initialState.selectedGroupBuyId).toBeNull();
            expect(initialState.currentGroupBuyProducts).toEqual([]);
            expect(initialState.cart).toEqual([]);
            expect(initialState.submittingOrder).toBe(false);
            expect(initialState.myOrders).toEqual([]);
            expect(initialState.actionLoading).toBe(false);
        });
    });

    // ---- Load GroupBuys (List) ----
    describe('Load GroupBuys', () => {
        it('loadGroupBuys should set loadingList to true and clear listError', () => {
            const prev: GroupBuyState = { ...initialState, loadingList: false, listError: 'old error' };
            const state = groupBuyReducer(prev, GroupBuyActions.loadGroupBuys());
            expect(state.loadingList).toBe(true);
            expect(state.listError).toBeNull();
        });

        it('loadGroupBuysSuccess should set all entities and stop loading', () => {
            const gbs = [makeGroupBuy('1', 'A'), makeGroupBuy('2', 'B')];
            const prev: GroupBuyState = { ...initialState, loadingList: true };
            const state = groupBuyReducer(prev, GroupBuyActions.loadGroupBuysSuccess({ groupBuys: gbs }));

            expect(state.loadingList).toBe(false);
            expect(state.ids.length).toBe(2);
            expect(state.entities['1']).toBeDefined();
            expect(state.entities['2']).toBeDefined();
        });

        it('loadGroupBuysFailure should set listError and stop loading', () => {
            const prev: GroupBuyState = { ...initialState, loadingList: true };
            const state = groupBuyReducer(prev, GroupBuyActions.loadGroupBuysFailure({ error: 'fail' }));

            expect(state.loadingList).toBe(false);
            expect(state.listError).toBe('fail');
        });
    });

    // ---- Load GroupBuy Detail ----
    describe('Load GroupBuy Detail', () => {
        it('loadGroupBuyDetail should set selectedGroupBuyId, start loading, clear products', () => {
            const prev: GroupBuyState = {
                ...initialState,
                currentGroupBuyProducts: [makeProduct('old')],
            };
            const state = groupBuyReducer(prev, GroupBuyActions.loadGroupBuyDetail({ id: 'gb1' }));

            expect(state.selectedGroupBuyId).toBe('gb1');
            expect(state.loadingDetail).toBe(true);
            expect(state.detailError).toBeNull();
            expect(state.currentGroupBuyProducts).toEqual([]);
        });

        it('loadGroupBuyDetailSuccess should upsert groupBuy and set products', () => {
            const gb = makeGroupBuy('gb1', 'Detail');
            const products = [makeProduct('p1'), makeProduct('p2')];
            const prev: GroupBuyState = { ...initialState, loadingDetail: true };
            const state = groupBuyReducer(
                prev,
                GroupBuyActions.loadGroupBuyDetailSuccess({ groupBuy: gb, products }),
            );

            expect(state.loadingDetail).toBe(false);
            expect(state.entities['gb1']).toBeDefined();
            expect(state.currentGroupBuyProducts).toEqual(products);
        });

        it('loadGroupBuyDetailFailure should set detailError and stop loading', () => {
            const prev: GroupBuyState = { ...initialState, loadingDetail: true };
            const state = groupBuyReducer(
                prev,
                GroupBuyActions.loadGroupBuyDetailFailure({ error: 'not found' }),
            );

            expect(state.loadingDetail).toBe(false);
            expect(state.detailError).toBe('not found');
        });
    });

    // ---- Create GroupBuy ----
    describe('Create GroupBuy', () => {
        it('createGroupBuy should set actionLoading true and clear actionError', () => {
            const state = groupBuyReducer(
                { ...initialState, actionError: 'old' },
                GroupBuyActions.createGroupBuy({ title: 'T', description: 'D' }),
            );
            expect(state.actionLoading).toBe(true);
            expect(state.actionError).toBeNull();
        });

        it('createGroupBuySuccess should add entity and stop actionLoading', () => {
            const gb = makeGroupBuy('new1', 'New');
            const prev: GroupBuyState = { ...initialState, actionLoading: true };
            const state = groupBuyReducer(prev, GroupBuyActions.createGroupBuySuccess({ groupBuy: gb }));

            expect(state.actionLoading).toBe(false);
            expect(state.ids).toContain('new1');
            expect(state.entities['new1']).toBeDefined();
        });

        it('createGroupBuyFailure should set actionError and stop actionLoading', () => {
            const prev: GroupBuyState = { ...initialState, actionLoading: true };
            const state = groupBuyReducer(prev, GroupBuyActions.createGroupBuyFailure({ error: 'create failed' }));

            expect(state.actionLoading).toBe(false);
            expect(state.actionError).toBe('create failed');
        });
    });

    // ---- Update GroupBuy ----
    describe('Update GroupBuy', () => {
        it('updateGroupBuy should set actionLoading true and clear actionError', () => {
            const state = groupBuyReducer(
                initialState,
                GroupBuyActions.updateGroupBuy({
                    id: '1', title: 'T', description: 'D', status: 1,
                    products: [], coverImage: '', shippingConfigs: [],
                }),
            );
            expect(state.actionLoading).toBe(true);
            expect(state.actionError).toBeNull();
        });

        it('updateGroupBuySuccess should upsert entity and stop actionLoading', () => {
            const gb = makeGroupBuy('1', 'Updated');
            // Pre-populate entity
            const prev = adapter.addOne(makeGroupBuy('1', 'Old'), { ...initialState, actionLoading: true });
            const state = groupBuyReducer(prev, GroupBuyActions.updateGroupBuySuccess({ groupBuy: gb }));

            expect(state.actionLoading).toBe(false);
            expect(state.entities['1']!.title).toBe('Updated');
        });

        it('updateGroupBuyFailure should set actionError and stop actionLoading', () => {
            const prev: GroupBuyState = { ...initialState, actionLoading: true };
            const state = groupBuyReducer(prev, GroupBuyActions.updateGroupBuyFailure({ error: 'update failed' }));

            expect(state.actionLoading).toBe(false);
            expect(state.actionError).toBe('update failed');
        });
    });

    // ---- Add Product ----
    describe('Add Product', () => {
        it('addProduct should set actionLoading true and clear actionError', () => {
            const state = groupBuyReducer(
                initialState,
                GroupBuyActions.addProduct({
                    groupBuyId: 'gb1', name: 'P', priceOriginal: 100,
                    exchangeRate: 1, specs: [],
                }),
            );
            expect(state.actionLoading).toBe(true);
            expect(state.actionError).toBeNull();
        });

        it('addProductSuccess should append product to currentGroupBuyProducts', () => {
            const existing = makeProduct('p1');
            const newProd = makeProduct('p2', 'New Prod');
            const prev: GroupBuyState = {
                ...initialState,
                actionLoading: true,
                currentGroupBuyProducts: [existing],
            };
            const state = groupBuyReducer(prev, GroupBuyActions.addProductSuccess({ product: newProd }));

            expect(state.actionLoading).toBe(false);
            expect(state.currentGroupBuyProducts.length).toBe(2);
            expect(state.currentGroupBuyProducts[1].id).toBe('p2');
        });

        it('addProductFailure should set actionError and stop actionLoading', () => {
            const prev: GroupBuyState = { ...initialState, actionLoading: true };
            const state = groupBuyReducer(prev, GroupBuyActions.addProductFailure({ error: 'prod error' }));

            expect(state.actionLoading).toBe(false);
            expect(state.actionError).toBe('prod error');
        });
    });

    // ---- Cart ----
    describe('Cart', () => {
        it('addToCart should add a new item to the cart', () => {
            const item = makeCartItem();
            const state = groupBuyReducer(initialState, GroupBuyActions.addToCart({ item }));

            expect(state.cart.length).toBe(1);
            expect(state.cart[0]).toEqual(item);
        });

        it('addToCart should increment quantity for existing item with same productId and specId', () => {
            const item = makeCartItem({ quantity: 2 });
            const prev: GroupBuyState = { ...initialState, cart: [item] };
            const addAgain = makeCartItem({ quantity: 3 });
            const state = groupBuyReducer(prev, GroupBuyActions.addToCart({ item: addAgain }));

            expect(state.cart.length).toBe(1);
            expect(state.cart[0].quantity).toBe(5);
        });

        it('addToCart should add separate items when specId differs', () => {
            const item1 = makeCartItem({ specId: 'spec-a' });
            const prev: GroupBuyState = { ...initialState, cart: [item1] };
            const item2 = makeCartItem({ specId: 'spec-b' });
            const state = groupBuyReducer(prev, GroupBuyActions.addToCart({ item: item2 }));

            expect(state.cart.length).toBe(2);
        });

        it('addToCart should add separate items when productId differs', () => {
            const item1 = makeCartItem({ productId: 'pa' });
            const prev: GroupBuyState = { ...initialState, cart: [item1] };
            const item2 = makeCartItem({ productId: 'pb' });
            const state = groupBuyReducer(prev, GroupBuyActions.addToCart({ item: item2 }));

            expect(state.cart.length).toBe(2);
        });

        it('removeFromCart should remove item by productId and specId', () => {
            const item = makeCartItem({ productId: 'p1', specId: 's1' });
            const prev: GroupBuyState = { ...initialState, cart: [item] };
            const state = groupBuyReducer(prev, GroupBuyActions.removeFromCart({ productId: 'p1', specId: 's1' }));

            expect(state.cart.length).toBe(0);
        });

        it('removeFromCart should leave other items untouched', () => {
            const item1 = makeCartItem({ productId: 'p1', specId: 's1' });
            const item2 = makeCartItem({ productId: 'p2', specId: 's2' });
            const prev: GroupBuyState = { ...initialState, cart: [item1, item2] };
            const state = groupBuyReducer(prev, GroupBuyActions.removeFromCart({ productId: 'p1', specId: 's1' }));

            expect(state.cart.length).toBe(1);
            expect(state.cart[0].productId).toBe('p2');
        });

        it('updateCartQuantity should update the quantity for matching item', () => {
            const item = makeCartItem({ productId: 'p1', specId: 's1', quantity: 2 });
            const prev: GroupBuyState = { ...initialState, cart: [item] };
            const state = groupBuyReducer(
                prev,
                GroupBuyActions.updateCartQuantity({ productId: 'p1', specId: 's1', quantity: 7 }),
            );

            expect(state.cart[0].quantity).toBe(7);
        });

        it('updateCartQuantity should not affect non-matching items', () => {
            const item1 = makeCartItem({ productId: 'p1', specId: 's1', quantity: 2 });
            const item2 = makeCartItem({ productId: 'p2', specId: 's2', quantity: 3 });
            const prev: GroupBuyState = { ...initialState, cart: [item1, item2] };
            const state = groupBuyReducer(
                prev,
                GroupBuyActions.updateCartQuantity({ productId: 'p1', specId: 's1', quantity: 10 }),
            );

            expect(state.cart[0].quantity).toBe(10);
            expect(state.cart[1].quantity).toBe(3);
        });

        it('clearCart should empty the cart', () => {
            const prev: GroupBuyState = {
                ...initialState,
                cart: [makeCartItem(), makeCartItem({ productId: 'p2' })],
            };
            const state = groupBuyReducer(prev, GroupBuyActions.clearCart());
            expect(state.cart).toEqual([]);
        });
    });

    // ---- Submit Order ----
    describe('Submit Order', () => {
        it('submitOrder should set submittingOrder true, clear errors and lastCreatedOrderId', () => {
            const prev: GroupBuyState = {
                ...initialState,
                submitOrderError: 'old',
                lastCreatedOrderId: 'old-order',
            };
            const state = groupBuyReducer(
                prev,
                GroupBuyActions.submitOrder({
                    groupBuyId: 'gb1', contactInfo: 'c', shippingAddress: 'a', items: [],
                }),
            );
            expect(state.submittingOrder).toBe(true);
            expect(state.submitOrderError).toBeNull();
            expect(state.lastCreatedOrderId).toBeNull();
        });

        it('submitOrderSuccess should stop submitting, clear cart, and set lastCreatedOrderId', () => {
            const prev: GroupBuyState = {
                ...initialState,
                submittingOrder: true,
                cart: [makeCartItem()],
            };
            const state = groupBuyReducer(prev, GroupBuyActions.submitOrderSuccess({ orderId: 'order-1' }));

            expect(state.submittingOrder).toBe(false);
            expect(state.cart).toEqual([]);
            expect(state.lastCreatedOrderId).toBe('order-1');
        });

        it('submitOrderFailure should stop submitting and set error', () => {
            const prev: GroupBuyState = { ...initialState, submittingOrder: true };
            const state = groupBuyReducer(prev, GroupBuyActions.submitOrderFailure({ error: 'order error' }));

            expect(state.submittingOrder).toBe(false);
            expect(state.submitOrderError).toBe('order error');
        });
    });

    // ---- My Orders ----
    describe('Load My Orders', () => {
        it('loadMyOrders should set loadingMyOrders true and clear error', () => {
            const prev: GroupBuyState = { ...initialState, myOrdersError: 'old' };
            const state = groupBuyReducer(prev, GroupBuyActions.loadMyOrders());

            expect(state.loadingMyOrders).toBe(true);
            expect(state.myOrdersError).toBeNull();
        });

        it('loadMyOrdersSuccess should set myOrders and stop loading', () => {
            const orders = [makeOrder('o1'), makeOrder('o2')];
            const prev: GroupBuyState = { ...initialState, loadingMyOrders: true };
            const state = groupBuyReducer(prev, GroupBuyActions.loadMyOrdersSuccess({ orders }));

            expect(state.loadingMyOrders).toBe(false);
            expect(state.myOrders).toEqual(orders);
        });

        it('loadMyOrdersFailure should set error and stop loading', () => {
            const prev: GroupBuyState = { ...initialState, loadingMyOrders: true };
            const state = groupBuyReducer(prev, GroupBuyActions.loadMyOrdersFailure({ error: 'orders fail' }));

            expect(state.loadingMyOrders).toBe(false);
            expect(state.myOrdersError).toBe('orders fail');
        });
    });

    // ---- Update User Order ----
    describe('Update User Order', () => {
        it('updateUserOrder should set updatingOrder true and clear error', () => {
            const state = groupBuyReducer(
                { ...initialState, updateOrderError: 'old' },
                GroupBuyActions.updateUserOrder({ orderId: 'o1', items: [] }),
            );
            expect(state.updatingOrder).toBe(true);
            expect(state.updateOrderError).toBeNull();
        });

        it('updateUserOrderSuccess should update the order in myOrders list', () => {
            const original = makeOrder('o1', 'gb1');
            const updated = new Order({ id: 'o1', groupBuyId: 'gb1', note: 'updated' });
            const prev: GroupBuyState = {
                ...initialState,
                updatingOrder: true,
                myOrders: [original, makeOrder('o2')],
            };
            const state = groupBuyReducer(prev, GroupBuyActions.updateUserOrderSuccess({ order: updated }));

            expect(state.updatingOrder).toBe(false);
            expect(state.myOrders.length).toBe(2);
            expect(state.myOrders[0]).toBe(updated);
            expect(state.myOrders[1].id).toBe('o2');
        });

        it('updateUserOrderFailure should set error and stop updating', () => {
            const prev: GroupBuyState = { ...initialState, updatingOrder: true };
            const state = groupBuyReducer(prev, GroupBuyActions.updateUserOrderFailure({ error: 'update fail' }));

            expect(state.updatingOrder).toBe(false);
            expect(state.updateOrderError).toBe('update fail');
        });
    });

    // ---- Update Payment Info ----
    describe('Update Payment Info', () => {
        it('updatePaymentInfo should set updatingOrder true and clear error', () => {
            const state = groupBuyReducer(
                { ...initialState, updateOrderError: 'old' },
                GroupBuyActions.updatePaymentInfo({ orderId: 'o1', method: 'bank', accountLast5: '12345' }),
            );
            expect(state.updatingOrder).toBe(true);
            expect(state.updateOrderError).toBeNull();
        });

        it('updatePaymentInfoSuccess should update the order in myOrders list', () => {
            const original = makeOrder('o1');
            const updated = new Order({ id: 'o1', groupBuyId: 'gb1' });
            const prev: GroupBuyState = {
                ...initialState,
                updatingOrder: true,
                myOrders: [original],
            };
            const state = groupBuyReducer(prev, GroupBuyActions.updatePaymentInfoSuccess({ order: updated }));

            expect(state.updatingOrder).toBe(false);
            expect(state.myOrders[0]).toBe(updated);
        });

        it('updatePaymentInfoFailure should set error and stop updating', () => {
            const prev: GroupBuyState = { ...initialState, updatingOrder: true };
            const state = groupBuyReducer(prev, GroupBuyActions.updatePaymentInfoFailure({ error: 'pay fail' }));

            expect(state.updatingOrder).toBe(false);
            expect(state.updateOrderError).toBe('pay fail');
        });
    });
});
