const dashboardService = require("../services/dashboardService");

const getSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getSummary(req.user.id);
    res.status(200).json({
      success: true,
      message: "Dashboard summary retrieved successfully.",
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

const getRecentTransactions = async (req, res, next) => {
  try {
    const recent = await dashboardService.getRecentTransactions(req.user.id);
    res.status(200).json({
      success: true,
      message: "Recent transactions retrieved successfully.",
      data: recent
    });
  } catch (error) {
    next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const dashboard = await dashboardService.getDashboardData(req.user.id);
    res.status(200).json({
      success: true,
      message: "Dashboard data retrieved successfully.",
      data: dashboard
    });
  } catch (error) {
    next(error);
  }
};

const getSpendingBreakdown = async (req, res, next) => {
  try {
    const data = await dashboardService.getSpendingBreakdown(req.user.id);
    res.status(200).json({
      success: true,
      message: "Spending breakdown retrieved successfully.",
      data: data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getRecentTransactions,
  getDashboard,
  getSpendingBreakdown,
};
