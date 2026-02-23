import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Timestamp } from '@bufbuild/protobuf';
import { createPromiseClient, Transport } from '@connectrpc/connect';

import {
  GroupBuy,
  Product,
  ProductSpec,
  CreateOrderItem,
  Order,
  ShippingConfig,
  RoundingConfig,
  RoundingMethod,
} from '../api/api/v1/groupbuy_pb';
import { GroupBuyService as ProjectServiceDef } from '../api/api/v1/groupbuy_connect';
import { TransportToken } from '../providers/transport.token';
import { AuthService } from '../auth/auth.service';
import { orderToCartItems, cartItemsToOrderItems } from './groupbuy.mapper';
import { paginateAll } from '../utils/paginate-all';
import { CartItem } from './cart-item.model';

export type { CartItem };

@Injectable({ providedIn: 'root' })
export class GroupBuyService {
  private transport = inject(TransportToken) as Transport;
  private client = createPromiseClient(ProjectServiceDef, this.transport);
  private authService = inject(AuthService);

  // ── GroupBuy list ──────────────────────────────────────────────
  readonly groupBuys = signal<GroupBuy[]>([]);
  readonly isLoadingList = signal(false);
  readonly listError = signal<string | null>(null);

  // ── GroupBuy detail ────────────────────────────────────────────
  readonly currentGroupBuy = signal<GroupBuy | null>(null);
  readonly currentProducts = signal<Product[]>([]);
  readonly isLoadingDetail = signal(false);
  readonly detailError = signal<string | null>(null);

  // ── Manager view ───────────────────────────────────────────────
  readonly managerGroupBuys = signal<GroupBuy[]>([]);

  // ── Cart ───────────────────────────────────────────────────────
  readonly cart = signal<CartItem[]>([]);
  readonly cartCount = computed(() => this.cart().reduce((acc, i) => acc + i.quantity, 0));
  readonly cartTotal = computed(() =>
    this.cart().reduce((acc, i) => acc + i.price * i.quantity, 0),
  );

  // ── Order state ────────────────────────────────────────────────
  readonly myOrders = signal<Order[]>([]);
  readonly loadingMyOrders = signal(false);
  readonly myOrdersError = signal<string | null>(null);

  readonly isSubmittingOrder = signal(false);
  readonly submitOrderError = signal<string | null>(null);
  readonly lastCreatedOrderId = signal<string | null>(null);

  readonly updatingOrder = signal(false);
  readonly updateOrderError = signal<string | null>(null);

  // ── Action state (create/update GB) ───────────────────────────
  readonly isActionLoading = signal(false);
  readonly actionError = signal<string | null>(null);

  // ── Cart tracking ──────────────────────────────────────────────
  readonly loadedGroupBuyCartId = signal<string | null>(null);
  readonly myGroupBuyOrder = signal<Order | null>(null);
  readonly existingOrderId = signal<string | null>(null);

  constructor() {
    // Clear cart & order state on logout
    effect(() => {
      if (!this.authService.user()) {
        this.clearCart();
        this.myGroupBuyOrder.set(null);
        this.existingOrderId.set(null);
        this.loadedGroupBuyCartId.set(null);
      }
    });
  }

  // ────────────────────────────────────────────────────────────────
  // GroupBuy CRUD
  // ────────────────────────────────────────────────────────────────

  async loadGroupBuys(): Promise<void> {
    this.isLoadingList.set(true);
    this.listError.set(null);
    try {
      const all = await paginateAll(
        (pageToken) => this.client.listGroupBuys({ pageSize: 100, pageToken }),
        (res) => res.groupBuys,
      );
      this.groupBuys.set(all);
    } catch (err: any) {
      this.listError.set(err.message || 'Failed to load group buys');
    } finally {
      this.isLoadingList.set(false);
    }
  }

