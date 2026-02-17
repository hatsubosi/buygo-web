import { Routes } from '@angular/router';
import { OrderListComponent } from './order-list/order-list.component';

export const MANAGER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard/manager-dashboard.component').then((m) => m.ManagerDashboardComponent),
  },
  {
    path: 'groupbuy/create',
    loadComponent: () =>
      import('./groupbuy-form/groupbuy-form.component').then((m) => m.GroupBuyFormComponent),
  },
  {
    path: 'groupbuy/:id/products',
    loadComponent: () =>
      import('./product-list/manager-product-list.component').then(
        (m) => m.ManagerProductListComponent,
      ),
  },
  {
    path: 'groupbuy/:id',
    loadComponent: () =>
      import('./groupbuy-detail/manager-groupbuy-detail.component').then(
        (m) => m.ManagerGroupBuyDetailComponent,
      ),
  },
  {
    path: 'groupbuy/:id/edit',
    loadComponent: () =>
      import('./groupbuy-form/groupbuy-form.component').then((m) => m.GroupBuyFormComponent),
  },
  {
    path: 'groupbuy/:id/orders',
    component: OrderListComponent,
  },
  {
    path: 'groupbuy/:id/orders/:orderId',
    loadComponent: () =>
      import('./order-detail/manager-order-detail.component').then(
        (m) => m.ManagerOrderDetailComponent,
      ),
  },
  {
    path: 'groupbuy/:id/fulfillment',
    loadComponent: () =>
      import('./status-dashboard/status-dashboard.component').then(
        (m) => m.StatusDashboardComponent,
      ),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./user-list/manager-user-list.component').then((m) => m.ManagerUserListComponent),
  },
  {
    path: 'event/create',
    loadComponent: () =>
      import('./event-form/event-form.component').then((m) => m.EventFormComponent),
  },
  {
    path: 'event/:id',
    loadComponent: () =>
      import('./event-detail/manager-event-detail.component').then(
        (m) => m.ManagerEventDetailComponent,
      ),
  },
  {
    path: 'event/:id/edit',
    loadComponent: () =>
      import('./event-form/event-form.component').then((m) => m.EventFormComponent),
  },
  {
    path: 'event/:id/items',
    loadComponent: () =>
      import('./event-items/manager-event-items.component').then(
        (m) => m.ManagerEventItemsComponent,
      ),
  },
];
