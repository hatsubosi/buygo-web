import { Order, OrderItem, CreateOrderItem } from '../api/api/v1/groupbuy_pb';
import { CartItem } from './cart-item.model';

/**
 * Maps an Order's items to CartItem[] for local cart state.
 * maxQuantity defaults to 100 as a safe upper bound.
 */
export function orderToCartItems(order: Order, maxQuantity = 100): CartItem[] {
  return order.items.map((i: OrderItem) => ({
    groupBuyId: order.groupBuyId,
    productId: i.productId,
    specId: i.specId,
    quantity: i.quantity,
    productName: i.productName,
    specName: i.specName,
    price: Number(i.price),
    maxQuantity,
  }));
}

/**
 * Maps CartItem[] to CreateOrderItem[] for API submission.
 */
export function cartItemsToOrderItems(items: CartItem[]): CreateOrderItem[] {
  return items.map(
    (item) =>
      new CreateOrderItem({
        productId: item.productId,
        specId: item.specId,
        quantity: item.quantity,
      }),
  );
}
