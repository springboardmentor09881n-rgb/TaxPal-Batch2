import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth';
import { TaxEstimateService, TaxEstimateResult } from '../core/services/tax-estimate';

interface StateOption {
  value: string;
  label: string;
  taxRate: number; // Flat mock state tax rate
}

interface CountryConfig {
  states: StateOption[];
  hasStates: boolean;
  currencySymbol: string;
}

interface Slab {
  upTo: number;
  rate: number;
}

export interface CalendarAlert {
  id: string;
  estimateId: string;
  type: 'reminder' | 'payment';
  title: string;
  date: Date;
  dateStr: string;
  monthYearStr: string;
  description: string;
  isRead?: boolean;
  isPaymentDone?: boolean;
  estimatedTax?: number;
  currencySymbol?: string;
  daysRemaining?: number;
  status?: string;
  dueDateForCalculation: string | Date;
}

export interface AlertGroup {
  monthYear: string;
  alerts: CalendarAlert[];
}

@Component({
  selector: 'app-tax-estimator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tax-estimator.html',
  styleUrl: './tax-estimator.css'
})
export class TaxEstimator implements OnInit {
  taxForm!: FormGroup;
  currencySymbol = '$';
  availableStates: StateOption[] = [];
  hasStates = true;
  history: TaxEstimateResult[] = [];
  alertGroups: AlertGroup[] = [];