  async loadGroupBuy(id: string): Promise<void> {
    this.isLoadingDetail.set(true);
    this.detailError.set(null);
    this.currentProducts.set([]);
    try {
      const res = await this.client.getGroupBuy({ groupBuyId: id });
      if (!res.groupBuy) throw new Error('Project not found');
      this.currentGroupBuy.set(res.groupBuy);
      this.currentProducts.set(res.products);
    } catch (err: any) {
      this.detailError.set(err.message || 'Failed to load group buy');
    } finally {
      this.isLoadingDetail.set(false);
    }
  }

  async loadManagerProjects(): Promise<void> {
    const all = await paginateAll(
      (pageToken) => this.client.listManagerGroupBuys({ pageSize: 100, pageToken }),
      (res) => res.groupBuys,
    );
    this.managerGroupBuys.set(all);
  }

  async createGroupBuy(
    title: string,
    description: string,
    products: Product[],
    coverImage: string,
    deadline: Date | undefined,
    shippingConfigs: ShippingConfig[],
    managerIds: string[],
    exchangeRate: number,
    roundingConfig: RoundingConfig | undefined,
    sourceCurrency: string,
  ): Promise<GroupBuy | null> {
    this.isActionLoading.set(true);
    this.actionError.set(null);
    try {
      const res = await this.client.createGroupBuy({
        title,
        description,
        products,
        coverImageUrl: coverImage,
        deadline: deadline ? Timestamp.fromDate(deadline) : undefined,
        shippingConfigs,
        managerIds,
        exchangeRate,
        roundingConfig,
        sourceCurrency,
      });
      if (!res.groupBuy) throw new Error('No project returned');
      this.groupBuys.update((prev) => [...prev, res.groupBuy!]);
      return res.groupBuy;
    } catch (err: any) {
      this.actionError.set(err.message || 'Failed to create group buy');
      return null;
    } finally {
      this.isActionLoading.set(false);
    }
  }

  async updateGroupBuy(
    id: string,
    title: string,
    description: string,
    status: number,
    products: Product[],
    coverImage: string,
    deadline: Date | undefined,
    shippingConfigs: ShippingConfig[],
    managerIds?: string[],
    exchangeRate?: number,
    roundingConfig?: RoundingConfig,
    sourceCurrency?: string,
  ): Promise<GroupBuy | null> {
    this.isActionLoading.set(true);
    this.actionError.set(null);
    try {
      const res = await this.client.updateGroupBuy({
        groupBuyId: id,
        title,
        description,
        status,
        products,
        coverImageUrl: coverImage,
        deadline: deadline ? Timestamp.fromDate(deadline) : undefined,
        shippingConfigs,
        managerIds,
        exchangeRate,
        roundingConfig,
        sourceCurrency,
      });
      if (!res.groupBuy) throw new Error('No project returned');
      this.groupBuys.update((prev) =>
        prev.map((gb) => (gb.id === id ? res.groupBuy! : gb)),
      );
      if (this.currentGroupBuy()?.id === id) {
        this.currentGroupBuy.set(res.groupBuy);
      }
      return res.groupBuy;
    } catch (err: any) {
      this.actionError.set(err.message || 'Failed to update group buy');
      return null;
    } finally {
      this.isActionLoading.set(false);
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Cart
  // ────────────────────────────────────────────────────────────────

  addToCart(product: Product, spec: ProductSpec | undefined, quantity: number): void {
    if (quantity <= 0) return;

    const currentCart = this.cart();
    if (currentCart.length > 0 && currentCart[0].groupBuyId !== product.groupBuyId) {
      this.clearCart();
    }

    const freshCart = this.cart();
    const existingIndex = freshCart.findIndex(
      (item) => item.productId === product.id && item.specId === (spec?.id || ''),
    );
    const price = Number(product.priceFinal);

    if (existingIndex > -1) {
      const updated = [...freshCart];
      const newQty = updated[existingIndex].quantity + quantity;
      if (newQty > 0) {
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        this.cart.set(updated);
      }
    } else {
      const newItem: CartItem = {
        groupBuyId: product.groupBuyId,
        productId: product.id,
        specId: spec?.id || '',
        productName: product.name,
        specName: spec?.name || '',
        price,
        quantity,
        maxQuantity: product.maxQuantity,
      };
      this.cart.set([...freshCart, newItem]);
    }
  }

  removeFromCart(productId: string, specId: string): void {
    this.cart.set(
      this.cart().filter((item) => !(item.productId === productId && item.specId === specId)),
    );
  }

  updateCartQuantity(productId: string, specId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId, specId);
      return;
    }
    this.cart.set(
      this.cart().map((item) =>
        item.productId === productId && item.specId === specId
          ? { ...item, quantity }
          : item,
      ),
    );
  }

