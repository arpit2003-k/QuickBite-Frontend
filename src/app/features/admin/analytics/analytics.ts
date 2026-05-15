import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './analytics.html'
})
export class AnalyticsComponent implements OnInit {
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  stats = {
    totalOrders: 1254, // Placeholder
    totalRevenue: 450800, // Placeholder
    activeUsers: 0,
    avgRating: 4.7 // Placeholder
  };

  userBreakdown = {
    total: 0,
    customers: 0,
    owners: 0,
    agents: 0
  };

  revenueData = [
    { label: 'Mon', value: 45, height: '45%' },
    { label: 'Tue', value: 52, height: '52%' },
    { label: 'Wed', value: 38, height: '38%' },
    { label: 'Thu', value: 65, height: '65%' },
    { label: 'Fri', value: 85, height: '85%' },
    { label: 'Sat', value: 95, height: '95%' },
    { label: 'Sun', value: 78, height: '78%' }
  ];

  cuisineData = [
    { name: 'Italian', count: 420, percent: 35, color: '#dc3545' },
    { name: 'Chinese', count: 310, percent: 25, color: '#ffc107' },
    { name: 'Indian', count: 280, percent: 22, color: '#198754' },
    { name: 'Mexican', count: 180, percent: 18, color: '#0dcaf0' }
  ];

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.authService.getPlatformStats().subscribe({
      next: (data) => {
        this.stats.activeUsers = data.activeUsers;
        this.userBreakdown = {
          total: data.totalUsers,
          customers: data.totalCustomers,
          owners: data.totalOwners,
          agents: data.totalAgents
        };
        this.cdr.detectChanges();
      }
    });
  }
}
