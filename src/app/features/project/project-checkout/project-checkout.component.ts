import { Component, inject, effect, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/project/project.service';
import { CartItem } from '../../../core/project/project.actions';
import { UiContainerComponent } from '../../../shared/ui/ui-container/ui-container.component';
import { UiBtnComponent } from '../../../shared/ui/ui-btn/ui-btn.component';
import { ShippingType } from '../../../core/api/api/v1/project_pb';
import { ToastService } from '../../../shared/ui/ui-toast/toast.service';

@Component({
    selector: 'app-project-checkout',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, UiContainerComponent, UiBtnComponent],
    templateUrl: './project-checkout.component.html',
    styleUrl: './project-checkout.component.css'
})
export class ProjectCheckoutComponent implements OnInit {
    projectService = inject(ProjectService);
    router = inject(Router);
    route = inject(ActivatedRoute);
    toast = inject(ToastService);

    contactInfo = '';
    shippingAddress = '';
    note = '';

    selectedShippingMethodId = '';

    get project() {
        return this.projectService.currentProject();
    }

    get shippingConfigs() {
        return this.project?.shippingConfigs || [];
    }

    get selectedConfig() {
        return this.shippingConfigs.find((c: any) => c.id === this.selectedShippingMethodId);
    }

    get shippingFee() {
        return this.selectedConfig ? Number(this.selectedConfig.price) : 0;
    }

    get totalAmount() {
        return this.projectService.cartTotal() + this.shippingFee;
    }

    // Helper Methods for Template
    getShippingTypeLabel(type: number): string {
        switch (type) {
            case ShippingType.MEETUP: return 'Meetup';
            case ShippingType.DELIVERY: return 'Delivery';
            case ShippingType.STORE_PICKUP: return 'Store Pickup';
            default: return 'Standard';
        }
    }

    isMeetup(): boolean {
        return this.selectedConfig?.type === ShippingType.MEETUP;
    }

    shouldShowAddress(): boolean {
        return true;
    }

    addressLabel(): string {
        if (this.isMeetup()) return 'Notes / Meetup Details (Optional)';
        if (this.selectedConfig?.type === ShippingType.DELIVERY) return 'Delivery Address';
        if (this.selectedConfig?.type === ShippingType.STORE_PICKUP) return 'Pickup Store (Name/Code)';
        return 'Shipping Address';
    }

    addressPlaceholder(): string {
        if (this.isMeetup()) return 'e.g. Will arrive on time';
        if (this.selectedConfig?.type === ShippingType.DELIVERY) return 'e.g. 123 Main St, City';
        if (this.selectedConfig?.type === ShippingType.STORE_PICKUP) return 'e.g. 7-11 Ximen Store (123456)';
        return 'e.g. Address or Store Info';
    }

    constructor() {
        // Clear previous successful order ID to prevent auto-redirect
        this.projectService.lastCreatedOrderId.set(null);

        effect(() => {
            const orderId = this.projectService.lastCreatedOrderId();
            const projectId = this.projectService.currentProject()?.id;
            if (orderId && projectId) {
                this.router.navigate(['project', projectId, 'order-confirmation', orderId]);
            }
        });

        effect(() => {
            // Load existing order on init effectively
            const projectId = this.projectService.currentProject()?.id;
            if (projectId) {
                this.checkExistingOrder(projectId);
            }
        }, { allowSignalWrites: true });
    }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                // Ensure project is loaded
                this.projectService.loadProject(id);
            }
        });
    }

    async checkExistingOrder(projectId: string) {
        const order = await this.projectService.loadExistingOrderIntoCart(projectId);

        if (order && order.paymentStatus > 2) { // 3 = CONFIRMED/PAID
            this.router.navigate(['/user/orders', order.id]);
            return;
        }

        // Form population handles contact/shipping separately from Cart
        if (order) {
            this.contactInfo = order.contactInfo;
            this.shippingAddress = order.shippingAddress;
            // Pre-select shipping method if existing order has it
            if (order.shippingMethodId) {
                this.selectedShippingMethodId = order.shippingMethodId;
            }
            if ((order as any).note) {
                this.note = (order as any).note;
            }
        }
    }

    goBack() {
        // Go up one level (back to detail)
        this.router.navigate(['../'], { relativeTo: this.route });
    }

    updateQuantity(item: any, change: number) {
        const newQty = item.quantity + change;
        if (newQty <= 0) {
            this.projectService.removeFromCart(item.productId, item.specId);
        } else {
            this.projectService.updateCartQuantity(item.productId, item.specId, newQty);
        }
    }

    submitOrder() {
        if (!this.contactInfo) {
            this.toast.show('Please fill in Contact Info', 'error');
            return;
        }

        if (this.shippingConfigs.length > 0 && !this.selectedShippingMethodId) {
            this.toast.show('Please select a shipping method', 'error');
            return;
        }

        // Validate Address only if REQUIRED
        // If Type is DELIVERY or UNKNOWN/LEGACY -> Required
        // If Type is MEETUP -> Optional
        if (!this.isMeetup() && !this.shippingAddress) {
            this.toast.show('Please fill in Shipping Address', 'error');
            return;
        }

        const projectId = this.projectService.currentProject()?.id;
        if (!projectId) return;

        this.projectService.submitOrder(projectId, this.contactInfo, this.shippingAddress, this.projectService.cart(), this.selectedShippingMethodId, this.note);

        // We should probably listen to success to navigate away, 
        // but simpler for now:
        // The effect handles the API call. 
        // We can watch isSubmittingOrder going from true to false with no error? 
        // Or just a simple effect in this component or logic.
        // For MVP, if success (cart cleared), navigate back.
    }
}
