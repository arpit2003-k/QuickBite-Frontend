import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-history.html',
  styleUrl: './order-history.css'
})
export class OrderHistoryComponent implements OnInit {
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  orders: any[] = [];
  loading = true;
  reordering = false;

  get customerId(): string {
    const user = this.authService.getUser();
    return user?.id || user?.userId;
  }

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.orderService.getOrdersByCustomer(this.customerId).subscribe({
      next: (data) => {
        // Sort by date descending
        this.orders = (data || []).sort((a: any, b:any) => 
          new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        );
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PLACED': return 'bg-info';
      case 'CONFIRMED': return 'bg-primary';
      case 'PREPARING': return 'bg-warning text-dark';
      case 'OUT_FOR_DELIVERY': return 'bg-indigo text-white';
      case 'DELIVERED': return 'bg-success';
      case 'CANCELLED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  trackOrder(orderId: number) {
    this.router.navigate(['/customer/track', orderId]);
  }

  reorder(order: any) {
    this.reordering = true;
    this.cdr.detectChanges();
    
    this.orderService.reorder(order.orderId, this.customerId, order.modeOfPayment).subscribe({
      next: (newOrder) => {
        this.router.navigate(['/customer/order-confirmation', newOrder.orderId]);
      },
      error: (err) => {
        console.error('Reorder failed', err);
        this.reordering = false;
        this.cdr.detectChanges();
        alert('Failed to reorder. Please try again or order fresh from restaurant.');
      }
    });
  }
}
