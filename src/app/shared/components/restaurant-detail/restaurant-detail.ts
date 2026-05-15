import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { MenuService } from '../../../core/services/menu.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './restaurant-detail.html',
  styleUrls: ['./restaurant-detail.css']
})
export class RestaurantDetailComponent implements OnInit {
  restaurantId: string | null = null;
  restaurant: any = null;
  categories: any[] = [];
  menuItems: any[] = [];
  isLoading = false;
  
  toastMessage = '';
  showToast = false;

  private route = inject(ActivatedRoute);
  private restaurantService = inject(RestaurantService);
  private menuService = inject(MenuService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.restaurantId = this.route.snapshot.paramMap.get('id');
    if (this.restaurantId) {
      this.loadData();
    }
  }

  loadData(): void {
    this.isLoading = true;
    
    this.restaurantService.getById(this.restaurantId!).subscribe({
      next: (res) => {
        this.restaurant = res;
        this.cdr.detectChanges();
      }
    });

    this.menuService.getCategoriesByRestaurant(this.restaurantId!).subscribe({
      next: (res) => {
        this.categories = res || [];
        this.cdr.detectChanges();
      }
    });

    this.menuService.getItemsByRestaurant(this.restaurantId!).subscribe({
      next: (res) => {
        this.menuItems = res || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getItemsByCategory(categoryId: any): any[] {
    return this.menuItems.filter(item => 
      item.categoryId == categoryId || (item.category && item.category.id == categoryId)
    );
  }

  get totalItems(): number {
    return this.menuItems.length;
  }

  get totalCategories(): number {
    return this.categories.length;
  }

  get restaurantRating(): string {
    const rating = this.restaurant?.avgRating ?? this.restaurant?.rating;
    return rating ? Number(rating).toFixed(1) : 'New';
  }

  get heroImage(): string {
    return this.restaurant?.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1600&h=900';
  }

  get fullAddress(): string {
    if (!this.restaurant) return 'Location unknown';
    return this.restaurant.city
      ? `${this.restaurant.address}, ${this.restaurant.city}`
      : (this.restaurant.address || 'Location unknown');
  }

  get availabilityLabel(): string {
    return this.restaurant?.isOpen ? 'Open Now' : 'Currently Closed';
  }

  get cuisineLabel(): string {
    return this.restaurant?.cuisine || this.restaurant?.cuisineType || 'Mixed Cuisine';
  }

  isLoggedIn(): boolean {
    return !!this.authService.getUser();
  }

  isCustomer(): boolean {
    const user = this.authService.getUser();
    return user?.role === 'CUSTOMER';
  }

  addToCart(item: any): void {
    if (!this.isCustomer()) {
      alert('Only customers can add items to cart and place orders.');
      return;
    }
    const user = this.authService.getUser();
    if (!user) return;
    
    const customerId = user.id || user.userId;

    this.cartService.addItem(customerId, item.itemId || item.id, 1).subscribe({
      next: () => {
        this.displayToast(`Added ${item.name} to cart!`);
      },
      error: (err) => {
        this.displayToast(`Failed to add item: ${err.error?.message || 'Error'}`);
      }
    });
  }

  displayToast(msg: string) {
    this.toastMessage = msg;
    this.showToast = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }
}
