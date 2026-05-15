import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NotificationService, NotificationResponse } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

export interface GroupedNotifications {
  today: NotificationResponse[];
  yesterday: NotificationResponse[];
  thisWeek: NotificationResponse[];
  older: NotificationResponse[];
}

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.css'
})
export class NotificationCenterComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  allNotifications: NotificationResponse[] = [];
  groupedNotifications: GroupedNotifications = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: []
  };

  unreadCount = 0;
  userId: number | null = null;
  loading = true;

  private authSub: any = null;

  // Pagination
  currentPage = 1;
  pageSize = 20;

  ngOnInit(): void {
    this.authSub = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userId = user.id || user.userId;
        this.loadAllNotifications();
      } else {
        this.userId = null;
        this.allNotifications = [];
        this.groupedNotifications = { today: [], yesterday: [], thisWeek: [], older: [] };
        this.unreadCount = 0;
      }
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }

  loadAllNotifications(): void {
    if (!this.userId) return;

    this.loading = true;
    this.notificationService.getUnreadCount(this.userId).subscribe({
      next: (count) => {
        this.unreadCount = count;
        this.cdr.detectChanges();
      }
    });

    this.notificationService.getUserNotifications(this.userId).subscribe({
      next: (res) => {
        this.allNotifications = res;
        this.groupAndPaginate();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  groupAndPaginate(): void {
    // Basic grouping by date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    this.groupedNotifications = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    // Slice for current page
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const paginatedItems = this.allNotifications.slice(startIndex, startIndex + this.pageSize);

    paginatedItems.forEach(n => {
      const d = new Date(n.sentAt);
      if (d >= today) {
        this.groupedNotifications.today.push(n);
      } else if (d >= yesterday) {
        this.groupedNotifications.yesterday.push(n);
      } else if (d >= weekAgo) {
        this.groupedNotifications.thisWeek.push(n);
      } else {
        this.groupedNotifications.older.push(n);
      }
    });
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

  markAllAsRead(): void {
    if (!this.userId) return;
    this.notificationService.markAllAsRead(this.userId).subscribe({
      next: () => {
        this.allNotifications.forEach(n => n.isRead = true);
        this.unreadCount = 0;
        this.groupAndPaginate();
        this.cdr.detectChanges();
      }
    });
  }

  onNotificationClick(notification: NotificationResponse): void {
    this.markAsRead(notification);
    if (notification.deepLinkUrl) {
      const parsedUrl = notification.deepLinkUrl.replace(/^http:\/\/localhost:\d+/, '');
      this.router.navigateByUrl(parsedUrl);
    }
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.groupAndPaginate();
    this.cdr.detectChanges();
  }

  get totalPages(): number {
    return Math.ceil(this.allNotifications.length / this.pageSize);
  }

  get hasNotifications(): boolean {
    return (
      this.groupedNotifications.today.length > 0 ||
      this.groupedNotifications.yesterday.length > 0 ||
      this.groupedNotifications.thisWeek.length > 0 ||
      this.groupedNotifications.older.length > 0
    );
  }
}
