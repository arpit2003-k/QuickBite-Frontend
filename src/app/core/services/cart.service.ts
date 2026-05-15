import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.cartUrl;

  getCartByCustomer(customerId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${customerId}`);
  }

  addItem(customerId: string, menuItemId: string, quantity: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/items`, { customerId, menuItemId, quantity });
  }

  updateQuantity(customerId: string, menuItemId: string, quantity: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/items`, { customerId, menuItemId, quantity });
  }

  removeItem(customerId: string, menuItemId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/items`, {
      params: { customerId, menuItemId }
    });
  }

  clearCart(customerId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${customerId}`);
  }

  applyPromoCode(customerId: string, promoCode: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/promo`, { customerId, promoCode });
  }
}
