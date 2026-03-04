import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.css'],
})
export class BillingComponent implements OnInit {
  /* ─── Products ─────────────────────────────── */
  products: any[] = [];
  filteredProducts: any[] = [];
  categories: string[] = [];
  activeCategory: string = '';
  searchQuery: string = '';

  /* ─── Cart ─────────────────────────────────── */
  selectedItems: any[] = [];

  /* ─── Checkout modal ───────────────────────── */
  showCheckout = false;
  customerName = '';
  customerMobile = '';
  discountAmount: number = 0;
  discountApplied: number = 0;
  paymentMode: string = 'cash';

  /* ─── GST — fixed 5% ───────────────────────── */
  readonly GST_PERCENT = 5;

  /* ─── Bill meta ────────────────────────────── */
  billNumber: string = '';
  invoiceId: number = 0;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.billNumber = 'B' + Date.now().toString().slice(-6);
    this.loadProducts();
  }

  /* ── Load products ───────────────────────────── */
  loadProducts() {
    this.api.getProducts().subscribe((res: any) => {
      this.products = res;
      // Extract unique categories
      const cats = res
        .map((p: any) => p.category)
        .filter((c: any) => c && c.trim() !== '');
      this.categories = [...new Set<string>(cats)].sort();
      this.filterProducts();
    });
  }

  /* ── Category tab click ──────────────────────── */
  setCategory(cat: string) {
    this.activeCategory = cat;
    this.filterProducts();
  }

  /* ── Filter products by search + category ───── */
  filterProducts() {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredProducts = this.products.filter((p) => {
      const matchCat =
        !this.activeCategory || p.category === this.activeCategory;
      const matchSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }

  /* ── Check if product is in cart ────────────── */
  isInCart(productId: number): boolean {
    return this.selectedItems.some((i) => i.product_id === productId);
  }

  /* ── Toggle product in/out of cart ──────────── */
  toggleProduct(product: any) {
    const idx = this.selectedItems.findIndex(
      (i) => i.product_id === product.id,
    );
    if (idx >= 0) {
      // Already in cart — remove
      this.selectedItems.splice(idx, 1);
    } else {
      // Add to cart
      this.selectedItems.push({
        product_id: product.id,
        name: product.name,
        qty: 1,
        grams: product.grams,
        custom_price: product.price,
      });
    }
  }

  /* ── Change qty ──────────────────────────────── */
  changeQty(index: number, delta: number) {
    const item = this.selectedItems[index];
    const newQty = (item.qty || 1) + delta;
    if (newQty < 1) {
      // Remove if qty would go below 1
      this.selectedItems.splice(index, 1);
    } else {
      item.qty = newQty;
    }
  }

  /* ── Remove item ─────────────────────────────── */
  removeItem(index: number) {
    this.selectedItems.splice(index, 1);
  }

  /* ── Clear cart ──────────────────────────────── */
  clearCart() {
    this.selectedItems = [];
  }

  /* ── Discount ─────────────────────────────────── */
  applyDiscount() {
    const d = Number(this.discountAmount) || 0;
    this.discountApplied = Math.min(d, this.subTotal + this.gstAmount);
  }

  /* ── Open checkout modal ─────────────────────── */
  openCheckout() {
    if (!this.selectedItems.length) return;
    this.showCheckout = true;
    this.discountAmount = 0;
    this.discountApplied = 0;
  }

  /* ── Cancel and close ────────────────────────── */
  cancelAndClose() {
    this.showCheckout = false;
  }

  /* ── Print invoice ────────────────────────────── */
  printInvoice() {
    window.print();
  }

  /* ── Create invoice (API call) ───────────────── */
  createInvoice() {
    if (!this.selectedItems.length) return;

    const payload = {
      items: this.selectedItems,
      payment_mode: this.paymentMode,
      customer_name: this.customerName || 'Walk-in Customer',
      customer_mobile: this.customerMobile || null,
      gst_percent: this.GST_PERCENT,
      discount: this.discountApplied,
    };

    this.api.createInvoice(payload).subscribe({
      next: (res: any) => {
        this.invoiceId = res.invoice_id;
        alert(
          `✅ Invoice #${res.invoice_number} created successfully!\nTotal: ₹${res.final_total}`,
        );
        this.showCheckout = false;
        this.resetBill();
      },
      error: (err: any) => {
        alert('❌ ' + (err.error?.message || 'Something went wrong'));
      },
    });
  }

  /* ── Reset bill ──────────────────────────────── */
  resetBill() {
    this.selectedItems = [];
    this.customerName = '';
    this.customerMobile = '';
    this.discountAmount = 0;
    this.discountApplied = 0;
    this.paymentMode = 'cash';
    this.invoiceId = 0;
    this.billNumber = 'B' + Date.now().toString().slice(-6);
    this.loadProducts();
  }

  /* ── Computed values ─────────────────────────── */
  get subTotal(): number {
    return this.selectedItems.reduce(
      (sum, item) => sum + (item.qty || 0) * (item.custom_price || 0),
      0,
    );
  }

  get gstAmount(): number {
    return (this.subTotal * this.GST_PERCENT) / 100;
  }

  get finalTotal(): number {
    return this.subTotal + this.gstAmount - (this.discountApplied || 0);
  }
}
