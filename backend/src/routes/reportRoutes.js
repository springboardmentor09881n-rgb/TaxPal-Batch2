const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");
const { 
  reportGenerationValidation, 
  reportIdValidation, 
  validate 
} = require("../validators/reportValidator");

// Protect all report routes
router.use(protect);

// Static routes
router.post("/generate", reportGenerationValidation, validate, reportController.generateReport);
router.get("/", reportController.getReports);

// Dynamic routes (ID based)
router.get("/:id/preview", reportIdValidation, validate, reportController.getReportPreview);
router.get("/:id/download", reportIdValidation, validate, reportController.downloadReport);
router.delete("/:id", reportIdValidation, validate, reportController.deleteReport);

module.exports = router;
