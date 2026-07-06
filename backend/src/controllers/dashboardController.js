const dashboardService = require("../services/dashboardService");

const getDashboard = async (req, res) => {
  try {
    const userId = req.user?.id || "TEMP_USER_ID";

    const dashboard = await dashboardService.getDashboardData(userId);

    res.status(200).json(dashboard);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getDashboard,
};