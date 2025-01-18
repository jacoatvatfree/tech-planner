export function generateGanttMarkup(assignments, engineers) {
  if (!assignments?.length || !engineers?.length) {
    return `gantt
    dateFormat YYYY-MM-DD
    title Project Schedule
    section No Data
    No assignments found :2024-01-01, 1d`;
  }

  let markup = "gantt\n";
  markup += "    dateFormat YYYY-MM-DD\n";
  markup += `    title Project Schedule\n`;
  markup += "    excludes weekends\n\n";

  // Group by engineer
  engineers.forEach((engineer) => {
    if (!engineer?.name) return;
    
    markup += `    section ${engineer.name}\n`;

    const engineerAssignments = assignments.filter(
      (a) => a.engineerId === engineer.id
    );
    
    if (engineerAssignments.length === 0) {
      markup += `    No assignments :2024-01-01, 1d\n`;
      return;
    }

    engineerAssignments.forEach((assignment) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + assignment.startWeek * 7);
      const formattedStart = startDate.toISOString().split("T")[0];

      // Escape special characters in project names
      const escapedProjectName = assignment.projectName.replace(/[:#]/g, ' ');

      markup += `    ${escapedProjectName}    :${formattedStart}, ${assignment.weeksNeeded}w\n`;
    });
  });

  return markup;
}
