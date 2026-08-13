import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, forkJoin } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthService } from './auth';
import { TransactionService, Transaction } from './transaction';
import { BudgetService, Budget } from './budget.service';
import { TaxEstimateService, TaxEstimateResult } from './tax-estimate';

export interface GeneratedReport {
  id: string;
  name: string;
  type: 'income_statement' | 'tax_summary' | 'budget_performance';
  period: string; // 'current_month' | 'last_month' | 'q1' | 'q2' | 'q3' | 'q4' | 'current_year'
  periodLabel: string; // e.g. "August 2026", "Q2 2026"
  format: 'PDF' | 'CSV';
  generatedDate: string; // e.g. "Aug 7, 2026, 5:00 PM"
  data: any; // The detailed report data payload
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private reportsSubject = new BehaviorSubject<GeneratedReport[]>([]);
  public reports$ = this.reportsSubject.asObservable();
  private STORAGE_KEY = 'taxpal_generated_reports';

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private budgetService: BudgetService,
    private taxEstimateService: TaxEstimateService
  ) {
    this.loadReportsFromStorage();

    // Clear reports when user logs out
    this.authService.currentUser$.subscribe(user => {
      if (!user) {
        this.reportsSubject.next([]);
        localStorage.removeItem(this.STORAGE_KEY);
      }
    });
  }

  private loadReportsFromStorage(): void {
    const cached = localStorage.getItem(this.STORAGE_KEY);
    if (cached) {
      try {
        this.reportsSubject.next(JSON.parse(cached));
      } catch (e) {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }

  private saveReportsToStorage(reports: GeneratedReport[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reports));
    this.reportsSubject.next(reports);
  }

  getReports(): GeneratedReport[] {
    return this.reportsSubject.value;
  }

  deleteReport(id: string): void {
    const current = this.getReports();
    const updated = current.filter(r => r.id !== id);
    this.saveReportsToStorage(updated);
  }

  // Resolves the date range and label for a selected period code
  getPeriodDetails(period: string, targetYear: number = 2026): { startDate: Date; endDate: Date; label: string } {
    const now = new Date();
    const year = targetYear;
    let startDate = new Date();
    let endDate = new Date();
    let label = '';

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    switch (period) {
      case 'current_month': {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        startDate = new Date(currentYear, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
        label = `${monthNames[currentMonth]} ${currentYear}`;
        break;
      }
      case 'last_month': {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        let lastMonth = currentMonth - 1;
        let lastMonthYear = currentYear;
        if (lastMonth < 0) {
          lastMonth = 11;
          lastMonthYear -= 1;
        }
        startDate = new Date(lastMonthYear, lastMonth, 1);
        endDate = new Date(lastMonthYear, lastMonth + 1, 0, 23, 59, 59);
        label = `${monthNames[lastMonth]} ${lastMonthYear}`;
        break;
      }
      case 'q1':
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 2, 31, 23, 59, 59);
        label = `Q1 ${year}`;
        break;
      case 'q2':
        startDate = new Date(year, 3, 1);
        endDate = new Date(year, 5, 30, 23, 59, 59);
        label = `Q2 ${year}`;
        break;
      case 'q3':
        startDate = new Date(year, 6, 1);
        endDate = new Date(year, 8, 30, 23, 59, 59);
        label = `Q3 ${year}`;
        break;
      case 'q4':
        startDate = new Date(year, 9, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59);
        label = `Q4 ${year}`;
        break;
      case 'current_year':
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59);
        label = `${year}`;
        break;
      default:
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59);
        label = `${year}`;
    }

    return { startDate, endDate, label };
  }

  getCurrencySymbolForCountry(country: string): string {
    if (!country) return '$';
    const c = country.trim().toUpperCase();
    if (c === 'US' || c === 'UNITED STATES') return '$';
    if (c === 'CA' || c === 'CANADA') return 'CA$';
    if (c === 'UK' || c === 'UNITED KINGDOM') return '£';
    if (c === 'AU' || c === 'AUSTRALIA') return 'AU$';
    if (c === 'IN' || c === 'INDIA') return '₹';
    return '$';
  }

  // Generates the report based on selections
  generateReport(type: 'income_statement' | 'tax_summary' | 'budget_performance', period: string, format: 'PDF' | 'CSV', targetYear: number = 2026): Observable<GeneratedReport> {
    const periodInfo = this.getPeriodDetails(period, targetYear);
    const user = this.authService.currentUser;
    const userName = user ? user.fullName : 'TaxPal User';
    const userEmail = user ? user.email : 'user@taxpal.com';
    const currency = this.authService.getCurrencySymbol();
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const baseReport: Omit<GeneratedReport, 'data'> = {
      id: Math.random().toString(36).substring(2, 9),
      name: this.getReportName(type, periodInfo.label),
      type,
      period,
      periodLabel: periodInfo.label,
      format,
      generatedDate: timestamp
    };

    // Make sure transactions are loaded
    const transactionsPromise = this.transactionService.isLoaded 
      ? of(this.transactionService.getTransactions())
      : this.transactionService.loadTransactions();

    const budgetsPromise = this.budgetService.loadBudgets();
    const taxEstimatesPromise = this.taxEstimateService.getEstimates();

    return forkJoin({
      transactions: transactionsPromise,
      budgets: budgetsPromise,
      estimates: taxEstimatesPromise
    }).pipe(
      map(({ transactions, budgets, estimates }) => {
        let calculatedData: any = {
          header: {
            logo: 'TaxPal',
            title: this.getReportTitle(type),
            userName,
            userEmail,
            periodLabel: periodInfo.label,
            generatedDate: timestamp,
            currencySymbol: currency
          }
        };

        if (type === 'income_statement') {
          calculatedData = { ...calculatedData, ...this.calculateIncomeStatement(transactions, periodInfo.startDate, periodInfo.endDate) };
        } else if (type === 'tax_summary') {
          calculatedData = { ...calculatedData, ...this.calculateTaxSummary(transactions, estimates, period, targetYear, user) };
          calculatedData.header.currencySymbol = calculatedData.currencySymbol;
        } else if (type === 'budget_performance') {
          calculatedData = { ...calculatedData, ...this.calculateBudgetPerformance(transactions, budgets, periodInfo.startDate, periodInfo.endDate) };
        }

        const newReport: GeneratedReport = {
          ...baseReport,
          data: calculatedData
        };

        const currentReports = this.getReports();
        this.saveReportsToStorage([newReport, ...currentReports]);

        return newReport;
      })
    );
  }

  private getReportName(type: string, label: string): string {
    switch (type) {
      case 'income_statement': return `Income Statement - ${label}`;
      case 'tax_summary': return `Tax Summary - ${label}`;
      case 'budget_performance': return `Budget Performance - ${label}`;
      default: return `Financial Report - ${label}`;
    }
  }

  private getReportTitle(type: string): string {
    switch (type) {
      case 'income_statement': return 'Income Statement';
      case 'tax_summary': return 'Tax Summary Report';
      case 'budget_performance': return 'Budget Performance Report';
      default: return 'Financial Report';
    }
  }

  // Calculation for Income Statement
  private calculateIncomeStatement(transactions: Transaction[], start: Date, end: Date) {
    const filteredTxs = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      txDate.setHours(0,0,0,0);
      return txDate >= start && txDate <= end;
    });

    const incomeTxs = filteredTxs.filter(tx => tx.type === 'income');
    const expenseTxs = filteredTxs.filter(tx => tx.type === 'expense');

    const totalIncome = incomeTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const totalExpenses = expenseTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const netIncome = totalIncome - totalExpenses;

    // Categorize
    const incomeBreakdownMap: { [cat: string]: number } = {};
    incomeTxs.forEach(tx => {
      const cat = tx.category || 'Uncategorized';
      incomeBreakdownMap[cat] = (incomeBreakdownMap[cat] || 0) + (tx.amount || 0);
    });

    const expenseBreakdownMap: { [cat: string]: number } = {};
    expenseTxs.forEach(tx => {
      const cat = tx.category || 'Uncategorized';
      expenseBreakdownMap[cat] = (expenseBreakdownMap[cat] || 0) + (tx.amount || 0);
    });

    const incomeBreakdown = Object.keys(incomeBreakdownMap).map(category => ({
      category,
      amount: incomeBreakdownMap[category]
    })).sort((a, b) => b.amount - a.amount);

    const expenseBreakdown = Object.keys(expenseBreakdownMap).map(category => ({
      category,
      amount: expenseBreakdownMap[category]
    })).sort((a, b) => b.amount - a.amount);

    return {
      metrics: {
        totalIncome,
        totalExpenses,
        netIncome
      },
      incomeBreakdown,
      expenseBreakdown
    };
  }

  // Calculation for Tax Summary
  private calculateTaxSummary(transactions: Transaction[], estimates: TaxEstimateResult[], period: string, year: number, user: any) {
    const qCode = period.toUpperCase(); // 'Q1', 'Q2', 'Q3', 'Q4'

    // Look for matching saved estimate
    const savedEstimate = estimates.find(e => e.quarter.toUpperCase() === qCode && e.year === year);

    if (savedEstimate) {
      const currencySymbol = this.getCurrencySymbolForCountry(savedEstimate.country);
      return {
        metrics: {
          grossIncome: savedEstimate.grossIncomeForQuarter,
          totalDeductions: savedEstimate.totalDeductions,
          taxableIncome: savedEstimate.taxableIncome,
          estimatedTax: savedEstimate.estimatedTax
        },
        deductionsBreakdown: {
          businessExpenses: savedEstimate.businessExpenses || 0,
          retirement: savedEstimate.retirementContribution || 0,
          healthInsurance: savedEstimate.healthInsurancePremiums || 0,
          homeOffice: savedEstimate.homeOfficeDeduction || 0
        },
        taxCalculations: {
          nationalTax: savedEstimate.nationalTax,
          stateTax: savedEstimate.stateTax,
          effectiveTaxRate: savedEstimate.effectiveTaxRate,
          dueDate: savedEstimate.dueDate
        },
        isSavedEstimate: true,
        currencySymbol: currencySymbol
      };
    }

    // Fallback: If no saved estimate is found, estimate dynamically from transactions
    const periodInfo = this.getPeriodDetails(period, year);
    const filteredTxs = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      txDate.setHours(0,0,0,0);
      return txDate >= periodInfo.startDate && txDate <= periodInfo.endDate;
    });

    const grossIncome = filteredTxs
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const businessExpenses = filteredTxs
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const retirement = 0;
    const healthInsurance = 0;
    const homeOffice = 0;

    const totalDeductions = businessExpenses + retirement + healthInsurance + homeOffice;
    const taxableIncome = Math.max(0, grossIncome - totalDeductions);

    const nationalTax = taxableIncome * 0.12;
    const stateTax = taxableIncome * 0.045;
    const estimatedTax = nationalTax + stateTax;
    const effectiveTaxRate = grossIncome > 0 ? (estimatedTax / grossIncome) * 100 : 0;

    let dueDate = '';
    if (period === 'q1') dueDate = `April 15, ${year}`;
    else if (period === 'q2') dueDate = `June 15, ${year}`;
    else if (period === 'q3') dueDate = `September 15, ${year}`;
    else if (period === 'q4') dueDate = `January 15, ${year + 1}`;

    const userCountry = user ? user.country : 'US';
    const currencySymbol = this.getCurrencySymbolForCountry(userCountry);

    return {
      metrics: {
        grossIncome,
        totalDeductions,
        taxableIncome,
        estimatedTax
      },
      deductionsBreakdown: {
        businessExpenses,
        retirement,
        healthInsurance,
        homeOffice
      },
      taxCalculations: {
        nationalTax,
        stateTax,
        effectiveTaxRate,
        dueDate
      },
      isSavedEstimate: false,
      currencySymbol: currencySymbol
    };
  }

  // Calculation for Budget Performance
  private calculateBudgetPerformance(transactions: Transaction[], budgets: Budget[], start: Date, end: Date) {
    const expenseTxs = transactions.filter(tx => {
      if (tx.type !== 'expense') return false;
      const txDate = new Date(tx.date);
      txDate.setHours(0,0,0,0);
      return txDate >= start && txDate <= end;
    });

    const startMonthStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    const endMonthStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;

    const filteredBudgets = budgets.filter(b => {
      if (!b.month) return true;
      return b.month >= startMonthStr && b.month <= endMonthStr;
    });

    const categoryBudgetMap: { [cat: string]: number } = {};
    filteredBudgets.forEach(b => {
      const cat = b.category.trim().toLowerCase();
      categoryBudgetMap[cat] = (categoryBudgetMap[cat] || 0) + (b.limit || 0);
    });

    const categorySpentMap: { [cat: string]: number } = {};
    expenseTxs.forEach(tx => {
      const cat = (tx.category || 'Uncategorized').trim().toLowerCase();
      categorySpentMap[cat] = (categorySpentMap[cat] || 0) + (tx.amount || 0);
    });

    const categoriesSet = new Set<string>();
    Object.keys(categoryBudgetMap).forEach(c => categoriesSet.add(c));
    Object.keys(categorySpentMap).forEach(c => categoriesSet.add(c));

    const categoryPerformance = Array.from(categoriesSet).map(catKey => {
      const budgetMatch = filteredBudgets.find(b => b.category.toLowerCase() === catKey);
      const txMatch = expenseTxs.find(tx => (tx.category || '').toLowerCase() === catKey);
      const displayName = budgetMatch ? budgetMatch.category : (txMatch ? txMatch.category : catKey);

      const limit = categoryBudgetMap[catKey] || 0;
      const spent = categorySpentMap[catKey] || 0;
      const variance = limit - spent;
      const status = spent > limit ? 'Limit Exceeded' : 'On Track';

      return {
        categoryName: displayName,
        budgetLimit: limit,
        actualSpent: spent,
        variance,
        status
      };
    });

    const totalLimit = filteredBudgets.reduce((sum, b) => sum + (b.limit || 0), 0);
    const totalActualSpent = expenseTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const remainingBalance = totalLimit - totalActualSpent;
    const overBudget = totalActualSpent > totalLimit;

    return {
      metrics: {
        totalLimit,
        totalActualSpent,
        remainingBalance,
        overBudget
      },
      categoryPerformance
    };
  }

  downloadReportCSV(report: GeneratedReport): void {
    let csvContent = '';
    const d = report.data;
    const currency = d.header.currencySymbol;

    csvContent += `Report Name,${report.name}\n`;
    csvContent += `Period,${report.periodLabel}\n`;
    csvContent += `Generated Date,${report.generatedDate}\n`;
    csvContent += `User,${d.header.userName} (${d.header.userEmail})\n\n`;

    if (report.type === 'income_statement') {
      csvContent += `INCOME STATEMENT SUMMARY\n`;
      csvContent += `Metric,Amount (${currency})\n`;
      csvContent += `Total Income,${d.metrics.totalIncome.toFixed(2)}\n`;
      csvContent += `Total Expenses,${d.metrics.totalExpenses.toFixed(2)}\n`;
      csvContent += `Net Income,${d.metrics.netIncome.toFixed(2)}\n\n`;

      csvContent += `INCOME BREAKDOWN\n`;
      csvContent += `Category,Amount (${currency})\n`;
      d.incomeBreakdown.forEach((row: any) => {
        csvContent += `"${row.category}",${row.amount.toFixed(2)}\n`;
      });
      csvContent += `\n`;

      csvContent += `EXPENSE BREAKDOWN\n`;
      csvContent += `Category,Amount (${currency})\n`;
      d.expenseBreakdown.forEach((row: any) => {
        csvContent += `"${row.category}",${row.amount.toFixed(2)}\n`;
      });
    } else if (report.type === 'tax_summary') {
      csvContent += `TAX SUMMARY REPORT METRICS\n`;
      csvContent += `Metric,Amount (${currency})\n`;
      csvContent += `Gross Income,${d.metrics.grossIncome.toFixed(2)}\n`;
      csvContent += `Total Deductions,${d.metrics.totalDeductions.toFixed(2)}\n`;
      csvContent += `Taxable Income,${d.metrics.taxableIncome.toFixed(2)}\n`;
      csvContent += `Estimated Tax,${d.metrics.estimatedTax.toFixed(2)}\n\n`;

      csvContent += `DEDUCTIONS BREAKDOWN\n`;
      csvContent += `Deduction Type,Amount (${currency})\n`;
      csvContent += `Business Expenses,${d.deductionsBreakdown.businessExpenses.toFixed(2)}\n`;
      csvContent += `Retirement Contributions,${d.deductionsBreakdown.retirement.toFixed(2)}\n`;
      csvContent += `Health Insurance Premiums,${d.deductionsBreakdown.healthInsurance.toFixed(2)}\n`;
      csvContent += `Home Office Deduction,${d.deductionsBreakdown.homeOffice.toFixed(2)}\n\n`;

      csvContent += `TAX CALCULATIONS & ESTIMATIONS\n`;
      csvContent += `Tax Type,Rate/Value\n`;
      csvContent += `National Tax,${d.taxCalculations.nationalTax.toFixed(2)}\n`;
      csvContent += `State Tax,${d.taxCalculations.stateTax.toFixed(2)}\n`;
      csvContent += `Effective Tax Rate,${d.taxCalculations.effectiveTaxRate.toFixed(2)}%\n`;
      csvContent += `Target Due Date,"${d.taxCalculations.dueDate}"\n`;
    } else if (report.type === 'budget_performance') {
      csvContent += `BUDGET PERFORMANCE SUMMARY\n`;
      csvContent += `Metric,Amount (${currency})\n`;
      csvContent += `Total Budget Limit,${d.metrics.totalLimit.toFixed(2)}\n`;
      csvContent += `Total Actual Spent,${d.metrics.totalActualSpent.toFixed(2)}\n`;
      csvContent += `Remaining Balance,${d.metrics.remainingBalance.toFixed(2)}\n`;
      csvContent += `Over Budget Indicator,${d.metrics.overBudget ? 'YES' : 'NO'}\n\n`;

      csvContent += `CATEGORY PERFORMANCE\n`;
      csvContent += `Category,Budget Limit (${currency}),Actual Spent (${currency}),Variance (${currency}),Status\n`;
      d.categoryPerformance.forEach((row: any) => {
        csvContent += `"${row.categoryName}",${row.budgetLimit.toFixed(2)},${row.actualSpent.toFixed(2)},${row.variance.toFixed(2)},"${row.status}"\n`;
      });
    }

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${report.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  formatCurrency(val: number, symbol: string): string {
    if (val === undefined || val === null || isNaN(val)) return `${symbol}0.00`;
    const formatted = Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return val < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
  }

  downloadReportPDF(report: GeneratedReport): void {
    const d = report.data;
    const currency = d.header.currencySymbol;
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${report.name}</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #111827; line-height: 1.5; }
          .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
          .logo { font-size: 24px; font-weight: bold; color: #4f46e5; }
          .title { font-size: 20px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; color: #1f2937; }
          .meta-info { font-size: 14px; color: #6b7280; text-align: right; }
          .user-details { font-size: 14px; margin-bottom: 30px; }
          .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
          .metric-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; }
          .metric-card.alert { border-color: #fca5a5; background: #fee2e2; }
          .metric-label { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; }
          .metric-value { font-size: 24px; font-weight: bold; }
          .section-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; color: #374151; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f3f4f6; text-align: left; padding: 10px; font-size: 13px; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
          td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          .status-badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; }
          .status-green { background: #dcfce7; color: #15803d; }
          .status-red { background: #fee2e2; color: #991b1b; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">${d.header.logo}</div>
            <div class="title">${d.header.title}</div>
            <div class="user-details">
              <strong>Prepared For:</strong> ${d.header.userName} (${d.header.userEmail})<br>
              <strong>Period:</strong> ${d.header.periodLabel}
            </div>
          </div>
          <div class="meta-info">
            <strong>Generated Date:</strong> ${d.header.generatedDate}<br>
            <strong>Report Format:</strong> PDF Document
          </div>
        </div>
    `;

    if (report.type === 'income_statement') {
      htmlContent += `
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Total Income</div>
            <div class="metric-value" style="color: #15803d;">${this.formatCurrency(d.metrics.totalIncome, currency)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Expenses</div>
            <div class="metric-value" style="color: #b91c1c;">${this.formatCurrency(d.metrics.totalExpenses, currency)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Net Income</div>
            <div class="metric-value" style="color: ${d.metrics.netIncome >= 0 ? '#15803d' : '#b91c1c'}">
              ${this.formatCurrency(d.metrics.netIncome, currency)}
            </div>
          </div>
        </div>

        <div class="section-title">Income Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${d.incomeBreakdown.map((row: any) => `
              <tr>
                <td>${row.category}</td>
                <td style="text-align: right; font-weight: 500;">${this.formatCurrency(row.amount, currency)}</td>
              </tr>
            `).join('') || '<tr><td colspan="2">No income transactions found</td></tr>'}
          </tbody>
        </table>

        <div class="section-title">Expense Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${d.expenseBreakdown.map((row: any) => `
              <tr>
                <td>${row.category}</td>
                <td style="text-align: right; font-weight: 500;">${this.formatCurrency(row.amount, currency)}</td>
              </tr>
            `).join('') || '<tr><td colspan="2">No expense transactions found</td></tr>'}
          </tbody>
        </table>
      `;
    } else if (report.type === 'tax_summary') {
      htmlContent += `
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Gross Income</div>
            <div class="metric-value">${this.formatCurrency(d.metrics.grossIncome, currency)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Deductions</div>
            <div class="metric-value">${this.formatCurrency(d.metrics.totalDeductions, currency)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Taxable Income</div>
            <div class="metric-value">${this.formatCurrency(d.metrics.taxableIncome, currency)}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
          <div>
            <div class="section-title">Deductions Breakdown</div>
            <table>
              <thead>
                <tr>
                  <th>Deduction Type</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Business Expenses</td>
                  <td style="text-align: right; font-weight: 500;">${this.formatCurrency(d.deductionsBreakdown.businessExpenses, currency)}</td>
                </tr>
                <tr>
                  <td>Retirement Contributions</td>
                  <td style="text-align: right; font-weight: 500;">${this.formatCurrency(d.deductionsBreakdown.retirement, currency)}</td>
                </tr>
                <tr>
                  <td>Health Insurance Premiums</td>
                  <td style="text-align: right; font-weight: 500;">${this.formatCurrency(d.deductionsBreakdown.healthInsurance, currency)}</td>
                </tr>
                <tr>
                  <td>Home Office Deduction</td>
                  <td style="text-align: right; font-weight: 500;">${this.formatCurrency(d.deductionsBreakdown.homeOffice, currency)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <div class="section-title">Tax Projections & Calculations</div>
            <table>
              <thead>
                <tr>
                  <th>Tax Liability</th>
                  <th style="text-align: right;">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>National Tax</td>
                  <td style="text-align: right; font-weight: 500;">${this.formatCurrency(d.taxCalculations.nationalTax, currency)}</td>
                </tr>
                <tr>
                  <td>State Tax</td>
                  <td style="text-align: right; font-weight: 500;">${this.formatCurrency(d.taxCalculations.stateTax, currency)}</td>
                </tr>
                <tr>
                  <td>Effective Tax Rate</td>
                  <td style="text-align: right; font-weight: 500;">${d.taxCalculations.effectiveTaxRate.toFixed(2)}%</td>
                </tr>
                <tr style="background: #f9fafb; font-weight: bold; border-top: 1px solid #e5e7eb;">
                  <td>Total Estimated Tax</td>
                  <td style="text-align: right; color: #b91c1c;">${this.formatCurrency(d.metrics.estimatedTax, currency)}</td>
                </tr>
                <tr>
                  <td>Target Payment Due Date</td>
                  <td style="text-align: right; font-style: italic;">${d.taxCalculations.dueDate}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (report.type === 'budget_performance') {
      htmlContent += `
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Total Limit</div>
            <div class="metric-value">${this.formatCurrency(d.metrics.totalLimit, currency)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Actual Spent</div>
            <div class="metric-value" style="color: ${d.metrics.overBudget ? '#b91c1c' : '#111827'};">${this.formatCurrency(d.metrics.totalActualSpent, currency)}</div>
          </div>
          <div class="metric-card ${d.metrics.overBudget ? 'alert' : ''}">
            <div class="metric-label">Remaining Balance</div>
            <div class="metric-value" style="color: ${d.metrics.remainingBalance >= 0 ? '#15803d' : '#b91c1c'};">
              ${this.formatCurrency(d.metrics.remainingBalance, currency)}
            </div>
          </div>
        </div>

        <div class="section-title">Category Performance Detail</div>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th style="text-align: right;">Budget Limit</th>
              <th style="text-align: right;">Actual Spent</th>
              <th style="text-align: right;">Variance</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${d.categoryPerformance.map((row: any) => `
              <tr>
                <td><strong>${row.categoryName}</strong></td>
                <td style="text-align: right;">${this.formatCurrency(row.budgetLimit, currency)}</td>
                <td style="text-align: right;">${this.formatCurrency(row.actualSpent, currency)}</td>
                <td style="text-align: right; font-weight: 500; color: ${row.variance >= 0 ? '#15803d' : '#b91c1c'};">
                  ${row.variance >= 0 ? '+' : ''}${this.formatCurrency(row.variance, currency)}
                </td>
                <td style="text-align: center;">
                  <span class="status-badge ${row.status === 'On Track' ? 'status-green' : 'status-red'}">
                    ${row.status}
                  </span>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="5" style="text-align: center;">No budget/spending categories found</td></tr>'}
          </tbody>
        </table>
      `;
    }

    htmlContent += `
        <div style="margin-top: 50px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          Generated automatically by TaxPal Financial Planning Platform. All rights reserved &copy; 2026.
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
