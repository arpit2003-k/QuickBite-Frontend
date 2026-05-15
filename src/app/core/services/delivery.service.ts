import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.deliveryUrl;

  registerAgent(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  getAgentByUserId(userId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/user/${userId}`);
  }

  // This should probably call OrderService, but keeping for consistency if backend adds it
  getAssignedOrders(agentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${agentId}/orders`);
  }

  updateLocation(agentId: string, latitude: number, longitude: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/location`, { agentId, latitude, longitude });
  }

  setAvailability(agentId: string, isAvailable: boolean): Observable<any> {
    // Current backend uses @PatchMapping("/availability") with @RequestParam
    return this.http.patch(`${this.baseUrl}/availability`, null, { 
      params: { agentId, isAvailable: isAvailable.toString() }
    });
  }

  markDelivered(agentId: string, orderId: string): Observable<any> {
    // Current backend uses @PostMapping("/delivered") with @RequestParam
    return this.http.post(`${this.baseUrl}/delivered`, null, {
      params: { agentId, orderId }
    });
  }

  getEarnings(agentId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/earnings/${agentId}`);
  }

  // --- ADMIN METHODS ---
  getAllAgents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/all`);
  }

  verifyAgent(id: string, verified: boolean): Observable<any> {
    return this.http.patch(`${this.baseUrl}/verify/${id}`, null, {
      params: { verified: verified.toString() }
    });
  }
}
