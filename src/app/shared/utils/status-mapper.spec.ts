import {
  toEventStatusLabel,
  toGroupBuyStatusLabel,
  toOrderItemStatusProgressLabel,
  toRegistrationStatusBadgeClass,
  toRegistrationStatusLabel,
} from './status-mapper';
import { EventStatus, RegistrationStatus } from '../../core/api/api/v1/event_pb';
import { GroupBuyStatus, OrderItemStatus } from '../../core/api/api/v1/groupbuy_pb';

describe('status-mapper', () => {
  it('maps groupbuy status labels', () => {
    expect(toGroupBuyStatusLabel(GroupBuyStatus.DRAFT)).toBe('Draft');
    expect(toGroupBuyStatusLabel(GroupBuyStatus.ACTIVE)).toBe('Active');
    expect(toGroupBuyStatusLabel(GroupBuyStatus.ENDED)).toBe('Ended');
    expect(toGroupBuyStatusLabel(GroupBuyStatus.ARCHIVED)).toBe('Archived');
    expect(toGroupBuyStatusLabel(99)).toBe('Unknown');
  });

  it('maps event status labels using proto enum order', () => {
    expect(toEventStatusLabel(EventStatus.DRAFT)).toBe('Draft');
    expect(toEventStatusLabel(EventStatus.ACTIVE)).toBe('Active');
    expect(toEventStatusLabel(EventStatus.ENDED)).toBe('Ended');
    expect(toEventStatusLabel(EventStatus.ARCHIVED)).toBe('Archived');
    expect(toEventStatusLabel(99)).toBe('Unknown');
  });

  it('maps registration status labels', () => {
    expect(toRegistrationStatusLabel(RegistrationStatus.PENDING)).toBe('Pending');
    expect(toRegistrationStatusLabel(RegistrationStatus.CONFIRMED)).toBe('Confirmed');
    expect(toRegistrationStatusLabel(RegistrationStatus.CANCELLED)).toBe('Cancelled');
    expect(toRegistrationStatusLabel(99)).toBe('Unknown');
  });

  it('maps registration status badge classes', () => {
    expect(toRegistrationStatusBadgeClass(RegistrationStatus.CONFIRMED)).toBe(
      'bg-green-500/10 text-green-400 border-green-500/20',
    );
    expect(toRegistrationStatusBadgeClass(RegistrationStatus.PENDING)).toBe(
      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    );
    expect(toRegistrationStatusBadgeClass(RegistrationStatus.CANCELLED)).toBe(
      'bg-red-500/10 text-red-400 border-red-500/20',
    );
    expect(toRegistrationStatusBadgeClass(99)).toBe(
      'bg-gray-500/10 text-gray-400 border-gray-500/20',
    );
  });

  it('maps order item progress labels', () => {
    expect(toOrderItemStatusProgressLabel(OrderItemStatus.ITEM_STATUS_UNORDERED)).toBe('Unordered');
    expect(toOrderItemStatusProgressLabel(OrderItemStatus.ITEM_STATUS_ORDERED)).toBe('Ordered');
    expect(toOrderItemStatusProgressLabel(OrderItemStatus.ITEM_STATUS_ARRIVED_OVERSEAS)).toBe(
      'Arrived Overseas',
    );
    expect(toOrderItemStatusProgressLabel(OrderItemStatus.ITEM_STATUS_ARRIVED_DOMESTIC)).toBe(
      'Arrived Domestic',
    );
    expect(toOrderItemStatusProgressLabel(OrderItemStatus.ITEM_STATUS_READY_FOR_PICKUP)).toBe(
      'Ready for Pickup',
    );
    expect(toOrderItemStatusProgressLabel(OrderItemStatus.ITEM_STATUS_SENT)).toBe('Sent');
    expect(toOrderItemStatusProgressLabel(OrderItemStatus.ITEM_STATUS_FAILED)).toBe(
      'Failed/Cancelled',
    );
    expect(toOrderItemStatusProgressLabel(99)).toBe('Unknown');
  });
});
