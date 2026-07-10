import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Transaction, TransactionService } from './transaction';
import { AuthService } from './auth';
import { environment } from '../../../environments/environment';

export interface ChartItem {
  month: string;
  income: number;
  expense: number;
  incomePercent: number;
  expensePercent: number;
}

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface DashboardSummary {
  monthlyIncome: number;
  incomeTrend: number | null;
  monthlyExpenses: number;
  expenseTrend: number | null;
  estimatedTaxDue: number;
  savingsRate: number;
  savingsTrend: number | null;
  chartData: ChartItem[];
  categoryBreakdown: CategoryBreakdownItem[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;
  
  private summarySubject = new BehaviorSubject<DashboardSummary | null>(null);
  public summary$ = this.summarySubject.asObservable();

  private recentTransactionsSubject = new BehaviorSubject<Transaction[]>([]);
  public recentTransactions$ = this.recentTransactionsSubject.asObservable();

  constructor(
    private http: HttpClient, 
    private authService: AuthService,
    private transactionService: TransactionService
  ) {
    // Load cached summary from localStorage if available
    const storedSummary = localStorage.getItem('cachedSummary');
    if (storedSummary) {
      try {
        this.summarySubject.next(JSON.parse(storedSummary));
      } catch (e) {
        localStorage.removeItem('cachedSummary');
      }
    }

    // Load cached recent transactions
    const storedRecent = localStorage.getItem('cachedRecentTransactions');
    if (storedRecent) {
      try {
        this.recentTransactionsSubject.next(JSON.parse(storedRecent));
      } catch (e) {
        localStorage.removeItem('cachedRecentTransactions');
      }
    }

    // Clear cache when logged out, or fetch when logged in initially (or on reload)
    this.authService.currentUser$.subscribe(user => {
      if (!user) {
        localStorage.removeItem('cachedSummary');
        localStorage.removeItem('cachedRecentTransactions');
        this.summarySubject.next(null);
        this.recentTransactionsSubject.next([]);
      } else {
        // Fetch user's transactions first, then populate dashboard details
        this.transactionService.loadTransactions().subscribe({
          next: () => {
            this.getSummary().subscribe();
            this.getRecentTransactions().subscribe();
          }
        });
      }
    });

    // Auto-update dashboard when transactions change (only after initial load has finished)
    this.transactionService.transactions$.subscribe(() => {
      if (this.authService.token && this.transactionService.isLoaded) {
        this.getSummary().subscribe();
        this.getRecentTransactions().subscribe();
      }
    });
  }

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<any>(`${this.apiUrl}/summary`).pipe(
      map(res => res.success ? res.data : null),
      tap(summary => {
        if (summary) {
          localStorage.setItem('cachedSummary', JSON.stringify(summary));
          this.summarySubject.next(summary);
        }
      })
    );
  }

  public get cachedSummary(): DashboardSummary | null {
    return this.summarySubject.value;
  }

  getRecentTransactions(): Observable<Transaction[]> {
    return this.http.get<any>(`${this.apiUrl}/recent`).pipe(
      map(res => res.success ? res.data : []),
      tap(txs => {
        localStorage.setItem('cachedRecentTransactions', JSON.stringify(txs));
        this.recentTransactionsSubject.next(txs);
      })
    );
  }
}
