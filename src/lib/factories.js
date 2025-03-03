import { v4 as uuidv4 } from "uuid";

/**
 * Create a new team member
 */
export const makeTeamMember = ({ name, weeklyHours = 40 }) => ({
  id: uuidv4(),
  name,
  weeklyHours,
});

/**
 * Alias for backward compatibility
 */
export const makeEngineer = makeTeamMember;

/**
 * Create a new project
 */
export const makeProject = ({
  name,
  description = "",
  estimatedHours,
  startAfter = null,
  endBefore = null,
  priority = 3,
  teamMemberIds = [],
  allocations = [], // Keep for backward compatibility
  percentComplete = 0,
}) => ({
  id: uuidv4(),
  name,
  description,
  estimatedHours,
  startAfter,
  endBefore,
  priority,
  teamMemberIds,
  allocations, // Keep for backward compatibility
  percentComplete,
});

/**
 * Create a new allocation
 */
export const makeAllocation = ({
  projectId,
  engineerId, // Keep engineerId for backward compatibility
  startDate,
  endDate,
  percentage = 100,
}) => ({
  projectId,
  engineerId, // This remains engineerId for backward compatibility with existing data
  startDate: new Date(startDate),
  endDate: new Date(endDate),
  percentage,
});

/**
 * Create a new schedule
 */
export const makeSchedule = ({
  startDate,
  endDate,
  projects = [],
  engineers = [], // Keep engineers for backward compatibility
}) => ({
  startDate: new Date(startDate),
  endDate: new Date(endDate),
  projects,
  engineers, // This remains engineers for backward compatibility with existing data
});

/**
 * Create a new plan
 */
export const makePlan = ({ name, startDate, endDate, excludes = [] }) => ({
  id: uuidv4(),
  name,
  startDate: new Date(startDate),
  endDate: new Date(endDate),
  excludes,
});
