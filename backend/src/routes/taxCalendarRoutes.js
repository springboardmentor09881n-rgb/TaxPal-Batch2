const express = require("express");

const router = express.Router();

const {
  getAllReminders,
  getUpcomingReminders,
  getReminderById,
  markReminderRead,
  undoMarkAsRead,
  markPaymentDone,
  undoPaymentDone,
} = require("../controllers/taxCalendarController");

const { protect } = require("../middleware/authMiddleware");

// ==============================
// GET APIs
// ==============================

router.get("/", protect, getAllReminders);

router.get("/upcoming", protect, getUpcomingReminders);

router.get("/:id", protect, getReminderById);

// ==============================
// REMINDER ACTIONS
// ==============================

// Mark reminder as read
router.patch("/:id/read", protect, markReminderRead);

// Undo mark as read
router.patch("/:id/unread", protect, undoMarkAsRead);

// Mark payment as completed
router.patch("/:id/payment", protect, markPaymentDone);

// Undo payment completed
router.patch("/:id/payment/undo", protect, undoPaymentDone);

module.exports = router;