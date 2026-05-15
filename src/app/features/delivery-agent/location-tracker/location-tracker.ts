import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeliveryService } from '../../../core/services/delivery.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';

type LeafletModule = typeof import('leaflet');

@Component({
  selector: 'app-location-tracker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './location-tracker.html',
  styleUrl: './location-tracker.css'
})
export class LocationTrackerComponent implements OnInit, OnDestroy {
  private deliveryService = inject(DeliveryService);
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private cdr = inject(ChangeDetectorRef);

  agentId: string = '';
  currentPos: any = null;
  watchId: number | null = null;
  lastUpdate: Date | null = null;
  isTracking = false;
  activeOrder: any = null;
  tracking: any = null;
  loadingTracking = true;
  trackingTimer: any;

  private leaflet: LeafletModule | null = null;
  private map: any;
  private markerLayer: any[] = [];
  private routeLayers: any[] = [];

  ngOnInit() {
    this.fetchAgent();
  }

  fetchAgent() {
    const userId = this.authService.getUser()?.id || this.authService.getUser()?.userId;
    this.deliveryService.getAgentByUserId(userId).subscribe({
      next: (agent) => {
        this.agentId = agent.id || agent.agentId;
        this.loadTrackingContext();
        this.startTracking();
      },
      error: () => {
        this.agentId = 'AGENT001';
        this.loadTrackingContext();
        this.startTracking();
      }
    });
  }

  startTracking() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    this.isTracking = true;
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.currentPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        this.lastUpdate = new Date();
        this.sendUpdateToServer();
        this.renderTrackingMap();
        this.cdr.detectChanges();
      },
      (err) => {
        console.error('Location error:', err);
        this.isTracking = false;
        this.cdr.detectChanges();
      },
      { enableHighAccuracy: true }
    );
  }

  sendUpdateToServer() {
    if (!this.agentId || !this.currentPos) return;
    
    this.deliveryService.updateLocation(this.agentId, this.currentPos.lat, this.currentPos.lng).subscribe({
      next: () => {
        console.log('Location synced to server');
        this.refreshTracking();
      },
      error: (err) => console.warn('Sync failed', err)
    });
  }

  ngOnDestroy() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }
    if (this.trackingTimer) {
      clearInterval(this.trackingTimer);
    }
    if (this.map) {
      this.map.remove();
    }
  }

  get combinedEta(): number | null {
    if (!this.tracking) return null;
    const firstLeg = this.tracking.agentToRestaurant?.estimatedMinutes || 0;
    const secondLeg = this.tracking.restaurantToCustomer?.estimatedMinutes || 0;
    return firstLeg + secondLeg || null;
  }

  private loadTrackingContext() {
    this.refreshTracking();
    this.trackingTimer = setInterval(() => this.refreshTracking(), 10000);
  }

  private refreshTracking() {
    if (!this.agentId) return;

    this.orderService.getOrdersByAgent(this.agentId).subscribe({
      next: (orders) => {
        const activeOrders = (orders || []).filter((order: any) =>
          order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED'
        );
        this.activeOrder = activeOrders[0] || null;

        if (!this.activeOrder) {
          this.tracking = null;
          this.loadingTracking = false;
          this.renderTrackingMap();
          this.cdr.detectChanges();
          return;
        }

        this.orderService.getOrderTracking(String(this.activeOrder.orderId || this.activeOrder.id)).subscribe({
          next: async (tracking) => {
            this.tracking = tracking;
            this.loadingTracking = false;
            await this.renderTrackingMap();
            this.cdr.detectChanges();
          },
          error: () => {
            this.loadingTracking = false;
            this.tracking = null;
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.loadingTracking = false;
        this.cdr.detectChanges();
      }
    });
  }

  private async initializeMap() {
    const mapContainer = document.getElementById('agent-tracking-map');
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
  }

  private async renderTrackingMap() {
    if (!this.map) {
      await this.initializeMap();
    }
    if (!this.map || !this.leaflet) return;

    this.clearMapLayers();
    if (!this.tracking) return;

    const points: Array<{ label: string; latitude: number; longitude: number; color: string }> = [];
    const restaurant = this.tracking.restaurant;
    const customer = this.tracking.customer;
    const agent = this.currentPos
      ? { label: 'Your live location', latitude: this.currentPos.lat, longitude: this.currentPos.lng }
      : this.tracking.deliveryAgent;

    if (agent?.latitude != null && agent?.longitude != null) {
      points.push({ ...agent, color: '#2563eb' });
    }
    if (restaurant?.latitude != null && restaurant?.longitude != null) {
      points.push({ ...restaurant, color: '#dc3545' });
    }
    if (customer?.latitude != null && customer?.longitude != null) {
      points.push({ ...customer, color: '#16a34a' });
    }

    points.forEach((point) => this.addMarker(point));

    if (agent && restaurant) {
      await this.drawRoute([agent.latitude, agent.longitude], [restaurant.latitude, restaurant.longitude], '#2563eb');
    }
    if (restaurant && customer) {
      await this.drawRoute([restaurant.latitude, restaurant.longitude], [customer.latitude, customer.longitude], '#ff7a59');
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
      fillOpacity: 0.72
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
}