  // Calculation Results
  isCalculated = false;
  summaryGrossIncome = 0;
  summaryTotalDeductions = 0;
  summaryTaxableIncome = 0;
  summaryEstimatedTax = 0;
  summaryEffectiveRate = 0;
  summaryFederalTax = 0;
  summaryStateTax = 0;
  calculatedQuarter = '';
  dueDate = '';

  
  private countryConfigs: { [key: string]: CountryConfig } = {
    'US': {
      currencySymbol: '$',
      hasStates: true,
      states: [
        { value: 'AL', label: 'Alabama', taxRate: 0.00 },
        { value: 'AK', label: 'Alaska', taxRate: 0.00 },
        { value: 'AZ', label: 'Arizona', taxRate: 0.00 },
        { value: 'AR', label: 'Arkansas', taxRate: 0.00 },
        { value: 'CA', label: 'California', taxRate: 0.093 },
        { value: 'CO', label: 'Colorado', taxRate: 0.00 },
        { value: 'CT', label: 'Connecticut', taxRate: 0.00 },
        { value: 'DE', label: 'Delaware', taxRate: 0.00 },
        { value: 'DC', label: 'District of Columbia', taxRate: 0.00 },
        { value: 'FL', label: 'Florida', taxRate: 0.00 },
        { value: 'GA', label: 'Georgia', taxRate: 0.0549 },
        { value: 'HI', label: 'Hawaii', taxRate: 0.00 },
        { value: 'ID', label: 'Idaho', taxRate: 0.00 },
        { value: 'IL', label: 'Illinois', taxRate: 0.0495 },
        { value: 'IN', label: 'Indiana', taxRate: 0.00 },
        { value: 'IA', label: 'Iowa', taxRate: 0.00 },
        { value: 'KS', label: 'Kansas', taxRate: 0.00 },
        { value: 'KY', label: 'Kentucky', taxRate: 0.00 },
        { value: 'LA', label: 'Louisiana', taxRate: 0.00 },
        { value: 'ME', label: 'Maine', taxRate: 0.00 },
        { value: 'MD', label: 'Maryland', taxRate: 0.00 },
        { value: 'MA', label: 'Massachusetts', taxRate: 0.00 },
        { value: 'MI', label: 'Michigan', taxRate: 0.00 },
        { value: 'MN', label: 'Minnesota', taxRate: 0.00 },
        { value: 'MS', label: 'Mississippi', taxRate: 0.00 },
        { value: 'MO', label: 'Missouri', taxRate: 0.00 },
        { value: 'MT', label: 'Montana', taxRate: 0.00 },
        { value: 'NE', label: 'Nebraska', taxRate: 0.00 },
        { value: 'NV', label: 'Nevada', taxRate: 0.00 },
        { value: 'NH', label: 'New Hampshire', taxRate: 0.00 },
        { value: 'NJ', label: 'New Jersey', taxRate: 0.0637 },
        { value: 'NM', label: 'New Mexico', taxRate: 0.00 },
        { value: 'NY', label: 'New York', taxRate: 0.0685 },
        { value: 'NC', label: 'North Carolina', taxRate: 0.00 },
        { value: 'ND', label: 'North Dakota', taxRate: 0.00 },
        { value: 'OH', label: 'Ohio', taxRate: 0.035 },
        { value: 'OK', label: 'Oklahoma', taxRate: 0.00 },
        { value: 'OR', label: 'Oregon', taxRate: 0.00 },
        { value: 'PA', label: 'Pennsylvania', taxRate: 0.0307 },
        { value: 'RI', label: 'Rhode Island', taxRate: 0.00 },
        { value: 'SC', label: 'South Carolina', taxRate: 0.00 },
        { value: 'SD', label: 'South Dakota', taxRate: 0.00 },
        { value: 'TN', label: 'Tennessee', taxRate: 0.00 },
        { value: 'TX', label: 'Texas', taxRate: 0.00 },
        { value: 'UT', label: 'Utah', taxRate: 0.00 },
        { value: 'VT', label: 'Vermont', taxRate: 0.00 },
        { value: 'VA', label: 'Virginia', taxRate: 0.00 },
        { value: 'WA', label: 'Washington', taxRate: 0.00 },
        { value: 'WV', label: 'West Virginia', taxRate: 0.00 },
        { value: 'WI', label: 'Wisconsin', taxRate: 0.00 },
        { value: 'WY', label: 'Wyoming', taxRate: 0.00 }
      ]
    },
    'CA': {
      currencySymbol: 'CA$',
      hasStates: true,
      states: [
        { value: 'AB', label: 'Alberta', taxRate: 0.10 },
        { value: 'BC', label: 'British Columbia', taxRate: 0.077 },
        { value: 'MB', label: 'Manitoba', taxRate: 0.1275 },
        { value: 'NB', label: 'New Brunswick', taxRate: 0.14 },
        { value: 'NL', label: 'Newfoundland and Labrador', taxRate: 0.00 },
        { value: 'NS', label: 'Nova Scotia', taxRate: 0.1379 },
        { value: 'ON', label: 'Ontario', taxRate: 0.0915 },
        { value: 'PE', label: 'Prince Edward Island', taxRate: 0.00 },
        { value: 'QC', label: 'Quebec', taxRate: 0.14 },
        { value: 'SK', label: 'Saskatchewan', taxRate: 0.105 },
        { value: 'NT', label: 'Northwest Territories', taxRate: 0.00 },
        { value: 'NU', label: 'Nunavut', taxRate: 0.00 },
        { value: 'YT', label: 'Yukon', taxRate: 0.00 }
      ]
    },
    'UK': {
      currencySymbol: '£',
      hasStates: true,
      states: [
        { value: 'ENG', label: 'England', taxRate: 0.00 },
        { value: 'SCT', label: 'Scotland', taxRate: 0.00 },
        { value: 'WLS', label: 'Wales', taxRate: 0.00 },
        { value: 'NIR', label: 'Northern Ireland', taxRate: 0.00 }
      ]
    },
    'AU': {
      currencySymbol: 'AU$',
      hasStates: true,
      states: [
        { value: 'ACT', label: 'Australian Capital Territory', taxRate: 0.00 },
        { value: 'NSW', label: 'New South Wales', taxRate: 0.00 },
        { value: 'NT', label: 'Northern Territory', taxRate: 0.00 },
        { value: 'QLD', label: 'Queensland', taxRate: 0.00 },
        { value: 'SA', label: 'South Australia', taxRate: 0.00 },
        { value: 'TAS', label: 'Tasmania', taxRate: 0.00 },
        { value: 'VIC', label: 'Victoria', taxRate: 0.00 },
        { value: 'WA', label: 'Western Australia', taxRate: 0.00 }
      ]
    },
    'IN': {
      currencySymbol: '₹',
      hasStates: true,
      states: [
        { value: 'AP', label: 'Andhra Pradesh', taxRate: 0.00 },
        { value: 'AR', label: 'Arunachal Pradesh', taxRate: 0.00 },
        { value: 'AS', label: 'Assam', taxRate: 0.00 },
        { value: 'BR', label: 'Bihar', taxRate: 0.00 },
        { value: 'CG', label: 'Chhattisgarh', taxRate: 0.00 },
        { value: 'GA', label: 'Goa', taxRate: 0.00 },
        { value: 'GJ', label: 'Gujarat', taxRate: 0.00 },
        { value: 'HR', label: 'Haryana', taxRate: 0.00 },
        { value: 'HP', label: 'Himachal Pradesh', taxRate: 0.00 },
        { value: 'JH', label: 'Jharkhand', taxRate: 0.00 },
        { value: 'KA', label: 'Karnataka', taxRate: 0.00 },
        { value: 'KL', label: 'Kerala', taxRate: 0.00 },
        { value: 'MP', label: 'Madhya Pradesh', taxRate: 0.00 },
        { value: 'MH', label: 'Maharashtra', taxRate: 0.00 },
        { value: 'MN', label: 'Manipur', taxRate: 0.00 },
        { value: 'ML', label: 'Meghalaya', taxRate: 0.00 },
        { value: 'MZ', label: 'Mizoram', taxRate: 0.00 },
        { value: 'NL', label: 'Nagaland', taxRate: 0.00 },
        { value: 'OD', label: 'Odisha', taxRate: 0.00 },
        { value: 'PB', label: 'Punjab', taxRate: 0.00 },
        { value: 'RJ', label: 'Rajasthan', taxRate: 0.00 },
        { value: 'SK', label: 'Sikkim', taxRate: 0.00 },
        { value: 'TN', label: 'Tamil Nadu', taxRate: 0.00 },
        { value: 'TS', label: 'Telangana', taxRate: 0.00 },
        { value: 'TR', label: 'Tripura', taxRate: 0.00 },
        { value: 'UP', label: 'Uttar Pradesh', taxRate: 0.00 },
        { value: 'UK', label: 'Uttarakhand', taxRate: 0.00 },
        { value: 'WB', label: 'West Bengal', taxRate: 0.00 },
        { value: 'AN', label: 'Andaman and Nicobar Islands', taxRate: 0.00 },
        { value: 'CH', label: 'Chandigarh', taxRate: 0.00 },
        { value: 'DN', label: 'Dadra and Nagar Haveli and Daman and Diu', taxRate: 0.00 },
        { value: 'DL', label: 'Delhi', taxRate: 0.00 },
        { value: 'JK', label: 'Jammu and Kashmir', taxRate: 0.00 },
        { value: 'LA', label: 'Ladakh', taxRate: 0.00 },
        { value: 'LD', label: 'Lakshadweep', taxRate: 0.00 },
        { value: 'PY', label: 'Puducherry', taxRate: 0.00 }
      ]
    }
  };

  
  private taxSlabs: { [country: string]: { [filingStatus: string]: Slab[] } } = {
    'US': {
      'Single': [
        { upTo: 12400, rate: 0.1 },
        { upTo: 50400, rate: 0.12 },
        { upTo: 105700, rate: 0.22 },
        { upTo: 201775, rate: 0.24 },
        { upTo: 256225, rate: 0.32 },
        { upTo: 640600, rate: 0.35 },
        { upTo: Infinity, rate: 0.37 }
      ],
      'Married': [
        { upTo: 24800, rate: 0.1 },
        { upTo: 100800, rate: 0.12 },
        { upTo: 211400, rate: 0.22 },
        { upTo: 403550, rate: 0.24 },
        { upTo: 512450, rate: 0.32 },
        { upTo: 768700, rate: 0.35 },
        { upTo: Infinity, rate: 0.37 }
      ],
      'Married Separately': [
        { upTo: 12400, rate: 0.1 },
        { upTo: 50400, rate: 0.12 },
        { upTo: 105700, rate: 0.22 },
        { upTo: 201775, rate: 0.24 },
        { upTo: 256225, rate: 0.32 },
        { upTo: 640600, rate: 0.35 },
        { upTo: Infinity, rate: 0.37 }
      ],
      'Head of Household': [
        { upTo: 12400, rate: 0.1 },
        { upTo: 50400, rate: 0.12 },
        { upTo: 105700, rate: 0.22 },
        { upTo: 201775, rate: 0.24 },
        { upTo: 256225, rate: 0.32 },
        { upTo: 640600, rate: 0.35 },
        { upTo: Infinity, rate: 0.37 }
      ]
    },
    'CA': {
      'Single': [
        { upTo: 58523, rate: 0.14 },
        { upTo: 117045, rate: 0.205 },
        { upTo: 181440, rate: 0.26 },
        { upTo: 258482, rate: 0.29 },
        { upTo: Infinity, rate: 0.33 }
      ],
      'Married': [
        { upTo: 58523, rate: 0.14 },
        { upTo: 117045, rate: 0.205 },
        { upTo: 181440, rate: 0.26 },
        { upTo: 258482, rate: 0.29 },
        { upTo: Infinity, rate: 0.33 }
      ],
      'Married Separately': [
        { upTo: 58523, rate: 0.14 },
        { upTo: 117045, rate: 0.205 },
        { upTo: 181440, rate: 0.26 },
        { upTo: 258482, rate: 0.29 },
        { upTo: Infinity, rate: 0.33 }
      ],
      'Head of Household': [
        { upTo: 58523, rate: 0.14 },
        { upTo: 117045, rate: 0.205 },
        { upTo: 181440, rate: 0.26 },
        { upTo: 258482, rate: 0.29 },
        { upTo: Infinity, rate: 0.33 }
      ]
    },
    'IN': {
      'Single': [
        { upTo: 400000, rate: 0.0 },
        { upTo: 800000, rate: 0.05 },
        { upTo: 1200000, rate: 0.1 },
        { upTo: 1600000, rate: 0.15 },
        { upTo: 2000000, rate: 0.2 },
        { upTo: 2400000, rate: 0.25 },
        { upTo: Infinity, rate: 0.3 }
      ],
      'Married': [
        { upTo: 400000, rate: 0.0 },
        { upTo: 800000, rate: 0.05 },
        { upTo: 1200000, rate: 0.1 },
        { upTo: 1600000, rate: 0.15 },
        { upTo: 2000000, rate: 0.2 },
        { upTo: 2400000, rate: 0.25 },
        { upTo: Infinity, rate: 0.3 }
      ],
      'Married Separately': [
        { upTo: 400000, rate: 0.0 },
        { upTo: 800000, rate: 0.05 },
        { upTo: 1200000, rate: 0.1 },
        { upTo: 1600000, rate: 0.15 },
        { upTo: 2000000, rate: 0.2 },
        { upTo: 2400000, rate: 0.25 },
        { upTo: Infinity, rate: 0.3 }
      ],
      'Head of Household': [
        { upTo: 400000, rate: 0.0 },
        { upTo: 800000, rate: 0.05 },
        { upTo: 1200000, rate: 0.1 },
        { upTo: 1600000, rate: 0.15 },
        { upTo: 2000000, rate: 0.2 },
        { upTo: 2400000, rate: 0.25 },
        { upTo: Infinity, rate: 0.3 }
      ]
    },
    'AU': {
      'Single': [
        { upTo: 18200, rate: 0.0 },
        { upTo: 45000, rate: 0.15 },
        { upTo: 135000, rate: 0.3 },
        { upTo: 190000, rate: 0.37 },
        { upTo: Infinity, rate: 0.45 }
      ],
      'Married': [
        { upTo: 18200, rate: 0.0 },
        { upTo: 45000, rate: 0.15 },
        { upTo: 135000, rate: 0.3 },
        { upTo: 190000, rate: 0.37 },
        { upTo: Infinity, rate: 0.45 }
      ],
      'Married Separately': [
        { upTo: 18200, rate: 0.0 },
        { upTo: 45000, rate: 0.15 },
        { upTo: 135000, rate: 0.3 },
        { upTo: 190000, rate: 0.37 },
        { upTo: Infinity, rate: 0.45 }
      ],
      'Head of Household': [
        { upTo: 18200, rate: 0.0 },
        { upTo: 45000, rate: 0.15 },
        { upTo: 135000, rate: 0.3 },
        { upTo: 190000, rate: 0.37 },
        { upTo: Infinity, rate: 0.45 }
      ]
    },
    'UK': {
      'Single': [
        { upTo: 12570, rate: 0.0 },
        { upTo: 50270, rate: 0.2 },
        { upTo: 125140, rate: 0.4 },
        { upTo: Infinity, rate: 0.45 }
      ],
      'Married': [
        { upTo: 12570, rate: 0.0 },
        { upTo: 50270, rate: 0.2 },
        { upTo: 125140, rate: 0.4 },
        { upTo: Infinity, rate: 0.45 }
      ],
      'Married Separately': [
        { upTo: 12570, rate: 0.0 },
        { upTo: 50270, rate: 0.2 },
        { upTo: 125140, rate: 0.4 },
        { upTo: Infinity, rate: 0.45 }
      ],
      'Head of Household': [
        { upTo: 12570, rate: 0.0 },
        { upTo: 50270, rate: 0.2 },
        { upTo: 125140, rate: 0.4 },
        { upTo: Infinity, rate: 0.45 }
      ]
    }
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private taxEstimateService: TaxEstimateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Determine user's country
    const user = this.authService.currentUser;
    const defaultCountry = user && this.countryConfigs[user.country] ? user.country : 'US';

    this.initForm(defaultCountry);
    this.loadHistory();
  }

