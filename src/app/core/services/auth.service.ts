import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Observable, BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly baseUrl = environment.authUrl;
  
  private currentUserSubject = new BehaviorSubject<any>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  register(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, userData);
  }

  login(credentials: { email: string, password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, credentials).pipe(
      tap((response: any) => {
        if (response && response.token) {
          localStorage.setItem('quickbite_token', response.token);
          const user = {
            id: response.userId,
            userId: response.userId,
            role: response.role,
            email: response.email,
            fullName: response.fullName
          };
          localStorage.setItem('quickbite_user', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      })
    );
  }

  handleOAuth2Login(token: string, user: any): void {
    const enrichedUser = {
      ...user,
      userId: user.id
    };
    localStorage.setItem('quickbite_token', token);
    localStorage.setItem('quickbite_user', JSON.stringify(enrichedUser));
    this.currentUserSubject.next(enrichedUser);
  }

  logout(): void {
    localStorage.removeItem('quickbite_token');
    localStorage.removeItem('quickbite_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  getUser(): any {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('quickbite_token');
  }

  private getUserFromStorage(): any {
    const user = localStorage.getItem('quickbite_user');
    return user ? JSON.parse(user) : null;
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/profile`);
  }

  updateProfile(data: { fullName: string; phone: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/profile`, data).pipe(
      tap((profile: any) => this.updateStoredUser(profile))
    );
  }

  changePassword(data: { currentPassword?: string; newPassword: string }): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/profile/password`, data);
  }

  updateStoredUser(profile: any): void {
    const currentUser = this.getUser() || {};
    const updatedUser = {
      ...currentUser,
      id: profile.userId ?? currentUser.id,
      userId: profile.userId ?? currentUser.userId,
      fullName: profile.fullName ?? currentUser.fullName,
      email: profile.email ?? currentUser.email,
      phone: profile.phone ?? currentUser.phone,
      role: profile.role ?? currentUser.role
    };
    localStorage.setItem('quickbite_user', JSON.stringify(updatedUser));
    this.currentUserSubject.next(updatedUser);
  }

  // --- ADMIN METHODS ---
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/users`);
  }

  getPlatformStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/admin/stats`);
  }

  updateUserStatus(userId: string, active: boolean): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/admin/users/${userId}/status`, null, {
      params: { active: active.toString() }
    });
  }
}
