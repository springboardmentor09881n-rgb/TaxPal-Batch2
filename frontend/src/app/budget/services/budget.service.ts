import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Budget, BudgetProgress, OverallBudgetProgress } from '../models/budget.model';
import { TransactionService } from '../../core/services/transaction';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private apiUrl = `${environment.apiUrl}/budgets`;
  
  // Track whether we are running in local storage fallback mode
  private isFallbackMode = false;

  private budgetsSubject = new BehaviorSubject<Budget[]>([]);
  public budgets$ = this.budgetsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private transactionService: TransactionService
  ) {
    this.loadInitialBudgets();
  }

  private loadInitialBudgets(): void {
    this.getBudgets().subscribe({
      next: (budgets) => {
        this.budgetsSubject.next(budgets);
      },
      error: () => {
        // Safe to ignore here, constructor logging
      }
    });
  }

  getBudgets(): Observable<Budget[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => {
        this.isFallbackMode = false;
        return res.success ? res.data : [];
      }),
      tap(budgets => this.budgetsSubject.next(budgets)),
      catchError(err => {
        console.warn('Backend API connection failed, falling back to Local Storage for Budgets:', err.message);
        this.isFallbackMode = true;
        const localBudgets = this.getLocalBudgets();
        this.budgetsSubject.next(localBudgets);
        return of(localBudgets);
      })
    );
  }

  createBudget(budget: Budget): Observable<any> {
    if (this.isFallbackMode) {
      return of(this.createLocalBudget(budget)).pipe(
        tap(() => this.getBudgets().subscribe())
      );
    }

    return this.http.post<any>(this.apiUrl, budget).pipe(
      tap(() => this.getBudgets().subscribe()),
      catchError(err => {
        console.warn('API error, executing local storage fallback for createBudget:', err.message);
        this.isFallbackMode = true;
        return of(this.createLocalBudget(budget)).pipe(
          tap(() => this.getBudgets().subscribe())
        );
      })
    );
  }

  updateBudget(id: string, budget: Budget): Observable<any> {
    if (this.isFallbackMode) {
      return of(this.updateLocalBudget(id, budget)).pipe(
        tap(() => this.getBudgets().subscribe())
      );
    }

    return this.http.put<any>(`${this.apiUrl}/${id}`, budget).pipe(
      tap(() => this.getBudgets().subscribe()),
      catchError(err => {
        console.warn('API error, executing local storage fallback for updateBudget:', err.message);
        this.isFallbackMode = true;
        return of(this.updateLocalBudget(id, budget)).pipe(
          tap(() => this.getBudgets().subscribe())
        );
      })
    );
  }

  deleteBudget(id: string): Observable<any> {
    if (this.isFallbackMode) {
      return of(this.deleteLocalBudget(id)).pipe(
        tap(() => this.getBudgets().subscribe())
      );
    }

    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.getBudgets().subscribe()),
      catchError(err => {
        console.warn('API error, executing local storage fallback for deleteBudget:', err.message);
        this.isFallbackMode = true;
        return of(this.deleteLocalBudget(id)).pipe(
          tap(() => this.getBudgets().subscribe())
        );
      })
    );
  }

  getBudgetProgress(month?: string): Observable<BudgetProgress[]> {
    const selectedMonth = month || this.getCurrentMonthString();
    
    if (this.isFallbackMode) {
      return of(this.calculateLocalBudgetProgress(selectedMonth));
    }

    return this.http.get<any>(`${this.apiUrl}/progress`, { params: { month: selectedMonth } }).pipe(
      map(res => res.success ? res.data : []),
      catchError(err => {
        console.warn('API error, executing local storage fallback for getBudgetProgress:', err.message);
        this.isFallbackMode = true;
        return of(this.calculateLocalBudgetProgress(selectedMonth));
      })
    );
  }

  // --- Local Storage Helpers ---

  private getLocalBudgets(): Budget[] {
    const data = localStorage.getItem('taxpal_budgets');
    return data ? JSON.parse(data) : [];
  }

  private saveLocalBudgets(budgets: Budget[]): void {
    localStorage.setItem('taxpal_budgets', JSON.stringify(budgets));
  }

  private createLocalBudget(budget: Budget): any {
    const budgets = this.getLocalBudgets();
    
    // Validation: duplicate budgets for same Category and Month
    const duplicate = budgets.find(b => 
      b.category.toLowerCase() === budget.category.toLowerCase() && 
      b.month === budget.month
    );
    
    if (duplicate) {
      throw new Error(`A budget for category "${budget.category}" already exists in ${budget.month}`);
    }

    const newBudget: Budget = {
      ...budget,
      _id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    budgets.push(newBudget);
    this.saveLocalBudgets(budgets);
    return { success: true, message: 'Budget created successfully (Local Storage)', data: newBudget };
  }

  private updateLocalBudget(id: string, budget: Budget): any {
    const budgets = this.getLocalBudgets();
    const index = budgets.findIndex(b => b._id === id);
    if (index === -1) {
      throw new Error('Budget not found');
    }

    // Validation: duplicate budgets for same Category and Month (excluding this one)
    const duplicate = budgets.find((b, idx) => 
      idx !== index &&
      b.category.toLowerCase() === budget.category.toLowerCase() && 
      b.month === budget.month
    );

    if (duplicate) {
      throw new Error(`A budget for category "${budget.category}" already exists in ${budget.month}`);
    }

    budgets[index] = {
      ...budgets[index],
      ...budget,
      updatedAt: new Date().toISOString()
    };
    this.saveLocalBudgets(budgets);
    return { success: true, message: 'Budget updated successfully (Local Storage)', data: budgets[index] };
  }

  private deleteLocalBudget(id: string): any {
    let budgets = this.getLocalBudgets();
    budgets = budgets.filter(b => b._id !== id);
    this.saveLocalBudgets(budgets);
    return { success: true, message: 'Budget deleted successfully (Local Storage)' };
  }

  private calculateLocalBudgetProgress(month: string): BudgetProgress[] {
    const budgets = this.getLocalBudgets().filter(b => b.month === month);
    const transactions = this.transactionService.getTransactions();

    return budgets.map(budget => {
      // Spent = sum of expenses in this category and month
      const spent = transactions
        .filter(tx => {
          if (tx.type !== 'expense') return false;
          if (tx.category.toLowerCase() !== budget.category.toLowerCase()) return false;
          
          try {
            const txDate = new Date(tx.date);
            const txMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
            return txMonth === budget.month;
          } catch {
            return false;
          }
        })
        .reduce((sum, tx) => sum + tx.amount, 0);

      const remaining = budget.limit - spent;
      const progressPercentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      
      let status: 'Normal' | 'Warning' | 'Exceeded' = 'Normal';
      if (progressPercentage > 100) {
        status = 'Exceeded';
      } else if (progressPercentage >= 70) {
        status = 'Warning';
      }

      return {
        budgetId: budget._id,
        category: budget.category,
        limit: budget.limit,
        spent,
        remaining,
        progressPercentage,
        month: budget.month,
        status
      };
    });
  }

  public getCurrentMonthString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
