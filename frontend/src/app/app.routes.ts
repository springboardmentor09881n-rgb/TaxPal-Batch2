import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { Layout } from './layout/layout/layout';
import { Dashboard } from './dashboard/dashboard/dashboard';
import { TransactionForm } from './transactions/transaction-form/transaction-form';
import { TransactionsList } from './transactions/transactions-list/transactions-list';
import { ComingSoon } from './layout/coming-soon/coming-soon';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: '',
    component: Layout,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'income', component: TransactionForm, data: { type: 'income' } },
      { path: 'expense', component: TransactionForm, data: { type: 'expense' } },
      { path: 'transactions', component: TransactionsList },
      { path: 'budgets', component: ComingSoon },
      { path: 'tax-estimator', component: ComingSoon },
      { path: 'reports', component: ComingSoon },
      { path: 'settings', component: ComingSoon },
    ]
  },
  { path: '**', redirectTo: '/login' }
];
