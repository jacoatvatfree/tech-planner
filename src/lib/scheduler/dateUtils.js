export const dateUtils = {
  normalize: (date) => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  toISOLocalString: (d) => {
    d.setTime(d.getTime() - d.getTimezoneOffset() * 60000);
    return d.toISOString().split("T")[0].replace("-", "/");
  },

  isWeekend: (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  },

  getNextWeekday: (date) => {
    const result = new Date(date);
    // If it's a weekend, move to next Monday
    if (dateUtils.isWeekend(result)) {
      while (dateUtils.isWeekend(result)) {
        result.setDate(result.getDate() + 1);
      }
    } else {
      // If it's a Sunday (0) or Saturday (6), move to Monday
      const day = result.getDay();
      if (day === 0) {
        result.setDate(result.getDate() + 1);
      } else if (day === 6) {
        result.setDate(result.getDate() + 2);
      }
    }
    return result;
  },

  addBusinessDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + Math.ceil(days));
    return dateUtils.getNextWeekday(result);
  },

  addWorkingDays: (date, workDays) => {
    const result = new Date(date);
    let daysAdded = 0;

    while (daysAdded < workDays) {
      result.setDate(result.getDate() + 1);
      if (!dateUtils.isWeekend(result)) {
        daysAdded++;
      }
    }

    return result;
  },
};
