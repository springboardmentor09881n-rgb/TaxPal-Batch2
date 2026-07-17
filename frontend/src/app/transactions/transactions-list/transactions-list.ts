import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TransactionService, Transaction } from '../../core/services/transaction';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './transactions-list.html',
  styleUrl: './transactions-list.css'
})
export class TransactionsList implements OnInit {
  allTransactions: Transaction[] = [];
  displayedTransactions: Transaction[] = [];
  filter: 'all' | 'income' | 'expense' = 'all';
  currencySymbol = '₹';

  constructor(
    private transactionService: TransactionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currencySymbol = this.authService.getCurrencySymbol();
    
    this.transactionService.transactions$.subscribe(data => {
      this.allTransactions = data;
      this.applyFilter(this.filter);
    });

    // Only load transactions from server if we haven't loaded them yet
    if (!this.transactionService.isLoaded) {
      this.transactionService.loadTransactions().subscribe();
    }
  }

  applyFilter(type: 'all' | 'income' | 'expense') {
    this.filter = type;
    if (type === 'all') {
      this.displayedTransactions = [...this.allTransactions];
    } else {
      this.displayedTransactions = this.allTransactions.filter(t => t.type === type);
    }
  }

  onDelete(id: string | undefined): void {
    if (!id) return;
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.transactionService.deleteTransaction(id).subscribe({
        next: () => {
          // Central store will reload and emit new list automatically
        },
        error: (err) => {
          console.error('Delete error', err);
          alert('Failed to delete transaction.');
        }
      });
    }
  }
}
