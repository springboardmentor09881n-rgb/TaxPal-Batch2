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

module.exports = {
  getSummary,
  getRecentTransactions,
};
