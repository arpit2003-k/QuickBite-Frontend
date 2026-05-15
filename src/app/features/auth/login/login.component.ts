import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage = '';
  isLoading = false;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.login(this.loginForm.value as any).subscribe({
      next: (res) => {
        this.isLoading = false;
        const user = this.authService.getUser();
        if (!user) {
          this.cdr.detectChanges();
          this.router.navigate(['/']);
          return;
        }
        
        switch (user.role) {
          case 'CUSTOMER':
            this.router.navigate(['/customer/restaurants']);
            break;
          case 'RESTAURANT_OWNER':
            this.router.navigate(['/owner/dashboard']);
            break;
          case 'DELIVERY_AGENT':
            this.router.navigate(['/agent/dashboard']);
            break;
          case 'ADMIN':
            this.router.navigate(['/admin/users']);
            break;
          default:
            this.router.navigate(['/']);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Login failed. Please check if your backend is running.';
        this.cdr.detectChanges();
      }
    });
  }
}
