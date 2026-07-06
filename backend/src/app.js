const express = require("express");
const app = express();

const transactionRoutes = require("./routes/transactionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

app.use(express.json());

app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.send("TaxPal Backend Running ✅");
});

module.exports = app;