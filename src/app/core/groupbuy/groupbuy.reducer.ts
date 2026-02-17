import { createReducer, on } from '@ngrx/store';
import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { GroupBuy, Product, Order } from '../api/api/v1/groupbuy_pb';
import { GroupBuyActions, CartItem } from './groupbuy.actions';

export interface GroupBuyState extends EntityState<GroupBuy> {
  // Collection State
  loadingList: boolean;
  listError: string | null;

  // Detail State
  selectedGroupBuyId: string | null;
  currentGroupBuyProducts: Product[];
  loadingDetail: boolean;
  detailError: string | null;

  // Cart State
  cart: CartItem[];

  // Order State
  submittingOrder: boolean;
  submitOrderError: string | null;
  lastCreatedOrderId: string | null;

  // My Orders
  myOrders: Order[];
  loadingMyOrders: boolean;
  myOrdersError: string | null;

  // Update Order State
  updatingOrder: boolean;
  updateOrderError: string | null;

  // Action State (Create/Update)
  actionLoading: boolean;
  actionError: string | null;
}

export const adapter = createEntityAdapter<GroupBuy>();

export const initialState: GroupBuyState = adapter.getInitialState({
  loadingList: false,
  listError: null,
  selectedGroupBuyId: null,
  currentGroupBuyProducts: [],
  loadingDetail: false,
  detailError: null,
  cart: [],
  submittingOrder: false,
  submitOrderError: null,
  lastCreatedOrderId: null,

  myOrders: [],
  loadingMyOrders: false,
  myOrdersError: null,
  updatingOrder: false,
  updateOrderError: null,

  actionLoading: false,
  actionError: null,
});

