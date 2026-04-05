import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Dashboard ────────────────────────────────
  getDashboardSummary(filter: string) {
    return this.http.get(`${this.baseUrl}/dashboard?filter=${filter}`);
  }

  // ── Products ─────────────────────────────────
  getProducts() {
    return this.http.get(`${this.baseUrl}/products`);
  }
  addProduct(data: any) {
    return this.http.post(`${this.baseUrl}/products`, data);
  }

  // ── Billing ──────────────────────────────────
  previewBill(data: any) {
    return this.http.post(`${this.baseUrl}/billing/preview`, data);
  }
  createInvoice(data: any) {
    return this.http.post(`${this.baseUrl}/billing/create`, data);
  }
  completePayment(data: any) {
    return this.http.post(`${this.baseUrl}/billing/complete`, data);
  }

  // ── Invoices ─────────────────────────────────
  getInvoices() {
    return this.http.get(`${this.baseUrl}/invoices`);
  }
  cancelInvoice(data: any) {
    return this.http.post(`${this.baseUrl}/invoices/cancel`, data);
  }
  getInvoiceDetails(id: number) {
    return this.http.get(`${this.baseUrl}/invoices/${id}`);
  }
  convertInvoiceToGst(invoiceId: number) {
    return this.http.post(
      `${this.baseUrl}/invoices/convert-to-gst/${invoiceId}`,
      {},
    );
  }

  // ── Invoice PDF download ──────────────────────
  // responseType: 'blob' is REQUIRED — without it Angular tries
  // to parse the binary PDF as JSON and the download is corrupt.
  // The auth interceptor still attaches the Bearer token because
  // this goes through HttpClient just like any other request.
  downloadInvoicePdf(id: number) {
    return this.http.get(`${this.baseUrl}/invoices/${id}/download`, {
      responseType: 'blob',
    });
  }

  // ── Export invoices by date range ─────────────
  exportInvoicesByDate(start: string, end: string) {
    return this.http.get(
      `${this.baseUrl}/invoices/export?start=${start}&end=${end}`,
      { responseType: 'blob' },
    );
  }

  // ── Profile ───────────────────────────────────
  getProfile() {
    return this.http.get(`${this.baseUrl}/profile`);
  }
  updateProfile(data: any) {
    return this.http.put(`${this.baseUrl}/profile`, data);
  }
  uploadLogo(data: { logo: string }) {
    return this.http.post(`${this.baseUrl}/profile/logo`, data);
  }
  changePassword(data: { current: string; new: string }) {
    return this.http.put(`${this.baseUrl}/profile/change-password`, {
      current_password: data.current,
      new_password: data.new,
    });
  }
  // Add to api.service.ts

  checkRewardStatus(mobile: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/billing/reward-status/${mobile}`);
  }

  getRewardCustomers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/billing/rewards`);
  }
}
