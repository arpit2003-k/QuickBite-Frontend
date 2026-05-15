import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RestaurantService } from '../../../core/services/restaurant.service';

@Component({
  selector: 'app-restaurant-approval',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './restaurant-approval.html'
})
export class RestaurantApprovalComponent implements OnInit {
  private restaurantService = inject(RestaurantService);
  private cdr = inject(ChangeDetectorRef);

  restaurants: any[] = [];
  loading = true;
  filter = 'PENDING';

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.loading = true;
    const pending$ = this.restaurantService.getPending();
    const approved$ = this.restaurantService.getApproved();

    pending$.subscribe({
      next: (pending) => {
        approved$.subscribe({
          next: (approved) => {
            // Mark pending/approved explicitly to be safe
            this.restaurants = [
              ...pending.map((r: any) => ({ ...r, isApproved: false })),
              ...approved.map((r: any) => ({ ...r, isApproved: true }))
            ];
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => this.loading = false
        });
      },
      error: () => this.loading = false
    });
  }

  get filteredRestaurants() {
    if (this.filter === 'PENDING') return this.restaurants.filter((r: any) => !r.isApproved);
    return this.restaurants.filter((r: any) => r.isApproved);
  }

  approve(id: string) {
    if (!confirm('Approve this restaurant for operation?')) return;
    this.restaurantService.approveRestaurant(id, true).subscribe({
      next: () => {
        const res = this.restaurants.find((r: any) => (r.restaurantId || r.id).toString() === id.toString());
        if (res) res.isApproved = true;
        this.cdr.detectChanges();
        alert('Restaurant Approved! 🏪');
      }
    });
  }

  revoke(id: string) {
    if (!confirm('Revoke approval for this restaurant?')) return;
    this.restaurantService.approveRestaurant(id, false).subscribe({
      next: () => {
        const res = this.restaurants.find((r: any) => (r.restaurantId || r.id).toString() === id.toString());
        if (res) res.isApproved = false;
        this.cdr.detectChanges();
        alert('Approval Revoked');
      }
    });
  }

  reject(id: string) {
    if (!confirm('Reject this registration request?')) return;
    this.restaurantService.approveRestaurant(id, false).subscribe({
      next: () => {
        this.restaurants = this.restaurants.filter((r: any) => (r.restaurantId || r.id).toString() !== id.toString());
        this.cdr.detectChanges();
        alert('Registration Rejected');
      }
    });
  }
}
