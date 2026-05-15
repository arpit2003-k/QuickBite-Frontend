import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { PaymentService } from '../../../core/services/payment.service';
import { OrderService } from '../../../core/services/order.service';

declare var Razorpay: any;

type LeafletModule = typeof import('leaflet');

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class CheckoutComponent implements OnInit, AfterViewInit, OnDestroy {
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private paymentService = inject(PaymentService);
  private orderService = inject(OrderService);
  public router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  cart: any = null;
  walletBalance = 0;

  deliveryAddress = '';
  specialInstructions = '';
  paymentMode = 'COD';

  loading = true;
  placingOrder = false;
  errorMessage = '';
  locating = false;
  locationStatus = 'Use your live location or tap the map to pin the delivery point.';
  selectedLat: number | null = null;
  selectedLng: number | null = null;

  private leaflet: LeafletModule | null = null;
  private map: any;
  private marker: any;

  get customerId(): string {
    const user = this.authService.getUser();
    return user?.userId || user?.id;
  }

  ngOnInit() {
    if (!this.customerId) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadCart();
    this.loadWalletBalance();
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

  loadCart() {
    this.cartService.getCartByCustomer(this.customerId).subscribe({
      next: (data) => {
        this.cart = data;
        if (!this.cart?.items?.length) {
          this.router.navigate(['/customer/cart']);
        }
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.initializeMap();
          if (this.map) {
            this.map.invalidateSize();
          }
        }, 0);
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/customer/cart']);
        this.cdr.detectChanges();
      }
    });
  }

  loadWalletBalance() {
    this.paymentService.getWalletBalance(this.customerId).subscribe({
      next: (res) => {
        this.walletBalance = res.balance || 0;
        this.cdr.detectChanges();
      },
      error: () => {
        this.walletBalance = 0;
        this.cdr.detectChanges();
      }
    });
  }

  get isWalletSufficient(): boolean {
    if (!this.cart) return true;
    return this.walletBalance >= this.cart.totalPrice;
  }

  async initializeMap() {
    const mapContainer = document.getElementById('checkout-location-map');
    if (!mapContainer || this.map) return;

    const L = await import('leaflet');
    this.leaflet = L;

    const defaultCoords: [number, number] = [23.2599, 77.4126];
    this.map = L.map(mapContainer, {
      zoomControl: true,
      scrollWheelZoom: false
    }).setView(defaultCoords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (event: any) => {
      this.setPinnedLocation(event.latlng.lat, event.latlng.lng, true);
    });

    if (this.selectedLat != null && this.selectedLng != null) {
      this.renderMapPin(this.selectedLat, this.selectedLng, true);
    }

    setTimeout(() => this.map.invalidateSize(), 150);
  }

  useCurrentLocation() {
    if (!navigator.geolocation) {
      this.errorMessage = 'Geolocation is not supported in this browser.';
      this.cdr.detectChanges();
      return;
    }

    this.locating = true;
    this.locationStatus = 'Fetching your current location...';
    this.cdr.detectChanges();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.setPinnedLocation(position.coords.latitude, position.coords.longitude, true);
        this.locationStatus = 'Live location captured. You can still drag your pin by tapping another spot.';
        this.locating = false;
        this.cdr.detectChanges();
      },
      () => {
        this.errorMessage = 'Unable to fetch your location. Please allow location access or pin the map manually.';
        this.locationStatus = 'Location access denied. Tap the map to pin your delivery point manually.';
        this.locating = false;
        this.cdr.detectChanges();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  private setPinnedLocation(lat: number, lng: number, centerMap: boolean) {
    this.selectedLat = Number(lat.toFixed(6));
    this.selectedLng = Number(lng.toFixed(6));

    this.renderMapPin(lat, lng, centerMap);

    this.updateAddressFromCoordinates();
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  private renderMapPin(lat: number, lng: number, centerMap: boolean) {
    if (!this.leaflet || !this.map) return;

    if (!this.marker) {
      this.marker = this.leaflet.circleMarker([lat, lng], {
        radius: 10,
        color: '#ff4757',
        weight: 3,
        fillColor: '#ff7b89',
        fillOpacity: 0.85
      }).addTo(this.map);
    } else {
      this.marker.setLatLng([lat, lng]);
    }

    if (centerMap) {
      this.map.setView([lat, lng], 16);
    }
  }

  private async updateAddressFromCoordinates() {
    if (this.selectedLat == null || this.selectedLng == null) return;

    const gpsTag = `[GPS: ${this.selectedLat}, ${this.selectedLng}]`;
    const preservedAddress = this.deliveryAddress.replace(/\s*\[GPS:.*\]$/, '').trim();

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${this.selectedLat}&lon=${this.selectedLng}`,
        {
          headers: {
            Accept: 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const resolvedAddress = data?.display_name?.trim();
        if (resolvedAddress) {
          this.deliveryAddress = `${resolvedAddress} ${gpsTag}`;
          this.locationStatus = 'Live location and address captured. You can edit the address before placing the order.';
          this.cdr.detectChanges();
          return;
        }
      }
    } catch {
      // Keep a graceful local fallback when reverse geocoding is unavailable.
    }

    this.deliveryAddress = preservedAddress ? `${preservedAddress} ${gpsTag}` : `Pinned delivery location ${gpsTag}`;
    this.locationStatus = 'Live coordinates captured. If the full address does not appear, you can type it manually.';
    this.cdr.detectChanges();
  }

  placeOrder() {
    if (!this.deliveryAddress.trim()) {
      this.errorMessage = 'Delivery address is required.';
      return;
    }

    if (this.paymentMode === 'WALLET' && !this.isWalletSufficient) {
      this.errorMessage = 'Insufficient wallet balance! Please select Cash on Delivery or top up your wallet.';
      return;
    }

    if (this.paymentMode === 'ONLINE') {
      this.initiateRazorpayPayment();
      return;
    }

    this.completeOrderPlacement();
  }

  initiateRazorpayPayment() {
    this.errorMessage = '';
    this.placingOrder = true;
    this.cdr.detectChanges();

    const user = this.authService.getUser();

    this.paymentService.createRazorpayOrder(this.cart.totalPrice).subscribe({
      next: (res) => {
        const options = {
          key: res.keyId,
          amount: res.amount,
          currency: res.currency,
          name: 'QuickBite Premium',
          description: 'Food Delivery Payment',
          order_id: res.razorpayOrderId,
          handler: (response: any) => {
            this.verifyAndPlaceOrder(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
          },
          prefill: {
            name: user?.fullName || '',
            email: user?.email || ''
          },
          theme: { color: '#dc3545' },
          modal: {
            ondismiss: () => {
              this.placingOrder = false;
              this.cdr.detectChanges();
            }
          }
        };
        const rzp = new Razorpay(options);
        rzp.open();
      },
      error: () => {
        this.errorMessage = 'Failed to initiate online payment. Please try again.';
        this.placingOrder = false;
        this.cdr.detectChanges();
      }
    });
  }

  verifyAndPlaceOrder(orderId: string, paymentId: string, signature: string) {
    this.paymentService.verifyRazorpayPayment(orderId, paymentId, signature).subscribe({
      next: (isValid) => {
        if (isValid) {
          this.completeOrderPlacement();
        } else {
          this.errorMessage = 'Payment verification failed. Please contact support.';
          this.placingOrder = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.errorMessage = 'Something went wrong during verification.';
        this.placingOrder = false;
        this.cdr.detectChanges();
      }
    });
  }

  completeOrderPlacement() {
    this.errorMessage = '';
    this.placingOrder = true;
    this.cdr.detectChanges();

    const payload = {
      customerId: this.customerId,
      deliveryAddress: this.deliveryAddress,
      customerLatitude: this.selectedLat,
      customerLongitude: this.selectedLng,
      specialInstructions: this.specialInstructions,
      paymentMode: this.paymentMode
    };

    this.orderService.placeOrder(payload).subscribe({
      next: (order) => {
        this.router.navigate(['/customer/order-confirmation', order.orderId]);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to place order. Please try again later.';
        this.placingOrder = false;
        this.cdr.detectChanges();
      }
    });
  }
}
