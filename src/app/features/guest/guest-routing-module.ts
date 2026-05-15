import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RestaurantListComponent } from './restaurant-list/restaurant-list';

const routes: Routes = [
  { path: '', component: RestaurantListComponent },
  { path: 'restaurant/:id', loadComponent: () => import('../../shared/components/restaurant-detail/restaurant-detail').then(m => m.RestaurantDetailComponent) }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GuestRoutingModule { }
