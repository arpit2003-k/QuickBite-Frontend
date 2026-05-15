import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReviewService } from '../../../core/services/review.service';

@Component({
  selector: 'app-review-moderation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './review-moderation.html'
})
export class ReviewModerationComponent implements OnInit {
  private reviewService = inject(ReviewService);
  private cdr = inject(ChangeDetectorRef);

  reviews: any[] = [];
  loading = true;

  ngOnInit() {
    this.loadReviews();
  }

  loadReviews() {
    this.reviewService.getAllReviews().subscribe({
      next: (data) => {
        this.reviews = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        // Mock fallback if service fails
        this.reviews = [
          { id: 101, comment: 'Amazing food, loved it!', foodRating: 5, restaurantId: 1, reviewDate: new Date() },
          { id: 102, comment: 'Delivery was late by 30 mins.', deliveryRating: 2, restaurantId: 4, reviewDate: new Date() }
        ];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteReview(id: string) {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;
    
    this.reviewService.deleteReview(id).subscribe({
      next: () => {
        this.reviews = this.reviews.filter((r: any) => (r.reviewId || r.id).toString() !== id.toString());
        this.cdr.detectChanges();
        alert('Review removed from public view.');
      },
      error: (err) => alert(err.error?.message || 'Failed to delete review')
    });
  }

  renderStars(rating: number): number[] {
    return Array(rating || 0).fill(0);
  }
}
