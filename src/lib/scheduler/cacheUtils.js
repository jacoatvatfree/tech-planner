import { clearCalculationCache } from './calculateSchedule';
import { clearMarkupCache } from './generateGanttMarkup';
import logger from '../../utils/logger';

/**
 * Clears all caches used for scheduling and Gantt chart generation
 * This should be called whenever project or team member data changes
 */
export function clearAllCaches() {
  clearCalculationCache();
  clearMarkupCache();
  logger.info('All scheduling caches cleared');
}
