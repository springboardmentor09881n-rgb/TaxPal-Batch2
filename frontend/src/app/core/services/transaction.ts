import { Injectable } from '@angular/core';
import { delay, of, Observable } from 'rxjs';

export interface Transaction {
  id?: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private transactions: Transaction[] = [
    { id: 't1', type: 'income', description: 'Design Project', category: 'Consulting', amount: 1200, date: '2025-05-08' },
    { id: 't2', type: 'expense', description: 'Office Rent', category: 'Rent/Mortgage', amount: 800, date: '2025-05-05' },
    { id: 't3', type: 'expense', description: 'Adobe CC', category: 'Software Subscriptions', amount: 55, date: '2025-05-02' },
    { id: 't4', type: 'income', description: 'Website Update', category: 'Web Design', amount: 500, date: '2025-04-28' }
  ];

  constructor() {}

  getTransactions(): Transaction[] {
    // Return a sorted copy (newest first)
    return [...this.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  saveTransaction(transaction: Transaction): Observable<any> {
    const newTx = {
      ...transaction,
      id: Math.random().toString(36).substr(2, 9)
    };
    
    this.transactions.unshift(newTx); // Add to beginning of array

    return of({
      message: `${transaction.type === 'income' ? 'Income' : 'Expense'} saved successfully`,
      data: newTx
    }).pipe(delay(800)); // Delay is fine for the save action
  }
}
