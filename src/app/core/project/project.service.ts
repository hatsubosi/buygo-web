import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Store } from '@ngrx/store';
import { ProjectActions, CartItem } from './project.actions';
import { Project, Product, ProductSpec, CreateOrderItem, Order, OrderItem, ShippingConfig, RoundingConfig } from '../api/api/v1/project_pb';
import { createPromiseClient, Transport } from '@connectrpc/connect';
import { TransportToken } from '../providers/transport.token';
import { ProjectService as ProjectServiceDef } from '../api/api/v1/project_connect';
import { AuthService } from '../auth/auth.service';
import {
    selectAllProjects,
    selectCurrentProject,
    selectProjectsLoading,
    selectProjectDetailLoading,
    selectCurrentProjectProducts,
    selectIsSubmittingOrder,
    selectSubmitOrderError,
    selectLastCreatedOrderId,
    selectActionLoading,
    selectActionError,
    selectMyOrders,
    selectLoadingMyOrders,
    selectUpdatingOrder,
    selectUpdateOrderError
} from './project.selectors';

@Injectable({ providedIn: 'root' })
export class ProjectService {
    private store = inject(Store);
    private transport = inject(TransportToken) as Transport;
    private client = createPromiseClient(ProjectServiceDef, this.transport);

    // Signals
    projects = this.store.selectSignal(selectAllProjects);
    currentProject = this.store.selectSignal(selectCurrentProject);
    isLoadingList = this.store.selectSignal(selectProjectsLoading);

    // Actions (Create/Update)
    isActionLoading = this.store.selectSignal(selectActionLoading);
    actionError = this.store.selectSignal(selectActionError);

    // Detail & Products
    isLoadingDetail = this.store.selectSignal(selectProjectDetailLoading);
    currentProducts = this.store.selectSignal(selectCurrentProjectProducts);

    // Cart (Local State)
    cart = signal<CartItem[]>([]);
    cartCount = computed(() => this.cart().reduce((acc, item) => acc + item.quantity, 0));
    cartTotal = computed(() => this.cart().reduce((acc, item) => acc + (item.price * item.quantity), 0));

    // Existing Order (for Resume)
    existingOrderId = signal<string | null>(null);

    // Order (Store Selectors mixed with local calls)
    isSubmittingOrder = signal(false); // Local override for submit state
    submitOrderError = signal<string | null>(null); // Local error
    lastCreatedOrderId = signal<string | null>(null); // Local result

    // My Orders (Store)
    myOrders = this.store.selectSignal(selectMyOrders);
    loadingMyOrders = this.store.selectSignal(selectLoadingMyOrders);

    // Update Order (Store)
    updatingOrder = this.store.selectSignal(selectUpdatingOrder);
    updateOrderError = this.store.selectSignal(selectUpdateOrderError);

    loadProjects() {
        this.store.dispatch(ProjectActions.loadProjects());
    }

    loadMyOrders() {
        this.store.dispatch(ProjectActions.loadMyOrders());
    }

    // Manager State
    managerProjects = signal<Project[]>([]);

    async loadManagerProjects() {
        const res = await this.client['listManagerProjects']({ pageSize: 100 });
        this.managerProjects.set(res.projects);
    }

    loadProject(id: string) {
        this.store.dispatch(ProjectActions.loadProjectDetail({ id }));
    }

    constructor() {
        // Clear state on logout
        const authService = inject(AuthService);
        effect(() => {
            if (!authService.user()) {
                this.clearCart();
                this.myProjectOrder.set(null);
                this.existingOrderId.set(null);
                this.loadedProjectCartId.set(null);
            }
        });
    }

    addToCart(product: Product, spec: ProductSpec | undefined, quantity: number) {
        if (quantity <= 0) return; // Prevent negative quantity

        const currentCart = this.cart();

        // Failsafe: If cart has items from another project, clear it first
        if (currentCart.length > 0 && currentCart[0].projectId !== product.projectId) {
            this.clearCart();
        }

        const freshCart = this.cart(); // Re-read after potential clear
        const existingItemIndex = freshCart.findIndex(
            item => item.productId === product.id && item.specId === (spec?.id || '')
        );

        const price = Number(product.priceFinal);

        if (existingItemIndex > -1) {
            const updatedCart = [...freshCart];
            const newQty = updatedCart[existingItemIndex].quantity + quantity;
            if (newQty > 0) {
                updatedCart[existingItemIndex] = {
                    ...updatedCart[existingItemIndex],
                    quantity: newQty
                };
                this.cart.set(updatedCart);
            }
        } else {
            const newItem: CartItem = {
                projectId: product.projectId,
                productId: product.id,
                specId: spec?.id || '',
                productName: product.name,
                specName: spec?.name || '',
                price: price,
                quantity: quantity,
                maxQuantity: product.maxQuantity
            };
            this.cart.set([...freshCart, newItem]);
        }
    }

