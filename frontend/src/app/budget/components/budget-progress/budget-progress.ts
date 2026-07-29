import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetProgress, OverallBudgetProgress } from '../../models/budget.model';

@Component({
  selector: 'app-budget-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './budget-progress.html',
  styleUrl: './budget-progress.css'
})
export class BudgetProgressComponent implements OnChanges {
  @Input() progressList: BudgetProgress[] = [];
  @Input() currencySymbol = '₹';

  overall: OverallBudgetProgress = {
    totalLimit: 0,
    totalSpent: 0,
    totalRemaining: 0,
    overallProgressPercentage: 0
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['progressList']) {
      this.calculateOverallProgress();
    }
  }

  private calculateOverallProgress(): void {
    if (!this.progressList || this.progressList.length === 0) {
      this.overall = {
        totalLimit: 0,
        totalSpent: 0,
        totalRemaining: 0,
        overallProgressPercentage: 0
      };
      return;
    }

    const totalLimit = this.progressList.reduce((sum, item) => sum + item.limit, 0);
    const totalSpent = this.progressList.reduce((sum, item) => sum + item.spent, 0);
    const totalRemaining = totalLimit - totalSpent;
    const overallProgressPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

    this.overall = {
      totalLimit,
      totalSpent,
      totalRemaining,
      overallProgressPercentage
    };
  }

  get progressColorClass(): string {
    const pct = this.overall.overallProgressPercentage;
    if (pct > 100) return 'color-danger';
    if (pct >= 70) return 'color-warning';
    return 'color-success';
  }

  get isExceeded(): boolean {
    return this.overall.overallProgressPercentage > 100;
  }

  get progressPercent(): number {
    return Math.min(this.overall.overallProgressPercentage, 100);
  }
}
