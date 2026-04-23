// dashboard.component.ts — updated with online orders section, table, donut chart, summary
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import ApexCharts from 'apexcharts';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  stats: any = {};
  chart: any;
  paymentChart: any;
  stockChart: any;
  onlineStatusChart: any;

  selectedFilter: string = '7days';
  startDate: string = '';
  endDate: string = '';

  // Online orders counters (for card)
  onlineOrderCount: number = 0;
  newOnlineOrderCount: number = 0;

  // Login popup
  showNewOrderPopup = false;
  popupOrderCount = 0;

  // ── Online orders section ──────────────────────────────────
  onlineOrders: any[] = [];
  filteredOnlineOrders: any[] = [];
  pagedOnlineOrders: any[] = [];
  orderSearchQuery: string = '';

  // Summary computed values
  topOnlineCustomer: { name: string; count: number; total: number } | null =
    null;
  totalOnlineRevenue: number = 0;

  // Status summary for donut legend
  onlineStatusSummary: {
    label: string;
    count: number;
    pct: string;
    color: string;
  }[] = [];

  // Order detail modal
  showOOModal = false;
  selectedOOOrder: any = null;

  // Pagination
  ooPage = 1;
  ooPageSize = 5;
  ooTotalPages = 1;
  ooPageNumbers: number[] = [];

  get ooPageStart(): number {
    return this.filteredOnlineOrders.length === 0
      ? 0
      : (this.ooPage - 1) * this.ooPageSize + 1;
  }
  get ooPageEnd(): number {
    return Math.min(
      this.ooPage * this.ooPageSize,
      this.filteredOnlineOrders.length,
    );
  }

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadDashboard(this.selectedFilter);
    this.checkNewOnlineOrders();
    this.loadOnlineOrdersFull();
  }

  // ── Check for new online orders (called on login/load) ──────
  checkNewOnlineOrders() {
    this.http
      .get<any>(`${environment.apiUrl}/online-orders/new-count`)
      .subscribe({
        next: (res) => {
          this.newOnlineOrderCount = res.count || 0;
          if (this.newOnlineOrderCount > 0) {
            this.popupOrderCount = this.newOnlineOrderCount;
            this.showNewOrderPopup = true;
          }
        },
        error: () => {},
      });
  }

  // ── Load full online orders list for section ────────────────
  loadOnlineOrdersFull() {
    this.http.get<any[]>(`${environment.apiUrl}/online-orders`).subscribe({
      next: (orders) => {
        this.onlineOrders = orders;
        this.onlineOrderCount = orders.length;
        this.newOnlineOrderCount = orders.filter(
          (o) => o.status === 'new',
        ).length;
        this.filteredOnlineOrders = [...orders];
        this.ooPage = 1;
        this.computePagination();
        this.computeSummary();
        this.renderOnlineStatusChart();
      },
      error: () => {},
    });
  }

  // ── Compute summary stats ───────────────────────────────────
  computeSummary() {
    this.totalOnlineRevenue = this.onlineOrders.reduce(
      (s, o) => s + parseFloat(o.total || 0),
      0,
    );

    // Top customer by order count
    const custMap: Record<string, { count: number; total: number }> = {};
    for (const o of this.onlineOrders) {
      const name = o.customer_name || 'Website Customer';
      if (!custMap[name]) custMap[name] = { count: 0, total: 0 };
      custMap[name].count++;
      custMap[name].total += parseFloat(o.total || 0);
    }
    const top = Object.entries(custMap).sort(
      (a, b) => b[1].count - a[1].count,
    )[0];
    if (top) {
      this.topOnlineCustomer = {
        name: top[0],
        count: top[1].count,
        total: top[1].total,
      };
    }

    // Status counts for legend
    const statusColors: Record<string, string> = {
      new: '#1d4ed8',
      processing: '#d97706',
      shipped: '#16a34a',
      completed: '#6b7280',
      cancelled: '#dc2626',
    };
    const statusLabels: Record<string, string> = {
      new: 'New',
      processing: 'Processing',
      shipped: 'Shipped',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    const counts: Record<string, number> = {};
    for (const o of this.onlineOrders) {
      counts[o.status] = (counts[o.status] || 0) + 1;
    }
    const total = this.onlineOrders.length || 1;
    this.onlineStatusSummary = Object.entries(counts).map(([s, c]) => ({
      label: statusLabels[s] || s,
      count: c,
      pct: ((c / total) * 100).toFixed(1),
      color: statusColors[s] || '#ccc',
    }));
  }

  // ── Render inline status donut chart ───────────────────────
  renderOnlineStatusChart() {
    setTimeout(() => {
      if (this.onlineStatusChart) this.onlineStatusChart.destroy();
      const statusColors: Record<string, string> = {
        new: '#1d4ed8',
        processing: '#d97706',
        shipped: '#16a34a',
        completed: '#9ca3af',
        cancelled: '#dc2626',
      };
      const counts: Record<string, number> = {};
      for (const o of this.onlineOrders)
        counts[o.status] = (counts[o.status] || 0) + 1;

      const labels = Object.keys(counts).map(
        (s) => s.charAt(0).toUpperCase() + s.slice(1),
      );
      const series = Object.values(counts);
      const colors = Object.keys(counts).map((s) => statusColors[s] || '#ccc');

      const options = {
        chart: { type: 'donut', height: 240 },
        series,
        labels,
        colors,
        legend: { show: false },
        dataLabels: { enabled: false },
        plotOptions: {
          pie: {
            donut: {
              size: '68%',
              labels: {
                show: true,
                total: {
                  show: true,
                  label: 'Total Orders',
                  fontSize: '12px',
                  color: '#888',
                  formatter: () => String(this.onlineOrders.length),
                },
              },
            },
          },
        },
      };
      const el = document.querySelector('#onlineStatusChart');
      if (el) {
        this.onlineStatusChart = new ApexCharts(el, options);
        this.onlineStatusChart.render();
      }
    }, 100);
  }

  // ── Filter orders by search query ──────────────────────────
  filterOrders() {
    const q = this.orderSearchQuery.trim().toLowerCase();
    if (!q) {
      this.filteredOnlineOrders = [...this.onlineOrders];
    } else {
      this.filteredOnlineOrders = this.onlineOrders.filter(
        (o) =>
          (o.customer_name || '').toLowerCase().includes(q) ||
          String(o.id).includes(q) ||
          String(o.website_order_id).includes(q) ||
          (o.status || '').toLowerCase().includes(q),
      );
    }
    this.ooPage = 1;
    this.computePagination();
  }

  // ── Pagination helpers ─────────────────────────────────────
  computePagination() {
    this.ooTotalPages = Math.max(
      1,
      Math.ceil(this.filteredOnlineOrders.length / this.ooPageSize),
    );
    this.updatePagedOrders();
    // Show at most 5 page numbers around current
    const pages: number[] = [];
    for (
      let i = Math.max(1, this.ooPage - 2);
      i <= Math.min(this.ooTotalPages, this.ooPage + 2);
      i++
    ) {
      pages.push(i);
    }
    this.ooPageNumbers = pages;
  }

  updatePagedOrders() {
    const start = (this.ooPage - 1) * this.ooPageSize;
    this.pagedOnlineOrders = this.filteredOnlineOrders.slice(
      start,
      start + this.ooPageSize,
    );
  }

  ooFirstPage() {
    this.ooPage = 1;
    this.computePagination();
  }
  ooLastPage() {
    this.ooPage = this.ooTotalPages;
    this.computePagination();
  }
  ooPrevPage() {
    if (this.ooPage > 1) {
      this.ooPage--;
      this.computePagination();
    }
  }
  ooNextPage() {
    if (this.ooPage < this.ooTotalPages) {
      this.ooPage++;
      this.computePagination();
    }
  }
  ooGoTo(p: number) {
    this.ooPage = p;
    this.computePagination();
  }

  // ── View order modal ───────────────────────────────────────
  viewOnlineOrder(order: any) {
    this.selectedOOOrder = order;
    this.showOOModal = true;
  }

  // ── Status helpers ─────────────────────────────────────────
  getOnlineStatusClass(status: string): string {
    const map: Record<string, string> = {
      new: 'oo-status-new',
      processing: 'oo-status-processing',
      shipped: 'oo-status-shipped',
      completed: 'oo-status-completed',
      cancelled: 'oo-status-cancelled',
    };
    return map[status] || 'oo-status-new';
  }

  getOnlineStatusLabel(status: string): string {
    const map: Record<string, string> = {
      new: '🆕 New',
      processing: '⚙️ Processing',
      shipped: '🚚 Shipped',
      completed: '✅ Completed',
      cancelled: '❌ Cancelled',
    };
    return map[status] || status;
  }

  getOnlineItemsCount(order: any): number {
    return Array.isArray(order.items) ? order.items.filter(Boolean).length : 0;
  }

  // ── Load online order total count (card only) ───────────────
  loadOnlineOrderCount() {
    this.http.get<any[]>(`${environment.apiUrl}/online-orders`).subscribe({
      next: (orders) => {
        this.onlineOrderCount = orders.length;
        this.newOnlineOrderCount = orders.filter(
          (o) => o.status === 'new',
        ).length;
      },
      error: () => {},
    });
  }

  dismissPopup() {
    this.showNewOrderPopup = false;
  }

  changeFilter(filter: string) {
    this.selectedFilter = filter;
    this.loadDashboard(filter);
  }

  loadCustom() {
    if (!this.startDate || !this.endDate) return;
    this.http
      .get<any>(
        `${environment.apiUrl}/dashboard?start=${this.startDate}&end=${this.endDate}`,
      )
      .subscribe((res) => {
        this.stats = res;
        this.renderChart(res.dailySales);
        this.renderStockChart(res.stockDistribution);
        this.renderTopProducts(res.topProducts);
        this.renderPaymentChart(res.paymentMode);
      });
  }

  loadDashboard(filter: string) {
    this.http
      .get<any>(`${environment.apiUrl}/dashboard?filter=${filter}`)
      .subscribe((res) => {
        this.stats = res;
        this.onlineOrderCount = res.onlineOrders || 0;
        this.newOnlineOrderCount = res.newOnlineOrders || 0;
        this.renderChart(res.dailySales);
        this.renderStockChart(res.stockDistribution);
        this.renderTopProducts(res.topProducts);
        this.renderPaymentChart(res.paymentMode);
      });
  }

  renderChart(data: any[]) {
    if (this.chart) this.chart.destroy();
    const options = {
      chart: { type: 'area', height: 350 },
      series: [{ name: 'Sales', data: data.map((d) => Number(d.final_total)) }],
      xaxis: {
        categories: data.map((d) => new Date(d.date).toLocaleDateString()),
      },
      colors: ['#ff6b00'],
      stroke: { curve: 'smooth' },
      dataLabels: { enabled: false },
    };
    this.chart = new ApexCharts(document.querySelector('#salesChart'), options);
    this.chart.render();
  }

  renderStockChart(data: any) {
    if (this.stockChart) this.stockChart.destroy();
    const options = {
      chart: { type: 'donut', height: 300 },
      series: [Number(data.inStock), Number(data.outOfStock)],
      labels: ['In Stock', 'Out Of Stock'],
      colors: ['#ff6b00', '#d32f2f'],
      legend: { position: 'bottom' },
    };
    this.stockChart = new ApexCharts(
      document.querySelector('#stockChart'),
      options,
    );
    this.stockChart.render();
  }

  renderTopProducts(data: any[]) {
    const options = {
      chart: { type: 'bar', height: 300 },
      series: [{ name: 'Sold', data: data.map((p) => Number(p.totalSold)) }],
      xaxis: { categories: data.map((p) => p.name) },
      colors: ['#ff8c42'],
    };
    new ApexCharts(
      document.querySelector('#topProductsChart'),
      options,
    ).render();
  }

  renderPaymentChart(data: any) {
    const cash = Number(data.cash);
    const razorpay = Number(data.razorpay);
    if (this.paymentChart) this.paymentChart.destroy();
    const options = {
      chart: { type: 'donut', height: 300 },
      series: [cash, razorpay],
      labels: [`Cash (₹${cash})`, `Razorpay (₹${razorpay})`],
      colors: ['#ff6b00', '#444'],
      legend: { position: 'bottom' },
      tooltip: { y: { formatter: (val: number) => `₹ ${val}` } },
    };
    this.paymentChart = new ApexCharts(
      document.querySelector('#paymentChart'),
      options,
    );
    this.paymentChart.render();
  }
}
