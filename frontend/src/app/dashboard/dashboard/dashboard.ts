import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { DashboardService, DashboardSummary, ChartItem, CategoryBreakdownItem } from '../../core/services/dashboard';
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
  userName = 'Guest';
  loadError: string | null = null;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) {}

  get monthlyChartData(): ChartItem[] {
    return (this.summary && this.summary.chartData) ? this.summary.chartData : [];
  }

  get categoryBreakdown(): CategoryBreakdownItem[] {
    return (this.summary && this.summary.categoryBreakdown) 
      ? this.summary.categoryBreakdown.filter(item => item.amount > 0) 
      : [];
  }

  get pieChartBackground(): SafeStyle {
    if (!this.summary || !this.summary.categoryBreakdown || this.summary.categoryBreakdown.length === 0) {
      return this.sanitizer.bypassSecurityTrustStyle('#e5e7eb'); // light gray for empty
    }
    
    const breakdown = this.summary.categoryBreakdown;
    const totalAmount = breakdown.reduce((sum, item) => sum + item.amount, 0);
    
    if (totalAmount === 0) {
      return this.sanitizer.bypassSecurityTrustStyle('#e5e7eb'); // light gray for empty
    }
    
    let gradientParts: string[] = [];
    let accumulatedPercentage = 0;
    
    const sorted = [...breakdown].sort((a, b) => b.amount - a.amount);
    
    sorted.forEach((item) => {
      const percentage = (item.amount / totalAmount) * 100;
      if (percentage > 0) {
        const nextPercentage = accumulatedPercentage + percentage;
        gradientParts.push(`${item.color} ${accumulatedPercentage.toFixed(1)}% ${nextPercentage.toFixed(1)}%`);
        accumulatedPercentage = nextPercentage;
      }
    });
    
    if (accumulatedPercentage > 0 && accumulatedPercentage < 100 && sorted.length > 0) {
      gradientParts[gradientParts.length - 1] = gradientParts[gradientParts.length - 1].replace(/[\d\.]+%$/, '100%');
    }
    
    const styleStr = `conic-gradient(${gradientParts.join(', ')})`;
    return this.sanitizer.bypassSecurityTrustStyle(styleStr);
  }

  getTrendClass(trend: number | null | undefined, isExpense = false): string {
    if (trend === null || trend === undefined) {
      return 'neutral';
    }
    if (trend > 0) {
      return isExpense ? 'negative' : 'positive';
    }
    if (trend < 0) {
      return isExpense ? 'positive' : 'negative';
    }
    return 'neutral';
  }

  getTrendText(trend: number | null | undefined): string {
    if (trend === null || trend === undefined) {
      return 'No previous data';
    }
    if (trend > 0) {
      return `↑ ${trend}% from last month`;
    }
    if (trend < 0) {
      return `↓ ${Math.abs(trend)}% from last month`;
    }
    return `Flat (0%) from last month`;
  }

  ngOnInit(): void {
    this.currencySymbol = this.authService.getCurrencySymbol();
    const user = this.authService.currentUser;
    if (user) {
      this.userName = user.fullName || user.name || 'User';
    }
    
    // Check if we have pre-hydrated state to show immediately
    const cached = this.dashboardService.cachedSummary;
    if (cached) {
      this.summary = cached;
      this.isLoading = false;
    }

    // Subscribe to state changes for summary
    this.dashboardService.summary$.subscribe({
      next: (summary) => {
        if (summary) {
          this.summary = summary;
          this.isLoading = false;
          this.loadError = null;
        }
      },
      error: (err) => {
        console.error('Error in summary stream:', err);
        if (!this.summary) {
          this.loadError = err.message || JSON.stringify(err);
          this.isLoading = false;
        }
      }
    });

    // Subscribe to state changes for recent transactions
    this.dashboardService.recentTransactions$.subscribe({
      next: (txs) => {
        if (txs) {
          this.recentTransactions = txs;
        }
      }
    });

    // Force load if cache is completely empty (first run)
    if (!cached) {
      this.isLoading = true;
      this.dashboardService.getSummary().subscribe();
      this.dashboardService.getRecentTransactions().subscribe();
    }
  }
}
