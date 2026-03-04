import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  selectedFilter: string = '7days';
  startDate: string = '';
  endDate: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadDashboard(this.selectedFilter);
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
        this.renderChart(res.dailySales);
        this.renderStockChart(res.stockDistribution);
        this.renderTopProducts(res.topProducts);
        this.renderPaymentChart(res.paymentMode);
      });
  }

  renderChart(data: any[]) {
    if (this.chart) {
      this.chart.destroy();
    }

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
    const options = {
      chart: { type: 'donut', height: 300 },
      series: [Number(data.inStock), Number(data.outOfStock)],
      labels: ['In Stock', 'Out Of Stock'],
      colors: ['#ff6b00', '#d32f2f'],
      legend: { position: 'bottom' },
    };

    new ApexCharts(document.querySelector('#stockChart'), options).render();
  }

  renderTopProducts(data: any[]) {
    const options = {
      chart: { type: 'bar', height: 300 },
      series: [{ name: 'Sold', data: data.map((p) => Number(p.totalSold)) }],
      xaxis: {
        categories: data.map((p) => p.name),
      },
      colors: ['#ff8c42'],
    };

    new ApexCharts(
      document.querySelector('#topProductsChart'),
      options,
    ).render();
  }

  renderPaymentChart(data: any) {
    const options = {
      chart: { type: 'donut', height: 300 },
      series: [Number(data.cash), Number(data.razorpay)],
      labels: ['Cash', 'Razorpay'],
      colors: ['#ff6b00', '#444'],
      legend: { position: 'bottom' },
    };

    new ApexCharts(document.querySelector('#paymentChart'), options).render();
  }
}
