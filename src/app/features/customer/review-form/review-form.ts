import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { ReviewService } from '../../../core/services/review.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './review-form.html',
  styleUrl: './review-form.css'
})
export class ReviewFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private reviewService = inject(ReviewService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  orderId: string | null = null;
  order: any = null;
  loadingOrder = true;
  submitting = false;

  // Form Model
  foodRating = 5;
  deliveryRating = 5;
  comment = '';

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('orderId');
    if (this.orderId) {
      this.loadOrderDetails();
    }
  }

  loadOrderDetails() {
    this.orderService.getOrderById(this.orderId!).subscribe({
      next: (data) => {
        this.order = data;
        this.loadingOrder = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingOrder = false;
        this.cdr.detectChanges();
      }
    });
  }

  setFoodRating(r: number) {
    this.foodRating = r;
  }

  setDeliveryRating(r: number) {
    this.deliveryRating = r;
  }

  submitReview() {
    const user = this.authService.getUser();
    const customerId = user?.id || user?.userId;

    if (!this.order || !customerId) return;

    this.submitting = true;
    this.cdr.detectChanges();

    const payload = {
      orderId: this.order.orderId,
      customerId: customerId,
      restaurantId: this.order.restaurantId,
      deliveryAgentId: this.order.deliveryAgentId,
      foodRating: this.foodRating,
      deliveryRating: this.deliveryRating,
      comment: this.comment
    };

    this.reviewService.addReview(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.cdr.detectChanges();
        alert('Thank you for your feedback!');
        this.router.navigate(['/customer/orders']);
      },
      error: (err) => {
        this.submitting = false;
        this.cdr.detectChanges();
        alert('Failed to post review: ' + (err.error?.message || 'Server error'));
      }
    });
  }
}
