const {
  generateReport,
  getReportPreview: getReportPreviewService,
} = require("../services/reportService");

const getReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reportType, period } = req.query;

    if (!reportType) {
      return res.status(400).json({
        success: false,
        message: "Report type is required",
      });
    }

    if (!period) {
      return res.status(400).json({
        success: false,
        message: "Period is required",
      });
    }

    const report = await generateReport(
      userId,
      reportType,
      period
    );

    return res.status(200).json({
      success: true,
      message: "Report generated successfully",
      data: report,
    });
  } catch (error) {
    console.error("Report generation error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to generate report",
    });
  }
};

const getReportPreview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const report = await getReportPreviewService(id, userId);

    return res.status(200).json({
      success: true,
      message: "Report preview retrieved successfully",
      data: report,
    });
  } catch (error) {
    console.error("Report preview error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve report preview",
    });
  }
};

module.exports = {
  getReport,
  getReportPreview,
};