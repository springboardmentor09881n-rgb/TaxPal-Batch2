const dashboardService = require("../services/dashboardService");

const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const dashboard = await dashboardService.getDashboardData(userId);

    res.status(200).json({
      success: true,
      message: "Dashboard data retrieved successfully.",
      data: dashboard
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
};
