import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getDashboardSummary(filter: string) {
    return this.http.get(`${this.baseUrl}/dashboard?filter=${filter}`);
  }
  // PRODUCTS
  getProducts() {
    return this.http.get(`${this.baseUrl}/products`);
  }

  addProduct(data: any) {
    return this.http.post(`${this.baseUrl}/products`, data);
  }

  // BILLING
  previewBill(data: any) {
    return this.http.post(`${this.baseUrl}/billing/preview`, data);
  }

  createInvoice(data: any) {
    return this.http.post(`${this.baseUrl}/billing/create`, data);
  }

  completePayment(data: any) {
    return this.http.post(`${this.baseUrl}/billing/complete`, data);
  }

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
}
