export function calculateSchedule(projects, engineers) {
  if (!projects?.length || !engineers?.length) {
    return [];
  }

  const assignments = [];
  // Track when each engineer becomes available
  const engineerAvailability = {};
  engineers.forEach((eng) => (engineerAvailability[eng.id] = 0));

  // Sort projects by priority (lower number = higher priority)
  const sortedProjects = [...projects].sort((a, b) => a.priority - b.priority);

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

    // Find the latest available start week among all allocated engineers
    const latestStartWeek = Math.max(
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
        startDate: new Date(
          Date.now() + latestStartWeek * 7 * 24 * 60 * 60 * 1000,
        ),
      });

      // Update when this engineer will be available next
      engineerAvailability[engineer.id] = latestStartWeek + weeksNeeded;
    });
  }

  return assignments;
}
