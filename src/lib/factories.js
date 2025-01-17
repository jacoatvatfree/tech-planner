import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new engineer
 */
export const makeEngineer = ({
  name,
  weeklyHours = 40,
  allocations = []
}) => ({
  id: uuidv4(),
  name,
  weeklyHours,
  allocations
});

/**
 * Create a new project
 */
export const makeProject = ({
  name,
  estimatedHours,
  startAfter = null,
  endBefore = null,
  priority = 3,
  allocations = []
}) => ({
  id: uuidv4(),
  name,
  estimatedHours,
  startAfter,
  endBefore,
  priority,
  allocations
});

/**
 * Create a new schedule
 */
export const makeSchedule = ({
  startDate,
  endDate,
  projects = [],
  engineers = []
}) => ({
  startDate: new Date(startDate),
  endDate: new Date(endDate),
  projects,
  engineers
});
