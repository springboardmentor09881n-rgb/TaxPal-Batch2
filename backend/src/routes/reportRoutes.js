const express = require("express");

const router = express.Router();

const {
  getReport,
  previewReport,
  checkReportFile,
} = require("../controllers/reportController");

const {
  protect,
} = require("../middleware/authMiddleware");


router.get(
  "/",
  protect,
  getReport
);


router.get(
  "/:id/preview",
  protect,
  previewReport
);


router.get(
  "/:id/file",
  protect,
  checkReportFile
);


module.exports = router;