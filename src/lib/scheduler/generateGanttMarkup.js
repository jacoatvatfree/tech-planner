export function generateGanttMarkup(assignments, engineers, projects) {
  if (!assignments?.length || !engineers?.length) {
    return `gantt
    dateFormat YYYY-MM-DD
    title Resource Schedule
    section No Data
    No assignments found :2024-01-01, 1d`;
  }

  let markup = "gantt\n";
  markup += "    dateFormat YYYY-MM-DD\n";
  markup += "    title Resource Schedule\n";
  markup += "    tickInterval 1week\n";
  markup += "    excludes weekends\n\n";

  // Add quarter guidelines section
  const today = new Date();
  const currentQuarter = Math.floor(today.getMonth() / 3);
  const quarterStart = new Date(today.getFullYear(), currentQuarter * 3, 1);
  const quarterEnd = new Date(today.getFullYear(), (currentQuarter + 1) * 3, 0);

  markup += "    section Quarter Start \n";
  markup += `    s :milestone, ${quarterStart.toISOString().split("T")[0]}, 0d\n`;

  // Group by engineer
  engineers.forEach((engineer) => {
    if (!engineer?.name) return;

    markup += `\n    section ${engineer.name}\n`;

    // Get all projects assigned to this engineer and sort by priority
    const engineerAssignments = assignments
      .filter((a) => a.engineerId === engineer.id)
      .sort((a, b) => a.startWeek - b.startWeek);

    if (engineerAssignments.length === 0) {
      markup += `    No assignments :${new Date().toISOString().split("T")[0]}, 1d\n`;
      return;
    }

    engineerAssignments.forEach((assignment) => {
      // Ensure we have a valid date
      let startDate;
      try {
        const date = new Date(assignment.startDate);
        if (isNaN(date.getTime())) {
          // If date is invalid, use today's date as fallback
          startDate = new Date().toISOString().split("T")[0];
        } else {
          startDate = date.toISOString().split("T")[0];
        }
      } catch (e) {
        // If there's any error parsing the date, use today's date as fallback
        startDate = new Date().toISOString().split("T")[0];
      }

      const escapedProjectName = assignment.projectName.replace(/[:#]/g, " ");
      const percentageLabel =
        assignment.percentage < 100
          ? ` (${Math.round(assignment.percentage)}%)`
          : "";
      // Get all allocations for this project
      const projectAssignments = assignments.filter(
        (a) => a.projectId === assignment.projectId,
      );
      const totalWeeklyHours = projectAssignments.reduce((sum, a) => {
        const eng = engineers.find((e) => e.id === a.engineerId);
        if (!eng) return sum;
        const percentage = a.percentage || 100;
        return sum + (eng.weeklyHours || 40) * (percentage / 100);
      }, 0);

      // Find the original project to get estimated hours
      const project = projects.find((p) => p.id === assignment.projectId);
      if (!project) {
        console.warn(
          `Project not found for assignment: ${assignment.projectName}`,
        );
        return;
      }

      const hoursPerDay = totalWeeklyHours / 5; // Convert weekly hours to daily hours
      const days = Math.max(1, Math.ceil(project.estimatedHours / hoursPerDay));
      const durationStr = `${days}d`;

      const shortId = assignment.projectId.substring(0, 8);
      markup += `    ${escapedProjectName}${percentageLabel} :${shortId}, ${startDate}, ${durationStr}\n`;
    });
  });

  markup += "\n    section Quarter End \n";
  markup += `    e :milestone, ${quarterEnd.toISOString().split("T")[0]}, 0d\n\n`;

  return markup;
}
