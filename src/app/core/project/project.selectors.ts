import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProjectState, adapter } from './project.reducer';

export const selectProjectState = createFeatureSelector<ProjectState>('project');

const { selectAll, selectEntities } = adapter.getSelectors(selectProjectState);

export const selectAllProjects = selectAll;

export const selectProjectsLoading = createSelector(selectProjectState, (state) => state.loadingList);
export const selectProjectsError = createSelector(selectProjectState, (state) => state.listError);

export const selectSelectedProjectId = createSelector(selectProjectState, (state) => state.selectedProjectId);

export const selectCurrentProject = createSelector(
    selectEntities,
    selectSelectedProjectId,
    (entities, id) => (id ? entities[id] || null : null)
);

export const selectProjectDetailLoading = createSelector(selectProjectState, (state) => state.loadingDetail);

export const selectCurrentProjectProducts = createSelector(selectProjectState, (state) => state.currentProjectProducts);

export const selectCart = createSelector(selectProjectState, (state) => state.cart);

export const selectCartCount = createSelector(selectCart, (cart) =>
    cart.reduce((total, item) => total + item.quantity, 0)
);

export const selectCartTotal = createSelector(selectCart, (cart) =>
    cart.reduce((total, item) => total + (item.price * item.quantity), 0)
);

export const selectIsSubmittingOrder = createSelector(selectProjectState, (state) => state.submittingOrder);
export const selectSubmitOrderError = createSelector(selectProjectState, (state) => state.submitOrderError);
export const selectLastCreatedOrderId = createSelector(selectProjectState, (state) => state.lastCreatedOrderId);

export const selectMyOrders = createSelector(selectProjectState, (state) => state.myOrders);
export const selectLoadingMyOrders = createSelector(selectProjectState, (state) => state.loadingMyOrders);
export const selectMyOrdersError = createSelector(selectProjectState, (state) => state.myOrdersError);

export const selectUpdatingOrder = createSelector(selectProjectState, (state) => state.updatingOrder);
export const selectUpdateOrderError = createSelector(selectProjectState, (state) => state.updateOrderError);

export const selectActionLoading = createSelector(selectProjectState, (state) => state.actionLoading);
export const selectActionError = createSelector(selectProjectState, (state) => state.actionError);
