import { Component, OnInit, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GroupBuyService } from '../../../core/groupbuy/groupbuy.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';
import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { Product, Order, OrderItem, PaymentStatus } from '../../../core/api/api/v1/groupbuy_pb';
import { CurrencySymbolPipe } from '../../../shared/pipes/currency-symbol.pipe';

@Component({
  selector: 'app-groupbuy-detail',
  imports: [UiContainerComponent, UiBtnComponent, RouterLink, CurrencySymbolPipe],
  templateUrl: './groupbuy-detail.component.html',
  styleUrl: './groupbuy-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupBuyDetailComponent implements OnInit {
  groupBuyService = inject(GroupBuyService);
  authService = inject(AuthService); // Inject Auth Service
  toastService = inject(ToastService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  // Track selected spec ID for each product
  selectedSpecs: Record<string, string> = {};

  // Permissions & State
  canManage = computed(() => {
    const user = this.authService.user();
    const project = this.groupBuyService.currentGroupBuy();
    if (!user || !project) return false;
    return project.creator?.id === user.id || project.managers.some(m => m.id === user.id);
  });

  existingOrder = this.groupBuyService.myGroupBuyOrder;

  isOrderSubmittedOrConfirmed = computed(() => {
    const order = this.existingOrder();
    // Check local flag from service? No, rely on order status.
    // If order is loaded into cart for editing, we might want to hide this state?
    // Actually, we can check if cart is empty OR loaded cart matches.
    // But better: check paymentStatus.
    return order && order.paymentStatus >= PaymentStatus.SUBMITTED;
  });

  // If we are editing, we override the "Submitted" view
  isEditing = false;

  isOrderLocked = computed(() => {
    const o = this.existingOrder();
    if (!o) return false;
    // Locked if Payment is Confirmed (3) or Items are processed (> Unordered/1)
    if (o.paymentStatus === PaymentStatus.CONFIRMED) return true;
    if (o.items && o.items.some(i => (i.status || 0) > 1)) return true;
    return false;
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.groupBuyService.loadGroupBuy(id);
        this.groupBuyService.loadExistingOrderIntoCart(id).then(order => {
          // Check for edit mode query param
          const editMode = this.route.snapshot.queryParamMap.get('edit') === 'true';
          if (order) {
            const isLocked = (order.paymentStatus === PaymentStatus.CONFIRMED) || (order.items && order.items.some((i: OrderItem) => (i.status || 0) > 1));

            if (editMode && order.paymentStatus >= PaymentStatus.SUBMITTED && !isLocked) {
              this.isEditing = true;
              this.groupBuyService.editSubmittedOrder();
            } else {
              this.isEditing = false;
              if (editMode && isLocked) {
                this.router.navigate([], { queryParams: { edit: null }, queryParamsHandling: 'merge', replaceUrl: true });
                this.toastService.show('Order cannot be modified as it is being processed.', 'error');
              }
            }
          } else {
            this.isEditing = false;
          }
        });
      }
    });
  }

  onSpecSelect(productId: string, event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedSpecs[productId] = target.value;
  }

  // Helper to check auth and redirect
  private checkAuth(): boolean {
    if (this.authService.isAuthenticated()) return true;

    // Redirect to login with return url
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url }
    });
    return false;
  }

  addToCart(projectId: string, product: Product) {
    if (!this.checkAuth()) return; // Require Login

    let specId = '';
    let spec: any = undefined;

    if (product.specs.length > 0) {
      // Use selected spec or default to the first one
      specId = this.selectedSpecs[product.id] || product.specs[0].id;
      spec = product.specs.find(s => s.id === specId);
    }

    this.groupBuyService.addToCart(product, spec, 1);
    this.toastService.show('Added to order', 'success');
  }

  // Helper: Get Qty for current selected spec
  getQuantity(product: Product): number {
    const specId = this.selectedSpecs[product.id] || (product.specs.length > 0 ? product.specs[0].id : '');
    const item = this.groupBuyService.cart().find(i => i.productId === product.id && i.specId === specId);
    return item ? item.quantity : 0;
  }

  // Update Qty (Stepper)
  updateProductQuantity(product: Product, delta: number) {
    if (!this.checkAuth()) return;

    const specId = this.selectedSpecs[product.id] || (product.specs.length > 0 ? product.specs[0].id : '');
    const currentQty = this.getQuantity(product);
    const newQty = currentQty + delta;

    if (currentQty === 0 && delta > 0) {
      // Add new item
      let spec = product.specs.find(s => s.id === specId);
      this.groupBuyService.addToCart(product, spec, 1);
      this.toastService.show('Added to order', 'success');
    } else if (newQty <= 0) {
      // Remove item
      this.groupBuyService.removeFromCart(product.id, specId);
    } else {
      // Update item
      this.groupBuyService.updateCartQuantity(product.id, specId, newQty);
    }
  }

  viewOrder() {
    const order = this.existingOrder();
    if (order) {
      this.router.navigate(['/user/orders', order.id]);
    }
  }

  editOrder() {
    this.isEditing = true;
    this.groupBuyService.editSubmittedOrder();
  }

  cancelEdit() {
    this.isEditing = false;
    this.groupBuyService.clearCart();
    // Remove query param
    this.router.navigate([], {
      queryParams: { edit: null },
      queryParamsHandling: 'merge'
    });
  }

  goToCheckout(projectId: string) {
    if (!this.checkAuth()) return; // Require Login
    this.router.navigate(['groupbuy', projectId, 'checkout']);
  }
}
