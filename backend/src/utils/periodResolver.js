// Converts a period selection from the form into a concrete date range
// and a human-readable label, so every report service can share this logic.

function resolvePeriod(periodKey, year) {
  const now = new Date();

  switch (periodKey) {
    case "current_month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const label = start.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      });
      return { startDate: start, endDate: end, label };
    }

    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      const label = start.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      });
      return { startDate: start, endDate: end, label };
    }

    case "current_year": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { startDate: start, endDate: end, label: `${now.getFullYear()}` };
    }

    case "Q1":
    case "Q2":
    case "Q3":
    case "Q4": {
      const quarterMonths = { Q1: [0, 2], Q2: [3, 5], Q3: [6, 8], Q4: [9, 11] };
      const [startMonth, endMonth] = quarterMonths[periodKey];
      const start = new Date(year, startMonth, 1);
      const end = new Date(year, endMonth + 1, 0);
      return { startDate: start, endDate: end, label: `${periodKey} ${year}` };
    }

    default:
      throw new Error(`Unknown period: ${periodKey}`);
  }
}

module.exports = { resolvePeriod };
