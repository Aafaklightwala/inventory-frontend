import { Component } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  loggedIn = false;
  userName = '';
  userEmail = '';
  userInitial = '';

  constructor(private router: Router) {
    // Check login state on every route navigation
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.updateLoginState();
      });

    // Initial check on app load
    this.updateLoginState();
  }

  private updateLoginState() {
    const token = localStorage.getItem('token');
    this.loggedIn = !!token;

    if (this.loggedIn) {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        this.userName = user.name || '';
        this.userEmail = user.email || '';
        this.userInitial = this.userName
          ? this.userName.charAt(0).toUpperCase()
          : 'U';
      } catch {
        this.userName = '';
        this.userInitial = 'U';
      }
    } else {
      this.userName = '';
      this.userEmail = '';
      this.userInitial = '';
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.loggedIn = false;
    this.userName = '';
    this.userInitial = '';
    this.router.navigate(['/login']);
  }
}
