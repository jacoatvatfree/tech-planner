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

  // Calculate working days between dates (excluding weekends)
  function getWorkingDays(startDate, endDate) {
    let count = 0;
    const curDate = new Date(startDate.getTime());
    while (curDate <= endDate) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
      curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  }

  // Get total working days in the plan period
  const workingDays = getWorkingDays(startOfPlan, endOfPlan);

  // Calculate total capacity based on working days
  const totalCapacityHours = engineers.reduce((sum, engineer) => {
    const dailyHours = (engineer.weeklyHours || 40) / 5; // Convert weekly hours to daily
    return sum + dailyHours * workingDays;
  }, 0);

  // Subtract standard holidays (approximate)
  const AVERAGE_HOLIDAYS_PER_MONTH = 1.67; // 20 holidays per year / 12 months
  const monthsDuration = (endOfPlan - startOfPlan) / (30 * 24 * 60 * 60 * 1000);
  const estimatedHolidays = Math.round(
    monthsDuration * AVERAGE_HOLIDAYS_PER_MONTH,
  );

  // Adjust total capacity for holidays
  const adjustedCapacityHours = engineers.reduce((sum, engineer) => {
    const dailyHours = (engineer.weeklyHours || 40) / 5;
    return sum - dailyHours * estimatedHolidays;
  }, totalCapacityHours);

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
    totalCapacityHours: adjustedCapacityHours,
    assignedHours,
    utilizationPercentage: Math.round(
      (assignedHours / adjustedCapacityHours) * 100,
    ),
  };
}
