// Date utility functions
const dateUtils = {
  normalize: (date) => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  isWeekend: (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  },

  getNextWeekday: (date) => {
    const result = new Date(date);
    while (dateUtils.isWeekend(result)) {
      result.setDate(result.getDate() + 1);
    }
    return result;
  },

  addBusinessDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + Math.ceil(days));
    return dateUtils.getNextWeekday(result);
  },
};

// Project scheduling helper functions
const schedulingUtils = {
  calculateProjectDuration: (project, engineers) => {
    const hoursPerWeek = project.allocations.reduce((sum, allocation) => {
      const engineer = engineers.find((e) => e.id === allocation.engineerId);
      if (!engineer) return sum;
      const percentage = allocation.percentage || 100;
      const engineerWeeklyHours = engineer.weeklyHours || 40;
      return sum + engineerWeeklyHours * (percentage / 100);
    }, 0);

    const daysNeeded = project.estimatedHours / (hoursPerWeek / 5);
    return daysNeeded / 5; // Convert to weeks
  },

  findOverlappingAssignments: (assignments, engineerId, startDate, endDate) => {
    return assignments
      .filter((a) => a.engineerId === engineerId)
      .filter((a) => {
        const assignmentStart = new Date(a.startDate);
        const assignmentEnd = dateUtils.addBusinessDays(
          assignmentStart,
          a.weeksNeeded * 5,
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

export function calculateSchedule(projects, engineers) {
  if (!projects?.length || !engineers?.length) {
    return [];
  }

  const assignments = [];

  const baseDate = dateUtils.normalize(
    projects.reduce((earliest, project) => {
      if (!project.startAfter) return earliest;
      const projectStart = new Date(project.startAfter);
      return projectStart < earliest ? projectStart : earliest;
    }, new Date()),
  );

  const sortedProjects = [...projects].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const aStart = a.startAfter ? new Date(a.startAfter) : baseDate;
    const bStart = b.startAfter ? new Date(b.startAfter) : baseDate;
    return aStart - bStart;
  });

  for (const project of sortedProjects) {
    if (!project.allocations?.length || !project.estimatedHours) {
      console.warn(
        `Project ${project.name} skipped - missing allocations or hours`,
      );
      continue;
    }

    const weeksNeeded = schedulingUtils.calculateProjectDuration(
      project,
      engineers,
    );

    // Calculate weeks between base date and project start date
    const projectStartDate = project.startAfter
      ? new Date(project.startAfter)
      : baseDate;

    // Find a common start date where all engineers have capacity
    let commonStartDate = null;

    // First, find the latest individual start date among all engineers
    let latestPossibleStart = new Date(
      Math.max(
        project.startAfter
          ? new Date(project.startAfter).getTime()
          : baseDate.getTime(),
        baseDate.getTime(),
      ),
    );

    // For each engineer, find their earliest possible start date
    for (const allocation of project.allocations) {
      const engineer = engineers.find((e) => e.id === allocation.engineerId);
      if (!engineer) continue;

      const engineerLastProject = assignments
        .filter((a) => a.engineerId === engineer.id)
        .sort((a, b) => {
          const aEnd = new Date(a.startDate);
          aEnd.setDate(aEnd.getDate() + Math.ceil(a.weeksNeeded * 5));
          const bEnd = new Date(b.startDate);
          bEnd.setDate(bEnd.getDate() + Math.ceil(b.weeksNeeded * 5));
          return bEnd - aEnd;
        })
        .pop();

      const engineerEarliestStart = engineerLastProject
        ? new Date(engineerLastProject.startDate)
        : new Date(latestPossibleStart);

      if (engineerEarliestStart > latestPossibleStart) {
        latestPossibleStart = new Date(engineerEarliestStart);
      }
    }

    // Ensure it's a weekday
    latestPossibleStart = dateUtils.getNextWeekday(latestPossibleStart);

    // Now find a date where all engineers have enough capacity
    let searching = true;
    let candidateDate = new Date(latestPossibleStart);

    while (searching) {
      const allEngineersAvailable = project.allocations.every((allocation) => {
        const engineer = engineers.find((e) => e.id === allocation.engineerId);
        if (!engineer) return false;

        const proposedEndDate = dateUtils.addBusinessDays(
          candidateDate,
          weeksNeeded * 5,
        );

        const overlappingAssignments =
          schedulingUtils.findOverlappingAssignments(
            assignments,
            engineer.id,
            candidateDate,
            proposedEndDate,
          );

        if (
          schedulingUtils.hasHigherPriorityConflict(
            overlappingAssignments,
            project,
            sortedProjects,
          )
        ) {
          return false;
        }

        const currentWorkload = schedulingUtils.calculateCurrentWorkload(
          overlappingAssignments,
          project,
          sortedProjects,
        );

        return currentWorkload + (allocation.percentage || 100) <= 100;
      });

      if (allEngineersAvailable) {
        commonStartDate = new Date(candidateDate);
        searching = false;
      } else {
        do {
          candidateDate.setDate(candidateDate.getDate() + 1);
        } while (dateUtils.isWeekend(candidateDate));
      }
    }

    // Calculate weeks between base date and common start date
    const latestStartWeek = Math.ceil(
      (commonStartDate - baseDate) / (7 * 24 * 60 * 60 * 1000),
    );

    // Add an assignment for each allocation using the common start date
    project.allocations.forEach((allocation) => {
      const engineer = engineers.find((e) => e.id === allocation.engineerId);
      if (!engineer) return;

      // Use the common start date for all engineers
      const startDate = commonStartDate;

      assignments.push({
        projectId: project.id,
        projectName: project.name,
        engineerId: engineer.id,
        startWeek: latestStartWeek,
        weeksNeeded,
        percentage: allocation.percentage || 100,
        startDate: dateUtils.normalize(startDate),
      });
    });
  }

  console.log(assignments);
  return assignments;
}
