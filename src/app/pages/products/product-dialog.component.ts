import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-product-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <div class="dialog-wrapper">
      <!-- Header -->
      <div class="dialog-header">
        <div class="dialog-icon">
          <svg viewBox="0 0 24 24">
            <path
              d="M20 6h-2.18c.07-.44.18-.88.18-1.33C18 2.54 15.60.09 12.74.38 11.18.55 9.84 1.45 9 2.74 8.16 1.45 6.82.55 5.26.38 2.40.09 0 2.54 0 4.67c0 .45.11.89.18 1.33H0L2 20c.27 1.24 1.33 2 2.6 2h14.8c1.27 0 2.33-.76 2.6-2L24 6h-4z"
            />
          </svg>
        </div>
        <div>
          <h2 class="dialog-title">{{ data?.mode }} Product</h2>
          <p class="dialog-subtitle">
            {{
              data?.mode === 'Add'
                ? 'Fill in the details to add a new product'
                : 'Update the product information below'
            }}
          </p>
        </div>
      </div>

      <!-- Section: Basic Info -->
      <div class="dialog-section">
        <div class="section-label">Basic Information</div>
        <div class="form-grid-2">
          <div class="field-group full">
            <label>Product Name <span class="req">*</span></label>
            <input
              type="text"
              placeholder="e.g. Fresh Whole Milk"
              [(ngModel)]="product.name"
              class="field-input"
              required
            />
          </div>

          <div class="field-group">
            <label>SKU / Short Name</label>
            <input
              type="text"
              placeholder="e.g. MILK-001"
              [(ngModel)]="product.sku"
              class="field-input"
            />
            <span class="field-hint">Unique identifier for this product</span>
          </div>

          <div class="field-group">
            <label>
              Hotkey
              <span
                style="background:linear-gradient(135deg,#ff6b00,#ff8533);color:white;font-size:9px;font-weight:800;padding:2px 8px;border-radius:20px;letter-spacing:0.5px;margin-left:6px;"
                >POS</span
              >
            </label>
            <input
              type="text"
              placeholder="e.g. 101, A1, TEA"
              [(ngModel)]="product.hotkey"
              class="field-input"
              maxlength="20"
              style="text-transform:uppercase;letter-spacing:2px;font-weight:700;font-family:monospace;"
            />
            <span class="field-hint"
              >Type this code in billing screen to instantly add product to
              cart</span
            >
          </div>

          <div class="field-group">
            <label>Category</label>
            <!-- Input with datalist for autocomplete from existing categories -->
            <input
              type="text"
              placeholder="e.g. Dairy, Beverages..."
              [(ngModel)]="product.category"
              list="category-options"
              class="field-input"
            />
            <datalist id="category-options">
              <option *ngFor="let cat of data?.categories" [value]="cat">
                {{ cat }}
              </option>
            </datalist>
            <span class="field-hint">Type a new one or pick existing</span>
          </div>
        </div>
      </div>

      <!-- Section: Pricing & Inventory -->
      <div class="dialog-section">
        <div class="section-label">Pricing & Inventory</div>
        <div class="form-grid-2">
          <div class="field-group">
            <label>Price (₹) <span class="req">*</span></label>
            <div class="input-prefix-wrap">
              <span class="prefix">₹</span>
              <input
                type="number"
                placeholder="0.00"
                [(ngModel)]="product.price"
                class="field-input with-prefix"
                min="0"
              />
            </div>
          </div>

          <div class="field-group">
            <label>Stock Quantity</label>
            <input
              type="number"
              placeholder="0"
              [(ngModel)]="product.stock"
              class="field-input"
              min="0"
            />
          </div>

          <div class="field-group">
            <label>Weight (Grams)</label>
            <div class="input-suffix-wrap">
              <input
                type="number"
                placeholder="0"
                [(ngModel)]="product.grams"
                class="field-input with-suffix"
                min="0"
              />
              <span class="suffix">g</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="dialog-actions">
        <button class="cancel-btn" (click)="dialogRef.close()">Cancel</button>
        <button
          class="save-btn"
          (click)="save()"
          [disabled]="!product.name || !product.price"
        >
          <svg viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          {{ data?.mode === 'Add' ? 'Add Product' : 'Save Changes' }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      /* ─── Wrapper ─────────────────────────────────────────── */
      .dialog-wrapper {
        padding: 32px 36px 28px 36px;
        background: white;
        border-radius: 24px;
        width: 100%;
        box-sizing: border-box;
        font-family: 'Plus Jakarta Sans', sans-serif;
      }

      /* ─── Header ──────────────────────────────────────────── */
      .dialog-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 28px;
        padding-bottom: 20px;
        border-bottom: 1.5px solid #f0f0f0;
      }

      .dialog-icon {
        width: 48px;
        height: 48px;
        min-width: 48px;
        border-radius: 14px;
        background: linear-gradient(135deg, #fff3e6, #ffd9b3);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .dialog-icon svg {
        width: 24px;
        height: 24px;
        fill: #ff6b00;
      }

      .dialog-title {
        font-size: 20px;
        font-weight: 800;
        color: #111827;
        margin: 0 0 3px;
        letter-spacing: -0.4px;
      }

      .dialog-subtitle {
        font-size: 13px;
        color: #9ca3af;
        font-weight: 500;
        margin: 0;
      }

      /* ─── Section ─────────────────────────────────────────── */
      .dialog-section {
        margin-bottom: 22px;
      }

      .section-label {
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #ff6b00;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .section-label::after {
        content: '';
        flex: 1;
        height: 1px;
        background: linear-gradient(
          to right,
          rgba(255, 107, 0, 0.2),
          transparent
        );
      }

      /* ─── Grid ────────────────────────────────────────────── */
      .form-grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }

      .field-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .field-group.full {
        grid-column: span 2;
      }

      label {
        font-size: 11px;
        font-weight: 700;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.7px;
      }

      .req {
        color: #ef4444;
      }

      /* ─── Input ───────────────────────────────────────────── */
      .field-input {
        padding: 10px 14px;
        border-radius: 10px;
        border: 1.5px solid #e5e7eb;
        font-size: 14px;
        font-weight: 500;
        color: #111827;
        background: #fafafa;
        font-family: 'Plus Jakarta Sans', sans-serif;
        transition: all 0.2s ease;
        width: 100%;
        box-sizing: border-box;
        outline: none;
      }

      .field-input:focus {
        border-color: #ff6b00;
        box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.1);
        background: white;
      }

      .field-input::placeholder {
        color: #d1d5db;
      }

      .field-hint {
        font-size: 11px;
        color: #9ca3af;
        font-weight: 500;
      }

      /* ─── Prefix / Suffix inputs ──────────────────────────── */
      .input-prefix-wrap,
      .input-suffix-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }

      .prefix {
        position: absolute;
        left: 12px;
        font-size: 14px;
        font-weight: 700;
        color: #9ca3af;
        pointer-events: none;
      }

      .suffix {
        position: absolute;
        right: 12px;
        font-size: 13px;
        font-weight: 700;
        color: #9ca3af;
        pointer-events: none;
      }

      .field-input.with-prefix {
        padding-left: 26px;
      }
      .field-input.with-suffix {
        padding-right: 28px;
      }

      /* ─── Actions ─────────────────────────────────────────── */
      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1.5px solid #f0f0f0;
      }

      .cancel-btn {
        background: #f9fafb;
        border: 1.5px solid #e5e7eb;
        color: #6b7280;
        padding: 10px 22px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        font-family: 'Plus Jakarta Sans', sans-serif;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .cancel-btn:hover {
        background: #f3f4f6;
        color: #374151;
      }

      .save-btn {
        background: linear-gradient(135deg, #ff6b00, #ff8533);
        color: white;
        border: none;
        padding: 10px 24px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 700;
        font-family: 'Plus Jakarta Sans', sans-serif;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(255, 107, 0, 0.4);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .save-btn svg {
        width: 17px;
        height: 17px;
        fill: white;
      }

      .save-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(255, 107, 0, 0.5);
      }

      .save-btn:disabled {
        background: #e5e7eb;
        color: #9ca3af;
        box-shadow: none;
        transform: none;
        cursor: not-allowed;
      }
    `,
  ],
})
export class ProductDialogComponent {
  product: any = {
    name: '',
    sku: '',
    hotkey: '',
    category: '',
    price: null,
    stock: 0,
    grams: 0,
  };

  constructor(
    public dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    if (data?.product) {
      this.product = { ...data.product };
    }
  }

  save() {
    if (!this.product.name?.trim() || !this.product.price) return;
    this.dialogRef.close(this.product);
  }
}
