// online-orders.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { environment } from '../../../environments/environment';
import { StatusFilterPipe } from '../../pipes/status-filter.pipe';

@Component({
  selector: 'app-online-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    StatusFilterPipe,
  ],
  templateUrl: './online-orders.component.html',
  styleUrls: ['./online-orders.component.css'],
})
export class OnlineOrdersComponent implements OnInit {
  dataSource = new MatTableDataSource<any>();

  displayedColumns: string[] = [
    'id',
    'customer_name',
    'customer_phone',
    'total',
    'payment_mode',
    'status',
    'created_at',
    'action',
  ];

  // Track loading states per row
  makingBillId: number | null = null;
  updatingStatusId: number | null = null;

  // Order detail modal
  showDetailModal = false;
  selectedOrder: any = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders() {
    this.http.get<any[]>(`${environment.apiUrl}/online-orders`).subscribe({
      next: (res) => {
        this.dataSource = new MatTableDataSource(res);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      error: (err) => console.error('Failed to load orders', err),
    });
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  viewOrder(order: any) {
    this.selectedOrder = order;
    this.showDetailModal = true;
  }

  makeBill(order: any) {
    if (order.invoice_id) {
      alert(`Bill already exists: INV-WEB-${order.invoice_id}`);
      return;
    }
    if (this.makingBillId === order.id) return;
    this.makingBillId = order.id;

    this.http
      .post<any>(
        `${environment.apiUrl}/online-orders/${order.id}/make-bill`,
        {},
      )
      .subscribe({
        next: (res) => {
          this.makingBillId = null;
          let msg = `✅ Bill Created!\nInvoice: ${res.invoice_number}\nTotal: ₹${res.final_total}`;
          if (res.unmatched && res.unmatched.length > 0) {
            msg += `\n\n⚠️ Products not matched: ${res.unmatched.join(', ')}`;
          }
          alert(msg);
          this.loadOrders();
        },
        error: (err) => {
          this.makingBillId = null;
          alert('❌ ' + (err.error?.message || 'Failed to create bill'));
        },
      });
  }

  updateStatus(order: any, status: string) {
    if (this.updatingStatusId === order.id) return;
    this.updatingStatusId = order.id;

    this.http
      .put<any>(`${environment.apiUrl}/online-orders/${order.id}/status`, {
        status,
      })
      .subscribe({
        next: () => {
          this.updatingStatusId = null;
          order.status = status;
        },
        error: (err) => {
          this.updatingStatusId = null;
          alert('❌ Failed to update status');
        },
      });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      new: 'status-new',
      processing: 'status-processing',
      shipped: 'status-shipped',
      completed: 'status-completed',
      cancelled: 'status-cancelled',
    };
    return map[status] || 'status-new';
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      new: '🆕',
      processing: '⚙️',
      shipped: '🚚',
      completed: '✅',
      cancelled: '❌',
    };
    return map[status] || '🆕';
  }

  getItemsCount(order: any): number {
    return Array.isArray(order.items) ? order.items.filter(Boolean).length : 0;
  }
}
