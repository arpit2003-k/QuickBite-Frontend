import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <div class="card shadow border-0 rounded-4 p-5 text-center">
        <h1 class="display-6 fw-bold text-success mb-4">
          <i class="bi bi-check-circle-fill me-2"></i>Login Successful!
        </h1>
        <h3 class="mb-4">Welcome, {{ user?.fullName }}!</h3>
        <p class="lead mb-4">You have successfully logged in as <span class="badge bg-primary">{{ user?.role }}</span></p>
        <div class="alert alert-info d-inline-block">
          This is a placeholder dashboard. The full feature module will be built here next!
        </div>
        <div class="mt-4">
          <button class="btn btn-danger btn-lg px-5 rounded-pill" (click)="logout()">Logout</button>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  user = this.authService.getUser();

  logout() {
    this.authService.logout();
  }
}
