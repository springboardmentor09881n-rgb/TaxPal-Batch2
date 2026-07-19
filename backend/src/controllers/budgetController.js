const budgetService = require("../services/budgetService");

const createBudget = async (req, res, next) => {
  try {
    const budgetData = {
      ...req.body,
      userId: req.user.id,
    };
    const budget = await budgetService.createBudget(budgetData);
    res.status(201).json({
      success: true,
      message: "Budget created successfully.",
      data: budget
    });
  } catch (error) {
    next(error);
  }
};

const getBudgets = async (req, res, next) => {
  try {
    const budgets = await budgetService.getBudgets(req.user.id);
    res.status(200).json({
      success: true,
      message: "Budgets retrieved successfully.",
      data: budgets
    });
  } catch (error) {
    next(error);
  }
};

const getBudgetById = async (req, res, next) => {
  try {
    const budget = await budgetService.getBudgetById(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: "Budget retrieved successfully.",
      data: budget
    });
  } catch (error) {
    next(error);
  }
};

const updateBudget = async (req, res, next) => {
  try {
    const budget = await budgetService.updateBudget(req.params.id, req.user.id, req.body);
    res.status(200).json({
      success: true,
      message: "Budget updated successfully.",
      data: budget
    });
  } catch (error) {
    next(error);
  }
};

const deleteBudget = async (req, res, next) => {
  try {
    await budgetService.deleteBudget(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: "Budget deleted successfully.",
      data: null
    });
  } catch (error) {
    next(error);
  }
};

const getBudgetProgress = async (req, res, next) => {
  try {
    const month = req.query.month; // e.g., "2026-07"
    if (!month) {
      const error = new Error("Month is required");
      error.statusCode = 400;
      throw error;
    }
    const progress = await budgetService.getBudgetProgressFormatted(req.user.id, month);
    res.status(200).json({
      success: true,
      message: "Budget progress retrieved successfully.",
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  getBudgetProgress,
};
