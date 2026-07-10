import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionService, Transaction } from '../../core/services/transaction';

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

  incomeCategories = ['Web Design', 'Consulting', 'Salary', 'Investments', 'Other'];
  expenseCategories = ['Rent/Mortgage', 'Business Expenses', 'Utilities', 'Food', 'Software Subscriptions', 'Other'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private transactionService: TransactionService,
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
        });
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
    return this.transactionType === 'income' ? this.incomeCategories : this.expenseCategories;
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
