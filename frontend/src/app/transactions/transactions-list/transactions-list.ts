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
    this.allTransactions = this.transactionService.getTransactions();
    this.applyFilter('all');
  }

  applyFilter(type: 'all' | 'income' | 'expense') {
    this.filter = type;
    if (type === 'all') {
      this.displayedTransactions = [...this.allTransactions];
    } else {
      this.displayedTransactions = this.allTransactions.filter(t => t.type === type);
    }
  }
}
