import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { AuthService } from '../../../core/services/auth.service';

type LeafletModule = typeof import('leaflet');

@Component({
  selector: 'app-restaurant-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './restaurant-registration.html',
  styleUrl: './restaurant-registration.css'
})
export class RestaurantRegistrationComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private restaurantService = inject(RestaurantService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  registrationForm: FormGroup;
  loading = false;
  locating = false;
  errorMessage = '';
  locationStatus = 'Place your restaurant accurately so nearby customers and agents can find it quickly.';

  private leaflet: LeafletModule | null = null;
  private map: any;
  private marker: any;

  constructor() {
    const user = this.authService.getUser();
    this.registrationForm = this.fb.group({
      ownerId: [user?.id || user?.userId, Validators.required],
      name: ['', Validators.required],
      description: ['', Validators.required],
      cuisine: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      phone: ['', Validators.required],
      latitude: [23.2599, Validators.required],
      longitude: [77.4126, Validators.required],
      deliveryRadius: [10, [Validators.required, Validators.min(1)]],
      minOrderAmount: [200, [Validators.required, Validators.min(0)]],
      estimatedDeliveryMin: [30, [Validators.required, Validators.min(1)]],
      imageUrl: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', Validators.required]
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeMap();
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  async initializeMap() {
    const mapContainer = document.getElementById('restaurant-location-map');
    if (!mapContainer || this.map) return;

    const L = await import('leaflet');
    this.leaflet = L;

    const latitude = this.registrationForm.get('latitude')?.value ?? 23.2599;
    const longitude = this.registrationForm.get('longitude')?.value ?? 77.4126;

    this.map = L.map(mapContainer, {
      zoomControl: true,
      scrollWheelZoom: false
    }).setView([latitude, longitude], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.setRestaurantPin(latitude, longitude, false);

    this.map.on('click', (event: any) => {
      this.setRestaurantPin(event.latlng.lat, event.latlng.lng, true);
      this.locationStatus = 'Restaurant pin updated from the map.';
      this.cdr.detectChanges();
    });

    setTimeout(() => this.map.invalidateSize(), 150);
  }

  useCurrentLocation() {
    if (!navigator.geolocation) {
      this.errorMessage = 'Geolocation is not supported in this browser.';
      this.cdr.detectChanges();
      return;
    }

    this.locating = true;
    this.locationStatus = 'Fetching your current restaurant location...';
    this.cdr.detectChanges();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.setRestaurantPin(position.coords.latitude, position.coords.longitude, true);
        this.locationStatus = 'Current location captured. Fine-tune it by clicking another spot on the map if needed.';
        this.locating = false;
        this.cdr.detectChanges();
      },
      () => {
        this.errorMessage = 'Unable to fetch your location. Please allow access or set the pin manually on the map.';
        this.locationStatus = 'Location access denied. Please use the map to set your restaurant location.';
        this.locating = false;
        this.cdr.detectChanges();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  private setRestaurantPin(lat: number, lng: number, centerMap: boolean) {
    if (!this.leaflet || !this.map) return;

    const normalizedLat = Number(lat.toFixed(6));
    const normalizedLng = Number(lng.toFixed(6));
    this.registrationForm.patchValue({ latitude: normalizedLat, longitude: normalizedLng });

    if (!this.marker) {
      this.marker = this.leaflet.circleMarker([lat, lng], {
        radius: 10,
        color: '#198754',
        weight: 3,
        fillColor: '#5dd39e',
        fillOpacity: 0.9
      }).addTo(this.map);
    } else {
      this.marker.setLatLng([lat, lng]);
    }

    if (centerMap) {
      this.map.setView([lat, lng], 16);
    }
  }

  onSubmit() {
    if (this.registrationForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    this.restaurantService.registerRestaurant(this.registrationForm.value).subscribe({
      next: () => {
        alert('Restaurant Registered Successfully! Awaiting Admin Approval.');
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
