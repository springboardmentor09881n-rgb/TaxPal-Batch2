const fs = require("fs");
const reportService = require("../services/reportService");

const generateReport = async (req, res, next) => {
  try {
    const { reportType, period, format, year } = req.body;
    
    // The periodResolver expects uppercase 'Q1', 'Q2' etc.
    const servicePeriod = period.startsWith("q") ? period.toUpperCase() : period;

    const requestData = {
      reportType,
      period: servicePeriod,
      format,
      year,
    };

    const reportResponse = await reportService.generateReport(req.user.id, requestData);

    res.status(201).json({
      success: true,
      message: "Report generated successfully.",
      data: reportResponse,
    });
  } catch (error) {
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    // Rely on service to filter by userId ensuring ownership
    const reports = await reportService.getReports(req.user.id);
    
    res.status(200).json({
      success: true,
      message: "Reports retrieved successfully.",
      data: {
        reports,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getReportPreview = async (req, res, next) => {
  try {
    const reportId = req.params.id;
    // Assume getReportPreview returns the full JSON payload
    const previewData = await reportService.getReportPreview(reportId, req.user.id);

    res.status(200).json({
      success: true,
      message: "Report preview retrieved successfully.",
      data: previewData,
    });
  } catch (error) {
    next(error);
  }
};

const downloadReport = async (req, res, next) => {
  try {
    const reportId = req.params.id;
    
    // Fetch report metadata verifying ownership
    const report = await reportService.getReportById(reportId, req.user.id);

    if (!report || !report.filePath) {
      const error = new Error("Report file not found");
      error.statusCode = 404;
      throw error;
    }

    if (!fs.existsSync(report.filePath)) {
      const error = new Error("File missing on server");
      error.statusCode = 404;
      throw error;
    }

    const contentType = report.format === "CSV" ? "text/csv" : "application/pdf";
    const filename = `${report.reportName.replace(/\s+/g, '_')}.${report.format.toLowerCase()}`;

    res.setHeader("Content-Type", contentType);
    res.download(report.filePath, filename, (err) => {
      if (err) {
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
};

const deleteReport = async (req, res, next) => {
  try {
    const reportId = req.params.id;
    
    await reportService.deleteReport(reportId, req.user.id);

    res.status(200).json({
      success: true,
      message: "Report deleted successfully.",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateReport,
  getReports,
  getReportPreview,
  downloadReport,
  deleteReport,
};
