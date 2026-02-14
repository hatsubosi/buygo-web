import { Component, inject, computed, signal, effect, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerService } from '../../../core/manager/manager.service';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { UiDialogComponent } from '../../../shared/ui/ui-dialog/ui-dialog.component';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { PaymentStatus, CreateOrderItem, OrderItemStatus } from '../../../core/api/api/v1/groupbuy_pb';

@Component({
  selector: 'app-manager-order-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, UiContainerComponent, UiBtnComponent, UiDialogComponent, DecimalPipe],
  templateUrl: './manager-order-detail.component.html',
  styleUrl: './manager-order-detail.component.css'
})
export class ManagerOrderDetailComponent {
  route = inject(ActivatedRoute);
  router = inject(Router);
  managerService = inject(ManagerService);
  groupBuyService = inject(GroupBuyService);
  toastService = inject(ToastService);

  @ViewChild(UiDialogComponent) dialog!: UiDialogComponent;

  groupBuyId = signal('');
  orderId = signal('');

  products = this.groupBuyService.currentProducts;

  // Find order in managerService list
  order = computed(() => {
    const oid = this.orderId();
    return this.managerService.orders().find(o => o.id === oid);
  });

  editableItems = signal<CreateOrderItem[]>([]);
  isDirty = signal(false);
  isSaving = false;
  isLoading = computed(() => this.managerService.isLoading() || (this.orderId() && !this.order()));

  subtotal = computed(() => {
    const o = this.order();
    if (!o) return 0;
    // Use editableItems if dirty? Or always original order for summary?
    // Summary should probably reflect SAVED state unless we want live preview.
    // Let's use order() for now (saved state).
    return o.items.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
  });

  shippingFee = computed(() => {
    const o = this.order();
    return o ? Number(o.shippingFee) : 0;
  });

  total = computed(() => this.subtotal() + this.shippingFee());

  orderNote = computed(() => (this.order() as any)?.note || 'None');

  // Add Item Form State
  newItem = {
    productId: '',
    specId: '',
    quantity: 1
  };

  constructor() {
    // Load Data on Init
    const params = this.route.snapshot.paramMap;
    const pid = params.get('id');
    const oid = params.get('orderId');

    if (pid && oid) {
      this.groupBuyId.set(pid);
      this.orderId.set(oid);

      // Load Project (for products)
      this.groupBuyService.loadGroupBuy(pid);
      // Load Orders (for finding this order)
      this.managerService.loadGroupBuyOrders(pid);
    }

    // Sync Order Items to Edit State
    effect(() => {
      const o = this.order();
      if (o) {
        // Initial load of items
        // Only if we haven't touched it? 
        // Actually if we just loaded, we should replace.
        // But careful not to overwrite user edits if effect runs again?
        // Logic: Only set if editableItems is empty OR if we re-loaded fresh data explicitly?
        // For simplicity, we set it initially. 
        // Ideally we track "loaded" state.
        // Here "untracked" might be needed if we modify signals inside effect, but we set editableItems.
        // Simple check: if length 0, load.
        if (this.editableItems().length === 0 && o.items.length > 0) {
          const mapped = o.items.map(i => new CreateOrderItem({
            productId: i.productId,
            specId: i.specId,
            quantity: i.quantity,
            status: i.status
          }));
          this.editableItems.set(mapped);
        }
      }
    }, { allowSignalWrites: true });
  }

  markDirty() {
    this.isDirty.set(true);
  }

  removeItem(index: number) {
    this.editableItems.update(items => items.filter((_, i) => i !== index));
    this.markDirty();
  }

  addItem() {
    const { productId, specId, quantity } = this.newItem;
    if (!productId || quantity < 1) return;

    this.editableItems.update(items => [
      ...items,
      new CreateOrderItem({ productId, specId, quantity })
    ]);

    // Reset form
    this.newItem = { productId: '', specId: '', quantity: 1 };
    this.markDirty();
  }

