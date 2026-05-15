import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-oauth2-redirect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader-container">
      <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Loading...</span>
      </div>
      <h4 class="mt-4 fw-bold text-dark">Processing your login...</h4>
      <p class="text-muted">Please wait while we redirect you.</p>
    </div>
  `,
  styles: [`
    .loader-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background-color: #f8f9fa;
    }
    .spinner-border {
      border-width: 0.25em;
    }
  `]
})
export class OAuth2RedirectComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const userId = params['userId'];
      const role = params['role'];
      const email = params['email'];
      const fullName = params['fullName'];

      if (token && userId && role && email && fullName) {
        const user = {
          id: userId,
          role: role,
          email: email,
          fullName: fullName
        };
        
        // Use authService to handle state update and storage
        this.authService.handleOAuth2Login(token, user);

        // Redirect based on role
        this.redirectUser(role);
      } else {
        console.error('Missing OAuth2 parameters');
        this.router.navigate(['/login']);
      }
    });
  }

  private redirectUser(role: string) {
    const roleUpper = role.toUpperCase();
    switch (roleUpper) {
      case 'ADMIN':
        this.router.navigate(['/admin/users']);
        break;
      case 'RESTAURANT_OWNER':
        this.router.navigate(['/owner/dashboard']);
        break;
      case 'DELIVERY_AGENT':
        this.router.navigate(['/agent/dashboard']);
        break;
      case 'CUSTOMER':
        this.router.navigate(['/customer/restaurants']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }
}
