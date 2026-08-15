const express = require("express");

const router = express.Router();

const {
  getReport,
  getReportPreview,
} = require("../controllers/reportController");

const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getReport);

router.get("/:id/preview", protect, getReportPreview);

module.exports = router;