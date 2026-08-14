const { generateReport } = require("../services/reportService");

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

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate report",
    });
  }
};

module.exports = {
  getReport,
};