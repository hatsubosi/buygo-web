import { GroupBuyStatus } from '../../core/api/api/v1/groupbuy_pb';
import { EventStatus, RegistrationStatus } from '../../core/api/api/v1/event_pb';
import { OrderItemStatus } from '../../core/api/api/v1/groupbuy_pb';

export function toGroupBuyStatusLabel(status: number): string {
  switch (status) {
    case GroupBuyStatus.DRAFT:
      return 'Draft';
    case GroupBuyStatus.ACTIVE:
      return 'Active';
    case GroupBuyStatus.ENDED:
      return 'Ended';
    case GroupBuyStatus.ARCHIVED:
      return 'Archived';
    default:
      return 'Unknown';
  }
}

export function toEventStatusLabel(status: number): string {
  switch (status) {
    case EventStatus.DRAFT:
      return 'Draft';
    case EventStatus.ACTIVE:
      return 'Active';
    case EventStatus.ENDED:
      return 'Ended';
    case EventStatus.ARCHIVED:
      return 'Archived';
    default:
      return 'Unknown';
  }
}

export function toRegistrationStatusLabel(status: number): string {
  switch (status) {
    case RegistrationStatus.PENDING:
      return 'Pending';
    case RegistrationStatus.CONFIRMED:
      return 'Confirmed';
    case RegistrationStatus.CANCELLED:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

export function toRegistrationStatusBadgeClass(status: number): string {
  switch (status) {
    case RegistrationStatus.CONFIRMED:
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case RegistrationStatus.PENDING:
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case RegistrationStatus.CANCELLED:
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}

export function toOrderItemStatusProgressLabel(status: number): string {
  switch (status) {
    case OrderItemStatus.ITEM_STATUS_UNORDERED:
      return 'Unordered';
    case OrderItemStatus.ITEM_STATUS_ORDERED:
      return 'Ordered';
    case OrderItemStatus.ITEM_STATUS_ARRIVED_OVERSEAS:
      return 'Arrived Overseas';
    case OrderItemStatus.ITEM_STATUS_ARRIVED_DOMESTIC:
      return 'Arrived Domestic';
    case OrderItemStatus.ITEM_STATUS_READY_FOR_PICKUP:
      return 'Ready for Pickup';
    case OrderItemStatus.ITEM_STATUS_SENT:
      return 'Sent';
    case OrderItemStatus.ITEM_STATUS_FAILED:
      return 'Failed/Cancelled';
    default:
      return 'Unknown';
  }
}
