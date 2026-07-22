const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { protect } = require("../middleware/authMiddleware");
const { createCategoryValidation, updateCategoryValidation, categoryIdValidation, validate } = require("../validators/categoryValidator");

// Global JWT protection for all category endpoints
router.use(protect);

router.post("/", createCategoryValidation, validate, categoryController.createCategory);
router.get("/", categoryController.getCategories);
router.get("/:id", categoryIdValidation, validate, categoryController.getCategoryById);
router.put("/:id", categoryIdValidation, updateCategoryValidation, validate, categoryController.updateCategory);
router.delete("/:id", categoryIdValidation, validate, categoryController.deleteCategory);

module.exports = router;
