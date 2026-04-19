import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
} from '@angular/core';
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
  rewardStatus: any = null;
  rewardCheckTimer: any = null;
  showRewardPopup = false;
  rewardMessage = '';
  freeItemApplied = false;

  /* ─── Bill meta ─────────────────────────────── */
  billNumber = '';
  invoiceId = 0;

  /* ═══════════════════════════════════════════════════════════
     BARCODE SCANNER
  ══════════════════════════════════════════════════════════ */
  scannerOpen = false;
  scannerStatus: 'idle' | 'scanning' | 'success' | 'error' | 'notfound' =
    'idle';
  scannerMessage = '';
  private codeReader: any = null;
  private scannerStream: MediaStream | null = null;

  @ViewChild('scannerVideo') scannerVideoRef!: ElementRef<HTMLVideoElement>;

  async openScanner() {
    this.scannerOpen = true;
    this.scannerStatus = 'scanning';
    this.scannerMessage = 'Point camera at a barcode...';
    // Wait for view to render the video element
    setTimeout(() => this.startScan(), 300);
  }

  private async startScan() {
    try {
      // Dynamically import @zxing/browser
      const { BrowserMultiFormatReader } = await import(
        '@zxing/browser' as any
      );
      this.codeReader = new BrowserMultiFormatReader();

      const videoEl = this.scannerVideoRef?.nativeElement;
      if (!videoEl) {
        this.scannerMessage = 'Camera element not found.';
        this.scannerStatus = 'error';
        return;
      }

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (!devices.length) {
        this.scannerMessage = 'No camera found on this device.';
        this.scannerStatus = 'error';
        return;
      }

      // Prefer back camera on mobile
      const backCam = devices.find(
        (d: any) =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear'),
      );
      const deviceId = backCam ? backCam.deviceId : devices[0].deviceId;

      this.codeReader.decodeFromVideoDevice(
        deviceId,
        videoEl,
        (result: any, err: any) => {
          if (result) {
            const barcode = result.getText();
            this.onBarcodeScanned(barcode);
          }
        },
      );
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        this.scannerMessage =
          'Camera permission denied. Please allow camera access.';
      } else {
        this.scannerMessage =
          'Could not start camera. Try installing @zxing/browser.';
      }
      this.scannerStatus = 'error';
    }
  }

  onBarcodeScanned(code: string) {
    this.stopScanner();

    const product = this.products.find(
      (p) => p.barcode === code || p.sku === code,
    );

    if (product) {
      if (product.stock <= 0) {
        this.scannerStatus = 'error';
        this.scannerMessage = `"${product.name}" is out of stock!`;
        this.playBeep('error');
      } else {
        this.toggleProduct(product);
        this.scannerStatus = 'success';
        this.scannerMessage = `✓ "${product.name}" added to cart!`;
        this.playBeep('success');
      }
    } else {
      this.scannerStatus = 'notfound';
      this.scannerMessage = `No product found for barcode: ${code}`;
      this.playBeep('error');
    }

    // Auto-close after 2s
    setTimeout(() => this.closeScanner(), 2000);
  }

  stopScanner() {
    if (this.codeReader) {
      try {
        this.codeReader.reset();
      } catch {}
      this.codeReader = null;
    }
  }

  closeScanner() {
    this.stopScanner();
    this.scannerOpen = false;
    this.scannerStatus = 'idle';
    this.scannerMessage = '';
  }

  /* ═══════════════════════════════════════════════════════════
     POS HOTKEY SYSTEM
  ══════════════════════════════════════════════════════════ */
  typedKeys = '';
  hotkeyActive = false;
  hotkeyFlash: 'idle' | 'success' | 'error' = 'idle';
  private typingTimer: any;
  private flashTimer: any;
  private readonly HOTKEY_TIMEOUT_MS = 2000;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.billNumber = 'B' + Date.now().toString().slice(-6);
    this.loadProducts();
  }

  ngOnDestroy(): void {
    clearTimeout(this.typingTimer);
    clearTimeout(this.flashTimer);
    this.stopScanner();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (this.showCheckout || this.scannerOpen) return;

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

    if (/^[a-zA-Z0-9\-]$/.test(event.key)) {
      event.preventDefault();
      this.typedKeys += event.key.toUpperCase();
      this.hotkeyActive = true;
      this.hotkeyFlash = 'idle';

      clearTimeout(this.typingTimer);
      this.typingTimer = setTimeout(() => {
        this.resetHotkey();
      }, this.HOTKEY_TIMEOUT_MS);
    }
  }

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
      /* silent fallback */
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
        p.sku?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q);
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
      reward_applied: this.freeItemApplied,
    };

    this.api.createInvoice(payload).subscribe({
      next: (res: any) => {
        this.invoiceId = res.invoice_id;

        if (res.reward_eligible) {
          this.showRewardPopup = true;
          this.rewardMessage = `🎉 ${this.customerName || 'Customer'} has visited 5 times! They earn a FREE item on this visit.`;
        } else {
          const tag = this.isProforma ? 'Proforma Invoice' : 'Invoice';
          const paidMsg =
            this.isProforma && this.markAsPaid ? ' · Marked as Paid' : '';
          const rewardMsg =
            res.visits_until_reward > 0
              ? `\n⭐ ${res.visits_until_reward} more visit${res.visits_until_reward > 1 ? 's' : ''} until FREE item!`
              : '';
          alert(
            `✅ ${tag} #${res.invoice_number} created!\nTotal: ₹${res.final_total}${paidMsg}${rewardMsg}`,
          );
          this.showCheckout = false;
          this.resetBill();
        }
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

  onMobileInput() {
    clearTimeout(this.rewardCheckTimer);
    if (this.customerMobile?.length === 10) {
      this.rewardCheckTimer = setTimeout(() => {
        this.api
          .checkRewardStatus(this.customerMobile)
          .subscribe((status: any) => {
            this.rewardStatus = status;
          });
      }, 500);
    } else {
      this.rewardStatus = null;
    }
  }

  applyFreeItem() {
    const highestPricedItem = [...this.selectedItems].sort(
      (a, b) => b.custom_price - a.custom_price,
    )[0];

    if (highestPricedItem) {
      this.selectedItems.push({
        product_id: highestPricedItem.product_id,
        name: `🎁 FREE: ${highestPricedItem.name}`,
        qty: 1,
        grams: highestPricedItem.grams,
        custom_price: 0,
      });
    }

    this.freeItemApplied = true;
    this.showRewardPopup = false;
    this.showCheckout = false;
    this.resetBill();
  }

  skipFreeItem() {
    this.showRewardPopup = false;
    this.showCheckout = false;
    this.resetBill();
  }
}
