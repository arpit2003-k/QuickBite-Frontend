import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-management.html'
})
export class UserManagementComponent implements OnInit {
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  users: any[] = [];
  loading = true;
  filter = 'ALL';

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.authService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        console.error('User load failed:', err);
        alert('Failed to load users. Please ensure the authentication service is reachable.');
        this.cdr.detectChanges();
      }
    });
  }

  toggleStatus(userId: string, currentStatus: boolean) {
    this.authService.updateUserStatus(userId, !currentStatus).subscribe({
      next: () => {
        const user = this.users.find((u: any) => u.userId === userId || u.id === userId);
        if (user) user.isActive = !currentStatus;
        this.cdr.detectChanges();
      },
      error: (err: any) => alert('Failed to update user status')
    });
  }

  get filteredUsers() {
    if (this.filter === 'ALL') return this.users;
    return this.users.filter((u: any) => u.role === this.filter);
  }
}
