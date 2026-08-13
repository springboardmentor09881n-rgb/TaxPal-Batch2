# TaxPal - Frontend Architecture & Integration Guide

Welcome to the frontend repository for **TaxPal**, a personal finance and tax estimation platform built specifically for freelancers. This document outlines the frontend architecture and provides comprehensive instructions for the Backend and Database teams to successfully integrate their systems to complete **Milestone 1**.

---

## 🏛️ Frontend Architecture Overview

The frontend is built using **Angular** leveraging the modern **Standalone Components** architecture. This entirely eliminates `NgModules`, resulting in a highly modular, lightweight, and incredibly fast application.

### 1. Technology Stack
*   **Framework**: Angular (Standalone Architecture)
*   **Reactivity**: RxJS (Observables for seamless async data streams)
*   **Styling**: Pure CSS3 with custom variables (No heavy external frameworks like Bootstrap/Tailwind)
*   **Routing**: Angular Router (Nested layout routing)

### 2. Core Folder Structure
```text
src/
├── app/
│   ├── auth/                 # Login & Registration flows
│   ├── core/
│   │   └── services/         # State management & Mock API Data sources
│   ├── dashboard/            # Dynamic charts, metrics, and summaries
│   ├── layout/               # Global shell (Sidebar, Navbar, Coming Soon pages)
│   └── transactions/         # Dynamic forms for Income/Expense & Master Ledger
├── styles.css                # Global design system, theme tokens, and animations
```

### 3. State Management & Data Flow
Currently, the application relies on **Mock Services** located in `src/app/core/services/`.
*   These services (`auth.ts`, `transaction.ts`, `dashboard.ts`) house hardcoded data arrays and simulate network latency.
*   **Crucially, all mock methods return RxJS `Observables` (e.g., `of(...).pipe(delay(...))`).**
*   Because the frontend components already subscribe to these Observables asynchronously, the UI components **do not need to be changed at all** when real HTTP requests are introduced.

### 4. UI & Theming System
*   **Responsive**: Mobile-first media queries handle the sidebar toggle natively.
*   **Dynamic Theming**: Driven entirely by CSS Variables in `styles.css`. Clicking the theme toggle switches `data-theme="dark"` on the `<body>`, instantly inverting colors.
*   **Localization**: The UI dynamically tracks the user's country code to inject the proper currency symbol (`$`, `₹`, `£`, etc.) across all dashboards and tables.

---

## 🔗 Backend & Database Integration Guide (Tax Estimate Module)

This section outlines how the Backend (Node.js/Express) and Database (MongoDB/Mongoose) teams should integrate the **Tax Estimate Module** implemented in the frontend. Other core flows (Auth, Transactions, and Dashboard summaries) are already fully integrated.

### Step 1: Database Model Reference
The Database team should leverage the active schema in `backend/src/models/TaxEstimate.js` for storing quarterly estimates:

```javascript
const taxEstimateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    country: { type: String, required: true },
    state: { type: String, default: "" },
    filingStatus: {
      type: String,
      enum: ["Single", "Married", "Married Separately", "Head of Household"],
      required: true,
    },
    quarter: {
      type: String,
      enum: ["Q1", "Q2", "Q3", "Q4"],
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    grossIncomeForQuarter: {
      type: Number,
      required: true,
      min: [0, "Income cannot be negative"],
    },
    businessExpenses: { type: Number, default: 0 },
    retirementContribution: { type: Number, default: 0 },
    healthInsurancePremiums: { type: Number, default: 0 },
    homeOfficeDeduction: { type: Number, default: 0 },
    totalDeductions: { type: Number, required: true },
    taxableIncome: { type: Number, required: true },
    nationalTax: { type: Number, required: true },
    stateTax: { type: Number, required: true },
    estimatedTax: { type: Number, required: true },
    effectiveTaxRate: { type: Number, required: true },
    dueDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);
```

### Step 2: API Endpoints to Expose
The Backend team needs to create `taxRoutes.js` and register it under `/api/tax` in `app.js`. Implement the following protected routes (requiring the authentication `protect` middleware):

#### 1. `POST /api/tax/estimate`
Saves/updates a calculated quarterly tax estimate for the authenticated user.
*   **Request Headers**: `Authorization: Bearer <JWT_TOKEN>`
*   **Request Payload**:
    ```json
    {
      "country": "US",
      "state": "California",
      "filingStatus": "Single",
      "quarter": "Q2",
      "year": 2026,
      "grossIncomeForQuarter": 80000,
      "businessExpenses": 20000,
      "retirementContribution": 5000,
      "healthInsurancePremiums": 3000,
      "homeOfficeDeduction": 1500
    }
    ```
*   **Backend Controller Flow**:
    1. Parse and extract values. Normalize 2-character country/state codes if passed (e.g. `'US'` to `'United States'`, `'CA'` to `'California'`).
    2. Invoke backend `taxService.getFullTaxSummary(...)` to compute calculations.
    3. Save or update the `TaxEstimate` collection matching `{ userId, quarter, year }`.
