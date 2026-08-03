import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface TaxEstimateInput {
  id?: string;
  country: string;
  state: string;
  filingStatus: string;
  quarter: string;
  year: number;
  grossIncomeForQuarter: number;
  businessExpenses?: number;
  retirementContribution?: number;
  healthInsurancePremiums?: number;
  homeOfficeDeduction?: number;
}

export interface TaxEstimateResult extends TaxEstimateInput {
  totalDeductions: number;
  taxableIncome: number;
  nationalTax: number;
  stateTax: number;
  estimatedTax: number;
  effectiveTaxRate: number;
  dueDate: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaxEstimateService {
  private apiUrl = `${environment.apiUrl}/tax-estimates`;

  // Bidirectional country code map
  private countryMap: { [key: string]: string } = {
    'US': 'United States',
    'CA': 'Canada',
    'IN': 'India',
    'UK': 'United Kingdom',
    'AU': 'Australia'
  };

  private reverseCountryMap: { [key: string]: string } = {
    'United States': 'US',
    'Canada': 'CA',
    'India': 'IN',
    'United Kingdom': 'UK',
    'Australia': 'AU'
  };

  // Bidirectional state code map
  private stateMaps: { [country: string]: { [code: string]: string } } = {
    'US': {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
      'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'DC': 'District of Columbia',
      'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois',
      'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana',
      'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
      'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
      'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
      'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon',
      'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota',
      'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia',
      'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
    },
    'CA': {
      'AB': 'Alberta', 'BC': 'British Columbia', 'MB': 'Manitoba', 'NB': 'New Brunswick',
      'NL': 'Newfoundland and Labrador', 'NS': 'Nova Scotia', 'ON': 'Ontario',
      'PE': 'Prince Edward Island', 'QC': 'Quebec', 'SK': 'Saskatchewan',
      'NT': 'Northwest Territories', 'NU': 'Nunavut', 'YT': 'Yukon'
    },
    'UK': {
      'ENG': 'England', 'SCT': 'Scotland', 'WLS': 'Wales', 'NIR': 'Northern Ireland'
    },
    'AU': {
      'ACT': 'Australian Capital Territory', 'NSW': 'New South Wales', 'NT': 'Northern Territory',
      'QLD': 'Queensland', 'SA': 'South Australia', 'TAS': 'Tasmania', 'VIC': 'Victoria',
      'WA': 'Western Australia'
    },
    'IN': {
      'AP': 'Andhra Pradesh', 'AR': 'Arunachal Pradesh', 'AS': 'Assam', 'BR': 'Bihar',
      'CG': 'Chhattisgarh', 'GA': 'Goa', 'GJ': 'Gujarat', 'HR': 'Haryana', 'HP': 'Himachal Pradesh',
      'JH': 'Jharkhand', 'KA': 'Karnataka', 'KL': 'Kerala', 'MP': 'Madhya Pradesh',
      'MH': 'Maharashtra', 'MN': 'Manipur', 'ML': 'Meghalaya', 'MZ': 'Mizoram', 'NL': 'Nagaland',
      'OD': 'Odisha', 'PB': 'Punjab', 'RJ': 'Rajasthan', 'SK': 'Sikkim', 'TN': 'Tamil Nadu',
      'TS': 'Telangana', 'TR': 'Tripura', 'UP': 'Uttar Pradesh', 'UK': 'Uttarakhand',
      'WB': 'West Bengal', 'AN': 'Andaman and Nicobar Islands', 'CH': 'Chandigarh',
      'DN': 'Dadra and Nagar Haveli and Daman and Diu', 'DL': 'Delhi', 'JK': 'Jammu and Kashmir',
      'LA': 'Ladakh', 'LD': 'Lakshadweep', 'PY': 'Puducherry'
    }
  };

  private reverseStateMaps: { [country: string]: { [name: string]: string } } = {};

  constructor(private http: HttpClient) {
    // Generate reverse state maps
    Object.keys(this.stateMaps).forEach(countryCode => {
      this.reverseStateMaps[countryCode] = {};
      const states = this.stateMaps[countryCode];
      Object.keys(states).forEach(stateCode => {
        const stateName = states[stateCode];
        this.reverseStateMaps[countryCode][stateName] = stateCode;
      });
    });
  }

  // Frontend format -> Backend format translation
  private translateToBackend(input: TaxEstimateInput): any {
    const countryName = this.countryMap[input.country] || input.country;
    const stateMap = this.stateMaps[input.country] || {};
    const stateName = stateMap[input.state] || input.state;

    // Normalize filing status
    let filingStatus = input.filingStatus;
    if (filingStatus === 'Married (Joint)') {
      filingStatus = 'Married';
    } else if (filingStatus === 'Married (Separate)') {
      filingStatus = 'Married Separately';
    }

    return {
      country: countryName,
      state: stateName,
      filingStatus: filingStatus,
      quarter: input.quarter,
      year: input.year,
      grossIncomeForQuarter: input.grossIncomeForQuarter,
      businessExpenses: input.businessExpenses || 0,
      retirementContribution: input.retirementContribution || 0,
      healthInsurancePremiums: input.healthInsurancePremiums || 0,
      homeOfficeDeduction: input.homeOfficeDeduction || 0
    };
  }

  // Backend format -> Frontend format translation
  private translateToFrontend(backendObj: any): TaxEstimateResult {
    const countryCode = this.reverseCountryMap[backendObj.country] || backendObj.country;
    const reverseStateMap = this.reverseStateMaps[countryCode] || {};
    const stateCode = reverseStateMap[backendObj.state] || backendObj.state;

    // Restore filing status
    let filingStatus = backendObj.filingStatus;
    if (filingStatus === 'Married') {
      filingStatus = 'Married (Joint)';
    } else if (filingStatus === 'Married Separately') {
      filingStatus = 'Married (Separate)';
    }

    return {
      id: backendObj.id || backendObj._id,
      country: countryCode,
      state: stateCode,
      filingStatus: filingStatus,
      quarter: backendObj.quarter,
      year: backendObj.year,
      grossIncomeForQuarter: backendObj.grossIncomeForQuarter,
      businessExpenses: backendObj.businessExpenses,
      retirementContribution: backendObj.retirementContribution,
      healthInsurancePremiums: backendObj.healthInsurancePremiums,
      homeOfficeDeduction: backendObj.homeOfficeDeduction,
      totalDeductions: backendObj.totalDeductions,
      taxableIncome: backendObj.taxableIncome,
      nationalTax: backendObj.nationalTax,
      stateTax: backendObj.stateTax,
      estimatedTax: backendObj.estimatedTax,
      effectiveTaxRate: backendObj.effectiveTaxRate,
      dueDate: backendObj.dueDate,
      createdAt: backendObj.createdAt
    };
  }

  getEstimates(): Observable<TaxEstimateResult[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => {
        if (res.success && Array.isArray(res.data)) {
          return res.data.map((item: any) => this.translateToFrontend(item));
        }
        return [];
      })
    );
  }

  saveEstimate(estimate: TaxEstimateInput): Observable<TaxEstimateResult | null> {
    const backendData = this.translateToBackend(estimate);
    return this.http.post<any>(this.apiUrl, backendData).pipe(
      map(res => res.success ? this.translateToFrontend(res.data) : null)
    );
  }

  deleteEstimate(id: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.success ?? true)
    );
  }
}
