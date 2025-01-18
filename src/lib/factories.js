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
<<<<<<< HEAD
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
=======
export const makeAllocation = ({
  projectId,
  engineerId,
  startDate,
  endDate,
  percentage = 100
}) => ({
  projectId,
  engineerId,
  startDate: new Date(startDate),
  endDate: new Date(endDate),
  percentage
});

export const makeProject = ({
  name,
  description = "",
  estimatedHours,
  startAfter = null,
  endBefore = null,
  priority = 3,
  allocations = []
}) => ({
  id: uuidv4(),
  name,
  description,
  estimatedHours,
  startAfter,
  endBefore,
  priority,
  allocations
});
>>>>>>> Snippet

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
