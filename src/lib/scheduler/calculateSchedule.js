import { dateUtils } from "./dateUtils";

// Project scheduling helper functions
const schedulingUtils = {
  calculateProjectDuration: (project, engineers) => {
    // Calculate total hours per day across all allocations
    const hoursPerDay = project.allocations.reduce((sum, allocation) => {
      const engineer = engineers.find((e) => e.id === allocation.engineerId);
      if (!engineer) return sum;
      const percentage = allocation.percentage || 100;
      const engineerDailyHours = (engineer.weeklyHours || 40) / 5;
      return sum + engineerDailyHours * (percentage / 100);
    }, 0);

    // Calculate days needed by dividing total project hours by combined daily hours
    const daysNeeded = Math.ceil(project.estimatedHours / hoursPerDay);
    return daysNeeded / 5; // Convert to weeks
  },

  findOverlappingAssignments: (assignments, engineerId, startDate, endDate) => {
    return assignments
      .filter((a) => a.engineerId === engineerId)
      .filter((a) => {
        const assignmentStart = new Date(a.startDate);
        const assignmentEnd = dateUtils.addWorkingDays(
          assignmentStart,
          Math.ceil(a.weeksNeeded * 5),
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

        const proposedEndDate = dateUtils.addWorkingDays(
          candidateDate,
          Math.ceil(weeksNeeded * 5),
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

  // Convert assignments to scheduled projects format
  const scheduledProjects = projects.map((project) => {
    const projectAssignments = assignments.filter(
      (a) => a.projectId === project.id,
    );
    if (projectAssignments.length === 0) return project;

    const startDate = new Date(
      Math.min(...projectAssignments.map((a) => a.startDate)),
    );
    const endDate = new Date(
      Math.max(
        ...projectAssignments.map((a) => {
          const end = new Date(a.startDate);
          end.setDate(end.getDate() + Math.ceil(a.weeksNeeded * 5));
          return end;
        }),
      ),
    );

    return {
      ...project,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      assignments: projectAssignments,
    };
  });

  // Calculate resource utilization
  const calculateResourceUtilization = (
    scheduledProjects,
    availableEngineers,
  ) => {
    let totalAllocatedHours = 0;
    let totalAvailableHours = 0;

    // Get the full date range of the plan
    const projectsWithDates = scheduledProjects.filter(
      (p) => p.startDate && p.endDate,
    );

    if (projectsWithDates.length === 0) {
      return {
        allocated: 0,
        available: 0,
        percentage: 0,
      };
    }

    const planStart = new Date(
      Math.min(
        ...projectsWithDates.map((project) => new Date(project.startDate)),
      ),
    );
    const planEnd = new Date(
      Math.max(
        ...projectsWithDates.map((project) => new Date(project.endDate)),
      ),
    );

    // Ensure we have valid dates
    if (isNaN(planStart.getTime()) || isNaN(planEnd.getTime())) {
      console.warn("Invalid date range detected in resource calculation");
      return {
        allocated: 0,
        available: 0,
        percentage: 0,
      };
    }

    const totalWeeks = Math.max(
      1,
      Math.ceil((planEnd - planStart) / (7 * 24 * 60 * 60 * 1000)),
    );

    // Calculate total available capacity
    availableEngineers.forEach((engineer) => {
      const weeklyHours = engineer.weeklyHours || 40; // Using weeklyHours instead of hoursPerWeek
      totalAvailableHours += weeklyHours * totalWeeks;
    });

    // Calculate total allocated hours
    projectsWithDates.forEach((project) => {
      const projectStart = new Date(project.startDate);
      const projectEnd = new Date(project.endDate);

      if (isNaN(projectStart.getTime()) || isNaN(projectEnd.getTime())) {
        console.warn(`Invalid dates for project ${project.id}`);
        return;
      }

      const projectWeeks = Math.max(
        1,
        Math.ceil((projectEnd - projectStart) / (7 * 24 * 60 * 60 * 1000)),
      );

      project.assignments?.forEach((assignment) => {
        const engineer = availableEngineers.find(
          (e) => e.id === assignment.engineerId,
        );
        if (!engineer) return;

        const percentage = Number(assignment.percentage) || 0;
        const weeklyHours = engineer.weeklyHours || 40;
        const assignedHours = ((weeklyHours * percentage) / 100) * projectWeeks;
        totalAllocatedHours += assignedHours;
      });
    });

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
  };
  // Calculate resource utilization
  // const calculateResourceUtilization = (
  //   scheduledProjects,
  //   availableEngineers,
  // ) => {
  //   let totalAllocatedHours = 0;
  //   let totalAvailableHours = 0;
  //
  //   // Get the full date range of the plan
  //   const allDates = scheduledProjects
  //     .filter((p) => p.startDate && p.endDate)
  //     .flatMap((project) => [
  //       new Date(project.startDate),
  //       new Date(project.endDate),
  //     ]);
  //
  //   if (allDates.length === 0) {
  //     return {
  //       allocated: 0,
  //       available: 0,
  //       percentage: 0,
  //     };
  //   }
  //
  //   const planStart = new Date(Math.min(...allDates));
  //   const planEnd = new Date(Math.max(...allDates));
  //   const totalWeeks = Math.ceil(
  //     (planEnd - planStart) / (7 * 24 * 60 * 60 * 1000),
  //   );
  //
  //   // Calculate total available capacity
  //   availableEngineers.forEach((engineer) => {
  //     const weeklyHours = engineer.hoursPerWeek || 40;
  //     totalAvailableHours += weeklyHours * totalWeeks;
  //   });
  //
  //   // Calculate total allocated hours
  //   scheduledProjects.forEach((project) => {
  //     if (!project.startDate || !project.endDate) return;
  //
  //     const projectStart = new Date(project.startDate);
  //     const projectEnd = new Date(project.endDate);
  //     const projectWeeks = Math.ceil(
  //       (projectEnd - projectStart) / (7 * 24 * 60 * 60 * 1000),
  //     );
  //
  //     project.assignments?.forEach((assignment) => {
  //       const percentage = Number(assignment.percentage) || 0;
  //       const weeklyHours = Number(project.hoursPerWeek) || 40;
  //       const assignedHours = ((weeklyHours * percentage) / 100) * projectWeeks;
  //       totalAllocatedHours += assignedHours;
  //     });
  //   });
  //
  //   return {
  //     allocated: Math.round(totalAllocatedHours * 10) / 10,
  //     available: Math.round(totalAvailableHours * 10) / 10,
  //     percentage:
  //       totalAvailableHours > 0
  //         ? Math.round((totalAllocatedHours / totalAvailableHours) * 1000) / 10
  //         : 0,
  //   };
  // };

  const resourceUtilization = calculateResourceUtilization(
    scheduledProjects,
    engineers,
  );

  console.log("Assignments:", assignments);
  console.log("Scheduled Projects:", scheduledProjects);
  console.log("Resource Utilization:", resourceUtilization);

  return {
    assignments,
    scheduledProjects,
    resourceUtilization,
  };
}
