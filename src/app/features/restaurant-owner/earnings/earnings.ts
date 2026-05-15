import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-earnings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './earnings.html',
  styleUrl: './earnings.css'
})
export class EarningsComponent implements OnInit {
  private orderService = inject(OrderService);
  private restaurantService = inject(RestaurantService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  restaurant: any = null;
  orders: any[] = [];
  loading = true;

  stats = {
    daily: 0,
    weekly: 0,
    monthly: 0,
    total: 0
  };

  topItems: any[] = [];

  ngOnInit() {
    this.loadRestaurantAndData();
  }

  loadRestaurantAndData() {
    const targetId = this.route.snapshot.queryParamMap.get('id');
    
    if (targetId) {
      this.restaurantService.getById(targetId).subscribe({
        next: (res) => {
          this.restaurant = res;
          this.loadEarningsData();
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
          this.loadEarningsData();
        } else {
          this.loading = false;
          this.cdr.detectChanges();
        }
      }
    });
  }

  loadEarningsData() {
    this.orderService.getOrdersByRestaurant(this.restaurant.restaurantId).subscribe({
      next: (orders: any[]) => {
        this.orders = orders || [];
        this.calculateStats();
        this.calculateTopItems();
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateStats() {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    this.stats.total = this.orders.reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0);
    
    this.stats.daily = this.orders
      .filter(o => (now.getTime() - new Date(o.orderDate).getTime()) < oneDay)
      .reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0);
      
    this.stats.weekly = this.orders
      .filter(o => (now.getTime() - new Date(o.orderDate).getTime()) < oneWeek)
      .reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0);

    this.stats.monthly = this.orders
      .filter(o => (now.getTime() - new Date(o.orderDate).getTime()) < oneMonth)
      .reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0);
  }

  calculateTopItems() {
    const itemMap = new Map();
    this.orders.forEach(o => {
      o.items?.forEach((item: any) => {
        const current = itemMap.get(item.name) || { name: item.name, quantity: 0, revenue: 0 };
        current.quantity += item.quantity;
        current.revenue += (item.price * item.quantity);
        itemMap.set(item.name, current);
      });
    });

    this.topItems = Array.from(itemMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }
}
