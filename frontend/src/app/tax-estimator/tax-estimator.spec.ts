import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { FormBuilder } from '@angular/forms';
import { TaxEstimator } from './tax-estimator';

describe('TaxEstimator Class Logic', () => {
  let component: TaxEstimator;
  let mockAuthService: any;
  const fb = new FormBuilder();

  beforeEach(() => {
    mockAuthService = {
      currentUser: { username: 'testuser', country: 'US' },
      getCurrencySymbol: () => '$'
    };

    component = new TaxEstimator(fb, mockAuthService);
    component.ngOnInit();
  });

  it('should create the component instance', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with user default country US', () => {
    expect(component.taxForm.get('country')?.value).toBe('US');
    expect(component.currencySymbol).toBe('$');
    expect(component.availableStates.length).toBeGreaterThan(0);
    expect(component.availableStates[0].value).toBe('AL'); // Alabama (AL) is first alphabetically
  });

  it('should update currency symbol and states when country is changed to IN', () => {
    component.taxForm.get('country')?.setValue('IN');
    // In Angular reactive forms, valueChanges observable emits value, but here we can call updateCountryFields directly or update through set value
    // Let's ensure value changes subscription was triggered:
    expect(component.currencySymbol).toBe('₹');
    expect(component.availableStates.find(s => s.value === 'MH')).toBeTruthy(); // Maharashtra
    expect(component.taxForm.get('state')?.value).toBe('AP'); // Andhra Pradesh (AP) is first alphabetically
  });

  it('should calculate estimated tax correctly for US (California) Single filer', () => {
    component.taxForm.patchValue({
      country: 'US',
      state: 'CA',
      filingStatus: 'Single',
      quarter: 'Q2 (Apr-Jun 2026)',
      grossIncome: 80000,
      expenses: 20000,
      retirement: 5000,
      healthInsurance: 3000,
      homeOffice: 1500
    });

    component.calculateEstimatedTax();

    expect(component.isCalculated).toBe(true);
    expect(component.summaryGrossIncome).toBe(80000);
    expect(component.summaryTotalDeductions).toBe(29500); // 20000 + 5000 + 3000 + 1500
    expect(component.summaryTaxableIncome).toBe(50500); // 80000 - 29500

    // Annualized taxable income = 50500 * 4 = 202000
    // US Federal single bracket check on 202000:
    // Up to 12400: 10% -> 1240
    // 12400 to 50400 (38000): 12% -> 4560
    // 50400 to 105700 (55300): 22% -> 12166
    // 105700 to 201775 (96075): 24% -> 23058
    // Above 201775 (225 portion): 32% -> 72
    // Total Federal Annual = 1240 + 4560 + 12166 + 23058 + 72 = 41096
    // Federal Quarter = 41096 / 4 = 10274
    // CA State Tax flat 9.3% annual on 202000 = 18786
    // State Tax Quarter = 18786 / 4 = 4696.50
    // Total Estimated Tax Quarter = 10274 + 4696.50 = 14970.50
    expect(component.summaryFederalTax).toBeCloseTo(10274, 2);
    expect(component.summaryStateTax).toBeCloseTo(4696.50, 2);
    expect(component.summaryEstimatedTax).toBeCloseTo(14970.50, 2);
    expect(component.dueDate).toBe('June 15, 2026');
  });

  it('should calculate estimated tax correctly for India Married filer under slabs', () => {
    component.taxForm.patchValue({
      country: 'IN',
      state: 'MH',
      filingStatus: 'Married (Joint)',
      quarter: 'Q1 (Jan-Mar 2026)',
      grossIncome: 500000,
      expenses: 50000
    });

    component.calculateEstimatedTax();

    expect(component.isCalculated).toBe(true);
    expect(component.summaryGrossIncome).toBe(500000);
    expect(component.summaryTotalDeductions).toBe(50000);
    expect(component.summaryTaxableIncome).toBe(450000); // 450000 * 4 = 1800000 annualized

    // India New Tax regime slabs for 1800000:
    // Up to 400000: 0% -> 0
    // 400000 to 800000 (400000): 5% -> 20000
    // 800000 to 1200000 (400000): 10% -> 40000
    // 1200000 to 1600000 (400000): 15% -> 60000
    // 1600000 to 2000000 (200000 portion): 20% -> 40000
    // Total Annual Tax = 20000 + 40000 + 60000 + 40000 = 160000
    // Quarterly Tax = 160000 / 4 = 40000
    expect(component.summaryEstimatedTax).toBeCloseTo(40000, 2);
    expect(component.dueDate).toBe('April 15, 2026');
  });
});
