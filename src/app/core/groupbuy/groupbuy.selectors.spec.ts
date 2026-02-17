import { describe, it, expect } from 'vitest';
import {
    selectAllGroupBuys,
    selectGroupBuysLoading,
    selectGroupBuysError,
    selectCurrentGroupBuy,
    selectSelectedGroupBuyId,
    selectGroupBuyDetailLoading,
    selectCurrentGroupBuyProducts,
    selectCart,
    selectCartCount,
    selectCartTotal,
    selectIsSubmittingOrder,
    selectSubmitOrderError,
    selectLastCreatedOrderId,
    selectMyOrders,
    selectLoadingMyOrders,
    selectMyOrdersError,
    selectUpdatingOrder,
    selectUpdateOrderError,
    selectActionLoading,
    selectActionError,
} from './groupbuy.selectors';
import { GroupBuyState, adapter, initialState } from './groupbuy.reducer';
import { CartItem } from './groupbuy.actions';
import { GroupBuy, Product, Order } from '../api/api/v1/groupbuy_pb';

describe('GroupBuy Selectors', () => {
    // Helper: wrap GroupBuyState in the root state shape expected by the feature selector
    const wrapState = (partial: Partial<GroupBuyState> = {}): any => ({
        groupbuy: { ...initialState, ...partial },
    });

    const makeGroupBuy = (id: string, title = 'GB'): GroupBuy =>
        new GroupBuy({ id, title });

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

    // Build entity state from an array of GroupBuys using the adapter
    const withEntities = (...gbs: GroupBuy[]): Partial<GroupBuyState> => {
        return adapter.setAll(gbs, initialState);
    };

    // ---- List selectors ----
    describe('selectAllGroupBuys', () => {
        it('should return an empty array when no entities exist', () => {
            const result = selectAllGroupBuys(wrapState());
            expect(result).toEqual([]);
        });

        it('should return all group buys', () => {
            const state = wrapState(withEntities(makeGroupBuy('1'), makeGroupBuy('2')));
            const result = selectAllGroupBuys(state);
            expect(result.length).toBe(2);
        });
    });

    describe('selectGroupBuysLoading', () => {
        it('should return false by default', () => {
            expect(selectGroupBuysLoading(wrapState())).toBe(false);
        });

        it('should return true when loadingList is true', () => {
            expect(selectGroupBuysLoading(wrapState({ loadingList: true }))).toBe(true);
        });
    });

    describe('selectGroupBuysError', () => {
        it('should return null by default', () => {
            expect(selectGroupBuysError(wrapState())).toBeNull();
        });

        it('should return the error string', () => {
            expect(selectGroupBuysError(wrapState({ listError: 'fail' }))).toBe('fail');
        });
    });

    // ---- Detail selectors ----
    describe('selectCurrentGroupBuy', () => {
        it('should return null when no id is selected', () => {
            const state = wrapState(withEntities(makeGroupBuy('1')));
            expect(selectCurrentGroupBuy(state)).toBeNull();
        });

        it('should return null when selected id does not match any entity', () => {
            const state = wrapState({
                ...withEntities(makeGroupBuy('1')),
                selectedGroupBuyId: 'nonexistent',
            });
            expect(selectCurrentGroupBuy(state)).toBeNull();
        });

        it('should return the group buy matching selectedGroupBuyId', () => {
            const gb = makeGroupBuy('1', 'Target');
            const state = wrapState({
                ...withEntities(gb, makeGroupBuy('2')),
                selectedGroupBuyId: '1',
            });
            const result = selectCurrentGroupBuy(state);
            expect(result).toBeDefined();
            expect(result!.id).toBe('1');
            expect(result!.title).toBe('Target');
        });
    });

    describe('selectGroupBuyDetailLoading', () => {
        it('should return the loadingDetail flag', () => {
            expect(selectGroupBuyDetailLoading(wrapState({ loadingDetail: true }))).toBe(true);
            expect(selectGroupBuyDetailLoading(wrapState({ loadingDetail: false }))).toBe(false);
        });
    });

    describe('selectCurrentGroupBuyProducts', () => {
        it('should return current products', () => {
            const products = [new Product({ id: 'p1' }), new Product({ id: 'p2' })];
            expect(selectCurrentGroupBuyProducts(wrapState({ currentGroupBuyProducts: products }))).toEqual(products);
        });
    });

    // ---- Cart selectors ----
    describe('selectCart', () => {
        it('should return an empty array by default', () => {
            expect(selectCart(wrapState())).toEqual([]);
        });

        it('should return the cart items', () => {
            const items = [makeCartItem(), makeCartItem({ productId: 'p2' })];
            expect(selectCart(wrapState({ cart: items }))).toEqual(items);
        });
    });

    describe('selectCartCount', () => {
        it('should return 0 for empty cart', () => {
            expect(selectCartCount(wrapState())).toBe(0);
        });

        it('should sum quantities across all items', () => {
            const items = [
                makeCartItem({ quantity: 3 }),
                makeCartItem({ productId: 'p2', quantity: 5 }),
            ];
            expect(selectCartCount(wrapState({ cart: items }))).toBe(8);
        });

        it('should handle a single item', () => {
            expect(selectCartCount(wrapState({ cart: [makeCartItem({ quantity: 4 })] }))).toBe(4);
        });
    });

    describe('selectCartTotal', () => {
        it('should return 0 for empty cart', () => {
            expect(selectCartTotal(wrapState())).toBe(0);
        });

        it('should calculate price * quantity for each item and sum them', () => {
            const items = [
                makeCartItem({ price: 100, quantity: 2 }), // 200
                makeCartItem({ productId: 'p2', price: 50, quantity: 3 }), // 150
            ];
            expect(selectCartTotal(wrapState({ cart: items }))).toBe(350);
        });

        it('should handle single item total', () => {
            const items = [makeCartItem({ price: 250, quantity: 4 })];
            expect(selectCartTotal(wrapState({ cart: items }))).toBe(1000);
        });
    });

    // ---- Order selectors ----
    describe('selectIsSubmittingOrder', () => {
        it('should return the submittingOrder flag', () => {
            expect(selectIsSubmittingOrder(wrapState({ submittingOrder: true }))).toBe(true);
            expect(selectIsSubmittingOrder(wrapState({ submittingOrder: false }))).toBe(false);
        });
    });

    describe('selectSubmitOrderError', () => {
        it('should return null by default', () => {
            expect(selectSubmitOrderError(wrapState())).toBeNull();
        });

        it('should return the error', () => {
            expect(selectSubmitOrderError(wrapState({ submitOrderError: 'err' }))).toBe('err');
        });
    });

    describe('selectLastCreatedOrderId', () => {
        it('should return null by default', () => {
            expect(selectLastCreatedOrderId(wrapState())).toBeNull();
        });

        it('should return the order id', () => {
            expect(selectLastCreatedOrderId(wrapState({ lastCreatedOrderId: 'ord-1' }))).toBe('ord-1');
        });
    });

    // ---- My Orders selectors ----
    describe('selectMyOrders', () => {
        it('should return empty array by default', () => {
            expect(selectMyOrders(wrapState())).toEqual([]);
        });

        it('should return the orders list', () => {
            const orders = [new Order({ id: 'o1' }), new Order({ id: 'o2' })];
            expect(selectMyOrders(wrapState({ myOrders: orders }))).toEqual(orders);
        });
    });

    describe('selectLoadingMyOrders', () => {
        it('should return the loadingMyOrders flag', () => {
            expect(selectLoadingMyOrders(wrapState({ loadingMyOrders: true }))).toBe(true);
            expect(selectLoadingMyOrders(wrapState({ loadingMyOrders: false }))).toBe(false);
        });
    });

    describe('selectMyOrdersError', () => {
        it('should return null by default', () => {
            expect(selectMyOrdersError(wrapState())).toBeNull();
        });

        it('should return the error string', () => {
            expect(selectMyOrdersError(wrapState({ myOrdersError: 'no orders' }))).toBe('no orders');
        });
    });

    // ---- Updating order selectors ----
    describe('selectUpdatingOrder', () => {
        it('should return the updatingOrder flag', () => {
            expect(selectUpdatingOrder(wrapState({ updatingOrder: true }))).toBe(true);
        });
    });

    describe('selectUpdateOrderError', () => {
        it('should return null by default', () => {
            expect(selectUpdateOrderError(wrapState())).toBeNull();
        });

        it('should return the error string', () => {
            expect(selectUpdateOrderError(wrapState({ updateOrderError: 'upd err' }))).toBe('upd err');
        });
    });

    // ---- Action selectors ----
    describe('selectActionLoading', () => {
        it('should return the actionLoading flag', () => {
            expect(selectActionLoading(wrapState({ actionLoading: true }))).toBe(true);
            expect(selectActionLoading(wrapState({ actionLoading: false }))).toBe(false);
        });
    });

    describe('selectActionError', () => {
        it('should return null by default', () => {
            expect(selectActionError(wrapState())).toBeNull();
        });

        it('should return the error string', () => {
            expect(selectActionError(wrapState({ actionError: 'action err' }))).toBe('action err');
        });
    });
});
