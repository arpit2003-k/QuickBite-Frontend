import { AfterViewInit, Component, OnDestroy, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';

type LeafletModule = typeof import('leaflet');

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private restaurantService = inject(RestaurantService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  restaurant: any = null;
  myRestaurants: any[] = [];
  showRegistrationForm = false;
  
  stats = {
    todayOrders: 0,
    todayRevenue: 0,
    totalOrders: 0
  };
  loading = true;
  submitting = false;
  locating = false;
  locationStatus = 'Place the restaurant pin accurately so customers and delivery partners can reach the pickup point.';

  private leaflet: LeafletModule | null = null;
  private locationMap: any;
  private locationMarker: any;

  // Registration Form
  regForm: any = {
    name: '',
    description: '',
    cuisine: '',
    address: '',
    city: 'Bhopal',
    latitude: 23.2599,
    longitude: 77.4126,
    phone: '',
    deliveryRadius: 5,
    minOrderAmount: 100,
    estimatedDeliveryMin: 30,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'
  };

  ngOnInit() {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeRegistrationMap();
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.locationMap) {
      this.locationMap.remove();
    }
  }

  fetchLocation() {
    if (navigator.geolocation) {
      this.locating = true;
      this.locationStatus = 'Fetching your current location...';
      this.cdr.detectChanges();
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.regForm.latitude = Number(position.coords.latitude.toFixed(6));
          this.regForm.longitude = Number(position.coords.longitude.toFixed(6));
          this.locating = false;
          this.locationStatus = 'Current location captured. You can refine it on the map if needed.';
          this.setRegistrationPin(this.regForm.latitude, this.regForm.longitude, true);
          this.populateAddressFromCoordinates();
          this.cdr.detectChanges();
        },
        () => {
          this.locating = false;
          this.locationStatus = 'Location access failed. Please set the restaurant pin manually on the map.';
          alert('Could not fetch location. Using default coordinates.');
          this.cdr.detectChanges();
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }

  async initializeRegistrationMap() {
    const mapContainer = document.getElementById('owner-registration-map');
    if (!mapContainer || this.locationMap) return;

    const L = await import('leaflet');
    this.leaflet = L;

    this.locationMap = L.map(mapContainer, {
      zoomControl: true,
      scrollWheelZoom: false
    }).setView([this.regForm.latitude, this.regForm.longitude], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.locationMap);

    this.setRegistrationPin(this.regForm.latitude, this.regForm.longitude, false);

    this.locationMap.on('click', (event: any) => {
      this.regForm.latitude = Number(event.latlng.lat.toFixed(6));
      this.regForm.longitude = Number(event.latlng.lng.toFixed(6));
      this.locationStatus = 'Restaurant pin updated from the map.';
      this.setRegistrationPin(this.regForm.latitude, this.regForm.longitude, true);
      this.populateAddressFromCoordinates();
      this.cdr.detectChanges();
    });

    setTimeout(() => this.locationMap.invalidateSize(), 150);
  }

  private setRegistrationPin(lat: number, lng: number, centerMap: boolean) {
    if (!this.leaflet || !this.locationMap) return;

    if (!this.locationMarker) {
      this.locationMarker = this.leaflet.circleMarker([lat, lng], {
        radius: 10,
        color: '#198754',
        weight: 3,
        fillColor: '#5dd39e',
        fillOpacity: 0.9
      }).addTo(this.locationMap);
    } else {
      this.locationMarker.setLatLng([lat, lng]);
    }

    if (centerMap) {
      this.locationMap.setView([lat, lng], 16);
    }
  }

  private async populateAddressFromCoordinates() {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${this.regForm.latitude}&lon=${this.regForm.longitude}`,
        {
          headers: {
            Accept: 'application/json'
          }
        }
      );

      if (!response.ok) return;

      const data = await response.json();
      const address = data?.display_name?.trim();
      if (address && !this.regForm.address) {
        this.regForm.address = address;
      }
      if (address) {
        this.locationStatus = 'Live location and address captured. You can still edit the address before submitting.';
      }
      this.cdr.detectChanges();
    } catch {
      // Best-effort enhancement only.
    }
  }

  loadDashboardData() {
    const user = this.authService.getUser();
    const ownerId = user?.id || user?.userId;
    
    this.restaurantService.getByOwnerId(ownerId).subscribe({
      next: (restaurants: any[]) => {
        this.myRestaurants = restaurants || [];
        if (this.myRestaurants.length > 0) {
          const targetId = this.route.snapshot.queryParamMap.get('id');
          if (targetId) {
            this.restaurant = this.myRestaurants.find(r => r.restaurantId == targetId) || this.myRestaurants[0];
          } else {
            this.restaurant = this.myRestaurants[0];
          }
          this.loadOrders(this.restaurant.restaurantId);
        } else {
          this.showRegistrationForm = true;
          this.fetchLocation();
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  switchRestaurant(res: any) {
    this.restaurant = res;
    this.showRegistrationForm = false;
    this.loading = true;
    this.loadOrders(res.restaurantId);
  }

  toggleRegistration() {
    if (!this.showRegistrationForm) {
      this.fetchLocation();
    }
    this.showRegistrationForm = !this.showRegistrationForm;
    this.cdr.detectChanges();
    if (this.showRegistrationForm) {
      setTimeout(() => {
        this.initializeRegistrationMap();
        if (this.locationMap) {
          this.locationMap.invalidateSize();
        }
      }, 0);
    }
  }

  registerRestaurant() {
    this.submitting = true;
    const user = this.authService.getUser();
    const ownerId = user?.id || user?.userId;
    
    const payload = { ...this.regForm, ownerId: +ownerId };
    
    this.restaurantService.registerRestaurant(payload).subscribe({
      next: (res) => {
        // No auto-approval! Must wait for admin.
        this.myRestaurants.push(res);
        this.restaurant = res;
        this.showRegistrationForm = false;
        this.submitting = false;
        alert('Restaurant Registered! 🥳 It is currently pending Admin verification.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert('Registration failed: ' + (err.error?.message || 'Server error'));
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleRestaurantStatus() {
    if (!this.restaurant) return;
    
    const newStatus = !this.restaurant.isOpen;
    this.restaurantService.toggleOpen(this.restaurant.restaurantId, newStatus).subscribe({
      next: (updated) => {
        this.restaurant.isOpen = updated.isOpen;
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert('Failed to update status: ' + (err.error?.message || 'Error'));
      }
    });
  }

  loadOrders(restaurantId: string) {
    this.orderService.getOrdersByRestaurant(restaurantId).subscribe({
      next: (orders: any[]) => {
        const todayStr = new Date().toDateString();
        
        const todayOrders = orders.filter((o: any) => {
          if (!o.orderDate) return false;
          const oDate = new Date(o.orderDate);
          return oDate.toDateString() === todayStr;
        });

        this.stats.todayOrders = todayOrders.length;
        this.stats.todayRevenue = todayOrders.reduce((sum: number, o: any) => 
          sum + (o.finalAmount || o.totalAmount || 0), 0
        );
        this.stats.totalOrders = orders.length;
        
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
