import {
  Component,
  inject,
  OnInit,
  effect,
  signal,
  computed,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ManagerService } from '../../../core/manager/manager.service';
import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { UiDialogComponent } from '../../../shared/ui/ui-dialog/ui-dialog.component';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { PaymentStatus } from '../../../core/api/api/v1/groupbuy_pb';
import { getPaymentStatusLabel as sharedGetPaymentStatusLabel } from '../../../shared/utils/status-label.util';

@Component({
  selector: 'app-order-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiContainerComponent, UiBtnComponent, RouterLink, UiDialogComponent],
  template: `
    <div class="min-h-screen pt-8 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <app-ui-container customClass="p-8">
        <!-- Header -->
        <div class="mb-8 flex items-center justify-between">
          <div>
            <div class="mb-2 flex items-center gap-2">
              <a
                [routerLink]="['/manager/groupbuy', groupBuyId()]"
                class="text-gray-400 hover:text-white"
              >
                <span class="material-icons text-sm">arrow_back</span> Back to Project
              </a>
            </div>
            <h2 class="text-2xl font-bold text-white">Manage Orders</h2>
            <p class="mt-2 text-gray-400">View and manage orders for this project</p>
          </div>
        </div>

        <div>
          <!-- Loading -->
          @if (managerService.isLoading()) {
            <div class="text-center text-gray-400 py-8">Loading orders...</div>
          }

          <!-- Error -->
          @if (managerService.error()) {
            <div class="bg-red-900/40 border border-red-500/50 p-4 rounded text-red-200 mb-6">
              {{ managerService.error() }}
            </div>
          }

          <!-- Filters -->
          <div class="flex gap-4 mb-6">
            <button
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              [class.bg-white]="filter() === 'all'"
              [class.text-black]="filter() === 'all'"
              [class.bg-white_5]="filter() !== 'all'"
              [class.text-gray-400]="filter() !== 'all'"
              (click)="filter.set('all')"
            >
              All Orders
            </button>
            <button
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              [class.bg-green-500]="filter() === 'ready'"
              [class.text-white]="filter() === 'ready'"
              [class.bg-white_5]="filter() !== 'ready'"
              [class.text-gray-400]="filter() !== 'ready'"
              (click)="filter.set('ready')"
            >
              Ready to Ship
            </button>
          </div>

          <!-- Table -->
          @if (!managerService.isLoading() && filteredOrders().length > 0) {
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm text-gray-400">
                <thead class="bg-white/5 uppercase text-gray-200">
                  <tr>
                    <th class="p-4 rounded-tl-lg">Order ID</th>
                    <th class="p-4">Contact</th>
                    <th class="p-4">Total</th>
                    <th class="p-4">Payment</th>
                    <th class="p-4">Items / Status</th>
                    <th class="p-4 rounded-tr-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/10">
                  @for (order of filteredOrders(); track order.id) {
                    <tr class="hover:bg-white/5 transition-colors">
                      <td class="p-4 font-mono text-xs">{{ order.id.slice(0, 8) }}...</td>
                      <td class="p-4">
                        <div>{{ order.contactInfo }}</div>
                        <div class="text-xs text-gray-500">{{ order.shippingAddress }}</div>
                      </td>
                      <td class="p-4 text-white font-bold">\${{ order.totalAmount }}</td>
                      <td class="p-4">
                        <span
                          class="px-2 py-1 rounded text-xs"
                          [class.bg-green-900]="order.paymentStatus === paymentStatus.CONFIRMED"
                          [class.text-green-300]="order.paymentStatus === paymentStatus.CONFIRMED"
                          [class.bg-yellow-900]="order.paymentStatus === paymentStatus.SUBMITTED"
                          [class.text-yellow-300]="order.paymentStatus === paymentStatus.SUBMITTED"
                          [class.bg-gray-800]="order.paymentStatus === paymentStatus.UNSET"
                        >
                          {{ getPaymentStatusLabel(order.paymentStatus) }}
                        </span>
                      </td>
                      <td class="p-4">
                        <div>{{ order.items.length }} Items</div>
                        @if (isReadyToShip(order)) {
                          <div
                            class="mt-1 text-xs text-green-400 font-bold border border-green-500/30 bg-green-500/10 px-1 py-0.5 rounded inline-block"
                          >
                            READY TO SHIP
                          </div>
                        }
                        @if (isFullyShipped(order)) {
                          <div
                            class="mt-1 text-xs text-gray-400 font-bold border border-gray-500/30 bg-gray-500/10 px-1 py-0.5 rounded inline-block"
                          >
                            SHIPPED
                          </div>
                        }
                      </td>
                      <td class="p-4 text-right">
                        @if (order.paymentStatus !== paymentStatus.CONFIRMED) {
                          <app-ui-btn
                            variant="outline"
                            size="sm"
                            (onClick)="confirmPayment(order.id)"
                          >
                            Confirm Pay
                          </app-ui-btn>
                        }
                        <a
                          [routerLink]="['/manager/groupbuy', groupBuyId(), 'orders', order.id]"
                          class="ml-2 inline-block"
                        >
                          <app-ui-btn variant="ghost" size="sm">Manage</app-ui-btn>
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          @if (!managerService.isLoading() && filteredOrders().length === 0) {
            <div class="text-center text-gray-500 py-12">No orders found.</div>
          }
        </div>
      </app-ui-container>
      <app-ui-dialog></app-ui-dialog>
    </div>
  `,
})
export class OrderListComponent implements OnInit {
  managerService = inject(ManagerService);
  route = inject(ActivatedRoute);
  toast = inject(ToastService);

  @ViewChild(UiDialogComponent) dialog!: UiDialogComponent;

  paymentStatus = PaymentStatus;
  groupBuyId = signal('');

  // Filter State
  filter = signal<'all' | 'ready'>('all');

  filteredOrders = computed(() => {
    const orders = this.managerService.orders();
    const mode = this.filter();

    if (mode === 'all') return orders;

    // Filter for "Ready to Ship"
    // Criteria: Has items with Status 5 (Ready for Pickup) AND not all sent
    return orders.filter((o) => {
      return o.items.some((i) => i.status === 5); // 5 = READY_FOR_PICKUP
    });
  });

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.groupBuyId.set(id);
        this.managerService.loadGroupBuyOrders(id);
      }
    });
  }

  getPaymentStatusLabel(status: PaymentStatus): string {
    return sharedGetPaymentStatusLabel(status);
  }

  isReadyToShip(order: any): boolean {
    return order.items.some((i: any) => i.status === 5);
  }

  isFullyShipped(order: any): boolean {
    return order.items.length > 0 && order.items.every((i: any) => i.status === 6);
  }

  async confirmPayment(orderId: string) {
    const confirmed = await this.dialog.open({
      title: 'Confirm Payment',
      message: 'Confirm payment for this order?',
      confirmText: 'Confirm',
    });

    if (confirmed) {
      try {
        await this.managerService.confirmPayment(orderId);
        this.managerService.loadGroupBuyOrders(this.groupBuyId());
        this.toast.show('Payment confirmed', 'success');
      } catch (err: any) {
        this.toast.show('Failed to confirm payment', 'error');
      }
    }
  }
}
