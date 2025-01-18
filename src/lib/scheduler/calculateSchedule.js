export function calculateSchedule(projects, engineers) {
  if (!projects?.length || !engineers?.length) {
    return [];
  }

  const assignments = [];
  let currentWeek = 0;

  // Sort projects by priority (lower number = higher priority)
  const sortedProjects = [...projects].sort((a, b) => a.priority - b.priority);

  for (const project of sortedProjects) {
    if (!project.allocations?.length || !project.estimatedHours) {
      console.warn(`Project ${project.name} skipped - missing allocations or hours`);
      continue;
    }

    // Calculate total allocation percentage for this project
    const totalAllocationPercentage = project.allocations.reduce(
      (sum, allocation) => sum + (allocation.percentage || 100),
      0
    );

    // Calculate how many weeks needed based on total allocation percentage
    const weeksNeeded = Math.ceil(
      project.estimatedHours / (40 * (totalAllocationPercentage / 100))
    );

    // Add an assignment for each allocation
    project.allocations.forEach(allocation => {
      const engineer = engineers.find(e => e.id === allocation.engineerId);
      if (!engineer) return;

      assignments.push({
        projectId: project.id,
        projectName: project.name,
        engineerId: engineer.id,
        startWeek: currentWeek,
        weeksNeeded,
        percentage: allocation.percentage || 100
      });
    });

    currentWeek += weeksNeeded;
  }

  return assignments;
}
