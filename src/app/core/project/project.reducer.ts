import { createReducer, on } from '@ngrx/store';
import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { Project, Product, Order } from '../api/api/v1/project_pb';
import { ProjectActions, CartItem } from './project.actions';

export interface ProjectState extends EntityState<Project> {
    // Collection State
    loadingList: boolean;
    listError: string | null;

    // Detail State
    selectedProjectId: string | null;
    currentProjectProducts: Product[];
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

export const adapter = createEntityAdapter<Project>();

export const initialState: ProjectState = adapter.getInitialState({
    loadingList: false,
    listError: null,
    selectedProjectId: null,
    currentProjectProducts: [],
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

export const projectReducer = createReducer(
    initialState,
    // Load List
    on(ProjectActions.loadProjects, (state) => ({ ...state, loadingList: true, listError: null })),
    on(ProjectActions.loadProjectsSuccess, (state, { projects }) =>
        adapter.setAll(projects, { ...state, loadingList: false })
    ),
    on(ProjectActions.loadProjectsFailure, (state, { error }) => ({ ...state, loadingList: false, listError: error })),

    // Load Detail
    on(ProjectActions.loadProjectDetail, (state, { id }) => ({
        ...state,
        selectedProjectId: id,
        loadingDetail: true,
        detailError: null,
        // Optional: Clear products when loading new detail or keep? Let's clear to avoid stale data.
        currentProjectProducts: []
    })),
    on(ProjectActions.loadProjectDetailSuccess, (state, { project, products }) =>
        adapter.upsertOne(project, {
            ...state,
            loadingDetail: false,
            currentProjectProducts: products
        })
    ),
    on(ProjectActions.loadProjectDetailFailure, (state, { error }) => ({ ...state, loadingDetail: false, detailError: error })),

    // Cart
    on(ProjectActions.addToCart, (state, { item }) => {
        const existingItem = state.cart.find(i => i.productId === item.productId && i.specId === item.specId);
        if (existingItem) {
            // Update quantity
            return {
                ...state,
                cart: state.cart.map(i =>
                    (i.productId === item.productId && i.specId === item.specId)
                        ? { ...i, quantity: i.quantity + item.quantity }
                        : i
                )
            };
        }
        return { ...state, cart: [...state.cart, item] };
    }),
    on(ProjectActions.removeFromCart, (state, { productId, specId }) => ({
        ...state,
        cart: state.cart.filter(i => !(i.productId === productId && i.specId === specId))
    })),
    on(ProjectActions.updateCartQuantity, (state, { productId, specId, quantity }) => ({
        ...state,
        cart: state.cart.map(i =>
            (i.productId === productId && i.specId === specId)
                ? { ...i, quantity }
                : i
        )
    })),
    on(ProjectActions.clearCart, (state) => ({ ...state, cart: [] })),

    // Submit Order
    on(ProjectActions.submitOrder, (state) => ({ ...state, submittingOrder: true, submitOrderError: null, lastCreatedOrderId: null })),
    on(ProjectActions.submitOrderSuccess, (state, { orderId }) => ({ ...state, submittingOrder: false, cart: [], lastCreatedOrderId: orderId })), // Clear cart on success
    on(ProjectActions.submitOrderFailure, (state, { error }) => ({ ...state, submittingOrder: false, submitOrderError: error })),

    // My Orders
    on(ProjectActions.loadMyOrders, (state) => ({ ...state, loadingMyOrders: true, myOrdersError: null })),
    on(ProjectActions.loadMyOrdersSuccess, (state, { orders }) => ({ ...state, loadingMyOrders: false, myOrders: orders })),
    on(ProjectActions.loadMyOrdersFailure, (state, { error }) => ({ ...state, loadingMyOrders: false, myOrdersError: error })),

    // Update User Order / Payment
    on(ProjectActions.updateUserOrder, (state) => ({ ...state, updatingOrder: true, updateOrderError: null })),
    on(ProjectActions.updateUserOrderSuccess, (state, { order }) => ({
        ...state,
        updatingOrder: false,
        // Update the order in myOrders list
        myOrders: state.myOrders.map(o => o.id === order.id ? order : o)
    })),
    on(ProjectActions.updateUserOrderFailure, (state, { error }) => ({ ...state, updatingOrder: false, updateOrderError: error })),

    on(ProjectActions.updatePaymentInfo, (state) => ({ ...state, updatingOrder: true, updateOrderError: null })), // Re-use updatingOrder state or create separate? Re-use is fine.
    on(ProjectActions.updatePaymentInfoSuccess, (state, { order }) => ({
        ...state,
        updatingOrder: false,
        myOrders: state.myOrders.map(o => o.id === order.id ? order : o)
    })),
    on(ProjectActions.updatePaymentInfoFailure, (state, { error }) => ({ ...state, updatingOrder: false, updateOrderError: error })),


    // Create/Update Actions
    on(ProjectActions.createProject, (state) => ({ ...state, actionLoading: true, actionError: null })),
    on(ProjectActions.createProjectSuccess, (state, { project }) =>
        adapter.addOne(project, { ...state, actionLoading: false })
    ),
    on(ProjectActions.createProjectFailure, (state, { error }) => ({ ...state, actionLoading: false, actionError: error })),

    on(ProjectActions.updateProject, (state) => ({ ...state, actionLoading: true, actionError: null })),
    on(ProjectActions.updateProjectSuccess, (state, { project }) =>
        adapter.upsertOne(project, { ...state, actionLoading: false })
    ),
    on(ProjectActions.updateProjectFailure, (state, { error }) => ({ ...state, actionLoading: false, actionError: error })),

    // Add Product
    on(ProjectActions.addProduct, (state) => ({ ...state, actionLoading: true, actionError: null })),
    on(ProjectActions.addProductSuccess, (state, { product }) => ({
        ...state,
        actionLoading: false,
        currentProjectProducts: [...state.currentProjectProducts, product]
    })),
    on(ProjectActions.addProductFailure, (state, { error }) => ({ ...state, actionLoading: false, actionError: error })),
);
