import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { GroupBuyListComponent } from './features/groupbuy/groupbuy-list/groupbuy-list.component';
import { GroupBuyDetailComponent } from './features/groupbuy/groupbuy-detail/groupbuy-detail.component';
import { GroupBuyCheckoutComponent } from './features/groupbuy/groupbuy-checkout/groupbuy-checkout.component';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { HomeComponent } from './features/home/home.component';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'groupbuy', component: GroupBuyListComponent },
      { path: 'groupbuy/:id', component: GroupBuyDetailComponent },
      {
        path: 'groupbuy/:id/checkout',
        component: GroupBuyCheckoutComponent,
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
        canActivate: [authGuard, roleGuard],
      },
      {
        path: 'admin/categories',
        loadComponent: () =>
          import('./features/admin/category-management/category-management.component').then(
            (m) => m.CategoryManagementComponent,
          ),
        canActivate: [authGuard, roleGuard],
      },
      {
        path: 'admin/price-templates',
        loadComponent: () =>
          import('./features/admin/price-template/price-template.component').then(
            (m) => m.PriceTemplateComponent,
          ),
        canActivate: [authGuard, roleGuard],
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