*   **Response Payload (`201 Created`)**:
    ```json
    {
      "success": true,
      "message": "Tax estimate saved successfully",
      "data": {
        "_id": "60d0fe4f5311236168a109ca",
        "userId": "603f9a7d9b1d8e123456789b",
        "country": "United States",
        "state": "California",
        "filingStatus": "Single",
        "quarter": "Q2",
        "year": 2026,
        "grossIncomeForQuarter": 80000,
        "businessExpenses": 20000,
        "retirementContribution": 5000,
        "healthInsurancePremiums": 3000,
        "homeOfficeDeduction": 1500,
        "totalDeductions": 29500,
        "taxableIncome": 50500,
        "nationalTax": 10274,
        "stateTax": 4696.50,
        "estimatedTax": 14970.50,
        "effectiveTaxRate": 18.71,
        "dueDate": "2026-06-15T00:00:00.000Z"
      }
    }
    ```

#### 2. `GET /api/tax/estimates`
Retrieves all saved tax estimates for the authenticated user.
*   **Request Headers**: `Authorization: Bearer <JWT_TOKEN>`
*   **Response Payload (`200 OK`)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "_id": "60d0fe4f5311236168a109ca",
          "userId": "603f9a7d9b1d8e123456789b",
          "country": "United States",
          "state": "California",
          "filingStatus": "Single",
          "quarter": "Q2",
          "year": 2026,
          "grossIncomeForQuarter": 80000,
          "estimatedTax": 14970.50,
          "dueDate": "2026-06-15T00:00:00.000Z"
        }
      ]
    }
    ```

---

### Step 3: Tax Calculation Constants (Matching Database)
The calculations inside the frontend match the backend code (`backend/src/utils/taxSlabs.js` and `backend/src/utils/stateTaxRates.js`):

#### 1. National/Federal Slabs (Annualized)
- **United States (US) - Single / Married Separately / Head of Household**:
  - Up to $12,400: **10%**
  - $12,400 – $50,400: **12%**
  - $50,400 – $105,700: **22%**
  - $105,700 – $201,775: **24%**
  - $201,775 – $256,225: **32%**
  - $256,225 – $640,600: **35%**
  - Above $640,600: **37%**
- **United States (US) - Married (Joint)**:
  - Up to $24,800: **10%**
  - $24,800 – $100,800: **12%**
  - $100,800 – $211,400: **22%**
  - $211,400 – $403,550: **24%**
  - $403,550 – $512,450: **32%**
  - $512,450 – $768,700: **35%**
  - Above $768,700: **37%**
- **Canada (CA)**:
  - Up to $58,523: **14%**
  - $58,523 – $117,045: **20.5%**
  - $117,045 – $181,440: **26%**
  - $181,440 – $258,482: **29%**
  - Above $258,482: **33%**
- **India (IN)**:
  - Up to ₹4,00,000: **0%**
  - ₹4,00,001 – ₹8,00,000: **5%**
  - ₹8,00,001 – ₹12,00,000: **10%**
  - ₹12,00,001 – ₹16,00,000: **15%**
  - ₹16,00,001 – ₹20,00,000: **20%**
  - ₹20,00,001 – ₹24,00,000: **25%**
  - Above ₹24,00,000: **30%**
- **Australia (AU)**:
  - Up to AU$18,200: **0%**
  - AU$18,200 – AU$45,000: **15%**
  - AU$45,000 – AU$135,000: **30%**
  - AU$135,000 – AU$190,000: **37%**
  - Above AU$190,000: **45%**
- **United Kingdom (UK)**:
  - Up to £12,570: **0%**
  - £12,570 – £50,270: **20%**
  - £50,270 – £125,140: **40%**
  - Above £125,140: **45%**

#### 2. State flat tax rates (Annualized, applied directly)
- **United States**: California (`9.3%`), New York (`6.85%`), Illinois (`4.95%`), Pennsylvania (`3.07%`), Ohio (`3.5%`), Georgia (`5.49%`), New Jersey (`6.37%`).
- **Canada**: Ontario (`9.15%`), Quebec (`14.0%`), British Columbia (`7.7%`), Alberta (`10.0%`), Manitoba (`12.75%`), Saskatchewan (`10.5%`), Nova Scotia (`13.79%`), New Brunswick (`14.0%`).
- **India / UK / Australia**: State tax rates are `0%`.

---

### Step 4: Frontend Service Signature
During full integration, a `TaxService` can be created to swap the local calculation components for dynamic API integration:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TaxEstimateRequest {
  country: string;
  state?: string;
  filingStatus: string;
  quarter: string;
  year: number;
  grossIncomeForQuarter: number;
  businessExpenses?: number;
  retirementContribution?: number;
  healthInsurancePremiums?: number;
  homeOfficeDeduction?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaxService {
  private apiUrl = `${environment.apiUrl}/tax`;

  constructor(private http: HttpClient) {}

  saveEstimate(data: TaxEstimateRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/estimate`, data);
  }

  getEstimates(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estimates`);
  }
}
```

---

## 🚀 Running the Frontend Locally

1. **Prerequisites**: Ensure you have Node.js installed.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Start Development Server**:
   ```bash
   npm start
   ```
4. **View App**: Open your browser and navigate to `http://localhost:4200/`. The app supports live-reloading upon file saves.
