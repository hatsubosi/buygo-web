import { describe, expect, it } from 'vitest';
import { Order, OrderItem, CreateOrderItem } from '../api/api/v1/groupbuy_pb';
import { CartItem } from './cart-item.model';
import { orderToCartItems, cartItemsToOrderItems } from './groupbuy.mapper';

describe('groupbuy mapper', () => {
  describe('orderToCartItems', () => {
    it('should map Order items to CartItem array', () => {
      const order = new Order({
        groupBuyId: 'gb1',
        items: [
          new OrderItem({
            productId: 'p1',
            specId: 's1',
            quantity: 3,
            productName: 'Product A',
            specName: 'Red',
            price: BigInt(1500),
          }),
          new OrderItem({
            productId: 'p2',
            specId: 's2',
            quantity: 1,
            productName: 'Product B',
            specName: 'Blue',
            price: BigInt(2500),
          }),
        ],
      });

      const result = orderToCartItems(order);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        groupBuyId: 'gb1',
        productId: 'p1',
        specId: 's1',
        quantity: 3,
        productName: 'Product A',
        specName: 'Red',
        price: 1500,
        maxQuantity: 100,
      });
      expect(result[1].productId).toBe('p2');
    });

    it('should use custom maxQuantity when provided', () => {
      const order = new Order({
        groupBuyId: 'gb1',
        items: [new OrderItem({ productId: 'p1', quantity: 1, price: BigInt(100) })],
      });

      const result = orderToCartItems(order, 50);

      expect(result[0].maxQuantity).toBe(50);
    });

    it('should return empty array for order with no items', () => {
      const order = new Order({ groupBuyId: 'gb1', items: [] });
      const result = orderToCartItems(order);
      expect(result).toEqual([]);
    });
  });

  describe('cartItemsToOrderItems', () => {
    it('should map CartItem array to CreateOrderItem array', () => {
      const items: CartItem[] = [
        {
          groupBuyId: 'gb1',
          productId: 'p1',
          specId: 's1',
          quantity: 2,
          productName: 'A',
          specName: 'Red',
          price: 100,
          maxQuantity: 10,
        },
        {
          groupBuyId: 'gb1',
          productId: 'p2',
          specId: 's2',
          quantity: 5,
          productName: 'B',
          specName: 'Blue',
          price: 200,
          maxQuantity: 20,
        },
      ];

      const result = cartItemsToOrderItems(items);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(CreateOrderItem);
      expect(result[0].productId).toBe('p1');
      expect(result[0].specId).toBe('s1');
      expect(result[0].quantity).toBe(2);
      expect(result[1].productId).toBe('p2');
      expect(result[1].quantity).toBe(5);
    });

    it('should return empty array for empty input', () => {
      const result = cartItemsToOrderItems([]);
      expect(result).toEqual([]);
    });
  });
});
