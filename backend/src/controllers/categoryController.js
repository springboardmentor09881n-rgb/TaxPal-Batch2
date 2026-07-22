const categoryService = require("../services/categoryService");

const createCategory = async (req, res, next) => {
  try {
    const categoryData = {
      name: req.body.name,
      type: req.body.type,
      color: req.body.color,
      userId: req.user.id,
    };
    const category = await categoryService.createCategory(categoryData);
    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      data: category
    });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getCategories(req.user.id);
    res.status(200).json({
      success: true,
      message: "Categories retrieved successfully.",
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: "Category retrieved successfully.",
      data: category
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.type !== undefined) updateData.type = req.body.type;
    if (req.body.color !== undefined) updateData.color = req.body.color;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update."
      });
    }

    const category = await categoryService.updateCategory(req.params.id, req.user.id, updateData);
    res.status(200).json({
      success: true,
      message: "Category updated successfully.",
      data: category
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await categoryService.deleteCategory(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: "Category deleted successfully.",
      data: category
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
