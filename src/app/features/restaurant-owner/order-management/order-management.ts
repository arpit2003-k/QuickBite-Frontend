import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-management.html',
  styleUrl: './order-management.css'
})
export class OrderManagementComponent implements OnInit {
  private orderService = inject(OrderService);
  private restaurantService = inject(RestaurantService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  orders: any[] = [];
  restaurant: any = null;
  loading = true;

  // Status definition
  statusFlow = ['PLACED', 'CONFIRMED', 'PREPARING', 'PICKED_UP', 'DELIVERED', 'CANCELLED'];

  ngOnInit() {
    this.loadRestaurantAndOrders();
  }

  loadRestaurantAndOrders() {
    const targetId = this.route.snapshot.queryParamMap.get('id');
    
    if (targetId) {
      this.restaurantService.getById(targetId).subscribe({
        next: (res) => {
          this.restaurant = res;
          this.loadOrders();
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
          this.loadOrders();
        } else {
          this.loading = false;
          this.cdr.detectChanges();
        }
      }
    });
  }

  loadOrders() {
    this.orderService.getOrdersByRestaurant(this.restaurant.restaurantId).subscribe({
      next: (data: any[]) => {
        // Sort by date desc
        this.orders = (data || []).sort((a: any, b: any) => 
          new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        );
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateStatus(order: any, nextStatus: string) {
    this.orderService.updateStatus(order.orderId, nextStatus).subscribe({
      next: (updatedOrder) => {
        order.orderStatus = updatedOrder.orderStatus;
        this.cdr.detectChanges();
      },
      error: (err) => alert('Failed to update status: ' + (err.error?.message || 'Error'))
    });
  }

  getNextStatus(currentStatus: string): string | null {
    switch(currentStatus) {
      case 'PLACED': return 'CONFIRMED';
      case 'CONFIRMED': return 'PREPARING';
      case 'PREPARING': return 'PICKED_UP';
      default: return null;
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'PLACED': return 'bg-info bg-opacity-10 text-info';
      case 'CONFIRMED': return 'bg-primary bg-opacity-10 text-primary';
      case 'PREPARING': return 'bg-warning bg-opacity-10 text-warning';
      case 'PICKED_UP': return 'bg-indigo bg-opacity-10 text-indigo';
      case 'DELIVERED': return 'bg-success bg-opacity-10 text-success';
      case 'CANCELLED': return 'bg-danger bg-opacity-10 text-danger';
      default: return 'bg-secondary bg-opacity-10 text-secondary';
    }
  }
}
