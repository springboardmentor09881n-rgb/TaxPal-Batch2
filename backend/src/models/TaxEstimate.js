const mongoose = require("mongoose");

const taxEstimateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    country: {
      type: String,
      default: "IN",
    },
    state: {
      type: String,
      default: "",
    },
    filingStatus: {
      type: String,
      default: "Single",
    },
    quarter: {
      type: String,
      enum: ["Q1", "Q2", "Q3", "Q4"],
      required: true,
    },
    year: {
      type: Number,
      default: new Date().getFullYear(),
    },
    grossIncomeForQuarter: {
      type: Number,
      default: 0,
    },
    grossIncome: {
      type: Number,
      default: 0,
    },
    deductions: {
      type: Number,
      default: 0,
    },
    businessExpenses: { type: Number, default: 0 },
    retirementContribution: { type: Number, default: 0 },
    healthInsurancePremiums: { type: Number, default: 0 },
    homeOfficeDeduction: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    taxableIncome: { type: Number, default: 0 },
    nationalTax: { type: Number, default: 0 },
    stateTax: { type: Number, default: 0 },
    estimatedTax: { type: Number, default: 0 },
    effectiveTaxRate: { type: Number, default: 0 },
    dueDate: {
      type: Date,
      default: Date.now,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

taxEstimateSchema.index({ userId: 1, quarter: 1, year: 1 });

module.exports = mongoose.model("TaxEstimate", taxEstimateSchema);
