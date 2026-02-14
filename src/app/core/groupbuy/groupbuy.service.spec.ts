import { TestBed } from '@angular/core/testing';
import { GroupBuyService } from './project.service';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { AuthService } from '../auth/auth.service';
import { TransportToken } from '../providers/transport.token';
import { GroupBuyActions } from './groupbuy.actions';
import { signal } from '@angular/core';
import { Product, ProductSpec, Project, Order } from '../api/api/v1/groupbuy_pb';
import { vi } from 'vitest';

describe('ProjectService', () => {
    let service: ProjectService;
    let store: MockStore;
    const mockAuthService = {
        user: signal(null)
    };
    const mockTransport = {};

    const initialState = {
        groupBuy: {
            groupBuys: [],
            currentProject: null,
            loading: false,
            detailLoading: false,
            myOrders: [],
            error: null
        }
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ProjectService,
                provideMockStore({ initialState }),
                { provide: AuthService, useValue: mockAuthService },
                { provide: TransportToken, useValue: mockTransport }
            ]
        });

        service = TestBed.inject(GroupBuyService);
        store = TestBed.inject(MockStore);
        vi.spyOn(store, 'dispatch');
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Cart Management', () => {
        const mockProduct = new Product({
            id: 'prod1',
            groupBuyId: 'proj1',
            name: 'Test Product',
            priceFinal: BigInt(100),
            maxQuantity: 10
        });

        const mockSpec = new ProductSpec({
            id: 'spec1',
            name: 'Size M'
        });

        it('should add item to cart', () => {
            service.addToCart(mockProduct, undefined, 2);

            const cart = service.cart();
            expect(cart.length).toBe(1);
            expect(cart[0].productId).toBe('prod1');
            expect(cart[0].quantity).toBe(2);
            expect(cart[0].price).toBe(100);
        });

        it('should increment quantity for existing item', () => {
            service.addToCart(mockProduct, undefined, 2);
            service.addToCart(mockProduct, undefined, 3);

            const cart = service.cart();
            expect(cart.length).toBe(1);
            expect(cart[0].quantity).toBe(5);
        });

        it('should separate items with different specs', () => {
            service.addToCart(mockProduct, undefined, 1);
            service.addToCart(mockProduct, mockSpec, 1);

            const cart = service.cart();
            expect(cart.length).toBe(2);
            expect(cart[0].specId).toBe('');
            expect(cart[1].specId).toBe('spec1');
        });

        it('should clear cart when adding item from different project', () => {
            service.addToCart(mockProduct, undefined, 1);

            const otherProjectProduct = new Product({
                id: 'prod2',
                groupBuyId: 'proj2',
                name: 'Other Product',
                priceFinal: BigInt(200)
            });

            service.addToCart(otherProjectProduct, undefined, 1);

            const cart = service.cart();
            expect(cart.length).toBe(1);
            expect(cart[0].projectId).toBe('proj2');
        });

        it('should remove item from cart', () => {
            service.addToCart(mockProduct, undefined, 1);
            service.removeFromCart('prod1', '');
            expect(service.cart().length).toBe(0);
        });

        it('should update cart quantity', () => {
            service.addToCart(mockProduct, undefined, 1);
            service.updateCartQuantity('prod1', '', 5);
            expect(service.cart()[0].quantity).toBe(5);
        });

        it('should calculate cart total correctly', () => {
            service.addToCart(mockProduct, undefined, 2); // 100 * 2 = 200
            expect(service.cartTotal()).toBe(200);

            service.addToCart(mockProduct, undefined, 1); // 200 + 100 = 300
            expect(service.cartTotal()).toBe(300);
        });
    });

    describe('Store Interactions', () => {
        it('should dispatch loadProjects action', () => {
            service.loadProjects();
            expect(store.dispatch).toHaveBeenCalledWith(GroupBuyActions.loadProjects());
        });

        it('should dispatch loadProjectDetail action', () => {
            service.loadProject('123');
            expect(store.dispatch).toHaveBeenCalledWith(GroupBuyActions.loadProjectDetail({ id: '123' }));
        });
    });

    describe('Order Logic', () => {
        it('should load existing order into cart', async () => {
            const mockOrder = new Order({
                id: 'order1',
                groupBuyId: 'proj1',
                items: [], // simplified for mock
                paymentStatus: 1
            });

            // Mock client response
            const clientSpy = vi.spyOn((service as any).client, 'getMyProjectOrder').mockResolvedValue({ order: mockOrder });

            await service.loadExistingOrderIntoCart('proj1');

            expect(service.myProjectOrder()).toEqual(mockOrder);
        });
    });

    describe('Cart Edge Cases', () => {
        const mockProduct = new Product({
            id: 'prod1',
            groupBuyId: 'proj1',
            name: 'Test Product',
            priceFinal: BigInt(100),
            maxQuantity: 10
        });

        it('should clear cart and reset loadedProjectCartId', () => {
            service.addToCart(mockProduct, undefined, 2);
            service.clearCart();
            expect(service.cart().length).toBe(0);
        });

        it('should calculate cart count correctly', () => {
            const spec1 = new ProductSpec({ id: 's1', name: 'S' });
            const spec2 = new ProductSpec({ id: 's2', name: 'M' });
            service.addToCart(mockProduct, spec1, 3);
            service.addToCart(mockProduct, spec2, 5);
            expect(service.cartCount()).toBe(8);
        });

        it('should load order items into editable cart via editSubmittedOrder', () => {
            const order = new Order({
                id: 'order1',
                groupBuyId: 'proj1',
                items: [
                    { productId: 'p1', specId: 's1', quantity: 2, productName: 'Prod', specName: 'Spec', price: BigInt(100) } as any
                ],
                paymentStatus: 1
            });
            service.myProjectOrder.set(order);
            service.editSubmittedOrder();
            const cart = service.cart();
            expect(cart.length).toBe(1);
            expect(cart[0].productId).toBe('p1');
            expect(cart[0].quantity).toBe(2);
        });
    });
});
