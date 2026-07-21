import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CustomCategories {
  income: string[];
  expense: string[];
}

export interface CategoryColors {
  [name: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private defaultExpenseCategories = [
    'Food', 'Transport', 'Rent', 'Utilities', 'Shopping', 
    'Healthcare', 'Education', 'Entertainment', 'Travel', 'Other'
  ];

  private defaultIncomeCategories = [
    'Salary', 'Freelancing', 'Business', 'Investments', 'Bonus', 'Refund', 'Other'
  ];

  private customCategoriesSubject = new BehaviorSubject<CustomCategories>({ income: [], expense: [] });
  public customCategories$ = this.customCategoriesSubject.asObservable();

  /** Default palette – one color per default category in order */
  private readonly palette = [
    '#3b82f6','#10b981','#f97316','#8b5cf6','#ef4444',
    '#06b6d4','#14b8a6','#ec4899','#6b7280','#84cc16',
    '#a855f7','#22d3ee','#f43f5e','#fb923c','#eab308'
  ];

  /** Reusable category color mapping matching requirement specification */
  private defaultCategoryColors: { [key: string]: string } = {
    'Rent': '#3b82f6',          // Blue
    'Shopping': '#10b981',      // Green
    'Healthcare': '#eab308',    // Yellow
    'Utilities': '#f97316',     // Orange
    'Food': '#8b5cf6',           // Purple
    'Transport': '#ef4444',      // Red
    'Education': '#06b6d4',      // Cyan
    'Entertainment': '#14b8a6',  // Teal
    'Travel': '#ec4899',         // Pink
    'Other': '#6b7280',          // Gray
    'Salary': '#22c55e',
    'Freelancing': '#6366f1',
    'Business': '#2563eb',
    'Investments': '#a855f7',
    'Bonus': '#f59e0b',
    'Refund': '#0891b2'
  };

  private colorsSubject = new BehaviorSubject<CategoryColors>({});
  public categoryColors$ = this.colorsSubject.asObservable();

  constructor() {
    this.loadCustomCategories();
    this.loadColors();
  }

  private loadCustomCategories(): void {
    const stored = localStorage.getItem('taxpal_custom_categories');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.customCategoriesSubject.next({
          income: parsed.income || [],
          expense: parsed.expense || []
        });
      } catch (e) {
        console.error('Error loading custom categories', e);
        this.saveCustomCategories({ income: [], expense: [] });
      }
    } else {
      this.saveCustomCategories({ income: [], expense: [] });
    }
  }

  private saveCustomCategories(categories: CustomCategories): void {
    localStorage.setItem('taxpal_custom_categories', JSON.stringify(categories));
    this.customCategoriesSubject.next(categories);
  }

  // ── Color helpers ──────────────────────────────────────────────────────────

  private loadColors(): void {
    const stored = localStorage.getItem('taxpal_category_colors');
    if (stored) {
      try { this.colorsSubject.next(JSON.parse(stored)); return; } catch {}
    }
    // Seed defaults on first load
    const colors: CategoryColors = { ...this.defaultCategoryColors };
    [...this.defaultExpenseCategories, ...this.defaultIncomeCategories]
      .forEach((cat, i) => { 
        if (!colors[cat]) {
          colors[cat] = this.palette[i % this.palette.length];
        }
      });
    this.persistColors(colors);
  }

  private persistColors(colors: CategoryColors): void {
    localStorage.setItem('taxpal_category_colors', JSON.stringify(colors));
    this.colorsSubject.next(colors);
  }

  getCategoryColor(name: string): string {
    const stored = this.colorsSubject.value[name];
    if (stored) return stored;

    if (this.defaultCategoryColors[name]) {
      return this.defaultCategoryColors[name];
    }
    
    // Fallback: deterministic from index
    const all = [...this.defaultExpenseCategories, ...this.defaultIncomeCategories,
                  ...this.customCategoriesSubject.value.income,
                  ...this.customCategoriesSubject.value.expense];
    const idx = all.indexOf(name);
    return this.palette[(idx >= 0 ? idx : name.length) % this.palette.length];
  }

  setCategoryColor(name: string, color: string): void {
    this.persistColors({ ...this.colorsSubject.value, [name]: color });
  }

  getExpenseCategories(): string[] {
    const custom = this.customCategoriesSubject.value.expense;
    return Array.from(new Set([...this.defaultExpenseCategories, ...custom]));
  }

  getIncomeCategories(): string[] {
    const custom = this.customCategoriesSubject.value.income;
    return Array.from(new Set([...this.defaultIncomeCategories, ...custom]));
  }

  getSystemExpenseCategories(): string[] {
    return [...this.defaultExpenseCategories];
  }

  getSystemIncomeCategories(): string[] {
    return [...this.defaultIncomeCategories];
  }

  addCustomCategory(type: 'income' | 'expense', name: string): boolean {
    const trimmed = name.trim();
    if (!trimmed) return false;
    
    const formattedName = trimmed.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const current = this.customCategoriesSubject.value;
    const list = type === 'income' ? current.income : current.expense;
    const defaults = type === 'income' ? this.defaultIncomeCategories : this.defaultExpenseCategories;

    if (defaults.some(c => c.toLowerCase() === formattedName.toLowerCase()) || 
        list.some(c => c.toLowerCase() === formattedName.toLowerCase())) {
      return false;
    }

    const updatedList = [...list, formattedName];
    const updated = {
      ...current,
      [type]: updatedList
    };
    
    this.saveCustomCategories(updated);

    // Automatically assign next available color
    const currentColors = this.colorsSubject.value;
    if (!currentColors[formattedName]) {
      const assignedColor = this.getCategoryColor(formattedName);
      this.setCategoryColor(formattedName, assignedColor);
    }

    return true;
  }

  deleteCustomCategory(type: 'income' | 'expense', name: string): boolean {
    const current = this.customCategoriesSubject.value;
    const list = type === 'income' ? current.income : current.expense;

    if (!list.includes(name)) {
      return false;
    }

    const updatedList = list.filter(c => c !== name);
    const updated = {
      ...current,
      [type]: updatedList
    };

    this.saveCustomCategories(updated);
    return true;
  }

  editCustomCategory(type: 'income' | 'expense', oldName: string, newName: string): boolean {
    const trimmedNew = newName.trim();
    if (!trimmedNew) return false;
    const formattedNewName = trimmedNew.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const current = this.customCategoriesSubject.value;
    const list = type === 'income' ? current.income : current.expense;
    const defaults = type === 'income' ? this.defaultIncomeCategories : this.defaultExpenseCategories;

    if (!list.includes(oldName)) {
      return false;
    }

    if (defaults.some(c => c.toLowerCase() === formattedNewName.toLowerCase()) ||
        list.some(c => c.toLowerCase() === formattedNewName.toLowerCase() && c !== oldName)) {
      return false;
    }

    const updatedList = list.map(c => c === oldName ? formattedNewName : c);
    const updated = {
      ...current,
      [type]: updatedList
    };

    this.saveCustomCategories(updated);
    return true;
  }

  suggestCategory(description: string, type: 'income' | 'expense'): string | null {
    if (!description) return null;
    const lowerDesc = description.toLowerCase();

    if (type === 'expense') {
      const expenseKeywords: { [key: string]: string[] } = {
        'Food': ['food', 'restaurant', 'grocery', 'groceries', 'mcdonald', 'starbucks', 'lunch', 'dinner', 'breakfast', 'pizza', 'burger', 'cafe', 'eat', 'supermarket', 'swiggy', 'zomato', 'snack', 'coke', 'subway', 'tea', 'coffee'],
        'Transport': ['bus', 'metro', 'uber', 'taxi', 'train', 'flight', 'fuel', 'gas', 'petrol', 'car rent', 'commute', 'ticket', 'cab', 'ola', 'auto', 'railway', 'toll'],
        'Rent': ['rent', 'mortgage', 'lease', 'housing', 'apartment', 'landlord', 'flat rent', 'house rent'],
        'Utilities': ['electricity', 'water', 'power', 'internet', 'wifi', 'broadband', 'phone', 'mobile', 'gas bill', 'sewer', 'utility', 'utilities', 'recharge', 'dth', 'electricity bill'],
        'Shopping': ['amazon', 'ebay', 'clothing', 'clothes', 'shoes', 'mall', 'walmart', 'target', 'store', 'buy', 'gift', 'flipkart', 'myntra', 'shirt', 'pants', 'tshirt'],
        'Healthcare': ['doctor', 'medicine', 'hospital', 'clinic', 'pharmacy', 'dentist', 'health', 'medical', 'insurance', 'checkup', 'drugs', 'pharmeasy'],
        'Education': ['course', 'book', 'school', 'tuition', 'college', 'university', 'udemy', 'coursera', 'class', 'training', 'fees', 'exam', 'admission'],
        'Entertainment': ['netflix', 'spotify', 'movie', 'cinema', 'theater', 'game', 'gaming', 'concert', 'show', 'subscription', 'prime video', 'disney', 'hotstar', 'ticketshow', 'pub', 'club', 'bar'],
        'Travel': ['hotel', 'airbnb', 'flight ticket', 'vacation', 'trip', 'booking', 'travel', 'tour', 'stay', 'airline', 'makemytrip', 'expedia', 'goibibo']
      };

      for (const [category, keywords] of Object.entries(expenseKeywords)) {
        if (keywords.some(kw => lowerDesc.includes(kw))) {
          return category;
        }
      }
    } else {
      const incomeKeywords: { [key: string]: string[] } = {
        'Salary': ['salary', 'paycheck', 'wage', 'payroll', 'direct deposit', 'job', 'stipend', 'monthly pay'],
        'Freelancing': ['freelance', 'upwork', 'fiverr', 'contract', 'gig', 'consulting', 'project', 'client', 'toptal'],
        'Business': ['business', 'sale', 'client', 'customer', 'revenue', 'shop sale', 'invoice', 'shop profit'],
        'Investments': ['investment', 'stock', 'dividend', 'crypto', 'share', 'profit', 'mutual fund', 'bitcoin', 'fixed deposit', 'interest'],
        'Bonus': ['bonus', 'reward', 'award', 'incentive', 'appreciation'],
        'Refund': ['refund', 'cashback', 'return', 'reimbursement']
      };

      for (const [category, keywords] of Object.entries(incomeKeywords)) {
        if (keywords.some(kw => lowerDesc.includes(kw))) {
          return category;
        }
      }
    }

    const custom = type === 'income' ? this.customCategoriesSubject.value.income : this.customCategoriesSubject.value.expense;
    for (const cat of custom) {
      if (lowerDesc.includes(cat.toLowerCase())) {
        return cat;
      }
    }

    return null;
  }
}
