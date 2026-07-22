import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { TransactionService } from '../../core/services/transaction';
import { DashboardService } from '../../core/services/dashboard';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private transactionService: TransactionService,
    private dashboardService: DashboardService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading = false;
        
        this.transactionService.loadTransactions().subscribe({
          next: () => {
            this.dashboardService.getSummary().subscribe();
            this.dashboardService.getRecentTransactions().subscribe();
          }
        });

        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Login error received:', err);
        
        if (err && err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else if (err && err.message) {
          this.errorMessage = err.message;
        } else {
          this.errorMessage = 'Invalid username or password';
        }
        
        this.cdr.detectChanges();
        alert('Login failed: ' + this.errorMessage);
      }
    });
  }
}
