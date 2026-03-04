import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private base = `${environment.apiUrl}/auth`;
  constructor(private http: HttpClient) {}

  login(data: { identifier: string; password: string }) {
    return this.http.post(`${this.base}/login`, data);
  }

  register(data: any) {
    return this.http.post(`${this.base}/register`, data);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
