import { dateUtils } from "./dateUtils";
import logger from "../../utils/logger";

// Project scheduling helper functions
const schedulingUtils = {
  isExcludedDate: (date, excludes) => {
    if (!excludes?.length) return false;
    return dateUtils.isExcludedDate(date, excludes);
  },

  getNextWorkingDate: (date, excludes) => {
    let currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() + 1);

    while (
      dateUtils.isWeekend(currentDate) ||
      dateUtils.isExcludedDate(currentDate, excludes)
    ) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return currentDate;
  },

  calculateWorkingDays: (startDate, endDate, excludes) => {
    let days = 0;
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      if (
        !dateUtils.isWeekend(currentDate) &&
        !dateUtils.isExcludedDate(currentDate, excludes)
      ) {
        days++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  },
  calculateProjectDuration: (project, engineers, excludes) => {
    // Calculate total hours per day across all allocations
    const hoursPerDay = project.allocations.reduce((sum, allocation) => {
      const engineer = engineers.find((e) => e.id === allocation.engineerId);
      if (!engineer) return sum;
      const percentage = allocation.percentage || 100;
      const engineerDailyHours = (engineer.weeklyHours || 40) / 5;
      return sum + engineerDailyHours * (percentage / 100);
    }, 0);

    // Calculate days needed by dividing total project hours by combined daily hours
    let remainingHours = project.estimatedHours;
    let workDays = 0;
    let currentDate = new Date();

    while (remainingHours > 0) {
      if (
        !dateUtils.isWeekend(currentDate) &&
        !dateUtils.isExcludedDate(currentDate, excludes)
      ) {
        remainingHours -= hoursPerDay;
        workDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return workDays / 5; // Convert to weeks
  },

  findOverlappingAssignments: (
    assignments,
    engineerId,
    startDate,
    endDate,
    excludes,
  ) => {
    return assignments
      .filter((a) => a.engineerId === engineerId)
      .filter((a) => {
        const assignmentStart = new Date(a.startDate);
        const assignmentEnd = dateUtils.addWorkingDays(
          assignmentStart,
          Math.ceil(a.weeksNeeded * 5),
          excludes,
        );
        return !(endDate <= assignmentStart || startDate >= assignmentEnd);
      });
  },

  hasHigherPriorityConflict: (
    overlappingAssignments,
    project,
    sortedProjects,
  ) => {
    return overlappingAssignments.some((a) => {
      const assignmentProject = sortedProjects.find(
        (p) => p.id === a.projectId,
      );
      return assignmentProject && assignmentProject.priority < project.priority;
    });
  },

  calculateCurrentWorkload: (
    overlappingAssignments,
    project,
    sortedProjects,
  ) => {
    return overlappingAssignments
      .filter((a) => {
        const assignmentProject = sortedProjects.find(
          (p) => p.id === a.projectId,
        );
        return (
          assignmentProject && assignmentProject.priority >= project.priority
        );
      })
      .reduce((total, a) => total + (a.percentage || 100), 0);
  },
};

// Cache for expensive calculations
const calculationCache = {
  projectDuration: new Map(),
  overlappingAssignments: new Map(),
  workloadCache: new Map(),
};

// Clear cache when needed - exported for use in stores
export function clearCalculationCache() {
  calculationCache.projectDuration.clear();
  calculationCache.overlappingAssignments.clear();
  calculationCache.workloadCache.clear();
  logger.debug("Calculation cache cleared");
}

// Memoized version of calculateProjectDuration
function memoizedCalculateProjectDuration(project, engineers, excludes) {
  const cacheKey = `${project.id}_${project.estimatedHours}_${JSON.stringify(project.allocations)}`;
  
  if (calculationCache.projectDuration.has(cacheKey)) {
    return calculationCache.projectDuration.get(cacheKey);
  }
  
  const result = schedulingUtils.calculateProjectDuration(project, engineers, excludes);
  calculationCache.projectDuration.set(cacheKey, result);
  return result;
}

// Memoized version of findOverlappingAssignments
function memoizedFindOverlappingAssignments(assignments, engineerId, startDate, endDate, excludes) {
  const startStr = startDate.toISOString();
  const endStr = endDate.toISOString();
  const cacheKey = `${engineerId}_${startStr}_${endStr}`;
  
  if (calculationCache.overlappingAssignments.has(cacheKey)) {
    return calculationCache.overlappingAssignments.get(cacheKey);
  }
  
  const result = schedulingUtils.findOverlappingAssignments(
    assignments, engineerId, startDate, endDate, excludes
  );
  calculationCache.overlappingAssignments.set(cacheKey, result);
  return result;
}

// Find the base date for scheduling
function findBaseDate(projects) {
  return dateUtils.normalize(
    projects.reduce((earliest, project) => {
      if (!project.startAfter) return earliest;
      const projectStart = new Date(project.startAfter);
      return projectStart < earliest ? projectStart : earliest;
    }, new Date())
  );
}

// Sort projects by priority and start date
function sortProjects(projects, baseDate) {
  return [...projects].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const aStart = a.startAfter ? new Date(a.startAfter) : baseDate;
    const bStart = b.startAfter ? new Date(b.startAfter) : baseDate;
    return aStart - bStart;
  });
}

