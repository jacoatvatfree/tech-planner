import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger";
import { deprecatedLogEngineerTerminology } from "../utils/deprecatedCompatibility";

/**
 * Create a new team member
 */
export const makeTeamMember = ({ name, weeklyHours = 40 }) => ({
  id: uuidv4(),
  name,
  weeklyHours,
});

/**
 * @deprecated Use makeTeamMember instead
 * This function is used for backward compatibility and will be removed in a future version.
 */
export const makeEngineer = (data) => {
  deprecatedLogEngineerTerminology();
  return makeTeamMember(data);
};

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
  allocations = [], // Parameter kept for backward compatibility
  percentComplete = 0,
}) => {
  // Convert allocations to teamMemberIds if needed
  let finalTeamMemberIds = teamMemberIds;
  if (!teamMemberIds.length && allocations.length) {
    finalTeamMemberIds = [...new Set(allocations.map(allocation => allocation.engineerId))];
    logger.warn("DEPRECATED: Converting allocations to teamMemberIds in makeProject");
  }
  
  return {
    id: uuidv4(),
    name,
    description,
    estimatedHours,
    startAfter,
    endBefore,
    priority,
    teamMemberIds: finalTeamMemberIds,
    // allocations property is intentionally omitted to adopt the new schema
    percentComplete,
  };
};

/**
 * @deprecated Create a new allocation
 * This function is used for backward compatibility and will be removed in a future version.
 * Projects should use teamMemberIds instead of allocations.
 */
export const makeAllocation = ({
  projectId,
  engineerId, // Keep engineerId for backward compatibility
  startDate,
  endDate,
  percentage = 100,
}) => {
  logger.warn("DEPRECATED: Creating allocations - use teamMemberIds instead");
  return {
    projectId,
    engineerId, // This remains engineerId for backward compatibility with existing data
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    percentage,
  };
};

/**
 * @deprecated Create a new schedule
 * This function is used for backward compatibility and will be removed in a future version.
 */
export const makeSchedule = ({
  startDate,
  endDate,
  projects = [],
  engineers = [], // Keep engineers for backward compatibility
}) => {
  if (engineers.length > 0) {
    deprecatedLogEngineerTerminology();
  }
  
  return {
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    projects,
    engineers, // This remains engineers for backward compatibility with existing data
  };
};

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