  private initForm(defaultCountry: string): void {
    this.taxForm = this.fb.group({
      country: [defaultCountry, Validators.required],
      state: ['', Validators.required],
      filingStatus: ['Single', Validators.required],
      quarter: ['Q2', Validators.required],
      grossIncome: [null, [Validators.required, Validators.min(0)]],
      expenses: [null, [Validators.min(0)]],
      retirement: [null, [Validators.min(0)]],
      healthInsurance: [null, [Validators.min(0)]],
      homeOffice: [null, [Validators.min(0)]]
    });

    // React to country changes
    this.updateCountryFields(defaultCountry);
    this.taxForm.get('country')?.valueChanges.subscribe(country => {
      this.updateCountryFields(country);
    });
  }

  private updateCountryFields(country: string): void {
    const config = this.countryConfigs[country];
    if (config) {
      this.currencySymbol = config.currencySymbol;
      this.availableStates = config.states;
      this.hasStates = config.hasStates;

      // Select first state as default
      if (this.availableStates.length > 0) {
        this.taxForm.patchValue({ state: this.availableStates[0].value });
      } else {
        this.taxForm.patchValue({ state: '' });
      }
    }
  }

  calculateEstimatedTax(): void {
    if (this.taxForm.invalid) {
      this.taxForm.markAllAsTouched();
      return;
    }

    const val = this.taxForm.value;
    const grossIncome = val.grossIncome || 0;
    const expenses = val.expenses || 0;
    const retirement = val.retirement || 0;
    const healthInsurance = val.healthInsurance || 0;
    const homeOffice = val.homeOffice || 0;

    // Deductions & taxable income matching backend formulas
    const totalDeductions = expenses + retirement + healthInsurance + homeOffice;
    const taxableIncomeQuarter = Math.max(0, grossIncome - totalDeductions);
    const annualizedTaxableIncome = taxableIncomeQuarter * 4;

    // Calculate federal/national tax on annualized income
    const federalTaxAnnual = this.calculateFederalTax(val.country, annualizedTaxableIncome, val.filingStatus);
    const federalTaxQuarter = Math.round((federalTaxAnnual / 4) * 100) / 100;

    // Calculate state tax
    const stateConfig = this.availableStates.find(s => s.value === val.state);
    const stateTaxRate = stateConfig ? stateConfig.taxRate : 0;
    const stateTaxAnnual = annualizedTaxableIncome * stateTaxRate;
    const stateTaxQuarter = Math.round((stateTaxAnnual / 4) * 100) / 100;

    const totalEstimatedTaxQuarter = Math.round((federalTaxQuarter + stateTaxQuarter) * 100) / 100;

    // Local results assignment (for immediate UI response)
    this.summaryGrossIncome = grossIncome;
    this.summaryTotalDeductions = totalDeductions;
    this.summaryTaxableIncome = taxableIncomeQuarter;
    this.summaryFederalTax = federalTaxQuarter;
    this.summaryStateTax = stateTaxQuarter;
    this.summaryEstimatedTax = totalEstimatedTaxQuarter;
    
    // Effective tax rate 
    this.summaryEffectiveRate = grossIncome > 0 
      ? Math.round((totalEstimatedTaxQuarter / grossIncome) * 10000) / 100 
      : 0;

    this.calculatedQuarter = val.quarter;
    this.dueDate = this.getQuarterDueDate(val.quarter);
    this.isCalculated = true;

    // Save to the database via API
    const payload = {
      country: val.country,
      state: val.state,
      filingStatus: val.filingStatus,
      quarter: val.quarter,
      year: 2026,
      grossIncomeForQuarter: grossIncome,
      businessExpenses: expenses,
      retirementContribution: retirement,
      healthInsurancePremiums: healthInsurance,
      homeOfficeDeduction: homeOffice
    };

    this.taxEstimateService.saveEstimate(payload).subscribe({
      next: (res) => {
        if (res) {
          // Update the UI fields with exact figures computed by backend
          this.summaryGrossIncome = res.grossIncomeForQuarter;
          this.summaryTotalDeductions = res.totalDeductions;
          this.summaryTaxableIncome = res.taxableIncome;
          this.summaryFederalTax = res.nationalTax;
          this.summaryStateTax = res.stateTax;
          this.summaryEstimatedTax = res.estimatedTax;
          this.summaryEffectiveRate = res.effectiveTaxRate;
          this.calculatedQuarter = res.quarter;
          this.dueDate = this.formatDueDate(res.dueDate);
          this.isCalculated = true;
          this.cdr.detectChanges();
          
          this.loadHistory();
        }
      },
      error: (err) => {
        console.error('Error saving estimate to backend:', err);
      }
    });
  }

