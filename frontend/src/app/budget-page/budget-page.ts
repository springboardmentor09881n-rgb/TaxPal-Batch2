import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BudgetService, Budget, BudgetProgress } from '../core/services/budget.service';
import { CategoryService } from '../core/services/category.service';
import { TransactionService } from '../core/services/transaction';
import { AuthService } from '../core/services/auth';

@Component({
  selector: 'app-budget-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './budget-page.html',
  styleUrl: './budget-page.css'
})
export class BudgetPage implements OnInit {
  selectedMonth: string = ''; // Format: "YYYY-MM"
  budgetProgressList: BudgetProgress[] = [];
  currencySymbol = '₹';
  isLoading = false;
  protected readonly Math = Math;

  // Form State
  showFormModal = false;
  isEditMode = false;
  editingBudgetId: string | null = null;
  budgetForm!: FormGroup;
  formError = '';

  // Suggestions state
  showSuggestions = false;
  filteredCategories: string[] = [];

  // Summary Metrics
  totalLimit = 0;
  totalSpent = 0;
  totalRemaining = 0;
  overallPercentage = 0;
  budgetHealthStatus = 'Good';

  constructor(
    private fb: FormBuilder,
    private budgetService: BudgetService,
    private categoryService: CategoryService,
    private transactionService: TransactionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currencySymbol = this.authService.getCurrencySymbol();
    
    // Set default month to current month in local timezone (YYYY-MM)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    this.selectedMonth = `${year}-${month}`;

    this.initForm();

    // Load budgets when lists or transactions update
    this.budgetService.budgets$.subscribe(() => {
      this.loadBudgetsAndProgress();
    });

    this.transactionService.transactions$.subscribe(() => {
      this.loadBudgetsAndProgress();
    });

    this.loadBudgetsAndProgress();
  }

  initForm(): void {
    this.budgetForm = this.fb.group({
      category: ['', Validators.required],
      limit: [null, [Validators.required, Validators.min(0.01)]],
      month: [this.selectedMonth, Validators.required],
      description: ['']
    });

    // Auto-suggest category from description field keywords
    this.budgetForm.get('description')?.valueChanges.subscribe(desc => {
      if (desc && !this.isEditMode) {
        // Budgeting is typically for Expense categories, so search Expense suggestions first
        const suggested = this.categoryService.suggestCategory(desc, 'expense');
        if (suggested) {
          this.budgetForm.patchValue({ category: suggested }, { emitEvent: false });
          this.resetCategoryFilters();
        }
      }
    });
  }

  loadBudgetsAndProgress(): void {
    this.isLoading = true;
    this.budgetService.getBudgetProgressList(this.selectedMonth).subscribe({
      next: (progressList) => {
        this.budgetProgressList = progressList;
        this.calculateSummary();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading budget progress list', err);
        this.isLoading = false;
      }
    });
  }

  calculateSummary(): void {
    this.totalLimit = this.budgetProgressList.reduce((sum, item) => sum + item.limit, 0);
    this.totalSpent = this.budgetProgressList.reduce((sum, item) => sum + item.spent, 0);
    this.totalRemaining = this.totalLimit - this.totalSpent;
    this.overallPercentage = this.totalLimit > 0 ? (this.totalSpent / this.totalLimit) * 100 : 0;

    if (this.overallPercentage > 90) {
      this.budgetHealthStatus = 'Exceeded';
    } else if (this.overallPercentage >= 70) {
      this.budgetHealthStatus = 'Warning';
    } else {
      this.budgetHealthStatus = 'Good';
    }
  }

  onMonthChange(): void {
    this.loadBudgetsAndProgress();
    this.budgetForm.patchValue({ month: this.selectedMonth });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.editingBudgetId = null;
    this.formError = '';
    this.budgetForm.reset({
      category: '',
      limit: null,
      month: this.selectedMonth,
      description: ''
    });
    this.resetCategoryFilters();
    this.showFormModal = true;
  }

  openEditModal(progressItem: BudgetProgress): void {
    this.isEditMode = true;
    this.editingBudgetId = progressItem.budget.id;
    this.formError = '';
    this.budgetForm.patchValue({
      category: progressItem.budget.category,
      limit: progressItem.budget.limit,
      month: progressItem.budget.month,
      description: progressItem.budget.description || ''
    });
    this.resetCategoryFilters();
    this.showFormModal = true;
  }

  closeModal(): void {
    this.showFormModal = false;
  }

  saveBudget(): void {
    if (this.budgetForm.invalid) {
      this.budgetForm.markAllAsTouched();
      return;
    }

    const formVal = this.budgetForm.value;
    this.formError = '';

    if (this.isEditMode && this.editingBudgetId) {
      this.budgetService.updateBudget(this.editingBudgetId, formVal).subscribe({
        next: () => {
          this.closeModal();
        },
        error: (err) => {
          this.formError = err.message || 'Failed to update budget.';
        }
      });
    } else {
      this.budgetService.createBudget(formVal).subscribe({
        next: () => {
          this.closeModal();
        },
        error: (err) => {
          this.formError = err.message || 'Failed to create budget.';
        }
      });
    }
  }

  deleteBudget(id: string, category: string): void {
    if (confirm(`Are you sure you want to delete the budget for category "${category}"?`)) {
      this.budgetService.deleteBudget(id).subscribe();
    }
  }

  // Autocomplete methods
  get expenseCategories(): string[] {
    return this.categoryService.getExpenseCategories();
  }

  resetCategoryFilters(): void {
    const inputVal = this.categoryInputVal;
    if (!inputVal) {
      this.filteredCategories = this.expenseCategories;
    } else {
      this.filteredCategories = this.expenseCategories.filter(c => 
        c.toLowerCase().includes(inputVal.toLowerCase())
      );
    }
  }

  onCategoryInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filteredCategories = this.expenseCategories.filter(c => 
      c.toLowerCase().includes(value.toLowerCase())
    );
    this.showSuggestions = true;
  }

  selectCategory(cat: string): void {
    this.budgetForm.patchValue({ category: cat });
    this.showSuggestions = false;
  }

  hideSuggestionsWithDelay(): void {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  get categoryInputVal(): string {
    return this.budgetForm.get('category')?.value || '';
  }

  get canAddCustomCategory(): boolean {
    const val = this.categoryInputVal.trim();
    if (!val) return false;
    const exists = this.expenseCategories.some(c => c.toLowerCase() === val.toLowerCase());
    return !exists;
  }

  addCustomCategoryAndSelect(): void {
    const val = this.categoryInputVal.trim();
    if (val) {
      this.categoryService.addCustomCategory('expense', val);
      const cleanName = val.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      this.budgetForm.patchValue({ category: cleanName });
      this.resetCategoryFilters();
      this.showSuggestions = false;
    }
  }
}
