import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  form: any = {
    first_name: '',
    last_name: '',
    mobile: '',
    email: '',
    gst_number: '',
    company_name: '',
    password: '',
  };

  showPwd = false;
  loading = false;
  errorMsg = '';
  successMsg = '';

  // focus tracking per field
  focus: Record<string, boolean> = {};

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {
    if (localStorage.getItem('token')) {
      this.router.navigate(['/dashboard']);
    }
  }

  register() {
    this.errorMsg = '';
    this.successMsg = '';

    // Basic validation
    if (!this.form.first_name?.trim() || !this.form.last_name?.trim()) {
      this.errorMsg = 'First and last name are required.';
      return;
    }
    if (!this.form.mobile?.trim() || this.form.mobile.length !== 10) {
      this.errorMsg = 'Enter a valid 10-digit mobile number.';
      return;
    }
    if (!this.form.email?.trim()) {
      this.errorMsg = 'Email is required.';
      return;
    }
    if (!this.form.password?.trim() || this.form.password.length < 6) {
      this.errorMsg = 'Password must be at least 6 characters.';
      return;
    }

    this.loading = true;
    this.auth.register(this.form).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = 'Account created! Redirecting to login…';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Registration failed. Try again.';
      },
    });
  }
}
