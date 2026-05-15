import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DeliveryService } from '../../../core/services/delivery.service';

@Component({
  selector: 'app-agent-verification',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './agent-verification.html'
})
export class AgentVerificationComponent implements OnInit {
  private deliveryService = inject(DeliveryService);
  private cdr = inject(ChangeDetectorRef);

  agents: any[] = [];
  loading = true;
  filter = 'PENDING';

  ngOnInit() {
    this.loadAgents();
  }

  loadAgents() {
    this.deliveryService.getAllAgents().subscribe({
      next: (data) => {
        this.agents = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get filteredAgents() {
    if (this.filter === 'PENDING') return this.agents.filter((a: any) => !a.isVerified);
    return this.agents.filter((a: any) => a.isVerified);
  }

  verify(id: string) {
    this.deliveryService.verifyAgent(id, true).subscribe({
      next: () => {
        const agent = this.agents.find((a: any) => (a.agentId || a.id).toString() === id.toString());
        if (agent) agent.isVerified = true;
        this.cdr.detectChanges();
        alert('Rider Verified Successfully!');
      }
    });
  }

  revokeVerification(id: string) {
    if (!confirm('Revoke verification for this rider?')) return;
    this.deliveryService.verifyAgent(id, false).subscribe({
      next: () => {
        const agent = this.agents.find((a: any) => (a.agentId || a.id).toString() === id.toString());
        if (agent) agent.isVerified = false;
        this.cdr.detectChanges();
      }
    });
  }
}
