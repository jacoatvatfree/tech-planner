/**
 * Logger utility for consistent logging with level control
 * 
 * Logging levels:
 * - ERROR: Only show errors
 * - WARN: Show errors and warnings
 * - INFO: Show errors, warnings, and info messages
 * - DEBUG: Show all messages including debug
 * - NONE: Disable all logging
 */

// Set the default log level (can be changed at runtime)
let currentLogLevel = process.env.NODE_ENV === 'production' ? 'ERROR' : 'WARN';

// Log levels with numeric values for comparison
const LOG_LEVELS = {
  NONE: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4
};

/**
 * Set the current logging level
 * @param {string} level - One of: 'NONE', 'ERROR', 'WARN', 'INFO', 'DEBUG'
 */
export function setLogLevel(level) {
  if (LOG_LEVELS[level] !== undefined) {
    currentLogLevel = level;
  } else {
    // Use console.error directly here since the logger isn't fully initialized
    console.error(`Invalid log level: ${level}. Using default: ${currentLogLevel}`);
  }
}

/**
 * Get the current logging level
 * @returns {string} The current log level
 */
export function getLogLevel() {
  return currentLogLevel;
}

/**
 * Check if a log level is enabled
 * @param {string} level - The log level to check
 * @returns {boolean} True if the level is enabled
 */
function isLevelEnabled(level) {
  return LOG_LEVELS[currentLogLevel] >= LOG_LEVELS[level];
}

/**
 * Format a log message with a prefix
 * @param {string} level - The log level
 * @param {string} message - The message to log
 * @param {any[]} args - Additional arguments to log
 * @returns {[string, ...any[]]} Formatted message and args
 */
function formatMessage(level, message, args) {
  const prefix = `[${level}]`;
  return [
    typeof message === 'string' ? `${prefix} ${message}` : message,
    ...args
  ];
}

// Logger object with methods for each log level
const logger = {
  /**
   * Log an error message
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments to log
   */
  error(message, ...args) {
    if (isLevelEnabled('ERROR')) {
      console.error(...formatMessage('ERROR', message, args));
    }
  },

  /**
   * Log a warning message
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments to log
   */
  warn(message, ...args) {
    if (isLevelEnabled('WARN')) {
      console.warn(...formatMessage('WARN', message, args));
    }
  },

  /**
   * Log an info message
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments to log
   */
  info(message, ...args) {
    if (isLevelEnabled('INFO')) {
      console.info(...formatMessage('INFO', message, args));
    }
  },

  /**
   * Log a debug message
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments to log
   */
  debug(message, ...args) {
    if (isLevelEnabled('DEBUG')) {
      console.debug(...formatMessage('DEBUG', message, args));
    }
  },

  /**
   * Log a message at a specific level
   * @param {string} level - The log level
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments to log
   */
  log(level, message, ...args) {
    switch (level) {
      case 'ERROR':
        this.error(message, ...args);
        break;
      case 'WARN':
        this.warn(message, ...args);
        break;
      case 'INFO':
        this.info(message, ...args);
        break;
      case 'DEBUG':
        this.debug(message, ...args);
        break;
      default:
        // Fall back to info level if an invalid level is provided
        this.info(message, ...args);
    }
  }
};

export default logger;
