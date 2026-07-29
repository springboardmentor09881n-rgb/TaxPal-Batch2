import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { BudgetService } from '../../services/budget.service';
import { AuthService } from '../../../core/services/auth';
import { Budget, BudgetProgress } from '../../models/budget.model';

// Subcomponents
import { BudgetForm } from '../../components/budget-form/budget-form';
import { BudgetCard } from '../../components/budget-card/budget-card';
import { BudgetProgressComponent } from '../../components/budget-progress/budget-progress';
import { BudgetChartComponent } from '../../components/budget-chart/budget-chart';

@Component({
  selector: 'app-budget-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BudgetForm,
    BudgetCard,
    BudgetProgressComponent,
    BudgetChartComponent
  ],
  templateUrl: './budget-page.html',
  styleUrl: './budget-page.css'
})
export class BudgetPage implements OnInit, OnDestroy {
  selectedMonth = '';
  currencySymbol = '₹';
  isLoading = false;
  
  progressList: BudgetProgress[] = [];
  rawBudgets: Budget[] = [];
  
  // Modals state
  showFormModal = false;
  showDeleteModal = false;
  
  budgetToEdit: Budget | null = null;
  budgetToDeleteId: string | null = null;
  
  // Messaging
  successMessage: string | null = null;
  errorMessage: string | null = null;
  
  private subscriptions = new Subscription();

  constructor(
    private budgetService: BudgetService,
    private authService: AuthService
  ) {
    this.selectedMonth = this.budgetService.getCurrentMonthString();
  }

  ngOnInit(): void {
    this.currencySymbol = this.authService.getCurrencySymbol();
    
    // Subscribe to budget changes
    const budgetSub = this.budgetService.budgets$.subscribe({
      next: (budgets) => {
        this.rawBudgets = budgets;
        this.loadProgress();
      }
    });
    this.subscriptions.add(budgetSub);

    this.refreshBudgets();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  refreshBudgets(): void {
    this.isLoading = true;
    this.budgetService.getBudgets().subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Failed to sync budgets from API.';
      }
    });
  }

  loadProgress(): void {
    this.budgetService.getBudgetProgress(this.selectedMonth).subscribe({
      next: (progress) => {
        this.progressList = progress;
      },
      error: (err) => {
        console.error('Error fetching progress:', err);
      }
    });
  }

  onMonthChange(): void {
    this.loadProgress();
  }

  // Dialog actions
  openCreateModal(): void {
    this.budgetToEdit = null;
    this.showFormModal = true;
    this.errorMessage = null;
    this.successMessage = null;
  }

  openEditModal(id: string): void {
    const budget = this.rawBudgets.find(b => b._id === id);
    if (budget) {
      this.budgetToEdit = { ...budget };
      this.showFormModal = true;
      this.errorMessage = null;
      this.successMessage = null;
    }
  }

  closeFormModal(): void {
    this.showFormModal = false;
    this.budgetToEdit = null;
  }

  openDeleteModal(id: string): void {
    this.budgetToDeleteId = id;
    this.showDeleteModal = true;
    this.errorMessage = null;
    this.successMessage = null;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.budgetToDeleteId = null;
  }

  // Form submission
  onBudgetSubmit(budget: Budget): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const operation$ = budget._id 
      ? this.budgetService.updateBudget(budget._id, budget)
      : this.budgetService.createBudget(budget);

    operation$.subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || 'Budget saved successfully.';
        this.closeFormModal();
        this.showToast(this.successMessage!);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'An error occurred while saving the budget.';
        this.showToast(this.errorMessage!, true);
      }
    });
  }

  // Deletion logic
  confirmDelete(): void {
    if (!this.budgetToDeleteId) return;

    this.isLoading = true;
    const deleteId = this.budgetToDeleteId;
    
    // Optimistic removal from visual cards grid instantly
    this.progressList = this.progressList.filter(p => p.budgetId !== deleteId);
    this.closeDeleteModal();

    this.budgetService.deleteBudget(deleteId).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || 'Budget deleted successfully.';
        this.showToast(this.successMessage!);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Failed to delete budget.';
        this.showToast(this.errorMessage!, true);
        
        // Re-sync on failure to restore items
        this.refreshBudgets();
      }
    });
  }

  // Custom Toast Message display
  private showToast(msg: string, isError = false): void {
    if (isError) {
      this.errorMessage = msg;
      setTimeout(() => this.errorMessage = null, 4000);
    } else {
      this.successMessage = msg;
      setTimeout(() => this.successMessage = null, 4000);
    }
  }
}
