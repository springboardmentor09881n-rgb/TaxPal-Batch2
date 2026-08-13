const taxCalendarService = require("../services/taxCalendarService");

// ==============================
// GET ALL REMINDERS
// ==============================

exports.getAllReminders = async (req, res) => {
  try {
    const data = await taxCalendarService.getAllReminders(
      req.user.id,
      req.query.year
    );

    res.json({
      success: true,
      message: "Tax reminders fetched successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// GET UPCOMING REMINDERS
// ==============================

exports.getUpcomingReminders = async (req, res) => {
  try {
    const data = await taxCalendarService.getUpcomingReminders(req.user.id);

    res.json({
      success: true,
      message: "Upcoming reminders fetched successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// GET REMINDER BY ID
// ==============================

exports.getReminderById = async (req, res) => {
  try {
    const data = await taxCalendarService.getReminderById(
      req.params.id,
      req.user.id
    );

    res.json({
      success: true,
      message: "Reminder fetched successfully",
      data,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// MARK AS READ
// ==============================

exports.markReminderRead = async (req, res) => {
  try {
    const data = await taxCalendarService.markAsRead(
      req.params.id,
      req.user.id
    );

    res.json({
      success: true,
      message: "Reminder marked as read",
      data,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// UNDO MARK AS READ
// ==============================

exports.undoMarkAsRead = async (req, res) => {
  try {
    const data = await taxCalendarService.undoMarkAsRead(
      req.params.id,
      req.user.id
    );

    res.json({
      success: true,
      message: "Reminder marked as unread",
      data,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// MARK PAYMENT DONE
// ==============================

exports.markPaymentDone = async (req, res) => {
  try {
    const data = await taxCalendarService.markPaymentDone(
      req.params.id,
      req.user.id
    );

    res.json({
      success: true,
      message: "Payment marked as completed",
      data,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// UNDO PAYMENT DONE
// ==============================

exports.undoPaymentDone = async (req, res) => {
  try {
    const data = await taxCalendarService.undoPaymentDone(
      req.params.id,
      req.user.id
    );

    res.json({
      success: true,
      message: "Payment status reverted to pending",
      data,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};