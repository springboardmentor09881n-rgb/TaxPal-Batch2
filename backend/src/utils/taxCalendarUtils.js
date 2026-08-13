// Get current quarter
const getCurrentQuarter = (date = new Date()) => {
  const month = date.getMonth() + 1;

  if (month <= 3) return "Q1";
  if (month <= 6) return "Q2";
  if (month <= 9) return "Q3";
  return "Q4";
};

// Map any date to its quarter
const getQuarterFromDate = (date) => {
  const month = new Date(date).getMonth() + 1;

  if (month <= 3) return "Q1";
  if (month <= 6) return "Q2";
  if (month <= 9) return "Q3";
  return "Q4";
};

// Calculate days remaining
const calculateDaysRemaining = (dueDate) => {
  const today = new Date();

  return Math.ceil(
    (new Date(dueDate) - today) / (1000 * 60 * 60 * 24)
  );
};

// Determine reminder status
const getReminderStatus = (daysRemaining) => {
  if (daysRemaining < 0) return "Overdue";
  if (daysRemaining <= 7) return "Due Soon";
  return "Upcoming";
};

// Sort reminders by due date
const sortByDueDate = (reminders) => {
  return reminders.sort(
    (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
  );
};

module.exports = {
  getCurrentQuarter,
  getQuarterFromDate,
  calculateDaysRemaining,
  getReminderStatus,
  sortByDueDate,
};