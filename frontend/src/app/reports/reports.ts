import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ReportService, GeneratedReport } from '../core/services/report.service';
import { AuthService } from '../core/services/auth';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class ReportsComponent implements OnInit {
  reportForm!: FormGroup;
  reports: GeneratedReport[] = [];
  selectedReport: GeneratedReport | null = null;
  currencySymbol = '$';

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currencySymbol = this.authService.getCurrencySymbol();
    this.initForm();

    // Subscribe to reports list from service
    this.reportService.reports$.subscribe(list => {
      this.reports = list;
      
      // If the currently selected report is no longer in the list (e.g. deleted), clear selection
      if (this.selectedReport && !list.find(r => r.id === this.selectedReport?.id)) {
        this.selectedReport = null;
      }
      this.cdr.detectChanges();
    });
  }

  private initForm(): void {
    this.reportForm = this.fb.group({
      reportType: ['income_statement', Validators.required],
      period: ['current_month', Validators.required],
      format: ['PDF', Validators.required]
    });

    // Reactive handling of report type changes
    this.reportForm.get('reportType')?.valueChanges.subscribe(type => {
      const periodCtrl = this.reportForm.get('period');
      if (type === 'tax_summary') {
        const currentPeriod = periodCtrl?.value;
        // Tax summary report type only supports Quarters (Q1, Q2, Q3, Q4)
        if (currentPeriod === 'current_month' || currentPeriod === 'last_month' || currentPeriod === 'current_year') {
          periodCtrl?.setValue('q2'); // default to Q2 in 2026
        }
      }
    });
  }

  // Helper to determine if a period option should be visible in the select dropdown
  shouldShowPeriodOption(optionValue: string): boolean {
    const reportType = this.reportForm?.get('reportType')?.value;
    if (reportType === 'tax_summary') {
      return optionValue !== 'current_month' && optionValue !== 'last_month' && optionValue !== 'current_year';
    }
    return true;
  }

  onSubmit(): void {
    if (this.reportForm.invalid) {
      return;
    }

    const { reportType, period, format } = this.reportForm.value;
    
    this.reportService.generateReport(reportType, period, format).subscribe(newReport => {
      // Auto-select the newly generated report for previewing
      this.selectedReport = newReport;
      this.cdr.detectChanges();
    });
  }

  onReset(): void {
    this.reportForm.reset({
      reportType: 'income_statement',
      period: 'current_month',
      format: 'PDF'
    });
  }

  onPreview(report: GeneratedReport): void {
    this.selectedReport = report;
  }

  onDownload(report: GeneratedReport): void {
    if (report.format === 'CSV') {
      this.reportService.downloadReportCSV(report);
    } else {
      this.reportService.downloadReportPDF(report);
    }
  }

  onDelete(report: GeneratedReport, event: MouseEvent): void {
    event.stopPropagation(); // prevent row click triggers
    if (confirm(`Are you sure you want to delete "${report.name}"?`)) {
      this.reportService.deleteReport(report.id);
      this.cdr.detectChanges();
    }
  }

  onPrint(): void {
    window.print();
  }
}
