import { Component, inject, input, computed, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/project/project.service';
import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { Order, OrderItemStatus } from '../../../core/api/api/v1/project_pb';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';

@Component({
    selector: 'app-user-order-detail',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, UiContainerComponent, UiBtnComponent, FormsModule, DecimalPipe, DatePipe],
    templateUrl: "./user-order-detail.component.html",
    styleUrl: "./user-order-detail.component.css"
})
export class UserOrderDetailComponent {
    projectService = inject(ProjectService);
    router = inject(Router);
    toast = inject(ToastService);
    id = input<string>();

    orders = this.projectService.myOrders;
    order = computed(() => this.orders().find(o => o.id === this.id()));

    isEditable = computed(() => {
        const o = this.order();
        if (!o) return false;
        // Locked if Payment is Confirmed (3) or Items are processed (> Unordered/1)
        if (o.paymentStatus === 3) return false;
        if (o.items.some(i => (i.status || 0) > 1)) return false;
        return true;
    });

    subtotal = computed(() => {
        const o = this.order();
        if (!o) return 0;
        return o.items.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
    });

    shippingFee = computed(() => {
        const o = this.order();
        return o ? Number(o.shippingFee) : 0;
    });

    total = computed(() => this.subtotal() + this.shippingFee());

    // Editable State
    isEditingItems = signal(false);
    isEditingPayment = signal(false);

    // Draft Items for Edit
    currentItems = signal<any[]>([]);

    // Draft Payment
    paymentMethod = '';
    accountLast5 = '';
    paymentAmount = 0;
    paymentPaidAt = ''; // ISO string for datetime-local
    contactInfo = '';
    shippingAddress = '';

    note = '';

    constructor() {
        effect(() => {
            // Load if empty
            if (this.orders().length === 0) {
                this.projectService.loadMyOrders();
            }
        });

        effect(() => {
            const o = this.order();
            if (o) {
                // Initialize items
                this.currentItems.set(o.items.map(i => ({
                    productId: i.productId,
                    specId: i.specId,
                    productName: i.productName, // Note: OrderItem might not have name populated directly if not expanded? 
                    // Actually Proto OrderItem has product_name, spec_name snapshot.
                    specName: i.specName,
                    price: Number(i.price),
                    quantity: i.quantity
                })));

                // Initialize Payment
                if (o.paymentInfo) {
                    this.paymentMethod = o.paymentInfo.method;
                    this.accountLast5 = o.paymentInfo.accountLast5;
                    this.paymentAmount = Number(o.paymentInfo.amount || 0);
                    // Convert Timestamp to ISO for input
                    if (o.paymentInfo.paidAt) {
                        // o.paymentInfo.paidAt is a Timestamp (or Date if mapped).
                        // Proto generated types usually have `toDate()`.
                        // Check generated code or assume it behaves like typical connect-es Timestamp
                        try {
                            const date = (o.paymentInfo.paidAt as any).toDate ? (o.paymentInfo.paidAt as any).toDate() : new Date(o.paymentInfo.paidAt as any);
                            // Format to yyyy-MM-ddThh:mm
                            this.paymentPaidAt = date.toISOString().slice(0, 16);
                        } catch (e) { console.warn('Date parse error', e); }
                    }
                } else {
                    // Auto-fill defaults
                    this.paymentAmount = this.total();
                    this.paymentPaidAt = new Date().toISOString().slice(0, 16);
                }
                this.contactInfo = o.contactInfo;
                this.shippingAddress = o.shippingAddress;
                // Cast to any since generated type might lag slightly in editor perception, but buf gen ran.
                // Or just access it. Note exists on Order now.
                this.note = (o as any).note || '';
            } else {
                this.currentItems.set([]);
            }
        });
        // ...


        effect(() => {
            if (this.projectService.updatingOrder() === false && !this.projectService.updateOrderError()) {
                // Success - close forms
                this.isEditingItems.set(false);
                this.isEditingPayment.set(false);
            }
        });
    }

    navigateToProject() {
        const o = this.order();
        if (o) {
            this.router.navigate(['/project', o.projectId], { queryParams: { edit: 'true' } });
        }
    }

    toggleEditItems() {
        this.isEditingItems.set(true);
    }

    cancelEditItems() {
        this.isEditingItems.set(false);
        // Reset items
        const o = this.order();
        if (o) {
            this.currentItems.set(o.items.map(i => ({
                productId: i.productId,
                specId: i.specId,
                productName: i.productName,
                specName: i.specName,
                price: Number(i.price),
                quantity: i.quantity
            })));
            this.note = (o as any).note || '';
        }
    }

    updateQuantity(item: any, delta: number) {
        const items = this.currentItems();
        const idx = items.indexOf(item);
        if (idx !== -1) {
            const newItem = { ...item, quantity: item.quantity + delta };
            if (newItem.quantity > 0) {
                const newItems = [...items];
                newItems[idx] = newItem;
                this.currentItems.set(newItems);
            } else {
                // Remove?
                const newItems = items.filter(i => i !== item);
                this.currentItems.set(newItems);
            }
        }
    }

    saveItems() {
        if (!this.order()) return;
        // Map back to CartItem format expected by Action
        // Action expects CartItem[] which has maxQuantity etc. 
        // We only need productId, specId, quantity for the backend really.
        // The Action definition: items: CartItem[]. 
        // Let's cast or ensure properties exist.
        const startItems = this.currentItems();
        const itemsToSave: any[] = startItems.map(i => ({
            projectId: this.order()!.projectId,
            productId: i.productId,
            specId: i.specId,
            quantity: i.quantity,
            // Mock other fields required by CartItem interface if strictly typed
            productName: i.productName,
            specName: i.specName,
            price: i.price,
            maxQuantity: 0
        }));

        this.projectService.updateUserOrder(this.order()!.id, itemsToSave, this.note);
    }


    toggleEditPayment() {
        this.isEditingPayment.set(true);
    }

    cancelEditPayment() {
        this.isEditingPayment.set(false);
        const o = this.order();
        if (o) {
            if (o.paymentInfo) {
                this.paymentMethod = o.paymentInfo.method;
                this.accountLast5 = o.paymentInfo.accountLast5;
            }
            this.contactInfo = o.contactInfo;
            this.shippingAddress = o.shippingAddress;
        }
    }

    async savePayment() {
        if (!this.order()) return;
        try {
            await this.projectService.updatePaymentInfoAsync(
                this.order()!.id,
                this.paymentMethod,
                this.accountLast5,
                this.contactInfo,
                this.shippingAddress,
                this.paymentPaidAt ? new Date(this.paymentPaidAt) : null,
                this.paymentAmount
            );
            // Reload to reflect changes if not auto-updated by service effect (service implementation of updatePaymentInfoAsync assumes success but doesn't auto-refresh store unless we call loadMyOrders)
            this.projectService.loadMyOrders();
            this.isEditingPayment.set(false);
        } catch (err) {
            console.error(err);
            this.toast.show('Failed to update payment info', 'error');
        }
    }
}

