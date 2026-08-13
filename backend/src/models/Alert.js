const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["reminder", "payment"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    alertDate: {
      type: Date,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

alertSchema.index({ userId: 1, alertDate: 1 });

module.exports = mongoose.model("Alert", alertSchema);
