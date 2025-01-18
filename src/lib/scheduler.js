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

export function generateMermaidGantt(assignments, engineers) {
  if (!assignments?.length || !engineers?.length) {
    return `gantt
    dateFormat YYYY-MM-DD
    title Project Schedule
    section No Data
    No assignments found :2024-01-01, 1d`;
  }

  let mermaidMarkup = "gantt\n";
  mermaidMarkup += "    dateFormat YYYY-MM-DD\n";
  mermaidMarkup += `    title Project Schedule\n`;
  mermaidMarkup += "    excludes weekends\n\n";

  // Group by engineer
  engineers.forEach((engineer) => {
    if (!engineer?.name) return;
    
    mermaidMarkup += `    section ${engineer.name}\n`;

    const engineerAssignments = assignments.filter(
      (a) => a.engineerId === engineer.id
    );
    
    if (engineerAssignments.length === 0) {
      mermaidMarkup += `    No assignments :2024-01-01, 1d\n`;
      return;
    }

    engineerAssignments.forEach((assignment) => {
      // Ensure we have valid dates
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + assignment.startWeek * 7);
      const formattedStart = startDate.toISOString().split("T")[0];

      // Escape special characters in project names
      const escapedProjectName = assignment.projectName.replace(/[:#]/g, ' ');

      mermaidMarkup += `    ${escapedProjectName}    :${formattedStart}, ${assignment.weeksNeeded}w\n`;
    });
  });

  return mermaidMarkup;
}