    removeFromCart(productId: string, specId: string) {
        // This method is now assumed to update the local cart signal directly
        this.cart.set(this.cart().filter(item => !(item.productId === productId && item.specId === specId)));
    }

    updateCartQuantity(productId: string, specId: string, quantity: number) {
        // Enforce positive quantity or remove?
        // UI logic usually handles 0 -> remove.
        // Let's enforce positive here for update.
        if (quantity <= 0) {
            this.removeFromCart(productId, specId);
            return;
        }

        this.cart.set(
            this.cart().map(item =>
                item.productId === productId && item.specId === specId
                    ? { ...item, quantity: quantity }
                    : item
            )
        );
    }

    setCart(items: CartItem[]) {
        this.cart.set(items);
    }

    clearCart() {
        this.cart.set([]);
        this.loadedProjectCartId.set(null);
    }

    async getMyProjectOrder(projectId: string) {
        try {
            const res = await this.client.getMyProjectOrder({ projectId });
            if (res.order) {
                this.existingOrderId.set(res.order.id);
                return res.order;
            }
        } catch (err) {
            // Ignore error if not found? Or log it?
            // Permission denied = not logged in?
            console.error('Failed to get my order', err);
        }
        this.existingOrderId.set(null);
        return null;
    }

    // Track which project's cart is loaded to prevent overwrites
    loadedProjectCartId = signal<string | null>(null);

    // Track the active order state
    myProjectOrder = signal<Order | null>(null);

    async loadExistingOrderIntoCart(projectId: string) {
        // Always fetch the latest order state first
        const order = await this.getMyProjectOrder(projectId);
        this.myProjectOrder.set(order || null);

        // If we already loaded the cart for this project, don't overwrite local edits
        if (this.loadedProjectCartId() === projectId) {
            return order;
        }

        if (order && order.paymentStatus < 2) {
            // Map to Cart items
            const cartItems: CartItem[] = order.items.map((i: OrderItem) => ({
                projectId: order.projectId,
                productId: i.productId,
                specId: i.specId,
                quantity: i.quantity,
                productName: i.productName,
                specName: i.specName,
                price: Number(i.price),
                maxQuantity: 100
            }));
            this.setCart(cartItems);
            // Sync loaded ID
            this.loadedProjectCartId.set(projectId);
            return order;
        }

        // If no existing order, or order is submitted/finished, and we are switching projects, we MUST clear the previous cart
        this.clearCart();
        this.loadedProjectCartId.set(projectId);
        return order;
    }

    // Force load an order into cart for editing (even if status is submitted)
    editSubmittedOrder() {
        const order = this.myProjectOrder();
        if (order) {
            const cartItems: CartItem[] = order.items.map((i: OrderItem) => ({
                projectId: order.projectId,
                productId: i.productId,
                specId: i.specId,
                quantity: i.quantity,
                productName: i.productName,
                specName: i.specName,
                price: Number(i.price),
                maxQuantity: 100
            }));
            this.setCart(cartItems);
            // We don't need to change loadedProjectCartId if it's already set or matches
        }
    }

