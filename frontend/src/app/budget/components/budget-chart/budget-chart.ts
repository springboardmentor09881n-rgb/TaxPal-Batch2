import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetProgress } from '../../models/budget.model';

interface BarVisual {
  category: string;
  limitHeight: number;
  spentHeight: number;
  limitY: number;
  spentY: number;
  limitAmount: number;
  spentAmount: number;
  spentColorClass: string;
  x: number;
}

interface PieVisual {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  pathD: string;
}

@Component({
  selector: 'app-budget-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './budget-chart.html',
  styleUrl: './budget-chart.css'
})
export class BudgetChartComponent implements OnChanges {
  @Input() progressList: BudgetProgress[] = [];
  @Input() currencySymbol = '₹';

  // Bar Chart Layout Config
  svgWidth = 600;
  svgHeight = 320;
  paddingBottom = 40;
  paddingLeft = 60;
  paddingRight = 20;
  paddingTop = 20;
  graphHeight = 260; // svgHeight - paddingBottom - paddingTop
  graphWidth = 520;  // svgWidth - paddingLeft - paddingRight

  maxAmount = 1000;
  yTicks: number[] = [];
  bars: BarVisual[] = [];

  // Pie Chart Layout Config
  pieRadius = 100;
  pieCx = 120;
  pieCy = 120;
  pieSectors: PieVisual[] = [];
  totalExpenses = 0;

  incomeCategories = ['Salary', 'Freelancing', 'Business', 'Investments', 'Bonus', 'Refund'];

  categoryColors: { [key: string]: string } = {
    'food': '#10b981',        // Green
    'transport': '#3b82f6',   // Blue
    'rent': '#6366f1',        // Indigo
    'utilities': '#f59e0b',   // Amber
    'shopping': '#ec4899',    // Pink
    'healthcare': '#ef4444',  // Red
    'education': '#8b5cf6',   // Purple
    'entertainment': '#a855f7',// Violet
    'travel': '#06b6d4',      // Cyan
    'other': '#6b7280',       // Gray
    'salary': '#10b981',
    'freelancing': '#3b82f6',
    'business': '#f59e0b',
    'investments': '#8b5cf6',
    'bonus': '#d946ef',
    'refund': '#06b6d4'
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['progressList']) {
      this.generateBarChartData();
      this.generatePieChartData();
    }
  }

  private getColorForCategory(cat: string): string {
    const key = cat.toLowerCase().trim();
    if (this.categoryColors[key]) {
      return this.categoryColors[key];
    }
    
    // Hash function to generate a color for custom categories
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 65%, 55%)`; // beautiful vibrant HSL color
  }

  private generateBarChartData(): void {
    if (!this.progressList || this.progressList.length === 0) {
      this.bars = [];
      this.yTicks = [0, 250, 500, 750, 1000];
      this.maxAmount = 1000;
      return;
    }

    // Filter to only items with limit > 0 or spent > 0
    const activeItems = this.progressList.filter(item => item.limit > 0 || item.spent > 0);
    if (activeItems.length === 0) {
      this.bars = [];
      this.yTicks = [0, 250, 500, 750, 1000];
      this.maxAmount = 1000;
      return;
    }

    // Determine max amount for Y-axis scaling
    let maxVal = Math.max(...activeItems.map(i => Math.max(i.limit, i.spent)));
    if (maxVal === 0) maxVal = 1000;
    
    // Round maxVal to a clean interval
    const orderOfMagnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
    const normalizer = maxVal / orderOfMagnitude;
    let roundedMax = maxVal;
    if (normalizer <= 1.0) roundedMax = 1.0 * orderOfMagnitude;
    else if (normalizer <= 2.0) roundedMax = 2.0 * orderOfMagnitude;
    else if (normalizer <= 5.0) roundedMax = 5.0 * orderOfMagnitude;
    else roundedMax = 10.0 * orderOfMagnitude;
    
    this.maxAmount = roundedMax;

    // Generate Y-axis ticks
    this.yTicks = [];
    for (let i = 0; i <= 4; i++) {
      this.yTicks.push((roundedMax / 4) * i);
    }

    // Generate bar coordinates
    const barSpacing = this.graphWidth / activeItems.length;
    const barGroupWidth = barSpacing * 0.7;
    const barWidth = barGroupWidth / 2 - 4; // two side-by-side bars

    this.bars = activeItems.map((item, idx) => {
      const xCenter = this.paddingLeft + (idx * barSpacing) + (barSpacing / 2);
      const limitHeight = (item.limit / roundedMax) * this.graphHeight;
      const spentHeight = (item.spent / roundedMax) * this.graphHeight;

      // Spent color based on percentage
      let spentColor = 'bar-success';
      if (item.progressPercentage > 100) spentColor = 'bar-danger';
      else if (item.progressPercentage >= 70) spentColor = 'bar-warning';

      return {
        category: item.category,
        limitHeight,
        spentHeight,
        limitY: this.svgHeight - this.paddingBottom - limitHeight,
        spentY: this.svgHeight - this.paddingBottom - spentHeight,
        limitAmount: item.limit,
        spentAmount: item.spent,
        spentColorClass: spentColor,
        // Starting X coordinate of the limit bar
        x: xCenter - (barGroupWidth / 2)
      };
    });
  }

  private generatePieChartData(): void {
    if (!this.progressList || this.progressList.length === 0) {
      this.pieSectors = [];
      this.totalExpenses = 0;
      return;
    }

    // Filter out income categories for the expense pie chart
    const expenseProgress = this.progressList.filter(item => 
      !this.incomeCategories.includes(item.category) && item.spent > 0
    );

    this.totalExpenses = expenseProgress.reduce((sum, item) => sum + item.spent, 0);

    if (this.totalExpenses === 0) {
      this.pieSectors = [];
      return;
    }

    let accumulatedAngle = -Math.PI / 2; // start from top (12 o'clock)

    this.pieSectors = expenseProgress.map(item => {
      const percentage = (item.spent / this.totalExpenses) * 100;
      const angleDelta = (item.spent / this.totalExpenses) * 2 * Math.PI;
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + angleDelta;

      // Arc formulas
      const x1 = this.pieCx + this.pieRadius * Math.cos(startAngle);
      const y1 = this.pieCy + this.pieRadius * Math.sin(startAngle);
      const x2 = this.pieCx + this.pieRadius * Math.cos(endAngle);
      const y2 = this.pieCy + this.pieRadius * Math.sin(endAngle);

      // Large arc flag (1 if angle > 180 degrees)
      const largeArcFlag = angleDelta > Math.PI ? '1' : '0';

      // Path data: Move to center, line to start, arc to end, line back to center
      let pathD = '';
      if (percentage === 100) {
        // Special case for 100% circle (donut ring)
        pathD = `M ${this.pieCx} ${this.pieCy - this.pieRadius} A ${this.pieRadius} ${this.pieRadius} 0 1 1 ${this.pieCx - 0.01} ${this.pieCy - this.pieRadius} Z`;
      } else {
        pathD = `M ${this.pieCx} ${this.pieCy} L ${x1} ${y1} A ${this.pieRadius} ${this.pieRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      }

      accumulatedAngle = endAngle;

      return {
        category: item.category,
        amount: item.spent,
        percentage,
        color: this.getColorForCategory(item.category),
        pathD
      };
    });
  }

  // Helper to convert ticks to nice readable currency formats
  formatTick(val: number): string {
    if (val >= 100000) return `${(val / 1000).toFixed(0)}k`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toFixed(0);
  }
}
