import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard, managerGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'groupbuy',
        loadComponent: () =>
          import('./features/groupbuy/groupbuy-list/groupbuy-list.component').then(
            (m) => m.GroupBuyListComponent,
          ),
      },
      {
        path: 'groupbuy/:id',
        loadComponent: () =>
          import('./features/groupbuy/groupbuy-detail/groupbuy-detail.component').then(
            (m) => m.GroupBuyDetailComponent,
          ),
      },
      {
        path: 'groupbuy/:id/checkout',
        loadComponent: () =>
          import('./features/groupbuy/groupbuy-checkout/groupbuy-checkout.component').then(
            (m) => m.GroupBuyCheckoutComponent,
          ),
        canActivate: [authGuard],
      },
      {
        path: 'groupbuy/:id/order-confirmation/:orderId',
        loadComponent: () =>
          import('./features/groupbuy/order-confirmation/order-confirmation.component').then(
            (m) => m.OrderConfirmationComponent,
          ),
        canActivate: [authGuard],
      },
      {
        path: 'event',
        loadChildren: () => import('./features/event/event.routes').then((m) => m.EVENT_ROUTES),
      },
      {
        path: 'manager',
        loadChildren: () =>
          import('./features/manager/manager.routes').then((m) => m.MANAGER_ROUTES),
        canActivate: [authGuard, managerGuard],
      },
      {
        path: 'admin/categories',
        loadComponent: () =>
          import('./features/admin/category-management/category-management.component').then(
            (m) => m.CategoryManagementComponent,
          ),
        canActivate: [authGuard, adminGuard],
      },
      {
        path: 'admin/price-templates',
        loadComponent: () =>
          import('./features/admin/price-template/price-template.component').then(
            (m) => m.PriceTemplateComponent,
          ),
        canActivate: [authGuard, adminGuard],
      },
      {
        path: 'user',
        loadChildren: () => import('./features/user/user.routes').then((m) => m.USER_ROUTES),
        canActivate: [authGuard],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
