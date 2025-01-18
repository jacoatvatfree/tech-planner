export function calculateSchedule(projects, engineers) {
  if (!projects?.length || !engineers?.length) {
    return [];
  }

  const assignments = [];
  // Track when each engineer becomes available
  const engineerAvailability = {};
  engineers.forEach((eng) => (engineerAvailability[eng.id] = 0));

  // Helper to normalize date to start of day
  const normalizeDate = (date) => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  };

  // Find earliest startAfter date from all projects
  const baseDate = normalizeDate(
    projects.reduce((earliest, project) => {
      if (!project.startAfter) return earliest;
      const projectStart = new Date(project.startAfter);
      return projectStart < earliest ? projectStart : earliest;
    }, new Date()),
  );

  // Sort projects by priority first, then by startAfter date
  const sortedProjects = [...projects].sort((a, b) => {
    // First sort by priority (lower number = higher priority)
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // Then sort by startAfter date if priority is the same
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

    // Calculate total hours per week available for this project based on allocations
    const hoursPerWeek = project.allocations.reduce((sum, allocation) => {
      const engineer = engineers.find((e) => e.id === allocation.engineerId);
      if (!engineer) return sum;

      const percentage = allocation.percentage || 100;
      // Use engineer's actual weekly hours * their allocation percentage
      const engineerWeeklyHours = engineer.weeklyHours || 40; // fallback to 40 if not specified
      return sum + engineerWeeklyHours * (percentage / 100);
    }, 0);

    // Calculate days needed based on hours (assuming 8-hour workdays)
    const daysNeeded = project.estimatedHours / (hoursPerWeek / 5);
    // Convert to weeks for internal scheduling
    const weeksNeeded = daysNeeded / 5;

    // Calculate weeks between base date and project start date
    const projectStartDate = project.startAfter
      ? new Date(project.startAfter)
      : baseDate;
    const weeksBetween = Math.floor(
      (projectStartDate - baseDate) / (7 * 24 * 60 * 60 * 1000),
    );

    // Find the latest available start week among all allocated engineers
    const latestStartWeek = Math.max(
      weeksBetween,
      ...project.allocations.map((allocation) => {
        const engineer = engineers.find((e) => e.id === allocation.engineerId);
        return engineer ? engineerAvailability[engineer.id] : 0;
      }),
    );

    // Add an assignment for each allocation
    project.allocations.forEach((allocation) => {
      const engineer = engineers.find((e) => e.id === allocation.engineerId);
      if (!engineer) return;

      // Find the actual date when the engineer becomes available
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

      // Find all ongoing projects for this engineer at the potential start time
      const getEngineerWorkload = (date) => {
        return assignments
          .filter((a) => a.engineerId === engineer.id)
          .filter((a) => {
            const assignmentStart = new Date(a.startDate);
            const assignmentEnd = new Date(a.startDate);
            assignmentEnd.setDate(
              assignmentEnd.getDate() + Math.ceil(a.weeksNeeded * 5),
            );
            return date >= assignmentStart && date <= assignmentEnd;
          })
          .reduce((total, a) => total + (a.percentage || 100), 0);
      };

      // Find the earliest date where the engineer has enough capacity
      let startDate = engineerLastProject
        ? new Date(engineerLastProject.startDate)
        : new Date(
            Math.max(
              project.startAfter
                ? new Date(project.startAfter).getTime()
                : baseDate.getTime(),
              baseDate.getTime(),
            ),
          );

      // Keep moving the date forward until we find a slot with enough capacity
      while (true) {
        const currentWorkload = getEngineerWorkload(startDate);
        const newWorkload = currentWorkload + (allocation.percentage || 100);

        if (newWorkload <= 100) {
          // We found a suitable start date
          break;
        }

        // Move to the next day
        startDate.setDate(startDate.getDate() + 1);

        // If we're moving past any project end dates, we need to recalculate
        const endingProjects = assignments
          .filter((a) => a.engineerId === engineer.id)
          .filter((a) => {
            const assignmentEnd = new Date(a.startDate);
            assignmentEnd.setDate(
              assignmentEnd.getDate() + Math.ceil(a.weeksNeeded * 5),
            );
            return assignmentEnd.getTime() === startDate.getTime();
          });

        if (endingProjects.length > 0) {
          // Recalculate workload at this new date
          continue;
        }
      }

      // Ensure we don't start before project's startAfter date
      if (project.startAfter) {
        const projectStartAfter = new Date(project.startAfter);
        if (startDate < projectStartAfter) {
          startDate = projectStartAfter;
        }
      }

      assignments.push({
        projectId: project.id,
        projectName: project.name,
        engineerId: engineer.id,
        startWeek: latestStartWeek,
        weeksNeeded,
        percentage: allocation.percentage || 100,
        startDate: normalizeDate(startDate),
      });

      // Update when this engineer will be available next
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Math.ceil(weeksNeeded * 5));
      engineerAvailability[engineer.id] = Math.ceil(
        (endDate - baseDate) / (7 * 24 * 60 * 60 * 1000),
      );
    });
  }

  return assignments;
}
