const mongoose = require("mongoose");

const taxEstimateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    country: { type: String, required: true },
    state: { type: String, default: "" },
    quarter: { type: String, enum: ["Q1", "Q2", "Q3", "Q4"], required: true },
    filingStatus: { type: String, default: "" },
    grossIncome: { type: Number, required: true },
    deductions: {
      businessExpenses: { type: Number, default: 0 },
      retirementContribution: { type: Number, default: 0 },
      healthInsurancePremiums: { type: Number, default: 0 },
      homeOfficeDeduction: { type: Number, default: 0 },
    },
    estimatedTax: { type: Number, required: true },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("TaxEstimate", taxEstimateSchema);
