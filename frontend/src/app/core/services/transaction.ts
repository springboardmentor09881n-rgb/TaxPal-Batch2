import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth';

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
  private apiUrl = `${environment.apiUrl}/transactions`;
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  public transactions$ = this.transactionsSubject.asObservable();
  public isLoaded = false;

  constructor(private http: HttpClient, private authService: AuthService) {
    // Clear list when user logs out
    this.authService.currentUser$.subscribe(user => {
      if (!user) {
        this.transactionsSubject.next([]);
        this.isLoaded = false;
      }
    });
  }

  loadTransactions(): Observable<Transaction[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => res.success ? res.data : []),
      tap(txs => {
        this.isLoaded = true;
        this.transactionsSubject.next(txs);
      })
    );
  }

  getTransactions(): Transaction[] {
    return this.transactionsSubject.value;
  }

  getTransactionById(id: string): Observable<Transaction> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.success ? res.data : null)
    );
  }

  saveTransaction(transaction: Transaction): Observable<any> {
    return this.http.post<any>(this.apiUrl, transaction).pipe(
      tap(() => this.loadTransactions().subscribe())
    );
  }

  updateTransaction(id: string, transaction: Transaction): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, transaction).pipe(
      tap(() => this.loadTransactions().subscribe())
    );
  }

  deleteTransaction(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadTransactions().subscribe())
    );
  }
}
