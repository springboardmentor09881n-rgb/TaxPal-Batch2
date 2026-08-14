const getPeriodRange = (period, referenceDate = new Date()) => {
  const date = new Date(referenceDate);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid reference date");
  }

  let startDate;
  let endDate;

  switch (period) {
    case "current_month":
      startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
      break;

    case "last_month":
      startDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);
      endDate = new Date(date.getFullYear(), date.getMonth(), 0, 23, 59, 59, 999);
      break;

    case "q1":
      startDate = new Date(date.getFullYear(), 0, 1);
      endDate = new Date(date.getFullYear(), 2, 31, 23, 59, 59, 999);
      break;

    case "q2":
      startDate = new Date(date.getFullYear(), 3, 1);
      endDate = new Date(date.getFullYear(), 5, 30, 23, 59, 59, 999);
      break;

    case "q3":
      startDate = new Date(date.getFullYear(), 6, 1);
      endDate = new Date(date.getFullYear(), 8, 30, 23, 59, 59, 999);
      break;

    case "q4":
      startDate = new Date(date.getFullYear(), 9, 1);
      endDate = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;

    case "current_year":
      startDate = new Date(date.getFullYear(), 0, 1);
      endDate = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;

    default:
      throw new Error(`Unsupported period: ${period}`);
  }

  return {
    startDate,
    endDate,
  };
};

const isQuarterPeriod = (period) => {
  return ["q1", "q2", "q3", "q4"].includes(period);
};

module.exports = {
  getPeriodRange,
  isQuarterPeriod,
};