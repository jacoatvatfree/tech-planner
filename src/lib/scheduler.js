import {
  calculateAvailableHours,
  createAllocation,
  isAllocationValid,
} from "./allocation";

const HOURS_PER_WEEK = 40; // Standard work week

export function calculateWeeksNeeded(hours) {
  return Math.ceil(hours / HOURS_PER_WEEK);
}

export function generateMermaidGantt(projects, engineers) {
  // Sort projects by priority
  const sortedProjects = [...projects].sort((a, b) => a.priority - b.priority);

  // Initialize engineer availability tracking (in weeks from start)
  const engineerAvailability = {};
  engineers.forEach((eng) => {
    engineerAvailability[eng.id] = 0; // Start at week 0
  });

  // Generate schedule and track assignments
  const assignments = [];
  const startDate = new Date();

  sortedProjects.forEach((project) => {
    if (!project.assignedEngineers?.length) return;

    // Calculate weeks needed per engineer
    const engineerCount = project.assignedEngineers.length;
    const hoursPerEngineer = Math.ceil(project.estimatedHours / engineerCount);
    const weeksNeeded = calculateWeeksNeeded(hoursPerEngineer);

    // Find when all assigned engineers are available
    const startWeek = Math.max(
      ...project.assignedEngineers.map(
        (engId) => engineerAvailability[engId] || 0,
      ),
    );

    // Record assignment and update engineer availability
    project.assignedEngineers.forEach((engId) => {
      assignments.push({
        projectName: project.name,
        engineerId: engId,
        startWeek,
        weeksNeeded,
      });
      engineerAvailability[engId] = startWeek + weeksNeeded;
    });
  });

  // Generate Mermaid markup
  let mermaidMarkup = "gantt\n";
  mermaidMarkup += "    dateFormat  YYYY-MM-DD\n";
  mermaidMarkup += `    title Project Schedule\n`;
  mermaidMarkup += "    excludes weekends\n\n";

  // Group by engineer
  engineers.forEach((engineer) => {
    mermaidMarkup += `    section ${engineer.name}\n`;

    const engineerAssignments = assignments.filter(
      (a) => a.engineerId === engineer.id,
    );
    engineerAssignments.forEach((assignment) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + assignment.startWeek * 7);
      const formattedStart = startDate.toISOString().split("T")[0];

      mermaidMarkup += `    ${assignment.projectName}    :${formattedStart}, ${assignment.weeksNeeded}w\n`;
    });
  });

  return mermaidMarkup;
}

/**
 * Calculate project duration based on allocations and estimated hours
 */
const calculateProjectDuration = (project, allocations) => {
  const totalAllocationPercentage = allocations.reduce(
    (sum, allocation) => sum + allocation.percentage,
    0,
  );

  const effectiveHoursPerWeek = (totalAllocationPercentage / 100) * 40;
  const durationWeeks = Math.ceil(
    project.estimatedHours / effectiveHoursPerWeek,
  );
  return durationWeeks * 7; // Convert to days
};

/**
 * Find the earliest possible start date for a project
 */
const findEarliestStartDate = (project, engineers) => {
  // Ensure baseDate is a Date object
  const baseDate = project.startAfter
    ? new Date(project.startAfter)
    : new Date();

  // Find the latest date when any required engineer becomes available
  const latestAvailability = Math.max(
    ...engineers.map((engineer) => {
      if (!engineer.allocations) return baseDate.getTime();

      const lastAllocation = [...(engineer.allocations || [])].sort((a, b) => {
        const dateA = new Date(b.endDate);
        const dateB = new Date(a.endDate);
        return dateA - dateB;
      })[0];

      return lastAllocation
        ? new Date(lastAllocation.endDate).getTime()
        : baseDate.getTime();
    }),
  );

  return new Date(Math.max(baseDate.getTime(), latestAvailability));
};

/**
 * Schedule projects based on priority and constraints
 */
export const scheduleProjects = (schedule) => {
  const prioritizedProjects = [...schedule.projects].sort(
    (a, b) => a.priority - b.priority,
  );

  const newSchedule = { ...schedule, projects: [] };

  for (const project of prioritizedProjects) {
    const startDate = findEarliestStartDate(project, schedule.engineers);
    const proposedAllocations = [];

    // Try to allocate engineers
    for (const engineer of schedule.engineers) {
      const availableHours = calculateAvailableHours(
        engineer,
        startDate,
        schedule.endDate,
      );

      if (availableHours > 0) {
        const allocation = createAllocation({
          projectId: project.id,
          engineerId: engineer.id,
          startDate,
          endDate: new Date(
            startDate.getTime() +
              calculateProjectDuration(project, proposedAllocations) * 86400000,
          ),
          percentage: Math.min(
            100,
            (project.estimatedHours / availableHours) * 100,
          ),
        });

        if (isAllocationValid(allocation, engineer, project)) {
          proposedAllocations.push(allocation);
        }
      }
    }

    if (proposedAllocations.length > 0) {
      newSchedule.projects.push({
        ...project,
        allocations: proposedAllocations,
      });
    }
  }

  return newSchedule;
};

/**
 * Calculate schedule metrics
 */
export const calculateScheduleMetrics = (schedule) => {
  const metrics = {
    engineerUtilization: {},
    projectCompletionDates: {},
    conflicts: [],
  };

  // Calculate engineer utilization
  schedule.engineers.forEach((engineer) => {
    const totalHoursAvailable =
      engineer.weeklyHours *
      ((schedule.endDate - schedule.startDate) / (7 * 86400000));

    const totalHoursAllocated = engineer.allocations.reduce(
      (sum, allocation) => {
        const durationWeeks =
          (allocation.endDate - allocation.startDate) / (7 * 86400000);
        return (
          sum +
          durationWeeks * engineer.weeklyHours * (allocation.percentage / 100)
        );
      },
      0,
    );

    metrics.engineerUtilization[engineer.id] =
      (totalHoursAllocated / totalHoursAvailable) * 100;
  });

  // Calculate project completion dates and find conflicts
  schedule.projects.forEach((project) => {
    const lastAllocation = [...project.allocations].sort(
      (a, b) => b.endDate - a.endDate,
    )[0];

    metrics.projectCompletionDates[project.id] = lastAllocation?.endDate;

    if (project.endBefore && lastAllocation?.endDate > project.endBefore) {
      metrics.conflicts.push({
        type: "deadline_missed",
        projectId: project.id,
        expected: project.endBefore,
        actual: lastAllocation.endDate,
      });
    }
  });

  return metrics;
};
