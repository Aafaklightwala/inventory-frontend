import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
  ],
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.css'],
})
export class InvoicesComponent implements OnInit {
  dataSource = new MatTableDataSource<any>();
  startDate: string = '';
  endDate: string = '';

  displayedColumns: string[] = [
    'id',
    'invoice_number',
    'customer_name',
    'total',
    'status',
    'payment_mode',
    'created_at',
    'action',
  ];

  /* ── Convert to GST modal ───────────────────── */
  showConvertModal = false;
  selectedInvoice: any = null;
  converting = false;

  /* ── Download state ─────────────────────────── */
  downloadingId: number | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices() {
    this.api.getInvoices().subscribe((res: any) => {
      this.dataSource = new MatTableDataSource(res);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  /* ────────────────────────────────────────────────────────
     DOWNLOAD INVOICE PDF
     Uses HttpClient (blob) so the auth interceptor attaches
     the JWT token automatically. window.open() bypasses the
     interceptor and gets a 401 from the auth middleware.
  ──────────────────────────────────────────────────────── */
  downloadInvoice(id: number) {
    if (this.downloadingId === id) return; // prevent double-click
    this.downloadingId = id;

    this.api.downloadInvoicePdf(id).subscribe({
      next: (blob: Blob) => {
        // Create a temporary <a> and trigger the browser download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.downloadingId = null;
      },
      error: (err: any) => {
        console.error('Download failed', err);
        alert('❌ Failed to download invoice. Please try again.');
        this.downloadingId = null;
      },
    });
  }

  /* ── Export range (no auth needed for CSV, adjust if needed) */
  exportByDate() {
    if (!this.startDate || !this.endDate) return;
    this.api.exportInvoicesByDate(this.startDate, this.endDate).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoices-${this.startDate}-to-${this.endDate}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => alert('❌ Export failed'),
    });
  }

  /* ── Open convert modal ─────────────────────── */
  convertToGst(invoice: any) {
    this.selectedInvoice = invoice;
    this.showConvertModal = true;
  }

  /* ── GST preview helpers ────────────────────── */
  getGstPreview(subTotal: number): number {
    return (Number(subTotal) * 5) / 100;
  }

  getNewTotal(invoice: any): number {
    const sub = Number(invoice.sub_total);
    const gst = (sub * 5) / 100;
    const discount = Number(invoice.discount) || 0;
    return sub + gst - discount;
  }

  /* ── Confirm convert API call ───────────────── */
  confirmConvert() {
    if (!this.selectedInvoice) return;
    this.converting = true;

    this.api.convertInvoiceToGst(this.selectedInvoice.id).subscribe({
      next: (res: any) => {
        this.converting = false;
        this.showConvertModal = false;
        alert(
          `✅ Converted!\nNew Invoice: ${res.new_invoice_number}\nNew Total (with GST): ₹${res.final_total}`,
        );
        this.loadInvoices();
      },
      error: (err: any) => {
        this.converting = false;
        alert('❌ ' + (err.error?.message || 'Conversion failed'));
      },
    });
  }
}
