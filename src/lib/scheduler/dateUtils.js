function parseExclude(exclude) {
  if (typeof exclude === "object") return exclude;

  const weekdayMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    weekends: [0, 6],
    weekdays: [1, 2, 3, 4, 5],
  };

  const day = exclude.toLowerCase();
  if (weekdayMap[day]) {
    return Array.isArray(weekdayMap[day])
      ? weekdayMap[day].map((d) => ({ weekday: d }))
      : [{ weekday: weekdayMap[day] }];
  }

  // Try to parse as date if it's not a named day
  const date = new Date(exclude);
  if (!isNaN(date.getTime())) {
    return [{ date: date.toISOString() }];
  }

  return null;
}

export const dateUtils = {
  isExcludedDate: (date, excludes) => {
    if (!excludes?.length) return false;

    const dayjs = new Date(date);
    const parsedExcludes = excludes.flatMap((exclude) => {
      const parsed = parseExclude(exclude);
      return parsed || [];
    });

    return parsedExcludes.some((exclude) => {
      // Handle specific dates
      if (exclude.date) {
        const excludeDate = new Date(exclude.date);
        return (
          dayjs.getFullYear() === excludeDate.getFullYear() &&
          dayjs.getMonth() === excludeDate.getMonth() &&
          dayjs.getDate() === excludeDate.getDate()
        );
      }
      // Handle weekdays (0 = Sunday, 6 = Saturday)
      if (exclude.weekday !== undefined) {
        return dayjs.getDay() === exclude.weekday;
      }
      return false;
    });
  },
  normalize: (date) => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  toISOLocalString: (d) => {
    d.setTime(d.getTime() - d.getTimezoneOffset() * 60000);
    return d.toISOString().split("T")[0].replace(/-/g, "/");
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

  addWorkingDays: (date, workDays, excludes = []) => {
    const result = new Date(date);
    let daysAdded = 0;

    while (daysAdded < workDays) {
      result.setDate(result.getDate() + 1);
      if (
        !dateUtils.isWeekend(result) &&
        !dateUtils.isExcludedDate(result, excludes)
      ) {
        daysAdded++;
      }
    }

    return result;
  },
};
