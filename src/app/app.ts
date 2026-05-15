import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { NotificationIconComponent } from './shared/components/notification-icon/notification-icon.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, NotificationIconComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = 'quickbite-ui';
  
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  
  user: any = null;

  ngOnInit() {
    // Listen to reactive user changes across the app
    this.authService.currentUser$.subscribe(u => {
      this.user = u;
      
      // If we are logged in but missing the fullName, fetch it from the backend API
      if (this.user && !this.user.fullName && this.authService.getToken()) {
        this.authService.getProfile().subscribe({
          next: (profile: any) => {
            this.user.fullName = profile.fullName;
            // Update local storage so we only have to fetch it once
            localStorage.setItem('quickbite_user', JSON.stringify(this.user));
            this.cdr.detectChanges();
          },
          error: () => {} // Fail silently, it will fallback to email
        });
      }
      
      this.cdr.detectChanges();
    });
  }

  isLoggedIn(): boolean {
    return !!this.user;
  }

  logout() {
    this.authService.logout();
  }
}
