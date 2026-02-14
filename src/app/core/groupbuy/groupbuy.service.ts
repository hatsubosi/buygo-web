import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Store } from '@ngrx/store';
import { GroupBuyActions, CartItem } from './groupbuy.actions';
import { GroupBuy, Product, ProductSpec, CreateOrderItem, Order, OrderItem, ShippingConfig, RoundingConfig } from '../api/api/v1/groupbuy_pb';
import { createPromiseClient, Transport } from '@connectrpc/connect';
import { TransportToken } from '../providers/transport.token';
import { GroupBuyService as ProjectServiceDef } from '../api/api/v1/groupbuy_connect';
import { AuthService } from '../auth/auth.service';
import {
    selectAllGroupBuys,
    selectCurrentGroupBuy,
    selectGroupBuysLoading,
    selectGroupBuyDetailLoading,
    selectCurrentGroupBuyProducts,
    selectIsSubmittingOrder,
    selectSubmitOrderError,
    selectLastCreatedOrderId,
    selectActionLoading,
    selectActionError,
    selectMyOrders,
    selectLoadingMyOrders,
    selectUpdatingOrder,
    selectUpdateOrderError
} from './groupbuy.selectors';

@Injectable({ providedIn: 'root' })
export class GroupBuyService {
    private store = inject(Store);
    private transport = inject(TransportToken) as Transport;
    private client = createPromiseClient(ProjectServiceDef, this.transport);

    // Signals
    groupBuys = this.store.selectSignal(selectAllGroupBuys);
    currentGroupBuy = this.store.selectSignal(selectCurrentGroupBuy);
    isLoadingList = this.store.selectSignal(selectGroupBuysLoading);

    // Actions (Create/Update)
    isActionLoading = this.store.selectSignal(selectActionLoading);
    actionError = this.store.selectSignal(selectActionError);

    // Detail & Products
    isLoadingDetail = this.store.selectSignal(selectGroupBuyDetailLoading);
    currentProducts = this.store.selectSignal(selectCurrentGroupBuyProducts);

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

    loadGroupBuys() {
        this.store.dispatch(GroupBuyActions.loadGroupBuys());
    }

    loadMyOrders() {
        this.store.dispatch(GroupBuyActions.loadMyOrders());
    }

    // Manager State
    managerGroupBuys = signal<GroupBuy[]>([]);

    async loadManagerProjects() {
        const res = await this.client['listManagerGroupBuys']({ pageSize: 100 });
        this.managerGroupBuys.set(res.groupBuys);
    }

    loadGroupBuy(id: string) {
        this.store.dispatch(GroupBuyActions.loadGroupBuyDetail({ id }));
    }

    constructor() {
        // Clear state on logout
        const authService = inject(AuthService);
        effect(() => {
            if (!authService.user()) {
                this.clearCart();
                this.myGroupBuyOrder.set(null);
                this.existingOrderId.set(null);
                this.loadedGroupBuyCartId.set(null);
            }
        });
    }

    addToCart(product: Product, spec: ProductSpec | undefined, quantity: number) {
        if (quantity <= 0) return; // Prevent negative quantity

        const currentCart = this.cart();

        // Failsafe: If cart has items from another project, clear it first
        if (currentCart.length > 0 && currentCart[0].groupBuyId !== product.groupBuyId) {
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
                groupBuyId: product.groupBuyId,
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
        this.loadedGroupBuyCartId.set(null);
    }

    async getMyGroupBuyOrder(groupBuyId: string) {
        try {
            const res = await this.client['getMyGroupBuyOrder']({ groupBuyId });
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
    loadedGroupBuyCartId = signal<string | null>(null);

    // Track the active order state
    myGroupBuyOrder = signal<Order | null>(null);

    async loadExistingOrderIntoCart(groupBuyId: string) {
        // Always fetch the latest order state first
        const order = await this.getMyGroupBuyOrder(groupBuyId);
        this.myGroupBuyOrder.set(order || null);

        // If we already loaded the cart for this project, don't overwrite local edits
        if (this.loadedGroupBuyCartId() === groupBuyId) {
            return order;
        }

        if (order && order.paymentStatus < 2) {
            // Map to Cart items
            const cartItems: CartItem[] = order.items.map((i: OrderItem) => ({
                groupBuyId: order.groupBuyId,
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
            this.loadedGroupBuyCartId.set(groupBuyId);
            return order;
        }

        // If no existing order, or order is submitted/finished, and we are switching projects, we MUST clear the previous cart
        this.clearCart();
        this.loadedGroupBuyCartId.set(groupBuyId);
        return order;
    }

    // Force load an order into cart for editing (even if status is submitted)
    editSubmittedOrder() {
        const order = this.myGroupBuyOrder();
        if (order) {
            const cartItems: CartItem[] = order.items.map((i: OrderItem) => ({
                groupBuyId: order.groupBuyId,
                productId: i.productId,
                specId: i.specId,
                quantity: i.quantity,
                productName: i.productName,
                specName: i.specName,
                price: Number(i.price),
                maxQuantity: 100
            }));
            this.setCart(cartItems);
            // We don't need to change loadedGroupBuyCartId if it's already set or matches
        }
    }

    async submitOrder(groupBuyId: string, contactInfo: string, shippingAddress: string, items: CartItem[], shippingMethodId?: string, note?: string) {
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
                    groupBuyId,
                    items: orderItems,
                    contactInfo,
                    shippingAddress,
                    shippingMethodId,
                    note
                });
                orderId = res.orderId;
            }

            // Refresh the local order state to ensure UI reflects changes immediately
            const freshOrder = await this.getMyGroupBuyOrder(groupBuyId);
            this.myGroupBuyOrder.set(freshOrder || null);

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
        this.store.dispatch(GroupBuyActions.updateUserOrder({ orderId, items, note }));
    }

    updatePaymentInfo(orderId: string, method: string, accountLast5: string) {
        this.store.dispatch(GroupBuyActions.updatePaymentInfo({ orderId, method, accountLast5 }));
    }

    createGroupBuy(title: string, description: string) {
        this.store.dispatch(GroupBuyActions.createGroupBuy({ title, description }));
    }

    updateGroupBuy(id: string, title: string, description: string, status: number, products: Product[], coverImage: string, deadline: Date | undefined, shippingConfigs: ShippingConfig[], managerIds?: string[], exchangeRate?: number, roundingConfig?: RoundingConfig, sourceCurrency?: string) {
        this.store.dispatch(GroupBuyActions.updateGroupBuy({ id, title, description, status, products, coverImage, deadline, shippingConfigs, managerIds, exchangeRate, roundingConfig, sourceCurrency }));
    }

    addProduct(groupBuyId: string, name: string, priceOriginal: number, exchangeRate: number, specs: string[]) {
        this.store.dispatch(GroupBuyActions.addProduct({ groupBuyId, name, priceOriginal, exchangeRate, specs }));
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
