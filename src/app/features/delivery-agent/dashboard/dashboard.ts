import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DeliveryService } from '../../../core/services/delivery.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-delivery-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
  private deliveryService = inject(DeliveryService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  agent: any = null;
  loading = true;

  ngOnInit() {
    this.loadAgentProfile();
  }

  loadAgentProfile() {
    const user = this.authService.getUser();
    const userId = user?.id || user?.userId;
    
    this.deliveryService.getAgentByUserId(userId).subscribe({
      next: (agent) => {
        this.agent = agent;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/profile']);
      }
    });
  }

  toggleAvailability() {
    if (!this.agent) return;
    
    const newStatus = !this.agent.isAvailable;
    this.deliveryService.setAvailability(this.agent.agentId || this.agent.id, newStatus).subscribe({
      next: () => {
        this.agent.isAvailable = newStatus;
        this.cdr.detectChanges();
      },
      error: (err) => alert('Availability update failed. Please check if you are verified.')
    });
  }
}
