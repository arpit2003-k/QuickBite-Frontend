import { Component, OnInit, OnDestroy, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';

type LeafletModule = typeof import('leaflet');

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-tracking.html',
  styleUrl: './order-tracking.css'
})
export class OrderTrackingComponent implements OnInit, OnDestroy, AfterViewInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private cdr = inject(ChangeDetectorRef);

  orderId: string | null = null;
  order: any = null;
  tracking: any = null;
  loading = true;
  cancelling = false;
  pollingTimer: any;
  trackingMessage = 'Loading live route and location details...';

  private leaflet: LeafletModule | null = null;
  private map: any;
  private markerLayer: any[] = [];
  private routeLayers: any[] = [];

  private authService = inject(AuthService);

  // Status mapping for the timeline
  statusSteps = [
    { key: 'PLACED', label: 'Order Placed', icon: 'bi-box-seam', color: 'info' },
    { key: 'CONFIRMED', label: 'Confirmed', icon: 'bi-check2-circle', color: 'primary' },
    { key: 'PREPARING', label: 'Preparing', icon: 'bi-fire', color: 'warning' },
    { key: 'PICKED_UP', label: 'On the Way', icon: 'bi-bicycle', color: 'indigo' },
    { key: 'DELIVERED', label: 'Delivered', icon: 'bi-house-check', color: 'success' }
  ];

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('orderId');
    if (this.orderId) {
      this.loadOrderData();
      // Start polling every 5 seconds
      this.pollingTimer = setInterval(() => {
        this.loadOrderData(false);
      }, 5000);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initializeMap(), 0);
  }

  ngOnDestroy() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
    }
    if (this.map) {
      this.map.remove();
    }
  }

  loadOrderData(firstLoad = true) {
    if (firstLoad) this.loading = true;
    
    this.orderService.getOrderById(this.orderId!).subscribe({
      next: (data) => {
        this.order = data;
        this.loadTrackingData();
        this.loading = false;
        this.cdr.detectChanges();
        
        // Stop polling if delivered or cancelled
        if (this.order.orderStatus === 'DELIVERED' || this.order.orderStatus === 'CANCELLED') {
          clearInterval(this.pollingTimer);
        }
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadTrackingData() {
    if (!this.orderId) return;

    this.orderService.getOrderTracking(this.orderId).subscribe({
      next: async (data) => {
        this.tracking = data;
        this.trackingMessage = this.buildTrackingMessage();
        await this.renderTrackingMap();
        this.cdr.detectChanges();
      },
      error: () => {
        this.tracking = null;
        this.trackingMessage = 'Live map data is not available for this order yet.';
        this.cdr.detectChanges();
      }
    });
  }

  getCurrentStepIndex(): number {
    if (!this.order) return -1;
    const status = this.order.orderStatus;
    if (status === 'CANCELLED') return -1;
    
    // Map both PICKED_UP and OUT_FOR_DELIVERY to the same step for UI consistency
    if (status === 'OUT_FOR_DELIVERY' || status === 'PICKED_UP') return 3;
    
    // Find index of standard steps
    return this.statusSteps.findIndex(s => s.key === status);
  }

  getStatusStepClass(index: number): string {
    const currentIndex = this.getCurrentStepIndex();
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'active';
    return 'pending';
  }

  cancelOrder() {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    this.cancelling = true;
    this.cdr.detectChanges();

    const customerId = this.authService.getUser()?.id || this.authService.getUser()?.userId;

    this.orderService.cancelOrder(+this.orderId!, customerId).subscribe({
      next: (updated) => {
        this.order = updated;
        this.cancelling = false;
        clearInterval(this.pollingTimer);
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to cancel order.');
        this.cancelling = false;
        this.cdr.detectChanges();
      }
    });
  }

  get visibleRouteDistance(): any {
    if (!this.tracking) return null;
    return this.order?.orderStatus === 'PICKED_UP'
      ? this.tracking.agentToCustomer || this.tracking.restaurantToCustomer
      : this.tracking.restaurantToCustomer;
  }

  private async initializeMap() {
    const mapContainer = document.getElementById('customer-tracking-map');
    if (!mapContainer || this.map) return;

    const L = await import('leaflet');
    this.leaflet = L;

    this.map = L.map(mapContainer, {
      zoomControl: true,
      scrollWheelZoom: false
    }).setView([23.2599, 77.4126], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    if (this.tracking) {
      await this.renderTrackingMap();
    }
  }

  private async renderTrackingMap() {
    if (!this.tracking) return;
    if (!this.map) {
      await this.initializeMap();
    }
    if (!this.map || !this.leaflet) return;

    this.clearMapLayers();

    const points: Array<{ label: string; latitude: number; longitude: number; color: string }> = [];
    const restaurant = this.tracking.restaurant;
    const customer = this.tracking.customer;
    const agent = this.tracking.deliveryAgent;

    if (restaurant?.latitude != null && restaurant?.longitude != null) {
      points.push({ ...restaurant, color: '#dc3545' });
    }
    if (customer?.latitude != null && customer?.longitude != null) {
      points.push({ ...customer, color: '#198754' });
    }
    if (agent?.latitude != null && agent?.longitude != null) {
      points.push({ ...agent, color: '#0d6efd' });
    }

    points.forEach((point) => this.addMarker(point));

    if (restaurant && customer) {
      await this.drawRoute(
        [restaurant.latitude, restaurant.longitude],
        [customer.latitude, customer.longitude],
        '#ff7a59'
      );
    }

    if (agent && restaurant && this.order?.orderStatus !== 'PICKED_UP' && this.order?.orderStatus !== 'DELIVERED') {
      await this.drawRoute(
        [agent.latitude, agent.longitude],
        [restaurant.latitude, restaurant.longitude],
        '#2563eb'
      );
    }

    if (agent && customer && this.order?.orderStatus === 'PICKED_UP') {
      await this.drawRoute(
        [agent.latitude, agent.longitude],
        [customer.latitude, customer.longitude],
        '#2563eb'
      );
    }

    const bounds = points.map((point) => [point.latitude, point.longitude]);
    if (bounds.length) {
      this.map.fitBounds(bounds, { padding: [32, 32] });
    }
  }

  private addMarker(point: { label: string; latitude: number; longitude: number; color: string }) {
    if (!this.leaflet || !this.map) return;
    const marker = this.leaflet.circleMarker([point.latitude, point.longitude], {
      radius: 10,
      color: point.color,
      weight: 3,
      fillColor: point.color,
      fillOpacity: 0.7
    }).addTo(this.map);
    marker.bindPopup(`<strong>${point.label}</strong>`);
    this.markerLayer.push(marker);
  }

  private async drawRoute(from: [number, number], to: [number, number], color: string) {
    if (!this.leaflet || !this.map) return;

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      const coordinates = data?.routes?.[0]?.geometry?.coordinates;
      if (coordinates?.length) {
        const latLngs = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        const polyline = this.leaflet.polyline(latLngs, {
          color,
          weight: 5,
          opacity: 0.85
        }).addTo(this.map);
        this.routeLayers.push(polyline);
        return;
      }
    } catch {
      // Fallback to straight line below.
    }

    const fallback = this.leaflet.polyline([from, to], {
      color,
      weight: 4,
      opacity: 0.6,
      dashArray: '8 10'
    }).addTo(this.map);
    this.routeLayers.push(fallback);
  }

  private clearMapLayers() {
    this.markerLayer.forEach((layer) => this.map.removeLayer(layer));
    this.routeLayers.forEach((layer) => this.map.removeLayer(layer));
    this.markerLayer = [];
    this.routeLayers = [];
  }

  private buildTrackingMessage(): string {
    if (!this.tracking) return 'Live map data is not available for this order yet.';
    if (this.order?.orderStatus === 'PICKED_UP') {
      return 'Your rider is on the way to the customer location.';
    }
    return 'Showing the restaurant, customer, and current rider position on the map.';
  }
}