// Find a common start date for a project where all engineers have capacity
function findCommonStartDate(project, engineers, assignments, baseDate, weeksNeeded, planExcludes, sortedProjects) {
  // Use project's startAfter date if specified, otherwise use the plan's base date
  let latestPossibleStart = new Date(
    Math.max(
      project.startAfter
        ? new Date(project.startAfter).getTime()
        : baseDate.getTime(),
      baseDate.getTime()
    )
  );

  // For each engineer, find their earliest possible start date
  for (const allocation of project.allocations) {
    const engineer = engineers.find((e) => e.id === allocation.engineerId);
    if (!engineer) continue;

    // Find the engineer's last project
    const engineerAssignments = assignments.filter((a) => a.engineerId === engineer.id);
    let latestEndDate = latestPossibleStart;
    
    for (const assignment of engineerAssignments) {
      const assignmentEnd = dateUtils.addWorkingDays(
        new Date(assignment.startDate),
        Math.ceil(assignment.weeksNeeded * 5),
        planExcludes
      );
      
      if (assignmentEnd > latestEndDate) {
        latestEndDate = assignmentEnd;
      }
    }

    if (latestEndDate > latestPossibleStart) {
      latestPossibleStart = new Date(latestEndDate);
    }
  }

  // Ensure it's not a weekend or excluded date
  while (
    dateUtils.isWeekend(latestPossibleStart) ||
    dateUtils.isExcludedDate(latestPossibleStart, planExcludes)
  ) {
    latestPossibleStart.setDate(latestPossibleStart.getDate() + 1);
  }

  // Now find a date where all engineers have enough capacity
  let candidateDate = new Date(latestPossibleStart);
  let maxIterations = 365; // Safety limit to prevent infinite loops
  let iterations = 0;

  // Check if any allocation has a specific start date
  // Only consider allocations for engineers that exist in the current plan
  const allocationsWithDates = project.allocations.filter(
    a => a.startDate && 
         new Date(a.startDate).getTime() > 0 && 
         engineers.some(e => e.id === a.engineerId)
  );
  
  if (allocationsWithDates.length > 0) {
    // Use the latest start date from allocations
    const latestAllocationStart = new Date(
      Math.max(...allocationsWithDates.map(a => new Date(a.startDate).getTime()))
    );
    
    // Only use allocation date if it's after our calculated start
    if (latestAllocationStart > candidateDate) {
      candidateDate = latestAllocationStart;
    }
  }

  while (iterations < maxIterations) {
    iterations++;
    
    const allEngineersAvailable = project.allocations.every((allocation) => {
      const engineer = engineers.find((e) => e.id === allocation.engineerId);
      if (!engineer) return false;

      const proposedEndDate = dateUtils.addWorkingDays(
        candidateDate,
        Math.ceil(weeksNeeded * 5),
        planExcludes
      );

      const overlappingAssignments = memoizedFindOverlappingAssignments(
        assignments,
        engineer.id,
        candidateDate,
        proposedEndDate,
        planExcludes
      );

      if (
        schedulingUtils.hasHigherPriorityConflict(
          overlappingAssignments,
          project,
          sortedProjects
        )
      ) {
        return false;
      }

      const workloadCacheKey = `${engineer.id}_${candidateDate.toISOString()}`;
      let currentWorkload;
      
      if (calculationCache.workloadCache.has(workloadCacheKey)) {
        currentWorkload = calculationCache.workloadCache.get(workloadCacheKey);
      } else {
        currentWorkload = schedulingUtils.calculateCurrentWorkload(
          overlappingAssignments,
          project,
          sortedProjects
        );
        calculationCache.workloadCache.set(workloadCacheKey, currentWorkload);
      }

      return currentWorkload + (allocation.percentage || 100) <= 100;
    });

    if (allEngineersAvailable) {
      return candidateDate;
    }

    // Move to next working day
    do {
      candidateDate.setDate(candidateDate.getDate() + 1);
    } while (
      dateUtils.isWeekend(candidateDate) ||
      dateUtils.isExcludedDate(candidateDate, planExcludes)
    );
  }

  // If we reach here, we couldn't find a suitable date within the iteration limit
  // Return the plan's base date as a fallback to avoid scheduling far in the future
  logger.warn(`Could not find suitable start date for project within ${maxIterations} iterations. Using plan base date.`);
  return baseDate;
}

