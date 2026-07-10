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

## 🔗 Backend & Database Integration Guide (Milestone 1)

This section is dedicated to the **Backend (Node.js/Express)** and **Database (SQL/NoSQL)** teams. The frontend is currently operating in isolation. Follow these steps to wire the two halves together.

### Step 1: Database Schema Modeling
Before building APIs, the Database team must prepare tables/collections that exactly match the data contracts the frontend expects.

**1. Users Table/Collection**
```json
{
  "id": "UUID / ObjectId",
  "username": "string",
  "password": "string (Hashed/Bcrypt)",
  "fullName": "string",
  "email": "string (Unique)",
  "country": "string (e.g. IN, US, UK)"
}
```

**2. Transactions Table/Collection**
```json
{
  "id": "UUID / ObjectId",
  "userId": "UUID / ObjectId (Foreign Key)",
  "type": "string (strictly 'income' OR 'expense')",
  "description": "string",
  "amount": "number",
  "category": "string",
  "date": "string (YYYY-MM-DD)",
  "notes": "string (Optional text)"
}
```

### Step 2: API Endpoint Development
The Backend team needs to develop the following endpoints that return JSON matching the contracts below.

#### Authentication APIs
*   **`POST /api/auth/register`**: Accepts User data, inserts into DB, returns JWT.
*   **`POST /api/auth/login`**: Accepts `{ username, password }`, returns JWT.
*   **Expected Frontend Response for both**:
    ```json
    {
      "token": "YOUR_JWT_STRING",
      "user": {
        "id": "123",
        "name": "Alex Morgan",
        "email": "alex@example.com",
        "country": "IN"
      }
    }
    ```

#### Transaction APIs
*   **`POST /api/transactions`**: Accepts a new Transaction object, saves it to the DB with the authenticated user's ID, and returns the saved object.
*   **`GET /api/transactions`**: Returns an array of Transactions for the authenticated user, sorted by date (newest first).

#### Dashboard API
*   **`GET /api/dashboard/summary`**: (Optional but Recommended) The frontend currently calculates the dashboard summary locally by fetching all transactions. For better performance, the backend should expose this endpoint to calculate and return the totals via a database aggregation query.
*   **Expected Frontend Response**:
    ```json
    {
      "monthlyIncome": 4200.00,
      "incomeTrend": 12,
      "monthlyExpenses": 1800.00,
      "expenseTrend": 8,
      "estimatedTaxDue": 450.00,
      "savingsRate": 57.1,
      "savingsTrend": 3.2
    }
    ```

### Step 3: Swapping Mocks for HTTP Requests (Frontend Updates)
Once the APIs are deployed locally or to a staging server, a frontend engineer (or the backend engineer running the full stack) simply needs to swap out the mock services.

Inside `src/app/core/services/`:
1.  Import `HttpClient` from `@angular/common/http`.
2.  Inject it into the service constructor: `constructor(private http: HttpClient) {}`.
3.  Replace the mock `return of(...)` logic with actual HTTP calls.

**Example Transformation (`transaction.ts`):**
```typescript
// BEFORE (Current Mock)
saveTransaction(transaction: Transaction): Observable<any> {
  this.transactions.unshift(transaction);
  return of({ message: 'Success', data: transaction });
}

// AFTER (Real Backend)
saveTransaction(transaction: Transaction): Observable<any> {
  return this.http.post<any>('http://localhost:3000/api/transactions', transaction);
}
```

Because the Angular components are already `subscribe()`-ing to these functions, **absolutely zero changes are required in the UI components.**

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
