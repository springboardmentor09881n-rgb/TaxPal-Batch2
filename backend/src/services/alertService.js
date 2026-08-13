const Alert = require("../models/Alert");
const { getQuarterlyDueDates } = require("./taxService");

async function generateQuarterlyAlerts(userId, year) {
  const dueDates = getQuarterlyDueDates(year);
  const alerts = [];

  for (const { quarter, dueDate } of dueDates) {
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - 14); 

    alerts.push({
      userId,
      type: "reminder",
      message: `Reminder: ${quarter} Estimated Tax Payment due on ${dueDate.toDateString()}`,
      alertDate: reminderDate,
    });

    alerts.push({
      userId,
      type: "payment",
      message: `${quarter} Estimated Tax Payment due`,
      alertDate: dueDate,
    });
  }

  return Alert.insertMany(alerts);
}

module.exports = { generateQuarterlyAlerts };