  setCart(items: CartItem[]): void {
    this.cart.set(items);
  }

  clearCart(): void {
    this.cart.set([]);
    this.loadedGroupBuyCartId.set(null);
  }

  // ────────────────────────────────────────────────────────────────
  // Orders
  // ────────────────────────────────────────────────────────────────

  async loadMyOrders(): Promise<void> {
    this.loadingMyOrders.set(true);
    this.myOrdersError.set(null);
    try {
      const res = await this.client.getMyOrders({});
      this.myOrders.set(res.orders);
    } catch (err: any) {
      this.myOrdersError.set(err.message || 'Failed to load orders');
    } finally {
      this.loadingMyOrders.set(false);
    }
  }

  async getMyGroupBuyOrder(groupBuyId: string): Promise<Order | null> {
    if (!this.authService.isAuthenticated()) {
      this.existingOrderId.set(null);
      return null;
    }
    try {
      const res = await this.client.getMyGroupBuyOrder({ groupBuyId });
      if (res.order) {
        this.existingOrderId.set(res.order.id);
        return res.order;
      }
    } catch (err) {
      console.error('Failed to get my order', err);
    }
    this.existingOrderId.set(null);
    return null;
  }

  async loadExistingOrderIntoCart(groupBuyId: string): Promise<Order | null> {
    const order = await this.getMyGroupBuyOrder(groupBuyId);
    this.myGroupBuyOrder.set(order || null);

    if (this.loadedGroupBuyCartId() === groupBuyId) return order;

    if (order && order.paymentStatus < 2) {
      this.setCart(orderToCartItems(order));
      this.loadedGroupBuyCartId.set(groupBuyId);
      return order;
    }

    this.clearCart();
    this.loadedGroupBuyCartId.set(groupBuyId);
    return order;
  }

  editSubmittedOrder(): void {
    const order = this.myGroupBuyOrder();
    if (order) {
      this.setCart(orderToCartItems(order));
    }
  }

  async submitOrder(
    groupBuyId: string,
    contactInfo: string,
    shippingAddress: string,
    items: CartItem[],
    shippingMethodId?: string,
    note?: string,
  ): Promise<void> {
    this.isSubmittingOrder.set(true);
    this.submitOrderError.set(null);
    try {
      const orderItems = items.map(
        (i) => new CreateOrderItem({ productId: i.productId, specId: i.specId, quantity: i.quantity }),
      );
      const startId = this.existingOrderId();
      let orderId = '';

      if (startId) {
        const res = await this.client.updateOrder({ orderId: startId, items: orderItems, note });
        orderId = res.order!.id;
        await this.client.updatePaymentInfo({ orderId: startId, contactInfo, shippingAddress });
      } else {
        const res = await this.client.createOrder({
          groupBuyId,
          items: orderItems,
          contactInfo,
          shippingAddress,
          shippingMethodId,
          note,
        });
        orderId = res.orderId;
      }

      const freshOrder = await this.getMyGroupBuyOrder(groupBuyId);
      this.myGroupBuyOrder.set(freshOrder || null);
      await this.loadMyOrders();
      this.lastCreatedOrderId.set(orderId);
      this.clearCart();
    } catch (err: any) {
      this.submitOrderError.set(err.message || 'Failed to submit order');
    } finally {
      this.isSubmittingOrder.set(false);
    }
  }

