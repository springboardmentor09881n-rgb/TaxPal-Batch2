const express = require("express");
const router = express.Router();
const budgetController = require("../controllers/budgetController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/progress", budgetController.getBudgetProgress);
router.post("/", budgetController.createBudget);
router.get("/", budgetController.getBudgets);
router.get("/:id", budgetController.getBudgetById);
router.put("/:id", budgetController.updateBudget);
router.delete("/:id", budgetController.deleteBudget);

module.exports = router;
