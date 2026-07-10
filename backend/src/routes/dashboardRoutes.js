const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/summary", dashboardController.getSummary);
router.get("/recent", dashboardController.getRecentTransactions);

module.exports = router;
