import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const expectedRoles = route.data['roles'] as Array<string>;

  const user = authService.getUser();

  if (!user || !user.role) {
    router.navigate(['/login']);
    return false;
  }

  // If the user role matches one of the allowed roles, grant access
  if (expectedRoles && expectedRoles.includes(user.role)) {
    return true;
  }

  // Otherwise redirect to the appropriate dashboard based on role
  switch (user.role) {
    case 'CUSTOMER':
      router.navigate(['/customer/restaurants']);
      break;
    case 'RESTAURANT_OWNER':      // ✅ correct role string
      router.navigate(['/owner/dashboard']);
      break;
    case 'DELIVERY_AGENT':        // ✅ correct role string
      router.navigate(['/agent/dashboard']);
      break;
    case 'ADMIN':
      router.navigate(['/admin/users']);
      break;
    default:
      router.navigate(['/login']);
  }
  return false;
};