import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserManagementComponent } from './user-management/user-management';
import { RestaurantApprovalComponent } from './restaurant-approval/restaurant-approval';
import { AgentVerificationComponent } from './agent-verification/agent-verification';
import { AnalyticsComponent } from './analytics/analytics';
import { ReviewModerationComponent } from './review-moderation/review-moderation';

const routes: Routes = [
  { path: '', redirectTo: 'users', pathMatch: 'full' },
  { path: 'users', component: UserManagementComponent },
  { path: 'restaurants', component: RestaurantApprovalComponent },
  { path: 'agents', component: AgentVerificationComponent },
  { path: 'analytics', component: AnalyticsComponent },
  { path: 'reviews', component: ReviewModerationComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