  private calculateFederalTax(country: string, income: number, filingStatus: string): number {
    let mappedStatus = filingStatus;
    if (filingStatus === 'Married (Joint)') {
      mappedStatus = 'Married';
    } else if (filingStatus === 'Married (Separate)') {
      mappedStatus = 'Married Separately';
    }

    const slabs = this.taxSlabs[country]?.[mappedStatus];
    if (!slabs) {
      return 0;
    }

    let annualTax = 0;
    let previousLimit = 0;

    for (const slab of slabs) {
      if (income > previousLimit) {
        const taxableAtThisSlab = Math.min(income, slab.upTo) - previousLimit;
        annualTax += taxableAtThisSlab * slab.rate;
        previousLimit = slab.upTo;
      } else {
        break;
      }
    }

    return annualTax;
  }

  private getQuarterDueDate(quarter: string, year: number = 2026): string {
    if (quarter.includes('Q1')) return `April 15, ${year}`;
    if (quarter.includes('Q2')) return `June 15, ${year}`;
    if (quarter.includes('Q3')) return `September 15, ${year}`;
    return `January 15, ${year + 1}`;
  }

  getCountryName(code: string): string {
    switch (code) {
      case 'US': return 'United States';
      case 'CA': return 'Canada';
      case 'UK': return 'United Kingdom';
      case 'AU': return 'Australia';
      case 'IN': return 'India';
      default: return code;
    }
  }

