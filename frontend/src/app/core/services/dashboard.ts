import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Transaction, TransactionService } from './transaction';

export interface DashboardSummary {
  monthlyIncome: number;
  incomeTrend: number; // percentage
  monthlyExpenses: number;
  expenseTrend: number;
  estimatedTaxDue: number;
  savingsRate: number;
  savingsTrend: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private transactionService: TransactionService) { }

  getSummary(): Observable<DashboardSummary> {
    const transactions = this.transactionService.getTransactions();
    
    // Calculate total income
    const monthlyIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate total expenses
    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Basic calculation for savings rate and estimated tax
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
    const estimatedTaxDue = monthlyIncome * 0.15; // flat 15% mock tax

    return of({
      monthlyIncome: monthlyIncome,
      incomeTrend: 12, // mock static trend
      monthlyExpenses: monthlyExpenses,
      expenseTrend: 8, // mock static trend
      estimatedTaxDue: estimatedTaxDue,
      savingsRate: parseFloat(savingsRate.toFixed(1)),
      savingsTrend: 3.2 // mock static trend
    });
  }

  getRecentTransactions(): Observable<Transaction[]> {
    // Return top 5 recent transactions
    return of(this.transactionService.getTransactions().slice(0, 5));
  }
}
