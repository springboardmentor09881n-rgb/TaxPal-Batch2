const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", dashboardController.getSummary);
router.get("/summary", dashboardController.getSummary);
router.get("/recent", dashboardController.getRecentTransactions);
router.get("/spending-breakdown", dashboardController.getSpendingBreakdown);

module.exports = router;
