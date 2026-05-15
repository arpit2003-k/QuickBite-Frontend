import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard';
import { AssignedOrdersComponent } from './assigned-orders/assigned-orders';
import { LocationTrackerComponent } from './location-tracker/location-tracker';
import { EarningsComponent } from './earnings/earnings';
import { AgentRegistrationComponent } from './agent-registration/agent-registration';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'assigned-orders', component: AssignedOrdersComponent },
  { path: 'location-tracker', component: LocationTrackerComponent },
  { path: 'earnings', component: EarningsComponent },
  { path: 'register-profile', component: AgentRegistrationComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DeliveryAgentRoutingModule { }
