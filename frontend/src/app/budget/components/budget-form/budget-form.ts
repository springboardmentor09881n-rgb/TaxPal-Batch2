import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Budget } from '../../models/budget.model';

@Component({
  selector: 'app-budget-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './budget-form.html',
  styleUrl: './budget-form.css'
})
export class BudgetForm implements OnInit, OnChanges {
  @Input() budgetToEdit: Budget | null = null;
  @Output() formSubmit = new EventEmitter<Budget>();
  @Output() formCancel = new EventEmitter<void>();

  budgetForm!: FormGroup;
  isEditMode = false;
  showCustomCategoryInput = false;

  expenseCategories = [
    'Food', 'Transport', 'Rent', 'Utilities', 'Shopping', 
    'Healthcare', 'Education', 'Entertainment', 'Travel', 'Other'
  ];

  incomeCategories = [
    'Salary', 'Freelancing', 'Business', 'Investments', 'Bonus', 'Refund', 'Other'
  ];

  categoryType: 'expense' | 'income' = 'expense';

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  ngOnInit(): void {
    this.listenToDescriptionChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['budgetToEdit'] && this.budgetForm) {
      if (this.budgetToEdit) {
        this.isEditMode = true;
        this.prefillForm(this.budgetToEdit);
      } else {
        this.isEditMode = false;
        this.resetForm();
      }
    }
  }

  private initForm(): void {
    // Current month pre-fill (YYYY-MM)
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    this.budgetForm = this.fb.group({
      category: ['', Validators.required],
      limit: [null, [Validators.required, Validators.min(0.01)]],
      month: [currentMonth, Validators.required],
      description: [''],
      customCategory: ['']
    });
  }

  private prefillForm(budget: Budget): void {
    // Determine category type (income or expense) based on category name
    if (this.incomeCategories.includes(budget.category)) {
      this.categoryType = 'income';
    } else {
      this.categoryType = 'expense';
    }

    const isCustom = !this.expenseCategories.includes(budget.category) && 
                     !this.incomeCategories.includes(budget.category);
    
    this.showCustomCategoryInput = isCustom;

    this.budgetForm.patchValue({
      category: isCustom ? 'Custom' : budget.category,
      limit: budget.limit,
      month: budget.month,
      description: budget.description || '',
      customCategory: isCustom ? budget.category : ''
    });

    if (isCustom) {
      this.budgetForm.get('customCategory')?.setValidators([Validators.required]);
      this.budgetForm.get('customCategory')?.updateValueAndValidity();
    }
  }

  resetForm(): void {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    this.showCustomCategoryInput = false;
    this.categoryType = 'expense';
    
    this.budgetForm.reset({
      category: '',
      limit: null,
      month: currentMonth,
      description: '',
      customCategory: ''
    });

    this.budgetForm.get('customCategory')?.clearValidators();
    this.budgetForm.get('customCategory')?.updateValueAndValidity();
  }

  get categories(): string[] {
    return this.categoryType === 'expense' ? this.expenseCategories : this.incomeCategories;
  }

  onTypeChange(type: 'expense' | 'income'): void {
    this.categoryType = type;
    this.budgetForm.get('category')?.setValue('');
    this.showCustomCategoryInput = false;
    this.budgetForm.get('customCategory')?.clearValidators();
    this.budgetForm.get('customCategory')?.updateValueAndValidity();
  }

  onCategoryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'Custom') {
      this.showCustomCategoryInput = true;
      this.budgetForm.get('customCategory')?.setValidators([Validators.required]);
    } else {
      this.showCustomCategoryInput = false;
      this.budgetForm.get('customCategory')?.clearValidators();
      this.budgetForm.get('customCategory')?.setValue('');
    }
    this.budgetForm.get('customCategory')?.updateValueAndValidity();
  }

  private listenToDescriptionChanges(): void {
    this.budgetForm.get('description')?.valueChanges.subscribe(desc => {
      if (!desc || this.isEditMode || this.budgetForm.get('category')?.value !== '') {
        return; // Only auto-categorize if the category is not already set by the user
      }
      
      const category = this.suggestCategoryFromText(desc);
      if (category) {
        if (this.incomeCategories.includes(category)) {
          this.categoryType = 'income';
        } else {
          this.categoryType = 'expense';
        }
        this.budgetForm.get('category')?.setValue(category);
      }
    });
  }

  private suggestCategoryFromText(text: string): string | null {
    const normalized = text.toLowerCase();
    
    // Keyword rules
    const rules = [
      { category: 'Food', keywords: ['food', 'eat', 'restaurant', 'grocery', 'groceries', 'lunch', 'dinner', 'breakfast', 'pizza', 'cafe', 'starbucks', 'cafe'] },
      { category: 'Transport', keywords: ['transport', 'uber', 'lyft', 'taxi', 'cab', 'bus', 'train', 'gas', 'fuel', 'metro', 'commute'] },
      { category: 'Rent', keywords: ['rent', 'lease', 'mortgage', 'flat', 'apartment', 'landlord'] },
      { category: 'Utilities', keywords: ['utility', 'utilities', 'electricity', 'water', 'gas bill', 'power', 'internet', 'wifi', 'broadband', 'phone', 'mobile'] },
      { category: 'Shopping', keywords: ['shop', 'shopping', 'amazon', 'clothes', 'store', 'mall', 'gift', 'target', 'walmart', 'ebay'] },
      { category: 'Healthcare', keywords: ['health', 'healthcare', 'hospital', 'doctor', 'dentist', 'medicine', 'meds', 'clinic', 'pharmacy', 'insurance'] },
      { category: 'Education', keywords: ['education', 'school', 'tuition', 'college', 'course', 'book', 'books', 'class', 'training', 'udemy'] },
      { category: 'Entertainment', keywords: ['entertainment', 'movie', 'movies', 'netflix', 'spotify', 'game', 'gaming', 'concert', 'ticket', 'cinema'] },
      { category: 'Travel', keywords: ['travel', 'vacation', 'trip', 'hotel', 'airbnb', 'tour', 'flight', 'luggage'] },
      { category: 'Salary', keywords: ['salary', 'pay', 'payroll', 'wage', 'wages', 'employer', 'salary deposit'] },
      { category: 'Freelancing', keywords: ['freelance', 'freelancing', 'client', 'project', 'contract', 'upwork', 'fiverr', 'gig'] },
      { category: 'Business', keywords: ['business', 'sales', 'revenue', 'shop sale', 'merchant'] },
      { category: 'Investments', keywords: ['invest', 'investment', 'investments', 'stock', 'stocks', 'crypto', 'dividend', 'mutual fund'] },
      { category: 'Bonus', keywords: ['bonus', 'reward', 'prize', 'incentive'] },
      { category: 'Refund', keywords: ['refund', 'cashback', 'return', 'reimbursement'] }
    ];

    for (const rule of rules) {
      if (rule.keywords.some(keyword => normalized.includes(keyword))) {
        return rule.category;
      }
    }
    return null;
  }

  onSubmit(): void {
    if (this.budgetForm.invalid) {
      this.budgetForm.markAllAsTouched();
      return;
    }

    const formValues = this.budgetForm.value;
    let selectedCategory = formValues.category;
    
    if (selectedCategory === 'Custom') {
      selectedCategory = formValues.customCategory.trim();
    }

    const budgetData: Budget = {
      category: selectedCategory,
      limit: formValues.limit,
      month: formValues.month,
      description: formValues.description
    };

    if (this.budgetToEdit && this.budgetToEdit._id) {
      budgetData._id = this.budgetToEdit._id;
    }

    this.formSubmit.emit(budgetData);
    this.resetForm();
  }

  onCancelClick(): void {
    this.resetForm();
    this.formCancel.emit();
  }
}
