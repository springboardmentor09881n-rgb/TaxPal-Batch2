import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { TransactionService } from './transaction';
import { AuthService } from './auth';
import { environment } from '../../../environments/environment';

export interface Budget {
  id: string;
  userId?: string;
  category: string;
  limit: number;
  month: string; // Format: "YYYY-MM"
  description?: string;
  createdAt?: string;
  updatedAt?: string;
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
  private apiUrl = `${environment.apiUrl}/budgets`;
  private budgetsSubject = new BehaviorSubject<Budget[]>([]);
  public budgets$ = this.budgetsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private transactionService: TransactionService,
    private authService: AuthService
  ) {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadBudgets().subscribe();
      } else {
        this.budgetsSubject.next([]);
      }
    });
  }

  loadBudgets(): Observable<Budget[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => {
        if (res && res.success && Array.isArray(res.data)) {
          return res.data.map((item: any) => ({
            id: item.id || item._id,
            category: item.category,
            limit: item.limit,
            month: item.month,
            description: item.description || ''
          }));
        }
        return [];
      }),
      tap(budgets => {
        this.budgetsSubject.next(budgets);
      }),
      catchError(err => {
        console.error('Error loading budgets from API:', err);
        return of(this.budgetsSubject.value);
      })
    );
  }

  getBudgets(): Observable<Budget[]> {
    if (this.budgetsSubject.value.length === 0) {
      this.loadBudgets().subscribe();
    }
    return this.budgets$;
  }

  createBudget(budgetData: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Observable<Budget> {
    return this.http.post<any>(this.apiUrl, budgetData).pipe(
      map(res => {
        const item = res.data;
        return {
          id: item.id || item._id,
          category: item.category,
          limit: item.limit,
          month: item.month,
          description: item.description || budgetData.description || ''
        } as Budget;
      }),
      tap(() => {
        this.loadBudgets().subscribe();
      })
    );
  }

  updateBudget(id: string, budgetData: Partial<Omit<Budget, 'id' | 'userId'>>): Observable<Budget> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, budgetData).pipe(
      map(res => {
        const item = res.data;
        return {
          id: item.id || item._id,
          category: item.category,
          limit: item.limit,
          month: item.month,
          description: item.description || budgetData.description || ''
        } as Budget;
      }),
      tap(() => {
        this.loadBudgets().subscribe();
      })
    );
  }

  deleteBudget(id: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.success ?? true),
      tap(() => {
        this.loadBudgets().subscribe();
      })
    );
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
