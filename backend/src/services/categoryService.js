const Category = require("../models/Category");
const defaultCategories = require("../utils/defaultCategories");

const formatCategory = (c) => {
  return {
    id: c._id,
    name: c.name,
    type: c.type,
    isDefault: c.isDefault,
    color: c.color,
  };
};

const createCategory = async (categoryData) => {
  try {
    const category = await Category.create(categoryData);
    return formatCategory(category);
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error("Category with this name and type already exists.");
      error.statusCode = 409;
      throw error;
    }
    throw err;
  }
};

const getCategories = async (userId) => {
  const categories = await Category.find({ userId }).sort({ name: 1 });
  return categories.map(formatCategory);
};

const getCategoryById = async (id, userId) => {
  const category = await Category.findOne({ _id: id, userId });
  if (!category) {
    const error = new Error("Category not found.");
    error.statusCode = 404;
    throw error;
  }
  return formatCategory(category);
};

const getDefaultCategories = async () => {
  return defaultCategories;
};

const suggestCategory = async (merchant) => {
  if (!merchant) return "Others";
  const name = merchant.toLowerCase();

  if (name.includes("swiggy") || name.includes("zomato") || name.includes("food") || name.includes("restaurant")) {
    return "Food";
  }
  if (name.includes("uber") || name.includes("ola") || name.includes("travel")) {
    return "Travel";
  }
  if (name.includes("salary") || name.includes("paycheck")) {
    return "Income";
  }
  if (name.includes("amazon") || name.includes("flipkart") || name.includes("shopping")) {
    return "Shopping";
  }
  return "Others";
};

const updateCategory = async (id, userId, updateData) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!category) {
      const error = new Error("Category not found.");
      error.statusCode = 404;
      throw error;
    }
    return formatCategory(category);
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error("Category with this name and type already exists.");
      error.statusCode = 409;
      throw error;
    }
    throw err;
  }
};

const deleteCategory = async (id, userId) => {
  const category = await Category.findOneAndDelete({ _id: id, userId });
  if (!category) {
    const error = new Error("Category not found.");
    error.statusCode = 404;
    throw error;
  }
  return formatCategory(category);
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  getDefaultCategories,
  suggestCategory,
  updateCategory,
  deleteCategory,
};
