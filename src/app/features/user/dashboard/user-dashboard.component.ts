import {
  Component,
  inject,
  computed,
  signal,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { EventService } from '../../../core/event/event.service';
import { AuthService } from '../../../core/auth/auth.service';
import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { PaymentStatus } from '../../../core/api/api/v1/groupbuy_pb';
import { RegistrationStatus } from '../../../core/api/api/v1/event_pb';
import {
  getOrderItemStatusLabel,
  getPaymentStatusLabel as sharedGetPaymentStatusLabel,
} from '../../../shared/utils/status-label.util';

@Component({
  selector: 'app-user-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, UiContainerComponent, UiBtnComponent],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css',
})
export class UserDashboardComponent {
  groupBuyService = inject(GroupBuyService);
  eventService = inject(EventService);
  authService = inject(AuthService);

  activeTab = signal<'overview' | 'orders' | 'events' | 'settings'>('overview');

  orders = computed(() => [...this.groupBuyService.myOrders()].reverse());
  registrations = signal<any[]>([]);

  pendingPaymentCount = computed(
    () => this.orders().filter((o) => o.paymentStatus === PaymentStatus.UNSET).length,
  );

  activeRegistrationCount = computed(
    () =>
      this.registrations().filter(
        (r) => r.status === RegistrationStatus.CONFIRMED || r.status === RegistrationStatus.PENDING,
      ).length,
  );

  constructor() {
    effect(() => {
      const user = this.authService.user();
      if (user) {
        this.groupBuyService.loadMyOrders();
        this.loadRegistrations();
      }
    });
  }

  async loadRegistrations() {
    try {
      const regs = await this.eventService.getMyRegistrations();
      this.registrations.set(regs);
    } catch (err) {
      console.error('Failed to load registrations', err);
    }
  }

  Number(val: any): number {
    return Number(val);
  }

  getPaymentStatusLabel(status: number) {
    return sharedGetPaymentStatusLabel(status);
  }

  getPaymentStatusClass(status: number) {
    switch (status) {
      case PaymentStatus.CONFIRMED:
        return 'bg-green-900/50 text-green-300';
      case PaymentStatus.SUBMITTED:
        return 'bg-yellow-900/50 text-yellow-300';
      case PaymentStatus.UNSET:
        return 'bg-red-900/50 text-red-300';
      case PaymentStatus.REJECTED:
        return 'bg-red-900 text-red-100';
      default:
        return 'bg-gray-800 text-gray-400';
    }
  }

  getItemStatusLabel(status: number) {
    return getOrderItemStatusLabel(status);
  }

  getRegStatusLabel(status: number) {
    switch (status) {
      case RegistrationStatus.PENDING:
        return 'Pending';
      case RegistrationStatus.CONFIRMED:
        return 'Confirmed';
      // case RegistrationStatus.CANCELLED: return 'Cancelled'; // Check if this exists in proto
      default:
        return 'Unknown';
    }
  }

  getRegStatusClass(status: number) {
    switch (status) {
      case RegistrationStatus.CONFIRMED:
        return 'bg-green-500/10 text-green-400 border-green-500/20'; // Confirmed
      case RegistrationStatus.PENDING:
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'; // Pending
      // case RegistrationStatus.CANCELLED: return 'bg-red-500/10 text-red-400 border-red-500/20'; // Cancelled
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  }
}