  loadHistory(): void {
    this.taxEstimateService.getEstimates().subscribe({
      next: (data) => {
        this.history = data;
        this.generateAlerts();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading estimates history:', err);
      }
    });
  }

  loadHistoryItem(item: TaxEstimateResult): void {
    this.updateCountryFields(item.country);

    this.taxForm.patchValue({
      country: item.country,
      state: item.state,
      filingStatus: item.filingStatus,
      quarter: item.quarter,
      grossIncome: item.grossIncomeForQuarter,
      expenses: item.businessExpenses,
      retirement: item.retirementContribution,
      healthInsurance: item.healthInsurancePremiums,
      homeOffice: item.homeOfficeDeduction
    });

    this.summaryGrossIncome = item.grossIncomeForQuarter;
    this.summaryTotalDeductions = item.totalDeductions;
    this.summaryTaxableIncome = item.taxableIncome;
    this.summaryFederalTax = item.nationalTax;
    this.summaryStateTax = item.stateTax;
    this.summaryEstimatedTax = item.estimatedTax;
    this.summaryEffectiveRate = item.effectiveTaxRate;
    this.calculatedQuarter = item.quarter;
    this.dueDate = this.formatDueDate(item.dueDate);
    this.isCalculated = true;
    this.cdr.detectChanges();
  }

