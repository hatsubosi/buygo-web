import {
  Component,
  inject,
  computed,
  input,
  effect,
  signal,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ManagerService } from '../../../core/manager/manager.service';
import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { UiDialogComponent } from '../../../shared/ui/ui-dialog/ui-dialog.component';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { Timestamp } from '@bufbuild/protobuf';
import { UserRole } from '../../../core/api/api/v1/auth_pb';
import { CurrencySymbolPipe } from '../../../shared/pipes/currency-symbol.pipe';

@Component({
  selector: 'app-manager-groupbuy-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    UiContainerComponent,
    UiBtnComponent,
    DatePipe,
    CurrencyPipe,
    FormsModule,
    UiDialogComponent,
    CurrencySymbolPipe,
  ],
  templateUrl: './manager-groupbuy-detail.component.html',
  styleUrl: './manager-groupbuy-detail.component.css',
})
export class ManagerGroupBuyDetailComponent {
  groupBuyService = inject(GroupBuyService);
  managerService = inject(ManagerService);
  auth = inject(AuthService);
  router = inject(Router);
  toastService = inject(ToastService);

  // Router input
  id = input<string>();

  @ViewChild(UiDialogComponent) dialog!: UiDialogComponent;

  constructor() {
    effect(() => {
      const p = this.project();
      const user = this.auth.user();
      if (p && user) {
        if (user.role === UserRole.SYS_ADMIN) return;

        const isCreator = p.creator?.id === user.id;
        const isManager = p.managers.some((m) => m.id === user.id);

        if (!isCreator && !isManager) {
          this.router.navigate(['/manager']);
        }
      }
    });

    // Load project
    effect(() => {
      const id = this.id();
      if (id) {
        this.groupBuyService.loadGroupBuy(id);
        this.managerService.loadGroupBuyOrders(id);
      }
    });
  }

  project = this.groupBuyService.currentGroupBuy;
  products = this.groupBuyService.currentProducts;
  orders = this.managerService.orders;

  // Filter out cancelled/invalid orders for stats
  validOrders = computed(() => {
    return this.orders().filter((o) => o.paymentStatus !== 4);
  });

  validOrdersCount = computed(() => this.validOrders().length);

  salesStats = computed(() => {
    const prods = this.products();
    const orders = this.validOrders();
    if (!prods.length) return [];

    const stats = new Map<
      string,
      { id: string; name: string; price: number; exchangeRate: number; quantity: number }
    >();

    // Initialize with products
    prods.forEach((prod) => {
      stats.set(prod.id, {
        id: prod.id,
        name: prod.name,
        price: Number(prod.priceOriginal),
        exchangeRate: Number(prod.exchangeRate),
        quantity: 0,
      });
    });

    // Aggregate orders
    orders.forEach((o) => {
      o.items.forEach((item) => {
        const stat = stats.get(item.productId);
        if (stat) {
          stat.quantity += item.quantity;
        }
      });
    });

    return Array.from(stats.values())
      .map((s) => ({
        ...s,
        revenueOriginal: s.price * s.quantity,
        revenueConverted: s.price * s.exchangeRate * s.quantity,
      }))
      .sort((a, b) => b.revenueConverted - a.revenueConverted);
  });

  financialStats = computed(() => {
    const stats = this.salesStats();
    return stats.reduce(
      (acc, curr) => ({
        totalOriginal: acc.totalOriginal + curr.revenueOriginal,
        totalConverted: acc.totalConverted + curr.revenueConverted,
      }),
      { totalOriginal: 0, totalConverted: 0 },
    );
  });

  getProjectStatus(status: any): string {
    const map = { 1: 'Draft', 2: 'Active', 3: 'Ended', 4: 'Archived' };
    return (map as any)[status] || 'Unknown';
  }

  toDate(ts: any): Date | null {
    return ts ? ts.toDate() : null;
  }

  async updateStatus(status: number) {
    const p = this.project();
    if (!p) return;

    let action = '';
    switch (status) {
      case 2:
        action = 'publish';
        break;
      case 3:
        action = 'end';
        break;
      case 4:
        action = 'archive';
        break;
      default:
        return;
    }

    const confirmed = await this.dialog.open({
      title: `Confirm ${action}`,
      message: `Are you sure you want to ${action} this project?`,
      type: status === 3 || status === 4 ? 'destructive' : 'default',
      confirmText: 'Yes, proceed',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    this.groupBuyService.updateGroupBuy(
      p.id,
      p.title,
      p.description,
      status,
      this.products(),
      p.coverImageUrl,
      p.deadline?.toDate(),
      p.shippingConfigs,
    );

    this.toastService.show(`Project status updated to ${action}`, 'success');
  }

  copyPublicLink() {
    const p = this.project();
    if (!p) return;
    const url = `${window.location.origin}/groupbuy/${p.id}`;
    navigator.clipboard.writeText(url).then(() => {
      this.toastService.show('Public link copied to clipboard!', 'success');
    });
  }
}