  async saveChanges() {
    if (!this.isDirty()) return;
    this.isSaving = true;
    try {
      await this.groupBuyService.updateOrder(this.orderId(), this.editableItems());
      // Reload orders to refresh UI
      await this.managerService.loadGroupBuyOrders(this.groupBuyId());
      this.isDirty.set(false);
      this.toastService.show('Order updated successfully', 'success');
    } catch (err: any) {
      this.toastService.show(err.message || 'Failed to update order', 'error');
    } finally {
      this.isSaving = false;
    }
  }

  async confirmPayment() {
    const confirmed = await this.dialog.open({
      title: 'Confirm Payment',
      message: 'Confirm payment? This will lock the order from further edits.',
      confirmText: 'Confirm'
    });
    if (!confirmed) return;

    try {
      await this.managerService.confirmPayment(this.orderId());
      // Reload
      await this.managerService.loadGroupBuyOrders(this.groupBuyId());
      this.toastService.show('Payment confirmed', 'success');
    } catch (err: any) {
      this.toastService.show(err.message, 'error');
    }
  }

  // Helpers
  getProductName(pid: string): string {
    return this.products().find(p => p.id === pid)?.name || 'Unknown Product';
  }

  getSpecName(pid: string, sid: string): string {
    if (!sid) return 'Default';
    const p = this.products().find(p => p.id === pid);
    return p?.specs.find(s => s.id === sid)?.name || 'Unknown Spec';
  }

  getSpecs(pid: string) {
    return this.products().find(p => p.id === pid)?.specs || [];
  }

  getPaymentLabel(status: number) {
    switch (status) {
      case PaymentStatus.CONFIRMED: return 'Paid';
      case PaymentStatus.SUBMITTED: return 'Submitted';
      case PaymentStatus.UNSET: return 'Unpaid';
      case PaymentStatus.REJECTED: return 'Rejected';
      default: return 'Unknown';
    }
  }

  // Shipping Helpers
  getShippingStatusLabel(): string {
    const o = this.order();
    if (!o || !o.items.length) return 'Empty';

    const allSent = o.items.every(i => i.status === 6);
    if (allSent) return 'Shipped';

    // Priority checks
    if (o.items.some(i => i.status === 5)) return 'Ready to Ship';
    if (o.items.some(i => i.status === 4)) return 'Arrived Domestic';
    if (o.items.some(i => i.status === 3)) return 'Arrived Overseas';
    if (o.items.some(i => i.status === 2)) return 'Ordered';
    if (o.items.some(i => i.status === 1)) return 'Unordered';

    return 'Processing';
  }

  getShippingProgress(): number {
    const o = this.order();
    if (!o || !o.items.length) return 0;

    const sentCount = o.items.filter(i => i.status === 6).length;
    return (sentCount / o.items.length) * 100;
  }

  canShip(): boolean {
    const o = this.order();
    if (!o) return false;
    // valid if NOT all are already sent
    return o.items.some(i => i.status !== 6);
  }

  isFullyShipped(): boolean {
    const o = this.order();
    if (!o || !o.items.length) return false;
    return o.items.every(i => i.status === 6);
  }

  async markAsShipped() {
    const confirmed = await this.dialog.open({
      title: 'Mark as Shipped',
      message: 'Mark all items in this order as SENT?',
      confirmText: 'Mark Sent'
    });
    if (!confirmed) return;

    this.isSaving = true;
    try {
      const o = this.order()!;
      // Map existing items to new state with Status=6
      const updatedItems = o.items.map(i => new CreateOrderItem({
        productId: i.productId,
        specId: i.specId,
        quantity: i.quantity,
        status: 6 // SENT
      }));

      await this.groupBuyService.updateOrder(this.orderId(), updatedItems);

      // Reload
      await this.managerService.loadGroupBuyOrders(this.groupBuyId());
      this.toastService.show('Order marked as shipped!', 'success');
    } catch (err: any) {
      this.toastService.show('Failed to update: ' + err.message, 'error');
    } finally {
      this.isSaving = false;
    }
  }
}
