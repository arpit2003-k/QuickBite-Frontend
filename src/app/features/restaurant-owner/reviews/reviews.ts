import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReviewService } from '../../../core/services/review.service';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css'
})
export class ReviewsComponent implements OnInit {
  private reviewService = inject(ReviewService);
  private restaurantService = inject(RestaurantService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  reviews: any[] = [];
  restaurant: any = null;
  loading = true;

  ngOnInit() {
    this.loadRestaurantAndData();
  }

  loadRestaurantAndData() {
    const targetId = this.route.snapshot.queryParamMap.get('id');
    
    if (targetId) {
      this.restaurantService.getById(targetId).subscribe({
        next: (res) => {
          this.restaurant = res;
          this.loadReviewData();
        },
        error: () => this.fallbackToFirst()
      });
    } else {
      this.fallbackToFirst();
    }
  }

  fallbackToFirst() {
    const userId = this.authService.getUser()?.id || this.authService.getUser()?.userId;
    this.restaurantService.getByOwnerId(userId).subscribe({
      next: (res: any[]) => {
        if (res && res.length > 0) {
          this.restaurant = res[0];
          this.loadReviewData();
        } else {
          this.loading = false;
          this.cdr.detectChanges();
        }
      }
    });
  }

  loadReviewData() {
    this.reviewService.getByRestaurant(this.restaurant.restaurantId).subscribe({
      next: (data: any[]) => {
        this.reviews = data || [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
