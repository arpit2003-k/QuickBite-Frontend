import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RestaurantService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.restaurantUrl;

  getApproved(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/approved`);
  }

  getNearby(lat: number, lng: number, radius: number): Observable<any[]> {
    let params = new HttpParams()
      .set('lat', lat.toString())
      .set('lng', lng.toString())
      .set('radius', radius.toString());
    return this.http.get<any[]>(`${this.baseUrl}/nearby`, { params });
  }

  approveRestaurant(id: string, approved: boolean): Observable<any> {
    return this.http.patch(`${this.baseUrl}/admin/approve/${id}`, null, { params: { approved } });
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  getByOwnerId(ownerId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/owner/${ownerId}`);
  }

  registerRestaurant(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  toggleOpen(id: string, isOpen: boolean): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}/open`, null, { params: { isOpen } });
  }

  // --- ADMIN METHODS ---
  getPending(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/pending`);
  }
}
