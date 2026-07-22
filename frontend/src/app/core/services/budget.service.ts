import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { TransactionService, Transaction } from './transaction';
import { AuthService } from './auth';

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  month: string; // Format: "YYYY-MM"
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetProgress {
  budget: Budget;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'Green' | 'Orange' | 'Red';
  isExceeded: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private budgetsSubject = new BehaviorSubject<Budget[]>([]);
  public budgets$ = this.budgetsSubject.asObservable();

  constructor(
    private transactionService: TransactionService,
    private authService: AuthService
  ) {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadBudgets();
      } else {
        this.budgetsSubject.next([]);
      }
    });
  }

  private loadBudgets(): void {
    const user = this.authService.currentUser;
    if (!user) return;

    const stored = localStorage.getItem(`taxpal_budgets_${user.id || 'default'}`);
    if (stored) {
      try {
        this.budgetsSubject.next(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading budgets', e);
        this.budgetsSubject.next([]);
      }
    } else {
      this.budgetsSubject.next([]);
    }
  }

  private saveBudgets(budgets: Budget[]): void {
    const user = this.authService.currentUser;
    if (!user) return;

    localStorage.setItem(`taxpal_budgets_${user.id || 'default'}`, JSON.stringify(budgets));
    this.budgetsSubject.next(budgets);
  }

  getBudgets(): Observable<Budget[]> {
    return this.budgets$;
  }

  createBudget(budgetData: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Observable<Budget> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not authenticated');

    const currentBudgets = this.budgetsSubject.value;

    // Check for duplicate category and month
    const duplicate = currentBudgets.find(
      b => b.category.toLowerCase() === budgetData.category.toLowerCase() && 
           b.month === budgetData.month
    );
    if (duplicate) {
      throw new Error(`A budget for category "${budgetData.category}" and month "${budgetData.month}" already exists.`);
    }

    if (budgetData.limit <= 0) {
      throw new Error('Budget limit must be greater than 0.');
    }

    const now = new Date().toISOString();
    const newBudget: Budget = {
      ...budgetData,
      id: Math.random().toString(36).substring(2, 9),
      userId: user.id || 'default',
      createdAt: now,
      updatedAt: now
    };

    const updated = [...currentBudgets, newBudget];
    this.saveBudgets(updated);
    return of(newBudget);
  }

  updateBudget(id: string, budgetData: Partial<Omit<Budget, 'id' | 'userId'>>): Observable<Budget> {
    const currentBudgets = this.budgetsSubject.value;
    const index = currentBudgets.findIndex(b => b.id === id);
    if (index === -1) {
      throw new Error('Budget not found');
    }

    const existingBudget = currentBudgets[index];

    // Check for duplicates if category or month is changing
    if (budgetData.category || budgetData.month) {
      const newCategory = budgetData.category || existingBudget.category;
      const newMonth = budgetData.month || existingBudget.month;
      const duplicate = currentBudgets.find(
        b => b.id !== id && 
             b.category.toLowerCase() === newCategory.toLowerCase() && 
             b.month === newMonth
      );
      if (duplicate) {
        throw new Error(`A budget for category "${newCategory}" and month "${newMonth}" already exists.`);
      }
    }

    if (budgetData.limit !== undefined && budgetData.limit <= 0) {
      throw new Error('Budget limit must be greater than 0.');
    }

    const updatedBudget: Budget = {
      ...existingBudget,
      ...budgetData,
      updatedAt: new Date().toISOString()
    } as Budget;

    const updated = [...currentBudgets];
    updated[index] = updatedBudget;
    this.saveBudgets(updated);
    return of(updatedBudget);
  }

  deleteBudget(id: string): Observable<boolean> {
    const currentBudgets = this.budgetsSubject.value;
    const updated = currentBudgets.filter(b => b.id !== id);
    this.saveBudgets(updated);
    return of(true);
  }

  getBudgetProgressList(month: string): Observable<BudgetProgress[]> {
    return this.budgets$.pipe(
      map(budgets => {
        let filteredBudgets = month ? budgets.filter(b => !b.month || b.month === month) : budgets;
        if (filteredBudgets.length === 0 && budgets.length > 0) {
          filteredBudgets = budgets;
        }

        const transactions = this.transactionService.getTransactions() || [];

        return filteredBudgets.map(budget => {
          const matchingExpenses = transactions.filter(tx => {
            if (tx.type !== 'expense') return false;
            if (!tx.category || !budget.category) return false;
            return tx.category.trim().toLowerCase() === budget.category.trim().toLowerCase();
          });

          let spent = matchingExpenses
            .filter(tx => {
              if (!tx.date || !month) return true;
              const txMonth = tx.date.substring(0, 7);
              return txMonth === month || (budget.month && txMonth === budget.month);
            })
            .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

          if (spent === 0 && matchingExpenses.length > 0) {
            spent = matchingExpenses.reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
          }

          const limit = budget.limit;
          const remaining = limit - spent;
          const percentage = limit > 0 ? (spent / limit) * 100 : 0;
          const isExceeded = spent > limit;

          let status: 'Green' | 'Orange' | 'Red' = 'Green';
          if (percentage > 90) {
            status = 'Red';
          } else if (percentage >= 70) {
            status = 'Orange';
          }

          return {
            budget,
            limit,
            spent,
            remaining,
            percentage,
            status,
            isExceeded
          };
        });
      })
    );
  }
}
