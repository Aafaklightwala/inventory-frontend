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

      <!-- Section: Product Image -->
      <div class="dialog-section">
        <div class="section-label">Product Image</div>
        <div
          class="image-upload-area"
          (click)="imageInput.click()"
          [class.has-image]="product.image"
        >
          <input
            #imageInput
            type="file"
            hidden
            accept="image/*"
            (change)="onImageSelect($event)"
          />
          <ng-container *ngIf="!product.image">
            <div class="upload-placeholder">
              <svg viewBox="0 0 24 24">
                <path
                  d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                />
              </svg>
              <span>Click to upload image</span>
              <small>PNG, JPG, WEBP — max 500 KB</small>
            </div>
          </ng-container>
          <ng-container *ngIf="product.image">
            <img
              [src]="product.image"
              alt="Product image"
              class="image-preview"
            />
            <button
              class="remove-image-btn"
              (click)="removeImage($event)"
              title="Remove image"
            >
              ✕
            </button>
          </ng-container>
        </div>
        <span class="field-hint" *ngIf="imageError" style="color:#ef4444">{{
          imageError
        }}</span>
      </div>

      <!-- ★ NEW Section: Ingredients -->
      <div class="dialog-section">
        <div class="section-label">Ingredients</div>

        <!-- Percentage total indicator -->
        <div class="pct-bar-wrap" *ngIf="product.ingredients?.length > 0">
          <div class="pct-bar-track">
            <div
              class="pct-bar-fill"
              [style.width.%]="totalPercentage > 100 ? 100 : totalPercentage"
              [class.pct-ok]="totalPercentage === 100"
              [class.pct-over]="totalPercentage > 100"
              [class.pct-under]="totalPercentage < 100"
            ></div>
          </div>
          <span
            class="pct-label"
            [class.pct-ok]="totalPercentage === 100"
            [class.pct-over]="totalPercentage > 100"
            [class.pct-under]="totalPercentage < 100 && totalPercentage > 0"
          >
            {{ totalPercentage }}% total
            <span *ngIf="totalPercentage === 100"> ✓</span>
            <span *ngIf="totalPercentage > 100"> — over 100%!</span>
            <span *ngIf="totalPercentage < 100 && totalPercentage > 0">
              — needs {{ 100 - totalPercentage }}% more</span
            >
          </span>
        </div>

        <!-- Ingredient rows -->
        <div class="ing-list">
          <div
            class="ing-row"
            *ngFor="let ing of product.ingredients; let i = index"
          >
            <div class="ing-num">{{ i + 1 }}</div>
            <input
              type="text"
              placeholder="e.g. Milk, Sugar, Wheat..."
              [(ngModel)]="ing.name"
              class="field-input ing-name-inp"
            />
            <div class="ing-pct-wrap">
              <input
                type="number"
                placeholder="0"
                [(ngModel)]="ing.percentage"
                class="field-input ing-pct-inp"
                min="0"
                max="100"
              />
              <span class="ing-pct-sym">%</span>
            </div>
            <button
              class="ing-del-btn"
              (click)="removeIngredient(i)"
              title="Remove"
            >
              <svg viewBox="0 0 24 24">
                <path
                  d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Empty state -->
        <div
          class="ing-empty"
          *ngIf="!product.ingredients || product.ingredients.length === 0"
        >
          <svg viewBox="0 0 24 24">
            <path
              d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"
            />
          </svg>
          <span>No ingredients added yet</span>
        </div>

        <button class="add-ing-btn" (click)="addIngredient()">
          <svg viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          Add Ingredient
        </button>
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
      /* ─── Wrapper ───────────────────────────────── */
      .dialog-wrapper {
        overflow-y: auto;
        max-height: 90vh;
        padding: 32px 36px 28px 36px;
        background: white;
        border-radius: 24px;
        width: 100%;
        box-sizing: border-box;
        font-family: 'Plus Jakarta Sans', sans-serif;
      }
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

      /* ─── Image Upload ──────────────────────────── */
      .image-upload-area {
        position: relative;
        border: 2px dashed #e5e7eb;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
        background: #fafafa;
        min-height: 110px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .image-upload-area:hover,
      .image-upload-area.has-image {
        border-color: #ff6b00;
        background: #fff8f3;
      }
      .upload-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        color: #9ca3af;
      }
      .upload-placeholder svg {
        width: 36px;
        height: 36px;
        fill: #d1d5db;
      }
      .upload-placeholder span {
        font-size: 13px;
        font-weight: 600;
        color: #6b7280;
      }
      .upload-placeholder small {
        font-size: 11px;
        color: #9ca3af;
      }
      .image-preview {
        max-height: 120px;
        max-width: 100%;
        border-radius: 8px;
        object-fit: contain;
      }
      .remove-image-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(220, 38, 38, 0.9);
        color: white;
        border: none;
        border-radius: 50%;
        width: 22px;
        height: 22px;
        font-size: 11px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
      }

      /* ─── Ingredients ───────────────────────────── */
      .pct-bar-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
      }
      .pct-bar-track {
        flex: 1;
        height: 8px;
        background: #f3f4f6;
        border-radius: 20px;
        overflow: hidden;
      }
      .pct-bar-fill {
        height: 100%;
        border-radius: 20px;
        background: #e5e7eb;
        transition:
          width 0.3s ease,
          background 0.2s ease;
      }
      .pct-bar-fill.pct-ok {
        background: linear-gradient(90deg, #16a34a, #22c55e);
      }
      .pct-bar-fill.pct-over {
        background: linear-gradient(90deg, #dc2626, #ef4444);
      }
      .pct-bar-fill.pct-under {
        background: linear-gradient(90deg, #ff6b00, #ff8533);
      }
      .pct-label {
        font-size: 12px;
        font-weight: 700;
        color: #6b7280;
        white-space: nowrap;
      }
      .pct-label.pct-ok {
        color: #16a34a;
      }
      .pct-label.pct-over {
        color: #dc2626;
      }
      .pct-label.pct-under {
        color: #ff6b00;
      }

      .ing-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 12px;
      }

      .ing-row {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #fafafa;
        border: 1.5px solid #e5e7eb;
        border-radius: 12px;
        padding: 10px 12px;
        transition: border-color 0.2s;
      }
      .ing-row:hover {
        border-color: rgba(255, 107, 0, 0.3);
      }

      .ing-num {
        width: 22px;
        height: 22px;
        min-width: 22px;
        border-radius: 50%;
        background: linear-gradient(135deg, #fff3e6, #ffd9b3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 800;
        color: #ff6b00;
      }

      .ing-name-inp {
        flex: 1;
        margin: 0;
      }
      .ing-pct-wrap {
        position: relative;
        display: flex;
        align-items: center;
        width: 80px;
        flex-shrink: 0;
      }
      .ing-pct-inp {
        width: 80px;
        padding-right: 24px !important;
        text-align: right;
        margin: 0;
      }
      .ing-pct-sym {
        position: absolute;
        right: 10px;
        font-size: 13px;
        font-weight: 700;
        color: #9ca3af;
        pointer-events: none;
      }

      .ing-del-btn {
        width: 30px;
        height: 30px;
        min-width: 30px;
        border-radius: 8px;
        border: none;
        background: rgba(220, 38, 38, 0.07);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      .ing-del-btn:hover {
        background: #ef4444;
      }
      .ing-del-btn:hover svg {
        fill: white;
      }
      .ing-del-btn svg {
        width: 14px;
        height: 14px;
        fill: #ef4444;
        transition: fill 0.2s;
      }

      .ing-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 20px;
        color: #9ca3af;
        text-align: center;
        border: 2px dashed #e5e7eb;
        border-radius: 12px;
        margin-bottom: 12px;
      }
      .ing-empty svg {
        width: 28px;
        height: 28px;
        fill: #d1d5db;
      }
      .ing-empty span {
        font-size: 13px;
        font-weight: 500;
      }

      .add-ing-btn {
        display: flex;
        align-items: center;
        gap: 7px;
        background: rgba(255, 107, 0, 0.08);
        border: 1.5px dashed rgba(255, 107, 0, 0.4);
        color: #ff6b00;
        padding: 9px 16px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 700;
        font-family: 'Plus Jakarta Sans', sans-serif;
        cursor: pointer;
        transition: all 0.2s;
        width: 100%;
        justify-content: center;
      }
      .add-ing-btn:hover {
        background: rgba(255, 107, 0, 0.15);
        border-color: #ff6b00;
      }
      .add-ing-btn svg {
        width: 16px;
        height: 16px;
        fill: #ff6b00;
      }

      /* ─── Actions ───────────────────────────────── */
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
  imageError = '';

  product: any = {
    name: '',
    sku: '',
    hotkey: '',
    category: '',
    price: null,
    stock: 0,
    grams: 0,
    image: null,
    ingredients: [],
  };

  constructor(
    public dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    if (data?.product) {
      this.product = {
        ...data.product,
        // Ensure ingredients is always an array
        ingredients: Array.isArray(data.product.ingredients)
          ? data.product.ingredients.filter(Boolean)
          : [],
      };
    }
  }

  get totalPercentage(): number {
    if (!this.product.ingredients?.length) return 0;
    return Math.round(
      this.product.ingredients.reduce(
        (sum: number, i: any) => sum + Number(i.percentage || 0),
        0,
      ),
    );
  }

  addIngredient() {
    if (!this.product.ingredients) this.product.ingredients = [];
    this.product.ingredients.push({ name: '', percentage: 0 });
  }

  removeIngredient(index: number) {
    this.product.ingredients.splice(index, 1);
  }

  onImageSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      this.imageError = 'Image too large. Max 500 KB.';
      return;
    }
    this.imageError = '';
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.product.image = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeImage(event: Event) {
    event.stopPropagation();
    this.product.image = null;
  }

  save() {
    if (!this.product.name?.trim() || !this.product.price) return;

    // Warn if ingredients exist but don't total 100%
    if (this.product.ingredients?.length > 0 && this.totalPercentage !== 100) {
      if (
        !confirm(
          `Ingredient total is ${this.totalPercentage}% (not 100%). Save anyway?`,
        )
      )
        return;
    }

    // Clean up empty ingredient rows before saving
    this.product.ingredients = (this.product.ingredients || []).filter(
      (i: any) => i.name && i.name.trim(),
    );

    this.dialogRef.close(this.product);
  }
}
