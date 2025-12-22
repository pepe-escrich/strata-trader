import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: Dashboard
  },
  // Future routes
  // { path: 'orders', loadComponent: () => import('./features/orders/orders-list/orders-list').then(m => m.OrdersList) },
  // { path: 'alerts', loadComponent: () => import('./features/alerts/alerts-list/alerts-list').then(m => m.AlertsList) },
];
