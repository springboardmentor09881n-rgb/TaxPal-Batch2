const TaxEstimate = require("../models/TaxEstimate");

const {
  getQuarterFromDate,
  calculateDaysRemaining,
  getReminderStatus,
  sortByDueDate,
} = require("../utils/taxCalendarUtils");

// ==============================
// GET ALL REMINDERS
// ==============================

exports.getAllReminders = async (userId, year) => {
  let query = {
    userId: userId,
  };

  if (year) {
    query.dueDate = {
      $gte: new Date(`${year}-01-01`),
      $lte: new Date(`${year}-12-31`),
    };
  }

  const reminders = await TaxEstimate.find(query);

  const formatted = reminders.map((reminder) => {
    const daysRemaining = calculateDaysRemaining(reminder.dueDate);

    return {
      ...reminder.toObject(),

      quarter:
        reminder.quarter || getQuarterFromDate(reminder.dueDate),

      daysRemaining,

      status: getReminderStatus(daysRemaining),
    };
  });

  return sortByDueDate(formatted);
};

// ==============================
// GET UPCOMING REMINDERS
// ==============================

exports.getUpcomingReminders = async (userId) => {
  const today = new Date();

  const reminders = await TaxEstimate.find({
    userId,
    dueDate: {
      $gte: today,
    },
  });

  return reminders.map((reminder) => {
    const daysRemaining = calculateDaysRemaining(reminder.dueDate);

    return {
      ...reminder.toObject(),

      daysRemaining,

      status: getReminderStatus(daysRemaining),
    };
  });
};

// ==============================
// GET REMINDER BY ID
// ==============================

exports.getReminderById = async (id, userId) => {
  const reminder = await TaxEstimate.findOne({
    _id: id,
    userId,
  });

  if (!reminder) {
    throw new Error("Reminder not found");
  }

  const daysRemaining = calculateDaysRemaining(reminder.dueDate);

  return {
    ...reminder.toObject(),

    daysRemaining,

    status: getReminderStatus(daysRemaining),
  };
};

// ==============================
// MARK AS READ
// ==============================

exports.markAsRead = async (id, userId) => {
  const reminder = await TaxEstimate.findOne({
    _id: id,
    userId,
  });

  if (!reminder) {
    throw new Error("Reminder not found");
  }

  reminder.isRead = true;

  await reminder.save();

  return reminder;
};

// ==============================
// UNDO MARK AS READ
// ==============================

exports.undoMarkAsRead = async (id, userId) => {
  const reminder = await TaxEstimate.findOne({
    _id: id,
    userId,
  });

  if (!reminder) {
    throw new Error("Reminder not found");
  }

  reminder.isRead = false;

  await reminder.save();

  return reminder;
};

// ==============================
// MARK PAYMENT AS COMPLETED
// ==============================

exports.markPaymentDone = async (id, userId) => {
  const reminder = await TaxEstimate.findOne({
    _id: id,
    userId,
  });

  if (!reminder) {
    throw new Error("Reminder not found");
  }

  reminder.paymentStatus = "Completed";

  await reminder.save();

  return reminder;
};

// ==============================
// UNDO PAYMENT COMPLETED
// ==============================

exports.undoPaymentDone = async (id, userId) => {
  const reminder = await TaxEstimate.findOne({
    _id: id,
    userId,
  });

  if (!reminder) {
    throw new Error("Reminder not found");
  }

  reminder.paymentStatus = "Pending";

  await reminder.save();

  return reminder;
};