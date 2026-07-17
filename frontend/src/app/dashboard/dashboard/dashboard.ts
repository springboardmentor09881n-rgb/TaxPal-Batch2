import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { DashboardService, DashboardSummary, ChartItem } from '../../core/services/dashboard';
import { Transaction, TransactionService } from '../../core/services/transaction';
import { AuthService } from '../../core/services/auth';
import { BudgetService, BudgetProgress } from '../../core/services/budget.service';

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
  protected readonly Math = Math;

  // Budget summaries
  totalBudget = 0;
  spentBudget = 0;
  remainingBudget = 0;
  overallBudgetProgressPercent = 0;
  budgetProgressList: BudgetProgress[] = [];

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private budgetService: BudgetService,
    private transactionService: TransactionService,
    private sanitizer: DomSanitizer
  ) {}

  get monthlyChartData(): ChartItem[] {
    return (this.summary && this.summary.chartData) ? this.summary.chartData : [];
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

    // Load budget tracking details reactively
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const currentMonth = `${year}-${month}`;

    const loadBudgets = () => {
      this.budgetService.getBudgetProgressList(currentMonth).subscribe(progressList => {
        this.budgetProgressList = progressList;
        this.totalBudget = progressList.reduce((sum, item) => sum + item.limit, 0);
        this.spentBudget = progressList.reduce((sum, item) => sum + item.spent, 0);
        this.remainingBudget = this.totalBudget - this.spentBudget;
        this.overallBudgetProgressPercent = this.totalBudget > 0 ? (this.spentBudget / this.totalBudget) * 100 : 0;
      });
    };

    this.budgetService.budgets$.subscribe(() => loadBudgets());
    this.transactionService.transactions$.subscribe(() => loadBudgets());
  }

  // Budget Charts Helper Getters
  get activeBudgets(): BudgetProgress[] {
    return this.budgetProgressList.filter(item => item.spent > 0);
  }

  get budgetPieChartBackground(): SafeStyle {
    if (this.budgetProgressList.length === 0 || this.spentBudget === 0) {
      return this.sanitizer.bypassSecurityTrustStyle('#e5e7eb');
    }
    
    let gradientParts: string[] = [];
    let accumulatedPercentage = 0;
    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6b7280'];
    
    const sorted = [...this.budgetProgressList]
      .filter(item => item.spent > 0)
      .sort((a, b) => b.spent - a.spent);
      
    if (sorted.length === 0) {
      return this.sanitizer.bypassSecurityTrustStyle('#e5e7eb');
    }
    
    sorted.forEach((item, idx) => {
      const percentage = (item.spent / this.spentBudget) * 100;
      if (percentage > 0) {
        const nextPercentage = accumulatedPercentage + percentage;
        const color = colors[idx % colors.length];
        gradientParts.push(`${color} ${accumulatedPercentage.toFixed(1)}% ${nextPercentage.toFixed(1)}%`);
        accumulatedPercentage = nextPercentage;
      }
    });
    
    if (accumulatedPercentage > 0 && accumulatedPercentage < 100 && sorted.length > 0) {
      gradientParts[gradientParts.length - 1] = gradientParts[gradientParts.length - 1].replace(/[\d\.]+%$/, '100%');
    }
    
    const styleStr = `conic-gradient(${gradientParts.join(', ')})`;
    return this.sanitizer.bypassSecurityTrustStyle(styleStr);
  }

  getBudgetCategoryColor(idx: number): string {
    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6b7280'];
    return colors[idx % colors.length];
  }
}
