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

    // Calculate total allocation percentage for this project
    const totalAllocationPercentage = project.allocations.reduce(
      (sum, allocation) => sum + (allocation.percentage || 100),
      0,
    );

    // Calculate how many weeks needed based on total allocation percentage
    const weeksNeeded = Math.ceil(
      project.estimatedHours / (40 * (totalAllocationPercentage / 100)),
    );

    // Add an assignment for each allocation
    project.allocations.forEach((allocation) => {
      const engineer = engineers.find((e) => e.id === allocation.engineerId);
      if (!engineer) return;

      // Get when this engineer is next available
      const startWeek = engineerAvailability[engineer.id];

      assignments.push({
        projectId: project.id,
        projectName: project.name,
        engineerId: engineer.id,
        startWeek,
        weeksNeeded,
        percentage: allocation.percentage || 100,
        startDate: new Date(Date.now() + startWeek * 7 * 24 * 60 * 60 * 1000),
      });

      // Update when this engineer will be available next
      engineerAvailability[engineer.id] = startWeek + weeksNeeded;
    });
  }

  return assignments;
}