  deleteHistoryItem(id: string | undefined, event: Event): void {
    event.stopPropagation();
    if (!id) return;
    if (confirm('Are you sure you want to delete this tax estimate calculation?')) {
      this.taxEstimateService.deleteEstimate(id).subscribe({
        next: (success) => {
          if (success) {
            this.loadHistory();
            this.isCalculated = false;
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('Error deleting tax estimate:', err);
          alert('Failed to delete tax estimate.');
        }
      });
    }
  }

  formatDueDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
  }

  getItemCurrencySymbol(countryCode: string): string {
    return this.countryConfigs[countryCode]?.currencySymbol || '$';
  }

  // Calendar view helper methods
  getQuarterFullName(quarter: string): string {
    if (quarter.includes('Q1')) return 'First';
    if (quarter.includes('Q2')) return 'Second';
    if (quarter.includes('Q3')) return 'Third';
    if (quarter.includes('Q4')) return 'Fourth';
    return quarter;
  }

  formatShortDate(date: Date): string {
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthsShort[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  formatMonthYear(date: Date): string {
    const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthsFull[date.getMonth()]} ${date.getFullYear()}`;
  }

  private getStorageKey(): string {
    const user = this.authService.currentUser;
    const userId = user ? user.id || user.email || 'guest' : 'guest';
    return `taxpal_alerts_state_${userId}`;
  }

  getAlertsState(): { readAlertIds: string[]; paidAlertIds: string[] } {
    const key = this.getStorageKey();
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
          readAlertIds: Array.isArray(parsed.readAlertIds) ? parsed.readAlertIds : [],
          paidAlertIds: Array.isArray(parsed.paidAlertIds) ? parsed.paidAlertIds : []
        };
      } catch (e) {
        console.error('Failed to parse alerts state from localStorage:', e);
      }
    }
    return { readAlertIds: [], paidAlertIds: [] };
  }

  saveAlertsState(state: { readAlertIds: string[]; paidAlertIds: string[] }): void {
    const key = this.getStorageKey();
    localStorage.setItem(key, JSON.stringify(state));
  }

  generateAlerts(): void {
    const state = this.getAlertsState();
    const list: CalendarAlert[] = [];

    for (const item of this.history) {
      if (!item.id) continue;
      const dueDateObj = item.dueDate ? new Date(item.dueDate) : null;
      if (!dueDateObj || isNaN(dueDateObj.getTime())) continue;

      // Calculate reminder date: 14 days before due date
      const reminderDate = new Date(dueDateObj.getTime() - 14 * 24 * 60 * 60 * 1000);
      const reminderId = `${item.id}_reminder`;
      const paymentId = `${item.id}_payment`;

      const isRead = state.readAlertIds.includes(reminderId);
      const isPaymentDone = state.paidAlertIds.includes(paymentId);
      const currencySymbol = this.getItemCurrencySymbol(item.country);

      // Dynamic calculation using the new utility functions
      const daysRemaining = this.calculateDaysRemaining(dueDateObj);
      const status = this.getReminderStatus(daysRemaining);

      // 1. Reminder Alert
      list.push({
        id: reminderId,
        estimateId: item.id,
        type: 'reminder',
        title: `Reminder: ${item.quarter} Estimated Tax Payment`,
        date: reminderDate,
        dateStr: this.formatShortDate(reminderDate),
        monthYearStr: this.formatMonthYear(reminderDate),
        description: `Reminder for upcoming ${item.quarter} estimated tax payment due on ${this.formatDueDate(item.dueDate)}`,
        isRead,
        estimatedTax: item.estimatedTax,
        currencySymbol,
        daysRemaining,
        status,
        dueDateForCalculation: dueDateObj
      });

      // 2. Due Payment Alert
      list.push({
        id: paymentId,
        estimateId: item.id,
        type: 'payment',
        title: `Due: ${item.quarter} Estimated Tax Payment`,
        date: dueDateObj,
        dateStr: this.formatShortDate(dueDateObj),
        monthYearStr: this.formatMonthYear(dueDateObj),
        description: `${this.getQuarterFullName(item.quarter)} quarter estimated tax payment due: ${currencySymbol}${item.estimatedTax}`,
        isPaymentDone,
        estimatedTax: item.estimatedTax,
        currencySymbol,
        daysRemaining,
        status,
        dueDateForCalculation: dueDateObj
      });
    }

    // Sort reminders by due date
    this.sortByDueDate(list);

    // Group by monthYearStr
    const groupsMap = new Map<string, CalendarAlert[]>();
    for (const alert of list) {
      if (!groupsMap.has(alert.monthYearStr)) {
        groupsMap.set(alert.monthYearStr, []);
      }
      groupsMap.get(alert.monthYearStr)!.push(alert);
    }

    this.alertGroups = Array.from(groupsMap.entries()).map(([monthYear, alerts]) => ({
      monthYear,
      alerts
    }));
  }

  markAsRead(alertId: string, event: Event): void {
    event.stopPropagation();
    const state = this.getAlertsState();
    if (!state.readAlertIds.includes(alertId)) {
      state.readAlertIds.push(alertId);
      this.saveAlertsState(state);
      this.generateAlerts();
      this.cdr.detectChanges();
    }
  }

  markAsPaid(alertId: string, event: Event): void {
    event.stopPropagation();
    const state = this.getAlertsState();
    if (!state.paidAlertIds.includes(alertId)) {
      state.paidAlertIds.push(alertId);
      this.saveAlertsState(state);
      this.generateAlerts();
      this.cdr.detectChanges();
    }
  }

  markAsUnread(alertId: string, event: Event): void {
    event.stopPropagation();
    const state = this.getAlertsState();
    const index = state.readAlertIds.indexOf(alertId);
    if (index > -1) {
      state.readAlertIds.splice(index, 1);
      this.saveAlertsState(state);
      this.generateAlerts();
      this.cdr.detectChanges();
    }
  }

  markAsUnpaid(alertId: string, event: Event): void {
    event.stopPropagation();
    const state = this.getAlertsState();
    const index = state.paidAlertIds.indexOf(alertId);
    if (index > -1) {
      state.paidAlertIds.splice(index, 1);
      this.saveAlertsState(state);
      this.generateAlerts();
      this.cdr.detectChanges();
    }
  }

  // User-provided utility functions implemented in Angular frontend
  getCurrentQuarter(date: Date = new Date()): string {
    const month = date.getMonth() + 1;

    if (month <= 3) return "Q1";
    if (month <= 6) return "Q2";
    if (month <= 9) return "Q3";
    return "Q4";
  }

  getQuarterFromDate(date: string | Date): string {
    const month = new Date(date).getMonth() + 1;

    if (month <= 3) return "Q1";
    if (month <= 6) return "Q2";
    if (month <= 9) return "Q3";
    return "Q4";
  }

  calculateDaysRemaining(dueDate: string | Date): number {
    const today = new Date();
    return Math.ceil(
      (new Date(dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  getReminderStatus(daysRemaining: number): string {
    if (daysRemaining < 0) return "Overdue";
    if (daysRemaining <= 7) return "Due Soon";
    return "Upcoming";
  }

  sortByDueDate(reminders: CalendarAlert[]): CalendarAlert[] {
    return reminders.sort(
      (a, b) => new Date(a.dueDateForCalculation).getTime() - new Date(b.dueDateForCalculation).getTime()
    );
  }
}

