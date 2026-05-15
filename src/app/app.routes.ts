import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'oauth2-redirect', loadComponent: () => import('./features/auth/oauth2-redirect/oauth2-redirect.component').then(m => m.OAuth2RedirectComponent) },
  { path: 'customer/restaurants', loadComponent: () => import('./features/guest/restaurant-list/restaurant-list').then(m => m.RestaurantListComponent) },
  { path: 'customer/cart', loadComponent: () => import('./features/customer/cart/cart').then(m => m.CartComponent) },
  { path: 'customer/checkout', loadComponent: () => import('./features/customer/checkout/checkout').then(m => m.CheckoutComponent) },
  { path: 'customer/order-confirmation/:id', loadComponent: () => import('./features/customer/order-confirmation/order-confirmation').then(m => m.OrderConfirmationComponent) },
  { path: 'customer/orders', loadComponent: () => import('./features/customer/order-history/order-history').then(m => m.OrderHistoryComponent) },
  { path: 'customer/track/:orderId', loadComponent: () => import('./features/customer/order-tracking/order-tracking').then(m => m.OrderTrackingComponent) },
  { path: 'customer/review/:orderId', loadComponent: () => import('./features/customer/review-form/review-form').then(m => m.ReviewFormComponent) },
  { path: 'profile', loadComponent: () => import('./shared/components/profile/profile').then(m => m.ProfileComponent) },
  { 
    path: 'owner', 
    loadChildren: () => import('./features/restaurant-owner/restaurant-owner-module').then(m => m.RestaurantOwnerModule)
  },
  { 
    path: 'agent', 
    loadChildren: () => import('./features/delivery-agent/delivery-agent-module').then(m => m.DeliveryAgentModule),
    canActivate: [roleGuard],
    data: { roles: ['DELIVERY_AGENT'] }
  },
  { 
    path: 'admin', 
    loadChildren: () => import('./features/admin/admin-module').then(m => m.AdminModule),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] }
  },
  { 
    path: 'notifications', 
    loadComponent: () => import('./features/notifications/notification-center/notification-center.component').then(m => m.NotificationCenterComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'admin/broadcast', 
    loadComponent: () => import('./features/admin/send-broadcast/send-broadcast.component').then(m => m.SendBroadcastComponent),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] }
  },

  { path: 'restaurants', loadChildren: () => import('./features/guest/guest-module').then(m => m.GuestModule) },
  { path: '', loadChildren: () => import('./features/guest/guest-module').then(m => m.GuestModule) },
  { path: '**', redirectTo: 'login' }
];
