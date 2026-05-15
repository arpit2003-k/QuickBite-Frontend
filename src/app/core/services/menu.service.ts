import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.menuUrl;

  getMenuByRestaurant(restaurantId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/restaurant/${restaurantId}`);
  }

  getCategoriesByRestaurant(restaurantId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/categories/restaurant/${restaurantId}`);
  }

  getItemsByRestaurant(restaurantId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/items/restaurant/${restaurantId}`);
  }

  searchItems(keyword: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/items/search`, { params: { keyword } });
  }

  // Category CRUD
  addCategory(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/categories`, data);
  }
  updateCategory(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/categories/${id}`, data);
  }
  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/categories/${id}`);
  }

  // Item CRUD
  addMenuItem(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/items`, data);
  }

  updateMenuItem(itemId: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/items/${itemId}`, data);
  }

  toggleAvailability(itemId: string, isAvailable: boolean): Observable<any> {
    return this.http.put(`${this.baseUrl}/items/${itemId}/availability`, null, { params: { isAvailable: isAvailable.toString() }});
  }
  
  deleteMenuItem(itemId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/items/${itemId}`);
  }
}
