const mongoose = require("mongoose");

// Stores metadata about a generated report — the actual PDF/CSV file
// lives on disk (or cloud storage); this document just points to it.
const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportName: {
      // e.g. "Budget Performance - Q2 2026"
      type: String,
      required: true,
    },
    reportType: {
      type: String,
      enum: ["income_statement", "tax_summary", "budget_performance"],
      required: true,
    },
    period: {
      // e.g. "July 2026" or "Q2 2026"
      type: String,
      required: true,
    },
    format: {
      type: String,
      enum: ["PDF", "CSV"],
      required: true,
    },
    filePath: {
      // where the generated file is saved / can be downloaded from
      type: String,
      required: true,
    },
  },
  { timestamps: true }, // createdAt = "Generated Date" shown in the table
);

reportSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
