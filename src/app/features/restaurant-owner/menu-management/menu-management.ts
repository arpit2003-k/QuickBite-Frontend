import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { MenuService } from '../../../core/services/menu.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './menu-management.html',
  styleUrl: './menu-management.css'
})
export class MenuManagementComponent implements OnInit {
  private restaurantService = inject(RestaurantService);
  private menuService = inject(MenuService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  restaurant: any = null;
  categories: any[] = [];
  menuItems: any[] = [];
  loading = true;

  // View state
  showCategoryModal = false;
  showItemModal = false;
  editingCategory: any = null;
  editingItem: any = null;

  // Form helpers
  categoryName = '';
  itemForm: any = {
    name: '',
    description: '',
    price: 0,
    discountedPrice: 0,
    categoryId: '',
    isVeg: true,
    isAvailable: true
  };

  ngOnInit() {
    this.loadRestaurant();
  }

  loadRestaurant() {
    const targetId = this.route.snapshot.queryParamMap.get('id');
    
    if (targetId) {
      this.restaurantService.getById(targetId).subscribe({
        next: (res) => {
          this.restaurant = res;
          this.loadMenuData();
        },
        error: () => {
          this.fallbackToFirst();
        }
      });
    } else {
      this.fallbackToFirst();
    }
  }

  fallbackToFirst() {
    const userId = this.authService.getUser()?.id || this.authService.getUser()?.userId;
    this.restaurantService.getByOwnerId(userId).subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          this.restaurant = res[0];
          this.loadMenuData();
        } else {
          this.loading = false;
          this.cdr.detectChanges();
        }
      }
    });
  }

  loadMenuData() {
    this.menuService.getCategoriesByRestaurant(this.restaurant.restaurantId).subscribe({
      next: (cats: any[]) => {
        this.categories = cats;
        this.menuService.getItemsByRestaurant(this.restaurant.restaurantId).subscribe({
          next: (items: any[]) => {
            this.menuItems = items;
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  // Category Actions
  openCategoryModal(cat: any = null) {
    this.editingCategory = cat;
    this.categoryName = cat ? cat.name : '';
    this.showCategoryModal = true;
    this.cdr.detectChanges();
  }

  saveCategory() {
    const payload = { name: this.categoryName, restaurantId: this.restaurant.restaurantId };
    if (this.editingCategory) {
      this.menuService.updateCategory(this.editingCategory.categoryId, payload).subscribe(() => this.loadMenuData());
    } else {
      this.menuService.addCategory(payload).subscribe(() => this.loadMenuData());
    }
    this.showCategoryModal = false;
  }

  deleteCategory(id: number) {
    if (confirm('Deleting category will delete all items in it. Proceed?')) {
      this.menuService.deleteCategory(id).subscribe(() => this.loadMenuData());
    }
  }

  // Item Actions
  openItemModal(item: any = null, categoryId: any = null) {
    this.editingItem = item;
    if (item) {
      this.itemForm = { ...item };
    } else {
      this.itemForm = {
        name: '',
        description: '',
        price: 0,
        discountedPrice: 0,
        categoryId: categoryId || (this.categories[0]?.categoryId),
        isVeg: true,
        isAvailable: true
      };
    }
    this.showItemModal = true;
    this.cdr.detectChanges();
  }

  saveItem() {
    const payload = { ...this.itemForm, restaurantId: this.restaurant.restaurantId };
    if (this.editingItem) {
      this.menuService.updateMenuItem(this.editingItem.itemId.toString(), payload).subscribe(() => this.loadMenuData());
    } else {
      this.menuService.addMenuItem(payload).subscribe(() => this.loadMenuData());
    }
    this.showItemModal = false;
  }

  toggleAvailability(item: any) {
    this.menuService.toggleAvailability(item.itemId.toString(), !item.isAvailable).subscribe({
      next: (updated) => {
        item.isAvailable = updated.isAvailable;
        this.cdr.detectChanges();
      }
    });
  }

  deleteItem(id: number) {
    if (confirm('Delete this item?')) {
      this.menuService.deleteMenuItem(id.toString()).subscribe(() => this.loadMenuData());
    }
  }

  getItemsByCategory(categoryId: number) {
    return this.menuItems.filter(i => i.categoryId == categoryId);
  }
}
