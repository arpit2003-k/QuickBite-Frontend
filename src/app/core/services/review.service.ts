import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.reviewUrl;

  addReview(reviewData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}`, reviewData);
  }

  getByRestaurant(restaurantId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/restaurant/${restaurantId}`);
  }

  getByAgent(agentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/agent/${agentId}`);
  }

  deleteReview(reviewId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${reviewId}`);
  }

  // --- ADMIN METHODS ---
  getAllReviews(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/all`);
  }
}
