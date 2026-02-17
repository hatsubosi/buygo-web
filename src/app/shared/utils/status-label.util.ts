import { OrderItemStatus, PaymentStatus } from '../../core/api/api/v1/groupbuy_pb';

export function getPaymentStatusLabel(status: number): string {
  switch (status) {
    case PaymentStatus.CONFIRMED:
      return 'Paid';
    case PaymentStatus.SUBMITTED:
      return 'Submitted';
    case PaymentStatus.UNSET:
      return 'Unpaid';
    case PaymentStatus.REJECTED:
      return 'Rejected';
    default:
      return 'Unknown';
  }
}

export function getOrderItemStatusLabel(status: number): string {
  switch (status) {
    case OrderItemStatus.ITEM_STATUS_UNORDERED:
      return 'Unordered';
    case OrderItemStatus.ITEM_STATUS_ORDERED:
      return 'Ordered';
    case OrderItemStatus.ITEM_STATUS_ARRIVED_OVERSEAS:
      return 'Overseas';
    case OrderItemStatus.ITEM_STATUS_ARRIVED_DOMESTIC:
      return 'Arrived';
    case OrderItemStatus.ITEM_STATUS_READY_FOR_PICKUP:
      return 'Ready';
    case OrderItemStatus.ITEM_STATUS_SENT:
      return 'Sent/Picked Up';
    case OrderItemStatus.ITEM_STATUS_FAILED:
      return 'Cancelled';
    default:
      return 'Pending';
  }
}

export function getShippingStatusLabelFromItems(
  items: Array<{ status: number }> | undefined,
): string {
  if (!items || items.length === 0) return 'Empty';
  if (items.every((item) => item.status === 6)) return 'Shipped';
  if (items.some((item) => item.status === 5)) return 'Ready to Ship';
  if (items.some((item) => item.status === 4)) return 'Arrived Domestic';
  if (items.some((item) => item.status === 3)) return 'Arrived Overseas';
  if (items.some((item) => item.status === 2)) return 'Ordered';
  if (items.some((item) => item.status === 1)) return 'Unordered';
  return 'Processing';
}
