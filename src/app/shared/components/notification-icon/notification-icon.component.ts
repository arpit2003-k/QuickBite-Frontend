import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NotificationService, NotificationResponse } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-icon',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-icon.component.html',
  styleUrl: './notification-icon.component.css'
})
export class NotificationIconComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  notifications: NotificationResponse[] = [];
  unreadCount = 0;
  userId: number | null = null;
  userRole: string | null = null;
  private pollingSub: Subscription | null = null;
  private authSub: Subscription | null = null;
  showDropdown = false;

  ngOnInit(): void {
    this.authSub = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userId = user.id || user.userId;
        this.userRole = user.role;
        this.loadNotifications();
      } else {
        this.userId = null;
        this.userRole = null;
        this.notifications = [];
        this.unreadCount = 0;
      }
      this.cdr.detectChanges();
    });
    this.startPolling();
  }

  ngOnDestroy(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }

  loadNotifications(): void {
    if (!this.userId) return;

    this.notificationService.getUnreadCount(this.userId).subscribe({
      next: (count) => {
        this.unreadCount = count;
        this.cdr.detectChanges();
      }
    });

    this.notificationService.getUserNotifications(this.userId).subscribe({
      next: (res) => {
        const oldFirstId = this.notifications.length > 0 ? this.notifications[0].id : null;
        this.notifications = res.slice(0, 5); // top 5 recent notifications
        
        // Audio alert check
        if (oldFirstId && res.length > 0 && res[0].id !== oldFirstId) {
          if (this.userRole === 'RESTAURANT_OWNER' && (res[0].type === 'ORDER_PLACED' || res[0].type === 'ORDER_CONFIRMED')) {
            this.playAudioAlert();
          }
        }
        this.cdr.detectChanges();
      }
    });
  }

  startPolling(): void {
    this.pollingSub = interval(5000).subscribe(() => {
      this.loadNotifications();
    });
  }

  playAudioAlert(): void {
    try {
      const audio = new Audio('/assets/sounds/new-order.mp3');
      audio.play().catch(err => console.warn('Audio autoplay blocked or failed:', err));
    } catch (e) {
      console.error('Failed to play notification audio:', e);
    }
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      this.loadNotifications();
    }
  }

  markAsRead(notification: NotificationResponse): void {
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.cdr.detectChanges();
      }
    });
  }

  onNotificationClick(notification: NotificationResponse): void {
    this.markAsRead(notification);
    this.showDropdown = false;
    if (notification.deepLinkUrl) {
      const parsedUrl = notification.deepLinkUrl.replace(/^http:\/\/localhost:\d+/, '');
      this.router.navigateByUrl(parsedUrl);
    }
  }

  markAllAsRead(): void {
    if (!this.userId) return;
    this.notificationService.markAllAsRead(this.userId).subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
        this.unreadCount = 0;
        this.cdr.detectChanges();
      }
    });
  }
}
