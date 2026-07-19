const express = require("express");
const router = express.Router();
const budgetController = require("../controllers/budgetController");
const { protect } = require("../middleware/authMiddleware");

const { budgetValidation, validate } = require("../validators/budgetValidator");

router.use(protect);

router.get("/progress", budgetController.getBudgetProgress);
router.post("/", budgetValidation, validate, budgetController.createBudget);
router.get("/", budgetController.getBudgets);
router.get("/:id", budgetController.getBudgetById);
router.put("/:id", budgetValidation, validate, budgetController.updateBudget);
router.delete("/:id", budgetController.deleteBudget);

module.exports = router;
