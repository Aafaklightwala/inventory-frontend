import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  identifier = '';
  password = '';
  showPwd = false;
  loading = false;
  errorMsg = '';

  // track focus for animated border
  focusId = false;
  focusPwd = false;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {
    // Already logged in → go to dashboard
    if (localStorage.getItem('token')) {
      this.router.navigate(['/dashboard']);
    }
  }

  login() {
    this.errorMsg = '';
    if (!this.identifier.trim() || !this.password.trim()) {
      this.errorMsg = 'Please enter your email/mobile and password.';
      return;
    }

    this.loading = true;
    this.auth
      .login({ identifier: this.identifier, password: this.password })
      .subscribe({
        next: (res: any) => {
          localStorage.setItem('token', res.token);
          // Store user info for display in navbar
          if (res.user) {
            localStorage.setItem('user', JSON.stringify(res.user));
          }
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err: any) => {
          this.loading = false;
          this.errorMsg =
            err.error?.message || 'Login failed. Please try again.';
        },
      });
  }
}
