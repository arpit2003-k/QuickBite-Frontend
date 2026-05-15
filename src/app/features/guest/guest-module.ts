import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuestRoutingModule } from './guest-routing-module';
import { RestaurantListComponent } from './restaurant-list/restaurant-list';

@NgModule({
  imports: [
    CommonModule,
    GuestRoutingModule,
    RestaurantListComponent
  ]
})
export class GuestModule { }
