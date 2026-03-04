import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductDialogComponent } from './product-dialog.component';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { MatSelectModule } from '@angular/material/select';
import { CategoryFilterPipe } from './category-filter.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatSnackBarModule,
    ProductDialogComponent,
    MatSelectModule,
    MatFormFieldModule,
    CategoryFilterPipe,
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
})
export class ProductsComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<any>();
  selectedRow: any = null;
  displayedColumns: string[] = [
    'name',
    'sku',
    'category',
    'price',
    'stock',
    'grams',
    'actions',
  ];

  // All unique categories extracted from products
  categories: string[] = [];
  selectedCategory: string = '';
  isOpen = false;
  categorySearch = '';

  // Keep the full unfiltered list for category re-filtering
  private allProducts: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadProducts() {
    this.http.get<any[]>(`${environment.apiUrl}/products`).subscribe((data) => {
      this.allProducts = data;
      this.dataSource.data = data;

      // Extract unique categories (ignore null/empty)
      const cats = data
        .map((p) => p.category)
        .filter((c) => c && c.trim() !== '');
      this.categories = [...new Set(cats)].sort();

      // Re-apply category filter if one is already selected
      this.applyCategoryFilter();
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  applyCategoryFilter() {
    if (!this.selectedCategory) {
      this.dataSource.data = this.allProducts;
    } else {
      this.dataSource.data = this.allProducts.filter(
        (p) => p.category === this.selectedCategory,
      );
    }
    // Reset to first page when filter changes
    if (this.paginator) this.paginator.firstPage();
  }

  deleteProduct(id: number) {
    if (!confirm('Delete this product?')) return;
    this.http.delete(`${environment.apiUrl}/products/${id}`).subscribe(() => {
      this.snackBar.open('Product Deleted', 'Close', { duration: 2000 });
      this.loadProducts();
    });
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      autoFocus: false,
      data: { mode: 'Add', categories: this.categories },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.http
          .post(`${environment.apiUrl}/products`, result)
          .subscribe(() => {
            this.snackBar.open('Product Added', 'Close', { duration: 2000 });
            this.loadProducts();
          });
      }
    });
  }

  openEditDialog(product: any) {
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      autoFocus: false,
      data: { mode: 'Edit', product, categories: this.categories },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.http
          .put(`${environment.apiUrl}/products/${product.id}`, result)
          .subscribe(() => {
            this.snackBar.open('Product Updated', 'Close', { duration: 2000 });
            this.loadProducts();
          });
      }
    });
  }

  exportToCSV() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(
      this.dataSource.data,
    );
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'products.csv');
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(
      this.dataSource.data,
    );
    const workbook: XLSX.WorkBook = {
      Sheets: { Products: worksheet },
      SheetNames: ['Products'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    saveAs(
      new Blob([excelBuffer], { type: 'application/octet-stream' }),
      'products.xlsx',
    );
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const workbook = XLSX.read(e.target.result, { type: 'binary' });
      const data = XLSX.utils.sheet_to_json(
        workbook.Sheets[workbook.SheetNames[0]],
      );
      this.processImportedData(data);
    };
    reader.readAsBinaryString(file);
  }

  processImportedData(data: any[]) {
    this.http
      .post<any>(`${environment.apiUrl}/products/bulk-import`, data)
      .subscribe((res) => {
        this.snackBar.open(
          `${res.added} Added, ${res.updated} Updated`,
          'Close',
          {
            duration: 3000,
          },
        );
        this.loadProducts();
      });
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.isOpen = false;
    this.categorySearch = '';
    this.applyCategoryFilter();
  }
}