    async submitOrder(projectId: string, contactInfo: string, shippingAddress: string, items: CartItem[], shippingMethodId?: string, note?: string) {
        this.isSubmittingOrder.set(true);
        this.submitOrderError.set(null);
        try {
            // Map items
            const orderItems = items.map(i => new CreateOrderItem({
                productId: i.productId,
                specId: i.specId,
                quantity: i.quantity
            }));

            const startId = this.existingOrderId();
            let orderId = '';

            if (startId) {
                // Update Order
                // If items changed, we update items.
                // We also pass the note if available.
                const res = await this.client.updateOrder({
                    orderId: startId,
                    items: orderItems,
                    note: note
                });
                orderId = res.order!.id;

                await this.client.updatePaymentInfo({
                    orderId: startId,
                    contactInfo,
                    shippingAddress
                });

            } else {
                // Create Order
                const res = await this.client.createOrder({
                    projectId,
                    items: orderItems,
                    contactInfo,
                    shippingAddress,
                    shippingMethodId,
                    note
                });
                orderId = res.orderId;
            }

            // Refresh the local order state to ensure UI reflects changes immediately
            const freshOrder = await this.getMyProjectOrder(projectId);
            this.myProjectOrder.set(freshOrder || null);

            // Refresh global store state
            this.loadMyOrders();

            this.lastCreatedOrderId.set(orderId);
            this.clearCart();
        } catch (err: any) {
            this.submitOrderError.set(err.message || 'Failed to submit order');
        } finally {
            this.isSubmittingOrder.set(false);
        }
    }

    updateUserOrder(orderId: string, items: CartItem[], note?: string) {
        this.store.dispatch(ProjectActions.updateUserOrder({ orderId, items, note }));
    }

    updatePaymentInfo(orderId: string, method: string, accountLast5: string) {
        this.store.dispatch(ProjectActions.updatePaymentInfo({ orderId, method, accountLast5 }));
    }

    createProject(title: string, description: string) {
        this.store.dispatch(ProjectActions.createProject({ title, description }));
    }

    updateProject(id: string, title: string, description: string, status: number, products: Product[], coverImage: string, deadline: Date | undefined, shippingConfigs: ShippingConfig[], managerIds?: string[], exchangeRate?: number, roundingConfig?: RoundingConfig, sourceCurrency?: string) {
        this.store.dispatch(ProjectActions.updateProject({ id, title, description, status, products, coverImage, deadline, shippingConfigs, managerIds, exchangeRate, roundingConfig, sourceCurrency }));
    }

    addProduct(projectId: string, name: string, priceOriginal: number, exchangeRate: number, specs: string[]) {
        this.store.dispatch(ProjectActions.addProduct({ projectId, name, priceOriginal, exchangeRate, specs }));
    }

    async updateOrder(orderId: string, items: CreateOrderItem[], note?: string) {
        try {
            await this.client.updateOrder({ orderId, items, note });
        } catch (err: any) {
            throw new Error(err.message || 'Failed to update order');
        }
    }

    async updatePaymentInfoAsync(orderId: string, method: string, accountLast5: string, contactInfo?: string, shippingAddress?: string, paidAt?: Date | null, amount?: number) {
        try {
            await this.client.updatePaymentInfo({
                orderId,
                method,
                accountLast5,
                contactInfo,
                shippingAddress,
                paidAt: paidAt ? { seconds: BigInt(Math.floor(paidAt.getTime() / 1000)) } as any : undefined,
                amount: amount ? BigInt(amount) : undefined
            });
        } catch (err: any) {
            throw new Error(err.message || 'Failed to update payment info');
        }
    }

    // Category Methods
    async createCategory(name: string, specNames: string[]) {
        return await this.client.createCategory({ name, specNames });
    }

    async listCategories() {
        const res = await this.client.listCategories({});
        return res.categories;
    }

    // Price Template Methods
    async createPriceTemplate(name: string, sourceCurrency: string, exchangeRate: number, roundingConfig?: RoundingConfig) {
        const res = await this.client.createPriceTemplate({
            name,
            sourceCurrency,
            exchangeRate,
            roundingConfig
        });
        return res.template;
    }

    async listPriceTemplates() {
        const res = await this.client.listPriceTemplates({});
        return res.templates;
    }

    async getPriceTemplate(templateId: string) {
        const res = await this.client.getPriceTemplate({ templateId });
        return res.template;
    }

    async updatePriceTemplate(templateId: string, name?: string, sourceCurrency?: string, exchangeRate?: number, roundingConfig?: RoundingConfig) {
        const res = await this.client.updatePriceTemplate({
            templateId,
            name,
            sourceCurrency,
            exchangeRate,
            roundingConfig
        });
        return res.template;
    }

    async deletePriceTemplate(templateId: string) {
        return await this.client.deletePriceTemplate({ templateId });
    }
}
