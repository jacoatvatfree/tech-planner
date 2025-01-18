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

    // Get all projects assigned to this engineer
    const engineerAssignments = assignments.filter(
      (a) => a.engineerId === engineer.id,
    );

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
      const duration = `${assignment.weeksNeeded || 1}w`;

      markup += `    ${escapedProjectName}${percentageLabel} :${startDate}, ${duration}\n`;
    });
  });

  return markup;
}
