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

  incomeCategories = ['Web Design', 'Consulting', 'Salary', 'Investments', 'Other'];
  expenseCategories = ['Rent/Mortgage', 'Business Expenses', 'Utilities', 'Food', 'Software Subscriptions', 'Other'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private transactionService: TransactionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Determine type from route data
    this.route.data.subscribe(data => {
      this.transactionType = data['type'] || 'income';
    });

    this.transactionForm = this.fb.group({
      description: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      category: ['', Validators.required],
      date: ['', Validators.required],
      notes: ['']
    });
  }

  get categories(): string[] {
    return this.transactionType === 'income' ? this.incomeCategories : this.expenseCategories;
  }

  get formTitle(): string {
    return this.transactionType === 'income' ? 'Record New Income' : 'Record New Expense';
  }

  get submitLabel(): string {
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

    this.transactionService.saveTransaction(transaction).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message;
        this.transactionForm.reset();
        
        // Navigate back to dashboard after short delay to show success message
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to save transaction.';
      }
    });
  }

  onCancel(): void {
    this.transactionForm.reset();
    this.router.navigate(['/dashboard']); 
  }
}
