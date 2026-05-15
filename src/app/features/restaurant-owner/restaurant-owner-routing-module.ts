import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard';
import { MenuManagementComponent } from './menu-management/menu-management';
import { OrderManagementComponent } from './order-management/order-management';
import { EarningsComponent } from './earnings/earnings';
import { ReviewsComponent } from './reviews/reviews';
import { RestaurantRegistrationComponent } from './restaurant-registration/restaurant-registration';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'register', component: RestaurantRegistrationComponent },
  { path: 'menu', component: MenuManagementComponent },
  { path: 'orders', component: OrderManagementComponent },
  { path: 'earnings', component: EarningsComponent },
  { path: 'reviews', component: ReviewsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RestaurantOwnerRoutingModule { }
