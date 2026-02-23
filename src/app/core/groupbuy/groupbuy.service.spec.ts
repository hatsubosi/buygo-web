import { TestBed } from '@angular/core/testing';
import { GroupBuyService } from './groupbuy.service';
import { AuthService } from '../auth/auth.service';
import { TransportToken } from '../providers/transport.token';
import { signal } from '@angular/core';
import { Product, ProductSpec, GroupBuy, Order, RoundingConfig, CreateOrderItem } from '../api/api/v1/groupbuy_pb';
import { vi } from 'vitest';

describe('GroupBuyService', () => {
  let service: GroupBuyService;
  const mockAuthService = {
    user: signal(null),
    isAuthenticated: () => true,
  };
  const mockTransport = {};

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GroupBuyService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: TransportToken, useValue: mockTransport },
      ],
    });
    service = TestBed.inject(GroupBuyService);
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
      maxQuantity: 10,
    });

    const mockSpec = new ProductSpec({
      id: 'spec1',
      name: 'Size M',
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
        priceFinal: BigInt(200),
      });

      service.addToCart(otherProjectProduct, undefined, 1);

      const cart = service.cart();
      expect(cart.length).toBe(1);
      expect(cart[0].groupBuyId).toBe('proj2');
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

  describe('GroupBuy API Calls', () => {
    it('should load all group buys and update signal', async () => {
      const clientSpy = vi
        .spyOn((service as any).client, 'listGroupBuys')
        .mockResolvedValueOnce({
          groupBuys: [new GroupBuy({ id: 'g1', title: 'G1' })],
          nextPageToken: '',
        });

      await service.loadGroupBuys();

      expect(clientSpy).toHaveBeenCalledTimes(1);
      expect(service.groupBuys().map((g) => g.id)).toEqual(['g1']);
      expect(service.isLoadingList()).toBe(false);
    });

    it('should set listError on load failure', async () => {
      vi.spyOn((service as any).client, 'listGroupBuys').mockRejectedValue(new Error('network'));

      await service.loadGroupBuys();

      expect(service.listError()).toBe('network');
      expect(service.isLoadingList()).toBe(false);
    });

    it('should load group buy detail and update signals', async () => {
      const mockGB = new GroupBuy({ id: 'g1', title: 'GB' });
      vi.spyOn((service as any).client, 'getGroupBuy').mockResolvedValue({
        groupBuy: mockGB,
        products: [],
      });

      await service.loadGroupBuy('g1');

      expect(service.currentGroupBuy()?.id).toBe('g1');
      expect(service.isLoadingDetail()).toBe(false);
    });

    it('should load all manager projects pages', async () => {
      const clientSpy = vi
        .spyOn((service as any).client, 'listManagerGroupBuys')
        .mockResolvedValueOnce({
          groupBuys: [new GroupBuy({ id: 'g1', title: 'G1' })],
          nextPageToken: '100',
        })
        .mockResolvedValueOnce({
          groupBuys: [new GroupBuy({ id: 'g2', title: 'G2' })],
          nextPageToken: '',
        });

      await service.loadManagerProjects();

      expect(clientSpy).toHaveBeenCalledTimes(2);
      expect(service.managerGroupBuys().map((g) => g.id)).toEqual(['g1', 'g2']);
    });

    it('should create group buy and update groupBuys signal', async () => {
      const mockGB = new GroupBuy({ id: 'gb1', title: 'New GB' });
      const clientSpy = vi
        .spyOn((service as any).client, 'createGroupBuy')
        .mockResolvedValue({ groupBuy: mockGB });

      const result = await service.createGroupBuy(
        'New GB', 'Desc', [], 'img.jpg', undefined, [], [], 5.0,
        new RoundingConfig({ method: 1, digit: 0 }), 'USD',
      );

      expect(clientSpy).toHaveBeenCalledTimes(1);
      expect(result?.id).toBe('gb1');
      expect(service.groupBuys().some((g) => g.id === 'gb1')).toBe(true);
      expect(service.isActionLoading()).toBe(false);
    });

    it('should set actionError when createGroupBuy fails', async () => {
      vi.spyOn((service as any).client, 'createGroupBuy').mockRejectedValue(new Error('fail'));

      const result = await service.createGroupBuy('t', 'd', [], '', undefined, [], [], 1, undefined, 'JPY');

      expect(result).toBeNull();
      expect(service.actionError()).toBe('fail');
    });

    it('should update group buy and refresh groupBuys signal', async () => {
      const mockGB = new GroupBuy({ id: 'gb1', title: 'Updated' });
      service.groupBuys.set([new GroupBuy({ id: 'gb1', title: 'Old' })]);
      vi.spyOn((service as any).client, 'updateGroupBuy').mockResolvedValue({ groupBuy: mockGB });

      await service.updateGroupBuy('gb1', 'Updated', 'desc', 2, [], 'cover', undefined, []);

      expect(service.groupBuys()[0].title).toBe('Updated');
    });

    it('should add product and update currentProducts signal', async () => {
      const mockProduct = new Product({ id: 'p1', name: 'Prod' });
      vi.spyOn((service as any).client, 'addProduct').mockResolvedValue({ product: mockProduct });

      await service.addProduct('gb1', 'Prod', 100, 0.23, ['L']);

      expect(service.currentProducts().some((p) => p.id === 'p1')).toBe(true);
    });
  });

  describe('Order Logic', () => {
    it('should load existing order into cart', async () => {
      const mockOrder = new Order({
        id: 'order1',
        groupBuyId: 'proj1',
        items: [],
        paymentStatus: 1,
      });

      const clientSpy = vi
        .spyOn((service as any).client, 'getMyGroupBuyOrder')
        .mockResolvedValue({ order: mockOrder });

      await service.loadExistingOrderIntoCart('proj1');

      expect(service.myGroupBuyOrder()).toEqual(mockOrder);
      expect(clientSpy).toHaveBeenCalledWith({ groupBuyId: 'proj1' });
    });

    it('should submit order by creating new order when no existing order id', async () => {
      const createOrderSpy = vi
        .spyOn((service as any).client, 'createOrder')
        .mockResolvedValue({ orderId: 'order-new' });
      const getMyOrderSpy = vi
        .spyOn((service as any).client, 'getMyGroupBuyOrder')
        .mockResolvedValue({ order: null });
      vi.spyOn((service as any).client, 'getMyOrders').mockResolvedValue({ orders: [] });

      await service.submitOrder('proj1', 'line:abc', 'addr', [
        {
          groupBuyId: 'proj1', productId: 'p1', specId: 's1', quantity: 2,
          productName: 'P1', specName: 'S1', price: 100, maxQuantity: 10
        },
      ]);

      expect(createOrderSpy).toHaveBeenCalledTimes(1);
      expect(getMyOrderSpy).toHaveBeenCalledWith({ groupBuyId: 'proj1' });
      expect(service.lastCreatedOrderId()).toBe('order-new');
      expect(service.submitOrderError()).toBeNull();
      expect(service.isSubmittingOrder()).toBe(false);
    });

    it('should submit order by updating existing order', async () => {
      service.existingOrderId.set('order-existing');
      const updateOrderSpy = vi
        .spyOn((service as any).client, 'updateOrder')
        .mockResolvedValue({ order: new Order({ id: 'order-existing' }) });
      const updatePaymentSpy = vi
        .spyOn((service as any).client, 'updatePaymentInfo')
        .mockResolvedValue({});
      vi.spyOn((service as any).client, 'getMyGroupBuyOrder').mockResolvedValue({ order: null });
      vi.spyOn((service as any).client, 'getMyOrders').mockResolvedValue({ orders: [] });
      const createOrderSpy = vi.spyOn((service as any).client, 'createOrder');

      await service.submitOrder('proj1', 'line:abc', 'addr', []);

      expect(createOrderSpy).not.toHaveBeenCalled();
      expect(updateOrderSpy).toHaveBeenCalledTimes(1);
      expect(updatePaymentSpy).toHaveBeenCalledWith({
        orderId: 'order-existing',
        contactInfo: 'line:abc',
        shippingAddress: 'addr',
      });
      expect(service.lastCreatedOrderId()).toBe('order-existing');
      expect(service.isSubmittingOrder()).toBe(false);
    });

    it('should set submitOrderError when submit order fails', async () => {
      vi.spyOn((service as any).client, 'createOrder').mockRejectedValue(new Error('submit failed'));

      await service.submitOrder('proj1', 'line:abc', 'addr', []);

      expect(service.submitOrderError()).toBe('submit failed');
      expect(service.isSubmittingOrder()).toBe(false);
    });

    it('should set existingOrderId to null when getMyGroupBuyOrder fails', async () => {
      service.existingOrderId.set('old-order');
      vi.spyOn((service as any).client, 'getMyGroupBuyOrder').mockRejectedValue(new Error('network'));

      const order = await service.getMyGroupBuyOrder('proj1');

      expect(order).toBeNull();
      expect(service.existingOrderId()).toBeNull();
    });
  });

  describe('Cart Edge Cases', () => {
    const mockProduct = new Product({
      id: 'prod1',
      groupBuyId: 'proj1',
      name: 'Test Product',
      priceFinal: BigInt(100),
      maxQuantity: 10,
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
          {
            productId: 'p1',
            specId: 's1',
            quantity: 2,
            productName: 'Prod',
            specName: 'Spec',
            price: BigInt(100),
          } as any,
        ],
        paymentStatus: 1,
      });
      service.myGroupBuyOrder.set(order);
      service.editSubmittedOrder();
      const cart = service.cart();
      expect(cart.length).toBe(1);
      expect(cart[0].productId).toBe('p1');
      expect(cart[0].quantity).toBe(2);
    });
  });

  describe('Client Wrappers', () => {
    it('should call updateOrder API', async () => {
      const items = [new CreateOrderItem({ productId: 'p1', specId: 's1', quantity: 1 })];
      const updateOrderSpy = vi.spyOn((service as any).client, 'updateOrder').mockResolvedValue({});

      await service.updateOrder('o1', items, 'note');

      expect(updateOrderSpy).toHaveBeenCalledWith({ orderId: 'o1', items, note: 'note' });
    });

    it('should rethrow friendly error when updateOrder fails', async () => {
      vi.spyOn((service as any).client, 'updateOrder').mockRejectedValue(new Error('x'));

      await expect(service.updateOrder('o1', [], 'note')).rejects.toThrow('x');
    });

    it('should call updatePaymentInfoAsync with paidAt and amount', async () => {
      const updatePaymentSpy = vi
        .spyOn((service as any).client, 'updatePaymentInfo')
        .mockResolvedValue({});
      const paidAt = new Date('2025-01-01T00:00:00.000Z');

      await service.updatePaymentInfoAsync('o1', 'bank', '12345', 'line', 'addr', paidAt, 300);

      expect(updatePaymentSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'o1',
          method: 'bank',
          accountLast5: '12345',
          contactInfo: 'line',
          shippingAddress: 'addr',
          amount: BigInt(300),
        }),
      );
    });

    it('should call category and template APIs', async () => {
      vi.spyOn((service as any).client, 'createCategory').mockResolvedValue({ category: { id: 'c1' } });
      vi.spyOn((service as any).client, 'listCategories').mockResolvedValue({ categories: [{ id: 'c1' }] });
      vi.spyOn((service as any).client, 'createPriceTemplate').mockResolvedValue({ template: { id: 't1' } });
      vi.spyOn((service as any).client, 'listPriceTemplates').mockResolvedValue({ templates: [{ id: 't1' }] });
      vi.spyOn((service as any).client, 'getPriceTemplate').mockResolvedValue({ template: { id: 't1' } });
      vi.spyOn((service as any).client, 'updatePriceTemplate').mockResolvedValue({ template: { id: 't1-updated' } });
      vi.spyOn((service as any).client, 'deletePriceTemplate').mockResolvedValue({});

      await expect(service.createCategory('cat', ['size'])).resolves.toEqual({ category: { id: 'c1' } });
      await expect(service.listCategories()).resolves.toEqual([{ id: 'c1' }]);
      await expect(service.createPriceTemplate('tpl', 'JPY', 0.23)).resolves.toEqual({ id: 't1' });
      await expect(service.listPriceTemplates()).resolves.toEqual([{ id: 't1' }]);
      await expect(service.getPriceTemplate('t1')).resolves.toEqual({ id: 't1' });
      await expect(service.updatePriceTemplate('t1', 'name')).resolves.toEqual({ id: 't1-updated' });
      await expect(service.deletePriceTemplate('t1')).resolves.toEqual({});
    });
  });
});
