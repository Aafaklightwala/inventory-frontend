import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  @ViewChild('logoInput') logoInput!: ElementRef<HTMLInputElement>;

  profile: any = null;

  // ── Edit mode ──────────────────────────────────────────────
  editMode = false;
  form: any = {};
  saving = false;

  // ── Alerts ─────────────────────────────────────────────────
  successMsg = '';
  errorMsg = '';

  // ── Logo ───────────────────────────────────────────────────
  logoUploading = false;
  logoSuccess = false;

  // ── Password ───────────────────────────────────────────────
  pwdForm = { current: '', new: '' };
  pwdSaving = false;
  pwdSuccess = '';
  pwdError = '';
  showCurrent = false;
  showNew = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.api.getProfile().subscribe({
      next: (res: any) => {
        this.profile = res;
      },
      error: () => {
        this.errorMsg = 'Failed to load profile.';
      },
    });
  }

  getInitials(): string {
    const f = this.profile?.first_name?.[0] || '';
    const l = this.profile?.last_name?.[0] || '';
    return (f + l).toUpperCase() || 'U';
  }

  // ── Edit helpers ───────────────────────────────────────────
  startEdit() {
    this.form = {
      first_name: this.profile.first_name || '',
      last_name: this.profile.last_name || '',
      mobile: this.profile.mobile || '',
      company_name: this.profile.company_name || '',
      gst_number: this.profile.gst_number || '',
    };
    this.editMode = true;
    this.successMsg = '';
    this.errorMsg = '';
  }

  cancelEdit() {
    this.editMode = false;
    this.form = {};
  }

  saveProfile() {
    if (!this.form.first_name?.trim() || !this.form.last_name?.trim()) {
      this.errorMsg = 'First and last name are required.';
      return;
    }
    if (!this.form.mobile?.trim() || this.form.mobile.length !== 10) {
      this.errorMsg = 'Enter a valid 10-digit mobile number.';
      return;
    }
    this.saving = true;
    this.errorMsg = '';
    this.successMsg = '';

    this.api.updateProfile(this.form).subscribe({
      next: () => {
        this.saving = false;
        this.editMode = false;
        this.successMsg = '✓ Profile updated successfully!';
        // Refresh local profile data + update localStorage name
        this.loadProfile();
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        stored.name = this.form.first_name + ' ' + this.form.last_name;
        localStorage.setItem('user', JSON.stringify(stored));
        setTimeout(() => (this.successMsg = ''), 4000);
      },
      error: (err: any) => {
        this.saving = false;
        this.errorMsg = err.error?.message || 'Failed to save profile.';
      },
    });
  }

  // ── Logo upload ────────────────────────────────────────────
  triggerLogoUpload() {
    this.logoInput.nativeElement.click();
  }

  onLogoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 500000) {
      this.errorMsg = 'Logo file too large. Please use an image under 500 KB.';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.logoUploading = true;
      this.logoSuccess = false;

      this.api.uploadLogo({ logo: base64 }).subscribe({
        next: () => {
          this.logoUploading = false;
          this.logoSuccess = true;
          this.profile.company_logo = base64; // instant preview
          setTimeout(() => (this.logoSuccess = false), 3000);
        },
        error: (err: any) => {
          this.logoUploading = false;
          this.errorMsg = err.error?.message || 'Logo upload failed.';
        },
      });
    };
    reader.readAsDataURL(file);
  }

  // ── Change password ────────────────────────────────────────
  changePassword() {
    this.pwdError = '';
    this.pwdSuccess = '';

    if (!this.pwdForm.current || !this.pwdForm.new) {
      this.pwdError = 'Both fields are required.';
      return;
    }
    if (this.pwdForm.new.length < 6) {
      this.pwdError = 'New password must be at least 6 characters.';
      return;
    }

    this.pwdSaving = true;
    this.api.changePassword(this.pwdForm).subscribe({
      next: () => {
        this.pwdSaving = false;
        this.pwdSuccess = 'Password changed successfully!';
        this.pwdForm = { current: '', new: '' };
        setTimeout(() => (this.pwdSuccess = ''), 4000);
      },
      error: (err: any) => {
        this.pwdSaving = false;
        this.pwdError = err.error?.message || 'Failed to change password.';
      },
    });
  }
}
