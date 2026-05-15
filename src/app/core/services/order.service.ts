import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.orderUrl;

  placeOrder(orderData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}`, orderData);
  }

  getOrderById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  getOrderTracking(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}/tracking`);
  }

  getOrdersByCustomer(customerId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/customer/${customerId}`);
  }

  getOrdersByRestaurant(restaurantId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/restaurant/${restaurantId}`);
  }

  getOrdersByAgent(agentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/agent/${agentId}`);
  }

  updateStatus(orderId: number, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/status`, { orderId, status });
  }

  cancelOrder(orderId: number, customerId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${orderId}/cancel`, {
      params: { customerId }
    });
  }

  reorder(previousOrderId: number, customerId: string, paymentMode: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/reorder`, null, {
      params: { previousOrderId: previousOrderId.toString(), customerId, paymentMode }
    });
  }
}
