import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../core/services/category.service';
import { AuthService } from '../core/services/auth';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class SettingsComponent implements OnInit {
  activeTab: 'profile' | 'categories' | 'notifications' | 'security' = 'categories';
  categoryTab: 'income' | 'expense' = 'expense';
  
  // Category variables
  systemCategories: string[] = [];
  customCategories: string[] = [];
  
  showAddModal = false;
  newCategoryName = '';
  categoryError = '';

  showEditModal = false;
  oldCategoryName = '';
  editCategoryName = '';
  editCategoryError = '';

  // Color state
  newCategoryColor = '#4f46e5';
  editCategoryColor = '#4f46e5';
  categoryColors: { [name: string]: string } = {};

  // Profile mock variables
  userProfile = {
    name: 'Alex Morgan',
    email: 'alex@example.com',
    phone: '+1 (555) 019-2834',
    currency: 'USD',
    language: 'English'
  };
  profileSuccess = '';

  // Notifications mock variables
  notifications = {
    emailAlerts: true,
    weeklyDigest: false,
    budgetAlerts: true,
    taxDeadlines: true
  };
  notifSuccess = '';

  // Security mock variables
  passwordData = {
    current: '',
    new: '',
    confirm: ''
  };
  securityError = '';
  securitySuccess = '';

  constructor(
    private categoryService: CategoryService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (user) {
      this.userProfile.name = user.fullName || user.name || 'Alex Morgan';
      this.userProfile.email = user.email || 'alex@example.com';
      this.userProfile.currency = user.country === 'US' ? 'USD' : 'INR';
    }
    this.loadCategories();
    
    // Listen to changes in custom categories
    this.categoryService.customCategories$.subscribe(() => {
      this.loadCategories();
    });

    // Keep local color map in sync with service
    this.categoryService.categoryColors$.subscribe(colors => {
      this.categoryColors = { ...colors };
    });
  }

  loadCategories(): void {
    if (this.categoryTab === 'expense') {
      this.systemCategories = this.categoryService.getSystemExpenseCategories();
      const all = this.categoryService.getExpenseCategories();
      this.customCategories = all.filter(c => !this.systemCategories.includes(c));
    } else {
      this.systemCategories = this.categoryService.getSystemIncomeCategories();
      const all = this.categoryService.getIncomeCategories();
      this.customCategories = all.filter(c => !this.systemCategories.includes(c));
    }
  }

  setCategoryTab(tab: 'income' | 'expense'): void {
    this.categoryTab = tab;
    this.loadCategories();
  }

  openAddModal(): void {
    this.newCategoryName = '';
    this.newCategoryColor = '#4f46e5';
    this.categoryError = '';
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  addCategory(): void {
    this.categoryError = '';
    const name = this.newCategoryName.trim();
    if (!name) {
      this.categoryError = 'Category name cannot be empty.';
      return;
    }

    const success = this.categoryService.addCustomCategory(this.categoryTab, name);
    if (success) {
      // Save the chosen color for this new category
      const formatted = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      this.categoryService.setCategoryColor(formatted, this.newCategoryColor);
      this.closeAddModal();
    } else {
      this.categoryError = 'Category already exists.';
    }
  }

  openEditModal(name: string): void {
    this.oldCategoryName = name;
    this.editCategoryName = name;
    this.editCategoryColor = this.getCategoryColor(name);
    this.editCategoryError = '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  updateCategory(): void {
    this.editCategoryError = '';
    const newName = this.editCategoryName.trim();
    if (!newName) {
      this.editCategoryError = 'Category name cannot be empty.';
      return;
    }

    const success = this.categoryService.editCustomCategory(this.categoryTab, this.oldCategoryName, newName);
    if (success) {
      // Save color under the new name
      const formatted = newName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      this.categoryService.setCategoryColor(formatted, this.editCategoryColor);
      this.closeEditModal();
    } else {
      this.editCategoryError = 'Invalid name or category already exists.';
    }
  }

  deleteCategory(name: string): void {
    if (confirm(`Are you sure you want to delete the category "${name}"?`)) {
      this.categoryService.deleteCustomCategory(this.categoryTab, name);
    }
  }

  /** Returns the saved color for a category (with a fallback). */
  getCategoryColor(name: string): string {
    return this.categoryColors[name] || this.categoryService.getCategoryColor(name);
  }

  /** Save a new color immediately when user picks one on the pill. */
  savePillColor(name: string, event: Event): void {
    const color = (event.target as HTMLInputElement).value;
    this.categoryService.setCategoryColor(name, color);
  }

  // Profile forms
  saveProfile(): void {
    this.profileSuccess = 'Profile settings updated successfully (mock).';
    setTimeout(() => this.profileSuccess = '', 3000);
  }

  // Notifications forms
  saveNotifications(): void {
    this.notifSuccess = 'Notification preferences updated (mock).';
    setTimeout(() => this.notifSuccess = '', 3000);
  }

  // Security forms
  changePassword(): void {
    this.securityError = '';
    this.securitySuccess = '';
    if (!this.passwordData.current || !this.passwordData.new || !this.passwordData.confirm) {
      this.securityError = 'All fields are required.';
      return;
    }
    if (this.passwordData.new !== this.passwordData.confirm) {
      this.securityError = 'New password and confirmation do not match.';
      return;
    }
    this.securitySuccess = 'Password changed successfully (mock).';
    this.passwordData = { current: '', new: '', confirm: '' };
  }
}
