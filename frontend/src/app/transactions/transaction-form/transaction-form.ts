import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionService, Transaction } from '../../core/services/transaction';
import { CategoryService } from '../../core/services/category.service';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-form.html',
  styleUrl: './transaction-form.css',
})
export class TransactionForm implements OnInit {
  transactionForm!: FormGroup;
  transactionType: 'income' | 'expense' = 'income';
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  isEditMode = false;
  transactionId: string | null = null;

  showSuggestions = false;
  filteredCategories: string[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.transactionForm = this.fb.group({
      description: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      category: ['', Validators.required],
      date: ['', Validators.required],
      notes: ['']
    });

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.transactionId = params['id'];
        this.loadTransaction(this.transactionId!);
      } else {
        this.route.data.subscribe(data => {
          this.transactionType = data['type'] || 'income';
          this.resetCategoryFilters();
        });
      }
    });

    // Auto-suggest category as user types in description
    this.transactionForm.get('description')?.valueChanges.subscribe(desc => {
      if (desc && !this.isEditMode) {
        const suggested = this.categoryService.suggestCategory(desc, this.transactionType);
        if (suggested) {
          this.transactionForm.patchValue({ category: suggested }, { emitEvent: false });
          this.resetCategoryFilters();
        }
      }
    });
  }

  loadTransaction(id: string): void {
    this.isLoading = true;
    this.transactionService.getTransactionById(id).subscribe({
      next: (tx) => {
        this.isLoading = false;
        if (tx) {
          this.transactionType = tx.type;
          
          let formattedDate = '';
          if (tx.date) {
            const dateObj = new Date(tx.date);
            if (!isNaN(dateObj.getTime())) {
              formattedDate = dateObj.toISOString().substring(0, 10);
            }
          }

          this.transactionForm.patchValue({
            description: tx.description,
            amount: tx.amount,
            category: tx.category,
            date: formattedDate,
            notes: tx.notes || ''
          });
          this.resetCategoryFilters();
        } else {
          this.errorMessage = 'Transaction not found.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Error loading transaction details.';
        console.error('Load transaction error', err);
      }
    });
  }

  get categories(): string[] {
    return this.transactionType === 'income' 
      ? this.categoryService.getIncomeCategories() 
      : this.categoryService.getExpenseCategories();
  }

  resetCategoryFilters(): void {
    const inputVal = this.categoryInputVal;
    if (!inputVal) {
      this.filteredCategories = this.categories;
    } else {
      this.filteredCategories = this.categories.filter(c => 
        c.toLowerCase().includes(inputVal.toLowerCase())
      );
    }
  }

  onCategoryInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filteredCategories = this.categories.filter(c => 
      c.toLowerCase().includes(value.toLowerCase())
    );
    this.showSuggestions = true;
  }

  selectCategory(cat: string): void {
    this.transactionForm.patchValue({ category: cat });
    this.showSuggestions = false;
  }

  hideSuggestionsWithDelay(): void {
    // Timeout to allow mouse click event to register on suggestions before dropdown closes
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  get categoryInputVal(): string {
    return this.transactionForm.get('category')?.value || '';
  }

  get canAddCustomCategory(): boolean {
    const val = this.categoryInputVal.trim();
    if (!val) return false;
    
    // Check if it already exists in the available categories list (case-insensitive)
    const exists = this.categories.some(c => c.toLowerCase() === val.toLowerCase());
    return !exists;
  }

  addCustomCategoryAndSelect(): void {
    const val = this.categoryInputVal.trim();
    if (val) {
      const added = this.categoryService.addCustomCategory(this.transactionType, val);
      // Clean display name is generated in service (e.g. capitalized)
      const cleanName = val.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      this.transactionForm.patchValue({ category: cleanName });
      this.resetCategoryFilters();
      this.showSuggestions = false;
    }
  }


  get formTitle(): string {
    if (this.isEditMode) {
      return this.transactionType === 'income' ? 'Edit Income' : 'Edit Expense';
    }
    return this.transactionType === 'income' ? 'Record New Income' : 'Record New Expense';
  }

  get submitLabel(): string {
    if (this.isEditMode) {
      return 'Update';
    }
    return this.transactionType === 'income' ? 'Save Income' : 'Save Expense';
  }

  onSubmit(): void {
    if (this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const transaction: Transaction = {
      ...this.transactionForm.value,
      type: this.transactionType
    };

    const action$ = this.isEditMode
      ? this.transactionService.updateTransaction(this.transactionId!, transaction)
      : this.transactionService.saveTransaction(transaction);

    action$.subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = this.isEditMode ? 'Transaction updated successfully.' : res.message;
        this.transactionForm.reset();
        
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to save transaction.';
      }
    });
  }

  onCancel(): void {
    this.transactionForm.reset();
    this.router.navigate(['/dashboard']); 
  }
}
