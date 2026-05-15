import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationResponse {
  id: number;
  type: string;
  title: string;
  message: string;
  relatedId: number;
  deepLinkUrl: string;
  isRead: boolean;
  sentAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private baseUrl = environment.notificationUrl;

  getUserNotifications(userId: number): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(`${this.baseUrl}/user/${userId}`);
  }

  getUnreadCount(userId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/user/${userId}/unread-count`);
  }

  markAllAsRead(userId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/user/${userId}/mark-read`, {});
  }

  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/read`, {});
  }

  broadcast(title: string, message: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/admin/broadcast`, null, {
      params: { title, message }
    });
  }
}
