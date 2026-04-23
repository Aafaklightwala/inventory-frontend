// invoices.component.ts — updated with website source column + ship/complete actions
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { environment } from '../../../environments/environment';

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

  // Added 'source' and 'order_status' columns
  displayedColumns: string[] = [
    'id',
    'invoice_number',
    'customer_name',
    'source',
    'total',
    'status',
    'order_status',
    'payment_mode',
    'created_at',
    'action',
  ];

  showConvertModal = false;
  selectedInvoice: any = null;
  converting = false;
  downloadingId: number | null = null;

  // Track which invoice is being status-updated
  updatingStatusId: number | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private api: ApiService,
    private http: HttpClient,
  ) {}

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
    this.dataSource.filter = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
  }

  // ── Update order status (shipped / completed) ──────────────
  updateOrderStatus(invoice: any, status: string) {
    if (this.updatingStatusId === invoice.id) return;
    this.updatingStatusId = invoice.id;

    this.http
      .put<any>(`${environment.apiUrl}/invoices/${invoice.id}/order-status`, {
        status,
      })
      .subscribe({
        next: () => {
          this.updatingStatusId = null;
          invoice.order_status = status;
        },
        error: (err: any) => {
          this.updatingStatusId = null;
          alert('❌ Failed to update status');
        },
      });
  }

  getOrderStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'os-pending',
      shipped: 'os-shipped',
      completed: 'os-completed',
    };
    return map[status] || 'os-pending';
  }

  // ── Download PDF ───────────────────────────────────────────
  downloadInvoice(id: number) {
    if (this.downloadingId === id) return;
    this.downloadingId = id;
    this.api.downloadInvoicePdf(id).subscribe({
      next: (blob: Blob) => {
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
      error: () => {
        alert('❌ Failed to download invoice.');
        this.downloadingId = null;
      },
    });
  }

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

  convertToGst(invoice: any) {
    this.selectedInvoice = invoice;
    this.showConvertModal = true;
  }
  getGstPreview(subTotal: number): number {
    return (Number(subTotal) * 5) / 100;
  }
  getNewTotal(invoice: any): number {
    const sub = Number(invoice.sub_total);
    return sub + (sub * 5) / 100 - (Number(invoice.discount) || 0);
  }

  confirmConvert() {
    if (!this.selectedInvoice) return;
    this.converting = true;
    this.api.convertInvoiceToGst(this.selectedInvoice.id).subscribe({
      next: (res: any) => {
        this.converting = false;
        this.showConvertModal = false;
        alert(
          `✅ Converted!\nNew Invoice: ${res.new_invoice_number}\nTotal: ₹${res.final_total}`,
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
