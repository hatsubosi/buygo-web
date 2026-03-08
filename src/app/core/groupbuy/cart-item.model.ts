/**
 * CartItem represents an item in the local shopping cart.
 * This interface is shared across the groupbuy feature.
 */
export interface CartItem {
  groupBuyId: string;
  productId: string;
  specId: string;
  quantity: number;
  productName: string;
  specName: string;
  price: number;
  maxQuantity: number;
}
