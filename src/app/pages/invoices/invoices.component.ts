import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

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
  displayedColumns: string[] = [
    'id',
    'invoice_number',
    'total',
    'status',
    'payment_mode',
    'created_at',
    'action',
  ];

  searchText: string = '';

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

  downloadInvoice(id: number) {
    window.open(`${environment.apiUrl}/invoices/${id}/download`, '_blank');
  }

  exportByDate() {
    if (!this.startDate || !this.endDate) return;

    window.open(
      `${environment.apiUrl}/invoices/export?start=${this.startDate}&end=${this.endDate}`,
      '_blank',
    );
  }
}
