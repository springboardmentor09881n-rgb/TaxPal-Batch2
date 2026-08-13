const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { protect } = require("../middleware/authMiddleware");
const { createCategoryValidation, updateCategoryValidation, categoryIdValidation, validate } = require("../validators/categoryValidator");

// Public helper routes
router.get("/default", categoryController.getDefaultCategories);
router.post("/suggest", categoryController.suggestCategory);

// Protected routes with express-validator middleware
router.post("/", protect, ...createCategoryValidation, validate, categoryController.createCategory);
router.get("/", protect, categoryController.getCategories);
router.get("/:id", protect, ...categoryIdValidation, validate, categoryController.getCategoryById);
router.put("/:id", protect, ...categoryIdValidation, ...updateCategoryValidation, validate, categoryController.updateCategory);
router.delete("/:id", protect, ...categoryIdValidation, validate, categoryController.deleteCategory);

module.exports = router;
