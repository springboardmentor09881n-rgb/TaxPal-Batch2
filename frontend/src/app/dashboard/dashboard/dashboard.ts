import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardSummary } from '../../core/services/dashboard';
import { Transaction } from '../../core/services/transaction';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  summary: DashboardSummary | null = null;
  recentTransactions: Transaction[] = [];
  isLoading = true;
  currencySymbol = '₹';

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {}

  get incomePercent(): number {
    if (!this.summary) return 0;
    const max = Math.max(this.summary.monthlyIncome, this.summary.monthlyExpenses);
    return max === 0 ? 0 : (this.summary.monthlyIncome / max) * 100;
  }

  get expensePercent(): number {
    if (!this.summary) return 0;
    const max = Math.max(this.summary.monthlyIncome, this.summary.monthlyExpenses);
    return max === 0 ? 0 : (this.summary.monthlyExpenses / max) * 100;
  }

  // Used specifically for the pie chart which requires percentage of total
  get expenseTotalPercent(): number {
    if (!this.summary) return 0;
    const total = this.summary.monthlyIncome + this.summary.monthlyExpenses;
    return total === 0 ? 0 : (this.summary.monthlyExpenses / total) * 100;
  }

  ngOnInit(): void {
    this.currencySymbol = this.authService.getCurrencySymbol();
    
    this.dashboardService.getSummary().subscribe(data => {
      this.summary = data;
      this.isLoading = false; // Stop loading spinner
    });

    this.dashboardService.getRecentTransactions().subscribe(data => {
      this.recentTransactions = data;
    });
  }
}
