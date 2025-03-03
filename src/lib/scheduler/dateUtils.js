// Cache for expensive date calculations
const dateCache = {
  excludedDates: new Map(),
  nextWeekday: new Map(),
  addWorkingDays: new Map(),
  parsedExcludes: new Map(),
};

// Clear cache when it gets too large
function clearDateCache() {
  if (dateCache.excludedDates.size > 1000 || 
      dateCache.nextWeekday.size > 1000 || 
      dateCache.addWorkingDays.size > 1000 ||
      dateCache.parsedExcludes.size > 100) {
    dateCache.excludedDates.clear();
    dateCache.nextWeekday.clear();
    dateCache.addWorkingDays.clear();
    dateCache.parsedExcludes.clear();
  }
}

// Parse exclude strings into structured objects
function parseExclude(exclude) {
  // Return early for already parsed objects
  if (typeof exclude === "object") return exclude;
  
  // Check cache first
  const cacheKey = String(exclude);
  if (dateCache.parsedExcludes.has(cacheKey)) {
    return dateCache.parsedExcludes.get(cacheKey);
  }

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

  let result = null;
  
  // Handle named days
  if (typeof exclude === "string") {
    const day = exclude.toLowerCase();
    if (weekdayMap[day]) {
      result = Array.isArray(weekdayMap[day])
        ? weekdayMap[day].map((d) => ({ weekday: d }))
        : [{ weekday: weekdayMap[day] }];
    } else {
      // Try to parse as date if it's not a named day
      const date = new Date(exclude);
      if (!isNaN(date.getTime())) {
        result = [{ date: date.toISOString() }];
      }
    }
  }
  
  // Cache the result
  dateCache.parsedExcludes.set(cacheKey, result);
  return result;
}

export const dateUtils = {
  // Check if a date is null, invalid, or epoch (1970-01-01)
  isNullOrEpochDate: (date) => {
    if (!date) return true;
    
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return true;
    
    // Check if it's the epoch date (1970-01-01)
    return dateObj.getFullYear() === 1970 && 
           dateObj.getMonth() === 0 && 
           dateObj.getDate() === 1;
  },
  
  // Check if a date is excluded based on the excludes list
  isExcludedDate: (date, excludes) => {
    if (!excludes?.length) return false;
    if (dateUtils.isNullOrEpochDate(date)) return false;

    // Create a cache key
    const dateStr = date instanceof Date ? date.toISOString() : new Date(date).toISOString();
    const excludesKey = Array.isArray(excludes) ? excludes.join(',') : String(excludes);
    const cacheKey = `${dateStr}_${excludesKey}`;
    
    // Check cache
    if (dateCache.excludedDates.has(cacheKey)) {
      return dateCache.excludedDates.get(cacheKey);
    }
    
    // Convert date to a consistent format
    const dayjs = new Date(date);
    
    // Parse excludes only once and cache the result
    const parsedExcludes = excludes.flatMap((exclude) => {
      const parsed = parseExclude(exclude);
      return parsed || [];
    });

    // Check if date is excluded
    const isExcluded = parsedExcludes.some((exclude) => {
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
    
    // Cache the result
    dateCache.excludedDates.set(cacheKey, isExcluded);
    return isExcluded;
  },
  
  // Normalize a date by setting time to midnight
  normalize: (date) => {
    if (dateUtils.isNullOrEpochDate(date)) return new Date();
    
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  // Convert date to ISO string with local timezone adjustment
  toISOLocalString: (d) => {
    if (dateUtils.isNullOrEpochDate(d)) return '';
    
    const copy = new Date(d);
    copy.setTime(copy.getTime() - copy.getTimezoneOffset() * 60000);
    return copy.toISOString().split("T")[0].replace(/-/g, "/");
  },

  // Check if a date is a weekend
  isWeekend: (date) => {
    if (dateUtils.isNullOrEpochDate(date)) return false;
    
    const day = date.getDay();
    return day === 0 || day === 6;
  },

  // Get the next weekday from a date
  getNextWeekday: (date) => {
    if (dateUtils.isNullOrEpochDate(date)) return new Date();
    
    // Create a cache key
    const dateStr = date instanceof Date ? date.toISOString() : new Date(date).toISOString();
    
    // Check cache
    if (dateCache.nextWeekday.has(dateStr)) {
      // Return a new date object to avoid mutation issues
      return new Date(dateCache.nextWeekday.get(dateStr));
    }
    
    const result = new Date(date);
    
    // If it's a weekend, move to next Monday
    if (dateUtils.isWeekend(result)) {
      // Limit iterations to prevent infinite loops
      let iterations = 0;
      while (dateUtils.isWeekend(result) && iterations < 7) {
        result.setDate(result.getDate() + 1);
        iterations++;
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
    
    // Cache the result
    dateCache.nextWeekday.set(dateStr, result.toISOString());
    return result;
  },

  // Add business days to a date
  addBusinessDays: (date, days) => {
    if (dateUtils.isNullOrEpochDate(date)) return new Date();
    if (!days || days <= 0) return new Date(date);
    
    const result = new Date(date);
    result.setDate(result.getDate() + Math.ceil(days));
    return dateUtils.getNextWeekday(result);
  },

  // Add working days to a date, skipping weekends and excluded dates
  addWorkingDays: (date, workDays, excludes = []) => {
    if (dateUtils.isNullOrEpochDate(date)) return new Date();
    if (!workDays || workDays <= 0) return new Date(date);
    
    // Create a cache key
    const dateStr = date instanceof Date ? date.toISOString() : new Date(date).toISOString();
    const excludesKey = Array.isArray(excludes) ? excludes.join(',') : String(excludes);
    const cacheKey = `${dateStr}_${workDays}_${excludesKey}`;
    
    // Check cache
    if (dateCache.addWorkingDays.has(cacheKey)) {
      // Return a new date object to avoid mutation issues
      return new Date(dateCache.addWorkingDays.get(cacheKey));
    }
    
    const result = new Date(date);
    let daysAdded = 0;
    let iterations = 0;
    const maxIterations = Math.min(workDays * 3, 1000); // Safety limit
    
    while (daysAdded < workDays && iterations < maxIterations) {
      result.setDate(result.getDate() + 1);
      iterations++;
      
      if (
        !dateUtils.isWeekend(result) &&
        !dateUtils.isExcludedDate(result, excludes)
      ) {
        daysAdded++;
      }
    }
    
    // Cache the result
    dateCache.addWorkingDays.set(cacheKey, result.toISOString());
    
    // Clear cache if it gets too large
    clearDateCache();
    
    return result;
  },
};
