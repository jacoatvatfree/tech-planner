export function calculateSchedule(projects, engineers) {
  if (!projects?.length || !engineers?.length) {
    return { assignments: [], referenceDate: new Date() };
  }

  // Find the earliest start date among all projects
  const referenceDate = new Date(
    Math.min(...projects
      .filter(p => p.startAfter)
      .map(p => new Date(p.startAfter).getTime())
    ) || new Date().getTime()
  );

  // Set to start of the week
  referenceDate.setHours(0, 0, 0, 0);
  referenceDate.setDate(referenceDate.getDate() - referenceDate.getDay());

  const assignments = [];
  const engineerSchedules = {};

  // Initialize engineer schedules
  engineers.forEach(eng => {
    engineerSchedules[eng.id] = [];
  });

  // Sort projects by priority (lower number = higher priority)
  const sortedProjects = [...projects].sort((a, b) => {
    return a.priority - b.priority;
  });

  // Process each project
  for (const project of sortedProjects) {
    if (!project.allocations?.length || !project.estimatedHours) {
      continue;
    }

    // Calculate project duration based on allocations
    const projectStartDate = project.startAfter ? new Date(project.startAfter) : referenceDate;
    let actualStartDate = new Date(projectStartDate);

    // Check if any allocated engineers are busy
    for (const allocation of project.allocations) {
      const engineerAssignments = engineerSchedules[allocation.engineerId] || [];
      
      // Find the latest end date of higher priority projects
      const latestConflict = engineerAssignments
        .filter(a => {
          const conflictingProject = sortedProjects.find(p => p.id === a.projectId);
          return conflictingProject && conflictingProject.priority < project.priority;
        })
        .reduce((latest, assignment) => {
          const endDate = new Date(assignment.startDate);
          endDate.setDate(endDate.getDate() + (assignment.weeksNeeded * 7));
          return endDate > latest ? endDate : latest;
        }, projectStartDate);

      // Update actual start date if needed
      if (latestConflict > actualStartDate) {
        actualStartDate = latestConflict;
      }
    }

    // Create assignments for each allocation
    for (const allocation of project.allocations) {
      const engineer = engineers.find(e => e.id === allocation.engineerId);
      if (!engineer) continue;

      const weeklyCapacity = engineer.weeklyHours || 40;
      const weeksNeeded = Math.ceil(project.estimatedHours / weeklyCapacity);

      const assignment = {
        projectId: project.id,
        projectName: project.name,
        engineerId: engineer.id,
        startDate: actualStartDate,
        weeksNeeded,
        percentage: Math.min(100, (project.estimatedHours / (weeksNeeded * weeklyCapacity)) * 100)
      };

      assignments.push(assignment);
      engineerSchedules[engineer.id].push(assignment);
    }
  }

  return { assignments, referenceDate };
}