// Create assignments for a project
function createAssignments(project, engineers, commonStartDate, baseDate, weeksNeeded, planExcludes) {
  const newAssignments = [];
  const latestStartWeek = Math.ceil(
    (commonStartDate - baseDate) / (7 * 24 * 60 * 60 * 1000)
  );

  for (const allocation of project.allocations) {
    const engineer = engineers.find((e) => e.id === allocation.engineerId);
    if (!engineer) continue;

    newAssignments.push({
      projectId: project.id,
      projectName: project.name,
      engineerId: engineer.id,
      startWeek: latestStartWeek,
      weeksNeeded,
      percentage: allocation.percentage || 100,
      startDate: dateUtils.normalize(commonStartDate),
    });
  }

  return newAssignments;
}

// Convert assignments to scheduled projects
function createScheduledProjects(projects, assignments, planExcludes) {
  return projects.map((project) => {
    const projectAssignments = assignments.filter(
      (a) => a.projectId === project.id
    );
    
    if (projectAssignments.length === 0) return project;

    // Find the earliest start date among all assignments for this project
    const startDates = projectAssignments.map(a => new Date(a.startDate));
    const startDate = new Date(Math.min(...startDates));

    // Calculate the latest end date
    const endDates = projectAssignments.map(a => {
      return dateUtils.addWorkingDays(
        new Date(a.startDate),
        Math.ceil(a.weeksNeeded * 5),
        planExcludes
      );
    });
    const endDate = new Date(Math.max(...endDates));

    return {
      ...project,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      assignments: projectAssignments,
    };
  });
}

