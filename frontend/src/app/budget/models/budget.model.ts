export interface Budget {
  _id?: string;
  category: string;
  limit: number;
  month: string; // e.g. "2026-07"
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetProgress {
  budgetId?: string;
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  progressPercentage: number;
  month: string;
  status: 'Normal' | 'Warning' | 'Exceeded';
}

export interface OverallBudgetProgress {
  totalLimit: number;
  totalSpent: number;
  totalRemaining: number;
  overallProgressPercentage: number;
}
