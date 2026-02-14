import { Routes } from '@angular/router';
import { UserOrderDetailComponent } from './order-detail/user-order-detail.component';

export const USER_ROUTES: Routes = [
    { path: 'dashboard', loadComponent: () => import('./dashboard/user-dashboard.component').then(m => m.UserDashboardComponent) },
    { path: 'orders/:id', component: UserOrderDetailComponent },
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
