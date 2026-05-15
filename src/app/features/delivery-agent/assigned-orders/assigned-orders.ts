import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeliveryService } from '../../../core/services/delivery.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-assigned-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assigned-orders.html',
  styleUrl: './assigned-orders.css'
})
export class AssignedOrdersComponent implements OnInit {
  private deliveryService = inject(DeliveryService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  agentId: string = '';
  activeOrders: any[] = [];
  pastDeliveries: any[] = [];
  showAllPastDeliveries = false;
  loading = true;

  ngOnInit() {
    this.fetchAgentAndOrders();
  }

  fetchAgentAndOrders() {
    const user = this.authService.getUser();
    const userId = user?.id || user?.userId;
    
    this.deliveryService.getAgentByUserId(userId).subscribe({
      next: (agent) => {
        this.agentId = agent.agentId || agent.id;
        this.loadOrders();
      },
      error: () => {
        this.agentId = '1'; // Realistic fallback
        this.loadOrders();
      }
    });
  }

  loadOrders() {
    // Assigned orders are managed by the Order Service
    this.orderService.getOrdersByAgent(this.agentId).subscribe({
      next: (data) => {
        const orders = data || [];
        this.activeOrders = orders.filter((o: any) =>
          o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED'
        );
        this.pastDeliveries = orders
          .filter((o: any) => o.orderStatus === 'DELIVERED')
          .sort((a: any, b: any) => {
            const aTime = new Date(a.deliveredAt || a.orderDate || 0).getTime();
            const bTime = new Date(b.deliveredAt || b.orderDate || 0).getTime();
            return bTime - aTime;
          });
        this.showAllPastDeliveries = false;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateStatus(orderId: any, status: string) {
    const statusLabels: { [key: string]: string } = {
      'PICKED_UP': 'PICK UP this order',
      'DELIVERED': 'mark this order as DELIVERED'
    };
    
    if (!confirm(`Are you sure you want to ${statusLabels[status] || status}?`)) return;
    
    this.orderService.updateStatus(orderId, status).subscribe({
      next: () => {
        if (status === 'DELIVERED') {
        }
        this.loadOrders();
        alert(`Order status updated to ${status}! 🚀`);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        alert(err.error?.message || 'Failed to update order status');
      }
    });
  }

  // Keep for compatibility if template uses it
  markAsDelivered(orderId: any) {
    this.updateStatus(orderId, 'DELIVERED');
  }

  get visiblePastDeliveries(): any[] {
    return this.showAllPastDeliveries ? this.pastDeliveries : this.pastDeliveries.slice(0, 8);
  }

  togglePastDeliveries(): void {
    this.showAllPastDeliveries = !this.showAllPastDeliveries;
  }
}
