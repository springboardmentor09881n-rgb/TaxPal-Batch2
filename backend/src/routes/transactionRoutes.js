const express = require("express");
const router = express.Router();

const transactionController = require("../controllers/transactionController");
const { protect } = require("../middleware/authMiddleware");
const { transactionValidation, validate } = require("../validators/transactionValidator");

router.use(protect);

router.post("/", transactionValidation, validate, transactionController.addTransaction);
router.get("/", transactionController.getAllTransactions);
router.get("/:id", transactionController.getTransactionById);
router.put("/:id", transactionValidation, validate, transactionController.updateTransaction);
router.delete("/:id", transactionController.deleteTransaction);

module.exports = router;
