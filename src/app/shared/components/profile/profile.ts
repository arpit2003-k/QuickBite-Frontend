import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { DeliveryService } from '../../../core/services/delivery.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private restaurantService = inject(RestaurantService);
  private deliveryService = inject(DeliveryService);
  private cdr = inject(ChangeDetectorRef);

  user: any = null;
  restaurants: any[] = [];
  agentProfile: any = null;
  loading = true;
  savingProfile = false;
  changingPassword = false;
  profileMessage = '';
  passwordMessage = '';
  profileError = '';
  passwordError = '';
  profileForm = {
    fullName: '',
    phone: ''
  };
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  ngOnInit() {
    this.user = this.authService.getUser();
    if (!this.user) {
      this.loading = false;
      return;
    }
    this.loadProfile();
  }

  loadProfile() {
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.user = { ...this.user, ...profile, id: profile.userId, userId: profile.userId };
        this.authService.updateStoredUser(profile);
        this.profileForm.fullName = profile.fullName || '';
        this.profileForm.phone = profile.phone || '';
        this.loadRoleSpecificData();
      },
      error: () => {
        this.profileForm.fullName = this.user?.fullName || '';
        this.profileForm.phone = this.user?.phone || '';
        this.loadRoleSpecificData();
      }
    });
  }

  loadRoleSpecificData() {
    if (this.user.role === 'RESTAURANT_OWNER') {
      this.loadOwnerData();
    } else if (this.user.role === 'DELIVERY_AGENT') {
      this.loadAgentData();
    } else {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  loadAgentData() {
    const userId = this.user.id || this.user.userId;
    this.deliveryService.getAgentByUserId(userId).subscribe({
      next: (profile) => {
        this.agentProfile = profile;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.agentProfile = null;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadOwnerData() {
    const userId = this.user.id || this.user.userId;
    this.restaurantService.getByOwnerId(userId).subscribe({
      next: (res: any[]) => {
        this.restaurants = res || [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateProfile() {
    if (!this.profileForm.fullName.trim() || !this.profileForm.phone.trim()) {
      this.profileError = 'Full name and phone are required.';
      this.profileMessage = '';
      this.cdr.detectChanges();
      return;
    }

    this.savingProfile = true;
    this.profileError = '';
    this.profileMessage = '';

    this.authService.updateProfile({
      fullName: this.profileForm.fullName.trim(),
      phone: this.profileForm.phone.trim()
    }).subscribe({
      next: (profile) => {
        this.user = { ...this.user, ...profile, id: profile.userId, userId: profile.userId };
        this.profileForm.fullName = profile.fullName || '';
        this.profileForm.phone = profile.phone || '';
        this.profileMessage = 'Profile updated successfully.';
        this.savingProfile = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.profileError = err.error?.message || 'Failed to update profile.';
        this.profileMessage = '';
        this.savingProfile = false;
        this.cdr.detectChanges();
      }
    });
  }

  updatePassword() {
    if (!this.passwordForm.newPassword.trim()) {
      this.passwordError = 'New password is required.';
      this.passwordMessage = '';
      this.cdr.detectChanges();
      return;
    }

    if (this.passwordForm.newPassword.length < 4) {
      this.passwordError = 'New password must be at least 4 characters long.';
      this.passwordMessage = '';
      this.cdr.detectChanges();
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.passwordError = 'New password and confirm password do not match.';
      this.passwordMessage = '';
      this.cdr.detectChanges();
      return;
    }

    this.changingPassword = true;
    this.passwordError = '';
    this.passwordMessage = '';

    this.authService.changePassword({
      currentPassword: this.passwordForm.currentPassword.trim() || undefined,
      newPassword: this.passwordForm.newPassword.trim()
    }).subscribe({
      next: () => {
        this.passwordForm = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        this.passwordMessage = 'Password updated successfully.';
        this.changingPassword = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.passwordError = err.error?.message || 'Failed to update password.';
        this.passwordMessage = '';
        this.changingPassword = false;
        this.cdr.detectChanges();
      }
    });
  }
}