  async updateUserOrder(orderId: string, items: CartItem[], note?: string): Promise<void> {
    this.updatingOrder.set(true);
    this.updateOrderError.set(null);
    try {
      const orderItems = cartItemsToOrderItems(items);
      const res = await this.client.updateOrder({ orderId, items: orderItems, note });
      if (!res.order) throw new Error('No order returned');
      this.myOrders.update((prev) => prev.map((o) => (o.id === res.order!.id ? res.order! : o)));
    } catch (err: any) {
      this.updateOrderError.set(err.message || 'Failed to update order');
    } finally {
      this.updatingOrder.set(false);
    }
  }

  async updatePaymentInfo(orderId: string, method: string, accountLast5: string): Promise<void> {
    this.updatingOrder.set(true);
    this.updateOrderError.set(null);
    try {
      const res = await this.client.updatePaymentInfo({ orderId, method, accountLast5 });
      if (res.order) {
        this.myOrders.update((prev) => prev.map((o) => (o.id === res.order!.id ? res.order! : o)));
      }
    } catch (err: any) {
      this.updateOrderError.set(err.message || 'Failed to update payment info');
    } finally {
      this.updatingOrder.set(false);
    }
  }

  async updateOrder(orderId: string, items: CreateOrderItem[], note?: string): Promise<void> {
    await this.client.updateOrder({ orderId, items, note }).catch((err: any) => {
      throw new Error(err.message || 'Failed to update order');
    });
  }

  async updatePaymentInfoAsync(
    orderId: string,
    method: string,
    accountLast5: string,
    contactInfo?: string,
    shippingAddress?: string,
    paidAt?: Date | null,
    amount?: number,
  ): Promise<void> {
    await this.client.updatePaymentInfo({
      orderId,
      method,
      accountLast5,
      contactInfo,
      shippingAddress,
      paidAt: paidAt ? ({ seconds: BigInt(Math.floor(paidAt.getTime() / 1000)) } as any) : undefined,
      amount: amount ? BigInt(amount) : undefined,
    }).catch((err: any) => {
      throw new Error(err.message || 'Failed to update payment info');
    });
  }

  // ────────────────────────────────────────────────────────────────
  // Products
  // ────────────────────────────────────────────────────────────────

  async addProduct(
    groupBuyId: string,
    name: string,
    priceOriginal: number,
    exchangeRate: number,
    specs: string[],
  ): Promise<void> {
    this.isActionLoading.set(true);
    this.actionError.set(null);
    try {
      const res = await this.client.addProduct({
        groupBuyId,
        name,
        priceOriginal: BigInt(priceOriginal),
        exchangeRate,
        specs,
        roundingConfig: new RoundingConfig({ method: RoundingMethod.CEIL, digit: 100 }),
      });
      if (!res.product) throw new Error('No product returned');
      this.currentProducts.update((prev) => [...prev, res.product!]);
    } catch (err: any) {
      this.actionError.set(err.message || 'Failed to add product');
    } finally {
      this.isActionLoading.set(false);
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Categories
  // ────────────────────────────────────────────────────────────────

  async createCategory(name: string, specNames: string[]) {
    return this.client.createCategory({ name, specNames });
  }

  async listCategories() {
    const res = await this.client.listCategories({});
    return res.categories;
  }

  // ────────────────────────────────────────────────────────────────
  // Price Templates
  // ────────────────────────────────────────────────────────────────

  async createPriceTemplate(
    name: string,
    sourceCurrency: string,
    exchangeRate: number,
    roundingConfig?: RoundingConfig,
  ) {
    const res = await this.client.createPriceTemplate({ name, sourceCurrency, exchangeRate, roundingConfig });
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

  async updatePriceTemplate(
    templateId: string,
    name?: string,
    sourceCurrency?: string,
    exchangeRate?: number,
    roundingConfig?: RoundingConfig,
  ) {
    const res = await this.client.updatePriceTemplate({ templateId, name, sourceCurrency, exchangeRate, roundingConfig });
    return res.template;
  }

  async deletePriceTemplate(templateId: string) {
    return this.client.deletePriceTemplate({ templateId });
  }
}
