import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TaxEstimateService, TaxEstimateResult } from './tax-estimate';

export interface TaxCalendarReminder extends TaxEstimateResult {
  daysRemaining: number;
  status: string;
  isRead: boolean;
  paymentStatus: 'Pending' | 'Completed';
}

@Injectable({
  providedIn: 'root'
})
export class TaxCalendarService {
  private apiUrl = `${environment.apiUrl}/tax-calendar`;

  constructor(
    private http: HttpClient,
    private taxEstimateService: TaxEstimateService
  ) {}

  getReminders(year?: number): Observable<TaxCalendarReminder[]> {
    const url = year ? `${this.apiUrl}?year=${year}` : this.apiUrl;
    return this.http.get<any>(url).pipe(
      map(res => {
        if (res.success && Array.isArray(res.data)) {
          return res.data.map((item: any) => {
            const mapped = this.taxEstimateService.translateToFrontend(item);
            return {
              ...mapped,
              daysRemaining: item.daysRemaining,
              status: item.status,
              isRead: item.isRead ?? false,
              paymentStatus: item.paymentStatus || 'Pending'
            } as TaxCalendarReminder;
          });
        }
        return [];
      })
    );
  }

  getUpcomingReminders(): Observable<TaxCalendarReminder[]> {
    return this.http.get<any>(`${this.apiUrl}/upcoming`).pipe(
      map(res => {
        if (res.success && Array.isArray(res.data)) {
          return res.data.map((item: any) => {
            const mapped = this.taxEstimateService.translateToFrontend(item);
            return {
              ...mapped,
              daysRemaining: item.daysRemaining,
              status: item.status,
              isRead: item.isRead ?? false,
              paymentStatus: item.paymentStatus || 'Pending'
            } as TaxCalendarReminder;
          });
        }
        return [];
      })
    );
  }

  getReminderById(id: string): Observable<TaxCalendarReminder | null> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => {
        if (res.success && res.data) {
          const mapped = this.taxEstimateService.translateToFrontend(res.data);
          return {
            ...mapped,
            daysRemaining: res.data.daysRemaining,
            status: res.data.status,
            isRead: res.data.isRead ?? false,
            paymentStatus: res.data.paymentStatus || 'Pending'
          } as TaxCalendarReminder;
        }
        return null;
      })
    );
  }

  markReminderRead(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/read`, {});
  }

  undoMarkAsRead(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/unread`, {});
  }

  markPaymentDone(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/payment`, {});
  }

  undoPaymentDone(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/payment/undo`, {});
  }
}
