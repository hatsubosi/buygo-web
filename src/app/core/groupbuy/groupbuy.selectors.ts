import { createFeatureSelector, createSelector } from '@ngrx/store';
import { GroupBuyState, adapter } from './groupbuy.reducer';

export const selectGroupBuyState = createFeatureSelector<GroupBuyState>('groupbuy');

const { selectAll, selectEntities } = adapter.getSelectors(selectGroupBuyState);

export const selectAllGroupBuys = selectAll;

export const selectGroupBuysLoading = createSelector(selectGroupBuyState, (state) => state.loadingList);
export const selectGroupBuysError = createSelector(selectGroupBuyState, (state) => state.listError);

export const selectSelectedGroupBuyId = createSelector(selectGroupBuyState, (state) => state.selectedGroupBuyId);

export const selectCurrentGroupBuy = createSelector(
    selectEntities,
    selectSelectedGroupBuyId,
    (entities, id) => (id ? entities[id] || null : null)
);

export const selectGroupBuyDetailLoading = createSelector(selectGroupBuyState, (state) => state.loadingDetail);

export const selectCurrentGroupBuyProducts = createSelector(selectGroupBuyState, (state) => state.currentGroupBuyProducts);

export const selectCart = createSelector(selectGroupBuyState, (state) => state.cart);

export const selectCartCount = createSelector(selectCart, (cart) =>
    cart.reduce((total, item) => total + item.quantity, 0)
);

export const selectCartTotal = createSelector(selectCart, (cart) =>
    cart.reduce((total, item) => total + (item.price * item.quantity), 0)
);

export const selectIsSubmittingOrder = createSelector(selectGroupBuyState, (state) => state.submittingOrder);
export const selectSubmitOrderError = createSelector(selectGroupBuyState, (state) => state.submitOrderError);
export const selectLastCreatedOrderId = createSelector(selectGroupBuyState, (state) => state.lastCreatedOrderId);

export const selectMyOrders = createSelector(selectGroupBuyState, (state) => state.myOrders);
export const selectLoadingMyOrders = createSelector(selectGroupBuyState, (state) => state.loadingMyOrders);
export const selectMyOrdersError = createSelector(selectGroupBuyState, (state) => state.myOrdersError);

export const selectUpdatingOrder = createSelector(selectGroupBuyState, (state) => state.updatingOrder);
export const selectUpdateOrderError = createSelector(selectGroupBuyState, (state) => state.updateOrderError);

export const selectActionLoading = createSelector(selectGroupBuyState, (state) => state.actionLoading);
export const selectActionError = createSelector(selectGroupBuyState, (state) => state.actionError);
