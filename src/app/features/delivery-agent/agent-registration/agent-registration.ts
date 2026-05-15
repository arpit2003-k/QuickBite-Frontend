import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DeliveryService } from '../../../core/services/delivery.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-agent-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './agent-registration.html'
})
export class AgentRegistrationComponent {
  private fb = inject(FormBuilder);
  private deliveryService = inject(DeliveryService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  registrationForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor() {
    const user = this.authService.getUser();
    this.registrationForm = this.fb.group({
      userId: [user?.id || user?.userId, Validators.required],
      fullName: [user?.fullName || '', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      vehicleType: ['Bicycle', Validators.required],
      vehicleNumber: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.registrationForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    
    this.deliveryService.registerAgent(this.registrationForm.value).subscribe({
      next: (res) => {
        alert('Registration Successful! Your profile is pending verification.');
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
