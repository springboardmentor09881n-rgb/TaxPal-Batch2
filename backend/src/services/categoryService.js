const Category = require("../models/Category");

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
  updateCategory,
  deleteCategory,
};
