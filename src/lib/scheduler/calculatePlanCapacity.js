export function calculatePlanCapacity(engineers, scheduleData, plan, projects) {
  // Ensure we have valid arrays to work with
  const assignments = scheduleData?.assignments || [];
  if (
    !Array.isArray(assignments) ||
    !Array.isArray(engineers) ||
    !plan.startDate ||
    !plan.endDate
  ) {
    return {
      totalCapacityHours: 0,
      assignedHours: 0,
      utilizationPercentage: 0,
    };
  }
  // Get current date and end of quarter
  const startOfPlan = new Date(plan.startDate);
  const endOfPlan = new Date(plan.endDate);
  endOfPlan.setHours(23, 59, 59, 999);

  // Calculate total available hours for all engineers until end of quarter
  const weeksUntilEndOfPlan = Math.ceil(
    (endOfPlan - startOfPlan) / (7 * 24 * 60 * 60 * 1000),
  );
  console.log("weeks", weeksUntilEndOfPlan);
  const totalCapacityHours = engineers.reduce((sum, engineer) => {
    const weeklyHours = engineer.weeklyHours || 40;
    return sum + weeklyHours * weeksUntilEndOfPlan;
  }, 0);

  console.log(totalCapacityHours);

  // Calculate assigned hours from assignments
  const assignedHours = assignments.reduce((sum, assignment) => {
    const startDate = new Date(assignment.startDate);
    if (startDate <= endOfPlan && startDate >= startOfPlan) {
      const engineer = engineers.find((e) => e.id === assignment.engineerId);
      const project = projects.find((p) => p.id === assignment.projectId);

      if (!engineer || !project) return sum;

      // Calculate total weekly hours for the project (same as in generateGanttMarkup)
      const projectAssignments = assignments.filter(
        (a) => a.projectId === assignment.projectId,
      );
      const totalWeeklyHours = projectAssignments.reduce((weeklySum, a) => {
        const eng = engineers.find((e) => e.id === a.engineerId);
        if (!eng) return weeklySum;
        const percentage = a.percentage || 100;
        return weeklySum + (eng.weeklyHours || 40) * (percentage / 100);
      }, 0);

      // Calculate duration in days (same as in generateGanttMarkup)
      const hoursPerDay = totalWeeklyHours / 5;
      const days = Math.max(1, Math.ceil(project.estimatedHours / hoursPerDay));

      // Convert days to hours for this specific engineer's contribution
      const weeklyHours = engineer.weeklyHours || 40;
      const percentage = assignment.percentage || 100;
      const engineerDailyHours = (weeklyHours / 5) * (percentage / 100);

      return sum + engineerDailyHours * days;
    }
    return sum;
  }, 0);

  return {
    totalCapacityHours,
    assignedHours,
    utilizationPercentage: Math.round(
      (assignedHours / totalCapacityHours) * 100,
    ),
  };
}