export const groupBuyReducer = createReducer(
  initialState,
  // Load List
  on(GroupBuyActions.loadGroupBuys, (state) => ({ ...state, loadingList: true, listError: null })),
  on(GroupBuyActions.loadGroupBuysSuccess, (state, { groupBuys }) =>
    adapter.setAll(groupBuys, { ...state, loadingList: false }),
  ),
  on(GroupBuyActions.loadGroupBuysFailure, (state, { error }) => ({
    ...state,
    loadingList: false,
    listError: error,
  })),

  // Load Detail
  on(GroupBuyActions.loadGroupBuyDetail, (state, { id }) => ({
    ...state,
    selectedGroupBuyId: id,
    loadingDetail: true,
    detailError: null,
    // Optional: Clear products when loading new detail or keep? Let's clear to avoid stale data.
    currentGroupBuyProducts: [],
  })),
  on(GroupBuyActions.loadGroupBuyDetailSuccess, (state, { groupBuy, products }) =>
    adapter.upsertOne(groupBuy, {
      ...state,
      loadingDetail: false,
      currentGroupBuyProducts: products,
    }),
  ),
  on(GroupBuyActions.loadGroupBuyDetailFailure, (state, { error }) => ({
    ...state,
    loadingDetail: false,
    detailError: error,
  })),

  // Cart
  on(GroupBuyActions.addToCart, (state, { item }) => {
    const existingItem = state.cart.find(
      (i) => i.productId === item.productId && i.specId === item.specId,
    );
    if (existingItem) {
      // Update quantity
      return {
        ...state,
        cart: state.cart.map((i) =>
          i.productId === item.productId && i.specId === item.specId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i,
        ),
      };
    }
    return { ...state, cart: [...state.cart, item] };
  }),
  on(GroupBuyActions.removeFromCart, (state, { productId, specId }) => ({
    ...state,
    cart: state.cart.filter((i) => !(i.productId === productId && i.specId === specId)),
  })),
  on(GroupBuyActions.updateCartQuantity, (state, { productId, specId, quantity }) => ({
    ...state,
    cart: state.cart.map((i) =>
      i.productId === productId && i.specId === specId ? { ...i, quantity } : i,
    ),
  })),
  on(GroupBuyActions.clearCart, (state) => ({ ...state, cart: [] })),

  // Submit Order
  on(GroupBuyActions.submitOrder, (state) => ({
    ...state,
    submittingOrder: true,
    submitOrderError: null,
    lastCreatedOrderId: null,
  })),
  on(GroupBuyActions.submitOrderSuccess, (state, { orderId }) => ({
    ...state,
    submittingOrder: false,
    cart: [],
    lastCreatedOrderId: orderId,
  })), // Clear cart on success
  on(GroupBuyActions.submitOrderFailure, (state, { error }) => ({
    ...state,
    submittingOrder: false,
    submitOrderError: error,
  })),

  // My Orders
  on(GroupBuyActions.loadMyOrders, (state) => ({
    ...state,
    loadingMyOrders: true,
    myOrdersError: null,
  })),
  on(GroupBuyActions.loadMyOrdersSuccess, (state, { orders }) => ({
    ...state,
    loadingMyOrders: false,
    myOrders: orders,
  })),
  on(GroupBuyActions.loadMyOrdersFailure, (state, { error }) => ({
    ...state,
    loadingMyOrders: false,
    myOrdersError: error,
  })),

  // Update User Order / Payment
  on(GroupBuyActions.updateUserOrder, (state) => ({
    ...state,
    updatingOrder: true,
    updateOrderError: null,
  })),
  on(GroupBuyActions.updateUserOrderSuccess, (state, { order }) => ({
    ...state,
    updatingOrder: false,
    // Update the order in myOrders list
    myOrders: state.myOrders.map((o) => (o.id === order.id ? order : o)),
  })),
  on(GroupBuyActions.updateUserOrderFailure, (state, { error }) => ({
    ...state,
    updatingOrder: false,
    updateOrderError: error,
  })),

  on(GroupBuyActions.updatePaymentInfo, (state) => ({
    ...state,
    updatingOrder: true,
    updateOrderError: null,
  })), // Re-use updatingOrder state or create separate? Re-use is fine.
  on(GroupBuyActions.updatePaymentInfoSuccess, (state, { order }) => ({
    ...state,
    updatingOrder: false,
    myOrders: state.myOrders.map((o) => (o.id === order.id ? order : o)),
  })),
  on(GroupBuyActions.updatePaymentInfoFailure, (state, { error }) => ({
    ...state,
    updatingOrder: false,
    updateOrderError: error,
  })),

  // Create/Update Actions
  on(GroupBuyActions.createGroupBuy, (state) => ({
    ...state,
    actionLoading: true,
    actionError: null,
  })),
  on(GroupBuyActions.createGroupBuySuccess, (state, { groupBuy }) =>
    adapter.addOne(groupBuy, { ...state, actionLoading: false }),
  ),
  on(GroupBuyActions.createGroupBuyFailure, (state, { error }) => ({
    ...state,
    actionLoading: false,
    actionError: error,
  })),

  on(GroupBuyActions.updateGroupBuy, (state) => ({
    ...state,
    actionLoading: true,
    actionError: null,
  })),
  on(GroupBuyActions.updateGroupBuySuccess, (state, { groupBuy }) =>
    adapter.upsertOne(groupBuy, { ...state, actionLoading: false }),
  ),
  on(GroupBuyActions.updateGroupBuyFailure, (state, { error }) => ({
    ...state,
    actionLoading: false,
    actionError: error,
  })),

  // Add Product
  on(GroupBuyActions.addProduct, (state) => ({ ...state, actionLoading: true, actionError: null })),
  on(GroupBuyActions.addProductSuccess, (state, { product }) => ({
    ...state,
    actionLoading: false,
    currentGroupBuyProducts: [...state.currentGroupBuyProducts, product],
  })),
  on(GroupBuyActions.addProductFailure, (state, { error }) => ({
    ...state,
    actionLoading: false,
    actionError: error,
  })),
);
