import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RestaurantService } from '../../../core/services/restaurant.service';

@Component({
  selector: 'app-restaurant-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './restaurant-list.html',
  styleUrls: ['./restaurant-list.css']
})
export class RestaurantListComponent implements OnInit {
  restaurants: any[] = [];
  filteredRestaurants: any[] = [];
  availableCuisines: string[] = [];
  searchQuery = '';
  selectedCuisine = 'ALL';
  showOpenOnly = false;
  sortBy = 'featured';
  isLoading = false;

  private restaurantService = inject(RestaurantService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.fetchRestaurants();
  }

  fetchRestaurants(): void {
    this.isLoading = true;
    // Use center of India (approx) and huge radius to show all restaurants regardless of city
    this.restaurantService.getNearby(20.5936, 78.9628, 5000).subscribe({
      next: (res) => {
        this.restaurants = res || [];
        this.availableCuisines = Array.from(
          new Set(
            this.restaurants
              .map(r => (r.cuisine || r.cuisineType || '').trim())
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b));
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load restaurants', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterRestaurants(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let list = [...this.restaurants];

    const query = this.searchQuery.toLowerCase();
    if (query) {
      list = list.filter(r =>
        (r.name && r.name.toLowerCase().includes(query)) ||
        (r.cuisine && r.cuisine.toLowerCase().includes(query)) ||
        (r.cuisineType && r.cuisineType.toLowerCase().includes(query)) ||
        (r.address && r.address.toLowerCase().includes(query)) ||
        (r.city && r.city.toLowerCase().includes(query))
      );
    }

    if (this.selectedCuisine !== 'ALL') {
      list = list.filter(r => (r.cuisine || r.cuisineType || '') === this.selectedCuisine);
    }

    if (this.showOpenOnly) {
      list = list.filter(r => !!r.isOpen);
    }

    switch (this.sortBy) {
      case 'rating':
        list.sort((a, b) => (Number(b.avgRating || b.rating || 0)) - (Number(a.avgRating || a.rating || 0)));
        break;
      case 'delivery':
        list.sort((a, b) => (Number(a.estimatedDeliveryMin || 999)) - (Number(b.estimatedDeliveryMin || 999)));
        break;
      case 'min-order':
        list.sort((a, b) => (Number(a.minOrderAmount || 0)) - (Number(b.minOrderAmount || 0)));
        break;
      default:
        list.sort((a, b) => (Number(b.avgRating || b.rating || 0)) - (Number(a.avgRating || a.rating || 0)));
        break;
    }

    this.filteredRestaurants = list;
  }
}