// Calculate resource utilization
function calculateResourceUtilization(scheduledProjects, availableEngineers) {
  let totalAllocatedHours = 0;
  let totalAvailableHours = 0;

  // Get projects with valid dates
  const projectsWithDates = scheduledProjects.filter(
    (p) => p.startDate && p.endDate
  );

  if (projectsWithDates.length === 0) {
    return {
      allocated: 0,
      available: 0,
      percentage: 0,
    };
  }

  // Find plan date range
  const startDates = projectsWithDates.map(p => new Date(p.startDate));
  const endDates = projectsWithDates.map(p => new Date(p.endDate));
  
  const planStart = new Date(Math.min(...startDates));
  const planEnd = new Date(Math.max(...endDates));

  // Ensure we have valid dates
  if (isNaN(planStart.getTime()) || isNaN(planEnd.getTime())) {
    return {
      allocated: 0,
      available: 0,
      percentage: 0,
    };
  }

  const totalWeeks = Math.max(
    1,
    Math.ceil((planEnd - planStart) / (7 * 24 * 60 * 60 * 1000))
  );

  // Calculate total available capacity
  for (const engineer of availableEngineers) {
    const weeklyHours = engineer.weeklyHours || 40;
    totalAvailableHours += weeklyHours * totalWeeks;
  }

  // Calculate total allocated hours
  for (const project of projectsWithDates) {
    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.endDate);

    if (isNaN(projectStart.getTime()) || isNaN(projectEnd.getTime())) {
      continue;
    }

    const projectWeeks = Math.max(
      1,
      Math.ceil((projectEnd - projectStart) / (7 * 24 * 60 * 60 * 1000))
    );

    if (project.assignments) {
      for (const assignment of project.assignments) {
        const engineer = availableEngineers.find(
          (e) => e.id === assignment.engineerId
        );
        if (!engineer) continue;

        const percentage = Number(assignment.percentage) || 0;
        const weeklyHours = engineer.weeklyHours || 40;
        const assignedHours = ((weeklyHours * percentage) / 100) * projectWeeks;
        totalAllocatedHours += assignedHours;
      }
    }
  }

  // Ensure we don't return negative or NaN values
  totalAllocatedHours = Math.max(0, totalAllocatedHours);
  totalAvailableHours = Math.max(0, totalAvailableHours);

  return {
    allocated: Math.round(totalAllocatedHours * 10) / 10,
    available: Math.round(totalAvailableHours * 10) / 10,
    percentage:
      totalAvailableHours > 0
        ? Math.round((totalAllocatedHours / totalAvailableHours) * 1000) / 10
        : 0,
  };
}

// Main schedule calculation function
export function calculateSchedule(projects, engineers, planExcludes = []) {
  // Early return for empty inputs
  if (!projects?.length || !engineers?.length) {
    return {
      assignments: [],
      scheduledProjects: [],
      resourceUtilization: {
        allocated: 0,
        available: 0,
        percentage: 0,
      },
    };
  }

  // Clear calculation cache
  clearCalculationCache();
  
  // Initialize assignments array
  const assignments = [];
  
  // Find base date and sort projects
  const baseDate = findBaseDate(projects);
  const sortedProjects = sortProjects(projects, baseDate);

  // Process each project
  for (const project of sortedProjects) {
    // Skip projects without allocations or hours
    if (!project.allocations?.length || !project.estimatedHours) {
      continue;
    }
    
    // Filter out allocations for engineers that don't exist in the current plan
    const validAllocations = project.allocations.filter(
      allocation => engineers.some(engineer => engineer.id === allocation.engineerId)
    );
    
    // Skip if no valid allocations remain
    if (validAllocations.length === 0) {
      logger.warn(`Project ${project.name} has no valid allocations for the current plan`);
      continue;
    }
    
    // Create a copy of the project with only valid allocations
    const projectWithValidAllocations = {
      ...project,
      allocations: validAllocations
    };

    // Calculate project duration
    const weeksNeeded = memoizedCalculateProjectDuration(
      projectWithValidAllocations,
      engineers,
      planExcludes
    );

    // Find a common start date for all engineers
    const commonStartDate = findCommonStartDate(
      projectWithValidAllocations,
      engineers,
      assignments,
      baseDate,
      weeksNeeded,
      planExcludes,
      sortedProjects
    );

    // Create assignments for this project
    const projectAssignments = createAssignments(
      projectWithValidAllocations,
      engineers,
      commonStartDate,
      baseDate,
      weeksNeeded,
      planExcludes
    );

    // Add to the assignments array
    assignments.push(...projectAssignments);
  }

  // Convert assignments to scheduled projects
  const scheduledProjects = createScheduledProjects(
    projects,
    assignments,
    planExcludes
  );

  // Calculate resource utilization
  const resourceUtilization = calculateResourceUtilization(
    scheduledProjects,
    engineers
  );

  return {
    assignments,
    scheduledProjects,
    resourceUtilization,
  };
}
