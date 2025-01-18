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

    // Calculate weeks needed based on total available hours per week
    const weeksNeeded = Math.ceil(project.estimatedHours / hoursPerWeek);

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

      assignments.push({
        projectId: project.id,
        projectName: project.name,
        engineerId: engineer.id,
        startWeek: latestStartWeek,
        weeksNeeded,
        percentage: allocation.percentage || 100,
        startDate: normalizeDate(
          new Date(
            Math.max(
              project.startAfter
                ? new Date(project.startAfter).getTime()
                : baseDate.getTime(),
              baseDate.getTime() + latestStartWeek * 7 * 24 * 60 * 60 * 1000,
            ),
          ),
        ),
        startDate: normalizeDate(
          new Date(
            Math.max(
              project.startAfter
                ? new Date(project.startAfter).getTime()
                : baseDate.getTime(),
              baseDate.getTime() + latestStartWeek * 7 * 24 * 60 * 60 * 1000,
            ),
          ),
        ),
      });

      // Update when this engineer will be available next
      engineerAvailability[engineer.id] = latestStartWeek + weeksNeeded;
    });
  }

  return assignments;
}
