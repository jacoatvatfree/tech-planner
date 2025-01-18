export function calculateSchedule(projects, engineers) {
  if (!projects?.length || !engineers?.length) {
    return { assignments: [], referenceDate: new Date() };
  }
  debugger;
  // Find the earliest start date among all projects
  const referenceDate = new Date(
    Math.min(...projects.map((p) => new Date(p.startAfter).getTime())),
  );
  // Set to start of the week
  referenceDate.setHours(0, 0, 0, 0);
  referenceDate.setDate(referenceDate.getDate() - referenceDate.getDay());

  const assignments = [];
  const engineerSchedules = {};

  // Initialize engineer schedules
  engineers.forEach((eng) => {
    engineerSchedules[eng.id] = [];
  });

  // Group projects by engineer
  const engineerProjects = {};
  engineers.forEach((engineer) => {
    engineerProjects[engineer.id] = projects
      .filter((project) =>
        project.allocations?.some(
          (allocation) => allocation.engineerId === engineer.id,
        ),
      )
      .sort((a, b) => a.priority - b.priority);
  });

  // Keep track of scheduled projects to avoid double scheduling
  const scheduledProjects = new Set();

  // Process each project
  while (
    Object.values(engineerProjects).some((projects) => projects.length > 0)
  ) {
    // Try to schedule one project for each engineer
    for (const engineer of engineers) {
      const projectsForEngineer = engineerProjects[engineer.id];

      if (projectsForEngineer.length === 0) continue;

      // Get the next unscheduled project for this engineer
      const projectIndex = projectsForEngineer.findIndex(
        (p) => !scheduledProjects.has(p.id),
      );
      if (projectIndex === -1) continue;

      const project = projectsForEngineer[projectIndex];

      // Calculate weeks from reference date
      const projectStartDate = new Date(project.startAfter);
      const startWeek = Math.floor(
        (projectStartDate.getTime() - referenceDate.getTime()) /
          (7 * 24 * 60 * 60 * 1000),
      );

      // Calculate weeks needed based on estimated hours (assuming 40-hour weeks)
      const weeksNeeded = Math.ceil(project.estimatedHours / 40);

      // Check if the slot is available for this engineer
      const engineerSchedule = engineerSchedules[engineer.id];
      const slotFound = !engineerSchedule.some((assignment) => {
        const assignmentEnd = assignment.startWeek + assignment.weeksNeeded;
        const projectEnd = startWeek + weeksNeeded;
        return startWeek < assignmentEnd && projectEnd > assignment.startWeek;
      });

      // If we found a slot, schedule the project
      if (slotFound) {
        project.allocations.forEach((allocation) => {
          const allocatedEngineer = engineers.find(
            (e) => e.id === allocation.engineerId,
          );
          if (!allocatedEngineer) return;

          const assignment = {
            projectId: project.id,
            projectName: project.name,
            engineerId: allocation.engineerId,
            startWeek: startWeek,
            weeksNeeded,
            percentage: allocation.percentage || 100,
          };

          assignments.push(assignment);
          engineerSchedules[allocation.engineerId].push(assignment);
        });

        // Mark project as scheduled
        scheduledProjects.add(project.id);

        // Remove this project from all engineer project lists
        Object.keys(engineerProjects).forEach((engId) => {
          engineerProjects[engId] = engineerProjects[engId].filter(
            (p) => p.id !== project.id,
          );
        });
      }
    }
  }

  return { assignments, referenceDate };
}

export function generateMermaidGantt(projects, engineers) {
  const { assignments, referenceDate } = calculateSchedule(projects, engineers);
  if (!assignments?.length || !engineers?.length) {
    return `gantt
    dateFormat YYYY-MM-DD
    title Project Schedule
    section No Data
    No assignments found :2024-01-01, 1d`;
  }

  // Find the earliest start week
  const earliestStartWeek = Math.min(...assignments.map((a) => a.startWeek));

  let mermaidMarkup = "gantt\n";
  mermaidMarkup += "    dateFormat YYYY-MM-DD\n";
  mermaidMarkup += `    title Project Schedule\n`;
  mermaidMarkup += "    excludes weekends\n\n";

  // Group by engineer
  engineers.forEach((engineer) => {
    if (!engineer?.name) return;

    mermaidMarkup += `    section ${engineer.name}\n`;

    const engineerAssignments = assignments.filter(
      (a) => a.engineerId === engineer.id,
    );

    if (engineerAssignments.length === 0) {
      mermaidMarkup += `    No assignments :${new Date().toISOString().split("T")[0]}}, 1d\n`;
      return;
    }

    engineerAssignments.forEach((assignment) => {
      // Calculate start date relative to reference date
      const startDate = new Date(referenceDate);
      startDate.setDate(
        referenceDate.getDate() +
          (assignment.startWeek - earliestStartWeek) * 7,
      );
      const formattedStart = startDate.toISOString().split("T")[0];

      // Escape special characters in project names
      const escapedProjectName = assignment.projectName.replace(/[:#]/g, " ");

      mermaidMarkup += `    ${escapedProjectName}    :${formattedStart}, ${assignment.weeksNeeded}w\n`;
    });
  });

  return mermaidMarkup;
}
