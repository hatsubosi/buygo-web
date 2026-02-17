import { describe, expect, it } from 'vitest';

import { OrderItemStatus, PaymentStatus } from '../../core/api/api/v1/groupbuy_pb';
import {
  getOrderItemStatusLabel,
  getPaymentStatusLabel,
  getShippingStatusLabelFromItems,
} from './status-label.util';

describe('status-label util', () => {
  it('maps payment status to labels', () => {
    expect(getPaymentStatusLabel(PaymentStatus.CONFIRMED)).toBe('Paid');
    expect(getPaymentStatusLabel(PaymentStatus.SUBMITTED)).toBe('Submitted');
    expect(getPaymentStatusLabel(PaymentStatus.UNSET)).toBe('Unpaid');
    expect(getPaymentStatusLabel(PaymentStatus.REJECTED)).toBe('Rejected');
    expect(getPaymentStatusLabel(PaymentStatus.UNSPECIFIED)).toBe('Unknown');
  });

  it('maps order item status to labels', () => {
    expect(getOrderItemStatusLabel(OrderItemStatus.ITEM_STATUS_UNORDERED)).toBe('Unordered');
    expect(getOrderItemStatusLabel(OrderItemStatus.ITEM_STATUS_ORDERED)).toBe('Ordered');
    expect(getOrderItemStatusLabel(OrderItemStatus.ITEM_STATUS_ARRIVED_OVERSEAS)).toBe('Overseas');
    expect(getOrderItemStatusLabel(OrderItemStatus.ITEM_STATUS_ARRIVED_DOMESTIC)).toBe('Arrived');
    expect(getOrderItemStatusLabel(OrderItemStatus.ITEM_STATUS_READY_FOR_PICKUP)).toBe('Ready');
    expect(getOrderItemStatusLabel(OrderItemStatus.ITEM_STATUS_SENT)).toBe('Sent/Picked Up');
    expect(getOrderItemStatusLabel(OrderItemStatus.ITEM_STATUS_FAILED)).toBe('Cancelled');
    expect(getOrderItemStatusLabel(OrderItemStatus.ITEM_STATUS_UNSPECIFIED)).toBe('Pending');
  });

  it('maps shipping status by priority from order items', () => {
    expect(getShippingStatusLabelFromItems(undefined)).toBe('Empty');
    expect(getShippingStatusLabelFromItems([])).toBe('Empty');
    expect(getShippingStatusLabelFromItems([{ status: OrderItemStatus.ITEM_STATUS_SENT }])).toBe(
      'Shipped',
    );
    expect(
      getShippingStatusLabelFromItems([
        { status: OrderItemStatus.ITEM_STATUS_SENT },
        { status: OrderItemStatus.ITEM_STATUS_READY_FOR_PICKUP },
      ]),
    ).toBe('Ready to Ship');
    expect(
      getShippingStatusLabelFromItems([{ status: OrderItemStatus.ITEM_STATUS_ARRIVED_DOMESTIC }]),
    ).toBe('Arrived Domestic');
    expect(
      getShippingStatusLabelFromItems([{ status: OrderItemStatus.ITEM_STATUS_ARRIVED_OVERSEAS }]),
    ).toBe('Arrived Overseas');
    expect(getShippingStatusLabelFromItems([{ status: OrderItemStatus.ITEM_STATUS_ORDERED }])).toBe(
      'Ordered',
    );
    expect(
      getShippingStatusLabelFromItems([{ status: OrderItemStatus.ITEM_STATUS_UNORDERED }]),
    ).toBe('Unordered');
    expect(
      getShippingStatusLabelFromItems([{ status: OrderItemStatus.ITEM_STATUS_UNSPECIFIED }]),
    ).toBe('Processing');
  });
});
