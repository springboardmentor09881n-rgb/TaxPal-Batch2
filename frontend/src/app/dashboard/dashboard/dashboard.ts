import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { DashboardService, DashboardSummary, ChartItem } from '../../core/services/dashboard';
import { Transaction, TransactionService } from '../../core/services/transaction';
import { AuthService } from '../../core/services/auth';
import { BudgetService, BudgetProgress } from '../../core/services/budget.service';
import { CategoryService } from '../../core/services/category.service';

export interface ExpenseCategoryDistribution {
  category: string;
  spent: number;
  percentage: number;
}

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
    private categoryService: CategoryService,
    private sanitizer: DomSanitizer
  ) {}

  selectedPeriod: 'Year' | 'Quarter' | 'Month' = 'Year';

  get monthlyChartData(): ChartItem[] {
    const transactions = this.transactionService.getTransactions() || [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Always generate all 12 months (Jan - Dec)
    let monthDataList = monthNames.map(month => ({
      month,
      income: 0,
      expense: 0,
      incomePercent: 0,
      expensePercent: 0
    }));

    if (transactions.length > 0) {
      transactions.forEach(tx => {
        if (!tx.date) return;
        const d = new Date(tx.date);
        if (isNaN(d.getTime())) return;
        
        const monthIdx = d.getMonth(); // 0 - 11
        if (monthIdx >= 0 && monthIdx < 12) {
          const val = Math.abs(tx.amount || 0);
          if (tx.type === 'income') {
            monthDataList[monthIdx].income += val;
          } else if (tx.type === 'expense') {
            monthDataList[monthIdx].expense += val;
          }
        }
      });
    } else if (this.summary && this.summary.chartData && this.summary.chartData.length > 0) {
      this.summary.chartData.forEach(item => {
        const found = monthDataList.find(m => m.month.toLowerCase() === item.month.toLowerCase());
        if (found) {
          found.income = item.income || 0;
          found.expense = item.expense || 0;
        }
      });
    }

    // Apply period filtering if Quarter or Month selected
    if (this.selectedPeriod === 'Quarter') {
      const currentMonth = new Date().getMonth();
      const quarterStart = Math.floor(currentMonth / 3) * 3;
      monthDataList = monthDataList.slice(quarterStart, quarterStart + 3);
    } else if (this.selectedPeriod === 'Month') {
      const currentMonth = new Date().getMonth();
      monthDataList = [monthDataList[currentMonth]];
    }

    let maxVal = 0;
    monthDataList.forEach(v => {
      if (v.income > maxVal) maxVal = v.income;
      if (v.expense > maxVal) maxVal = v.expense;
    });

    monthDataList.forEach(v => {
      v.incomePercent = maxVal > 0 ? Math.min((v.income / maxVal) * 100, 100) : 0;
      v.expensePercent = maxVal > 0 ? Math.min((v.expense / maxVal) * 100, 100) : 0;
    });

    return monthDataList;
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

    this.transactionService.loadTransactions().subscribe();
    
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
  get maxBudgetChartValue(): number {
    if (!this.budgetProgressList || this.budgetProgressList.length === 0) return 1;
    let max = 0;
    this.budgetProgressList.forEach(p => {
      if (p.limit > max) max = p.limit;
      if (p.spent > max) max = p.spent;
    });
    return max > 0 ? max : 1;
  }

  get activeBudgets(): BudgetProgress[] {
    return this.budgetProgressList.filter(item => item.spent > 0);
  }

  get activeExpenseCategories(): ExpenseCategoryDistribution[] {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // 1. Get expense transactions for current month
    const transactions = this.transactionService.getTransactions() || [];
    const monthlyExpenses = transactions.filter(tx => 
      tx.type === 'expense' && Math.abs(tx.amount || 0) > 0 && tx.date && tx.date.substring(0, 7) === currentMonth
    );

    const categoryMap = new Map<string, number>();

    if (monthlyExpenses.length > 0) {
      monthlyExpenses.forEach(tx => {
        const cat = tx.category || 'Other';
        const current = categoryMap.get(cat) || 0;
        categoryMap.set(cat, current + Math.abs(tx.amount || 0));
      });
    } else if (this.summary && this.summary.categoryBreakdown && this.summary.categoryBreakdown.length > 0) {
      this.summary.categoryBreakdown.forEach(item => {
        const val = Math.abs(item.amount || 0);
        if (val > 0) {
          categoryMap.set(item.category, val);
        }
      });
    } else if (this.budgetProgressList && this.budgetProgressList.length > 0) {
      this.budgetProgressList.forEach(item => {
        if (item.spent > 0) {
          categoryMap.set(item.budget.category, item.spent);
        }
      });
    }

    const total = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);
    if (total === 0) {
      return [];
    }

    const result: ExpenseCategoryDistribution[] = [];
    categoryMap.forEach((spent, category) => {
      const percentage = (spent / total) * 100;
      result.push({ category, spent, percentage });
    });

    return result.sort((a, b) => b.spent - a.spent);
  }

  getCategoryColor(categoryName: string): string {
    return this.categoryService.getCategoryColor(categoryName);
  }

  get budgetPieChartBackground(): SafeStyle {
    const categories = this.activeExpenseCategories;
    if (categories.length === 0) {
      return this.sanitizer.bypassSecurityTrustStyle('#e5e7eb');
    }
    
    let gradientParts: string[] = [];
    let accumulatedPercentage = 0;
    
    categories.forEach((item) => {
      if (item.percentage > 0) {
        const nextPercentage = accumulatedPercentage + item.percentage;
        const color = this.getCategoryColor(item.category);
        gradientParts.push(`${color} ${accumulatedPercentage.toFixed(1)}% ${nextPercentage.toFixed(1)}%`);
        accumulatedPercentage = nextPercentage;
      }
    });
    
    if (accumulatedPercentage > 0 && accumulatedPercentage < 100 && categories.length > 0) {
      gradientParts[gradientParts.length - 1] = gradientParts[gradientParts.length - 1].replace(/[\d\.]+%$/, '100%');
    }
    
    const styleStr = `conic-gradient(${gradientParts.join(', ')})`;
    return this.sanitizer.bypassSecurityTrustStyle(styleStr);
  }

  getBudgetCategoryColor(idx: number): string {
    // Kept for backward compatibility if needed
    const categories = this.activeExpenseCategories;
    if (categories[idx]) {
      return this.getCategoryColor(categories[idx].category);
    }
    return '#4f46e5';
  }

  getExpenseDistributionTooltip(): string {
    const categories = this.activeExpenseCategories;
    if (categories.length === 0) {
      return 'No expense data available';
    }
    return categories
      .map(item => {
        const formattedPct = item.percentage % 1 === 0 ? item.percentage.toFixed(0) : item.percentage.toFixed(1);
        return `${item.category} – ${formattedPct}%`;
      })
      .join('\n');
  }
}
