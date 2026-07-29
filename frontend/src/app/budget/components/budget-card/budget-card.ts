import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetProgress } from '../../models/budget.model';

@Component({
  selector: 'app-budget-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './budget-card.html',
  styleUrl: './budget-card.css'
})
export class BudgetCard {
  @Input() progress!: BudgetProgress;
  @Input() currencySymbol = '₹';
  
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  get progressPercent(): number {
    return Math.min(this.progress.progressPercentage, 100);
  }

  get progressColorClass(): string {
    const pct = this.progress.progressPercentage;
    if (pct > 100) return 'color-danger';
    if (pct >= 70) return 'color-warning';
    return 'color-success';
  }

  get isExceeded(): boolean {
    return this.progress.progressPercentage > 100;
  }

  get statusText(): string {
    if (this.isExceeded) {
      return 'Budget Exceeded';
    }
    if (this.progress.progressPercentage >= 70) {
      return 'Warning (70-90%+)';
    }
    return 'Good Status';
  }

  onEditClick(): void {
    if (this.progress.budgetId) {
      this.edit.emit(this.progress.budgetId);
    }
  }

  onDeleteClick(): void {
    if (this.progress.budgetId) {
      this.delete.emit(this.progress.budgetId);
    }
  }
}
