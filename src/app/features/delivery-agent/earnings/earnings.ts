import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeliveryService } from '../../../core/services/delivery.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-agent-earnings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './earnings.html'
})
export class EarningsComponent implements OnInit {
  private deliveryService = inject(DeliveryService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  agentId: string = '';
  summary: any = null;
  loading = true;

  ngOnInit() {
    this.fetchAgentAndEarnings();
  }

  fetchAgentAndEarnings() {
    const userId = this.authService.getUser()?.id || this.authService.getUser()?.userId;
    this.deliveryService.getAgentByUserId(userId).subscribe({
      next: (agent) => {
        this.agentId = agent.id || agent.agentId;
        this.loadEarnings();
      },
      error: () => {
        this.agentId = 'AGENT001';
        this.loadEarnings();
      }
    });
  }

  loadEarnings() {
    this.deliveryService.getEarnings(this.agentId).subscribe({
      next: (data) => {
        this.summary = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        // Demo fallback
        this.summary = {
          totalDeliveries: 124,
          totalEarnings: 8450,
          pendingPayout: 1200,
          averageRating: 4.8,
          incentives: 500
        };
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
