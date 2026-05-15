import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class CartComponent implements OnInit {
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  cart: any = null;
  loading = true;
  promoCode = '';
  promoError = '';
  promoSuccess = '';

  get customerId(): string {
    const user = this.authService.getUser();
    return user?.userId || user?.id; // Use userId first for backend consistency
  }

  ngOnInit() {
    this.loadCart();
  }

  loadCart() {
    const id = this.customerId;
    if (!id) {
      this.loading = false;
      return;
    }
    
    this.loading = true;
    this.cartService.getCartByCustomer(id).subscribe({
      next: (data) => {
        this.cart = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cart = null;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateQuantity(item: any, delta: number) {
    const newQty = item.quantity + delta;
    if (newQty < 1) {
      this.removeItem(item.menuItemId);
      return;
    }
    this.cartService.updateQuantity(this.customerId, item.menuItemId, newQty).subscribe({
      next: (latestCart) => {
        this.cart = latestCart;
        this.cdr.detectChanges();
      },
      error: () => this.loadCart()
    });
  }

  removeItem(menuItemId: string) {
    this.cartService.removeItem(this.customerId, menuItemId).subscribe({
      next: (latestCart) => {
        this.cart = latestCart;
        this.cdr.detectChanges();
      },
      error: () => this.loadCart()
    });
  }

  clearCart() {
    this.cartService.clearCart(this.customerId).subscribe({
      next: () => {
        this.cart = null;
        this.cdr.detectChanges();
      }
    });
  }

  applyPromo() {
    if (!this.promoCode) return;
    this.promoError = '';
    this.promoSuccess = '';
    
    this.cartService.applyPromoCode(this.customerId, this.promoCode).subscribe({
      next: (latestCart) => {
        this.cart = latestCart;
        this.promoSuccess = 'Promo code applied!';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.promoError = 'Invalid promo code.';
        this.cdr.detectChanges();
      }
    });
  }

  proceedToCheckout() {
    this.router.navigate(['/customer/checkout']);
  }
}
