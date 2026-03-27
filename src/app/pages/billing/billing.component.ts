import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
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
export class BillingComponent implements OnInit, OnDestroy {
  /* ─── Products ─────────────────────────────── */
  products: any[] = [];
  filteredProducts: any[] = [];
  categories: string[] = [];
  activeCategory: string = '';
  searchQuery: string = '';

  /* ─── Cart ─────────────────────────────────── */
  selectedItems: any[] = [];

  /* ─── Proforma toggle ──────────────────────── */
  isProforma: boolean = false;

  /* ─── Checkout modal ───────────────────────── */
  showCheckout = false;
  customerName = '';
  customerMobile = '';
  discountAmount = 0;
  discountApplied = 0;
  paymentMode = 'cash';
  markAsPaid = false;

  /* ─── GST ───────────────────────────────────── */
  readonly GST_PERCENT = 5;

  /* ─── Bill meta ─────────────────────────────── */
  billNumber = '';
  invoiceId = 0;

  /* ═══════════════════════════════════════════════════════════
     POS HOTKEY SYSTEM
  ══════════════════════════════════════════════════════════ */
  typedKeys = '';
  hotkeyActive = false;
  hotkeyFlash: 'idle' | 'success' | 'error' = 'idle';
  private typingTimer: any;
  private flashTimer: any;
  private readonly HOTKEY_TIMEOUT_MS = 2000; // reset after 2s inactivity

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.billNumber = 'B' + Date.now().toString().slice(-6);
    this.loadProducts();
  }

  ngOnDestroy(): void {
    clearTimeout(this.typingTimer);
    clearTimeout(this.flashTimer);
  }

  /* ═══════════════════════════════════════════════════════════
     KEYBOARD LISTENER
     • Alphanumeric keys build the buffer
     • Enter  → confirm match immediately  ← KEY CHANGE
     • Escape → clear buffer
     • Auto-reset after HOTKEY_TIMEOUT_MS of inactivity (no match attempt)
  ══════════════════════════════════════════════════════════ */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (this.showCheckout) return;

    const tag = (event.target as HTMLElement).tagName.toUpperCase();
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

    if (event.key === 'Escape') {
      this.resetHotkey();
      return;
    }

    if (event.key === 'Enter') {
      if (this.typedKeys) {
        this.matchAndAdd();
      }
      return;
    }

    // Only alphanumeric + hyphen
    if (/^[a-zA-Z0-9\-]$/.test(event.key)) {
      event.preventDefault();
      this.typedKeys += event.key.toUpperCase();
      this.hotkeyActive = true;
      this.hotkeyFlash = 'idle';

      // ── REMOVED: tryInstantMatch() ──
      // No longer auto-matching on keystroke.
      // User MUST press Enter to confirm. This prevents hotkey "1"
      // from firing when the user is still typing "100".

      // Reset inactivity timer — just clears buffer, does NOT match
      clearTimeout(this.typingTimer);
      this.typingTimer = setTimeout(() => {
        this.resetHotkey(); // silently clear, no match attempt
      }, this.HOTKEY_TIMEOUT_MS);
    }
  }

  /* Called ONLY on Enter — find exact match and add */
  private matchAndAdd(): void {
    const key = this.typedKeys.trim();
    if (!key) {
      this.resetHotkey();
      return;
    }

    const product = this.products.find((p) => p.hotkey?.toUpperCase() === key);

    if (product) {
      this.addHotkeyProduct(product);
    } else {
      this.hotkeyFlash = 'error';
      this.playBeep('error');
      clearTimeout(this.flashTimer);
      this.flashTimer = setTimeout(() => {
        this.hotkeyFlash = 'idle';
        this.resetHotkey();
      }, 800);
    }
  }

  /* Add product to cart via hotkey, show green flash */
  private addHotkeyProduct(product: any): void {
    if (product.stock <= 0) {
      this.hotkeyFlash = 'error';
      this.playBeep('error');
      clearTimeout(this.flashTimer);
      setTimeout(() => {
        this.hotkeyFlash = 'idle';
        this.resetHotkey();
      }, 800);
      return;
    }

    this.toggleProduct(product);
    this.hotkeyFlash = 'success';
    this.playBeep('success');

    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => {
      this.hotkeyFlash = 'idle';
      this.resetHotkey();
    }, 600);
  }

  resetHotkey(): void {
    this.typedKeys = '';
    this.hotkeyActive = false;
    clearTimeout(this.typingTimer);
  }

  private playBeep(type: 'success' | 'error'): void {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = type === 'success' ? 880 : 220;
      osc.type = type === 'success' ? 'sine' : 'square';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      /* AudioContext not supported — silent fallback */
    }
  }

  /* ═══════════════════════════════════════════════════════════
     PRODUCTS
  ══════════════════════════════════════════════════════════ */
  loadProducts() {
    this.api.getProducts().subscribe((res: any) => {
      this.products = res;
      const cats = res
        .map((p: any) => p.category)
        .filter((c: any) => c && c.trim() !== '');
      this.categories = [...new Set<string>(cats)].sort();
      this.filterProducts();
    });
  }

  setCategory(cat: string) {
    this.activeCategory = cat;
    this.filterProducts();
  }

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

  /* ═══════════════════════════════════════════════════════════
     CART
  ══════════════════════════════════════════════════════════ */
  isInCart(productId: number): boolean {
    return this.selectedItems.some((i) => i.product_id === productId);
  }

  toggleProduct(product: any) {
    const idx = this.selectedItems.findIndex(
      (i) => i.product_id === product.id,
    );
    if (idx >= 0) {
      if (this.hotkeyActive) {
        this.selectedItems[idx].qty += 1;
      } else {
        this.selectedItems.splice(idx, 1);
      }
    } else {
      this.selectedItems.push({
        product_id: product.id,
        name: product.name,
        qty: 1,
        grams: product.grams,
        custom_price: product.price,
      });
    }
  }

  changeQty(index: number, delta: number) {
    const item = this.selectedItems[index];
    const newQty = (item.qty || 1) + delta;
    if (newQty < 1) {
      this.selectedItems.splice(index, 1);
    } else {
      item.qty = newQty;
    }
  }

  removeItem(index: number) {
    this.selectedItems.splice(index, 1);
  }

  clearCart() {
    this.selectedItems = [];
  }

  applyDiscount() {
    const d = Number(this.discountAmount) || 0;
    this.discountApplied = Math.min(d, this.subTotal + this.gstAmount);
  }

  /* ═══════════════════════════════════════════════════════════
     CHECKOUT
  ══════════════════════════════════════════════════════════ */
  openCheckout() {
    if (!this.selectedItems.length) return;
    this.showCheckout = true;
    this.discountAmount = 0;
    this.discountApplied = 0;
    this.markAsPaid = false;
  }

  cancelAndClose() {
    this.showCheckout = false;
  }

  printInvoice() {
    window.print();
  }

  createInvoice() {
    if (!this.selectedItems.length) return;

    const payload = {
      items: this.selectedItems,
      payment_mode: this.paymentMode,
      customer_name: this.customerName || 'Walk-in Customer',
      customer_mobile: this.customerMobile || null,
      gst_percent: this.isProforma ? 0 : this.GST_PERCENT,
      discount: this.discountApplied,
      is_proforma: this.isProforma,
      mark_as_paid: this.isProforma && this.markAsPaid,
    };

    this.api.createInvoice(payload).subscribe({
      next: (res: any) => {
        this.invoiceId = res.invoice_id;
        const tag = this.isProforma ? 'Proforma Invoice' : 'Invoice';
        const paidMsg =
          this.isProforma && this.markAsPaid ? ' · Marked as Paid' : '';
        alert(
          `✅ ${tag} #${res.invoice_number} created!\nTotal: ₹${res.final_total}${paidMsg}`,
        );
        this.showCheckout = false;
        this.resetBill();
      },
      error: (err: any) => {
        alert('❌ ' + (err.error?.message || 'Something went wrong'));
      },
    });
  }

  resetBill() {
    this.selectedItems = [];
    this.customerName = '';
    this.customerMobile = '';
    this.discountAmount = 0;
    this.discountApplied = 0;
    this.paymentMode = 'cash';
    this.isProforma = false;
    this.markAsPaid = false;
    this.invoiceId = 0;
    this.billNumber = 'B' + Date.now().toString().slice(-6);
    this.resetHotkey();
    this.loadProducts();
  }

  /* ═══════════════════════════════════════════════════════════
     COMPUTED TOTALS
  ══════════════════════════════════════════════════════════ */
  get subTotal(): number {
    return this.selectedItems.reduce(
      (sum, item) => sum + (item.qty || 0) * (item.custom_price || 0),
      0,
    );
  }

  get gstAmount(): number {
    return this.isProforma ? 0 : (this.subTotal * this.GST_PERCENT) / 100;
  }

  get finalTotal(): number {
    return this.subTotal + this.gstAmount - (this.discountApplied || 0);
  }
}
