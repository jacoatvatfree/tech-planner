import { dateUtils } from "./dateUtils";

export function calculatePlanCapacity(team, scheduleData, plan, projects) {
  // Ensure we have valid arrays to work with
  const assignments = scheduleData?.assignments || [];
  if (
    !Array.isArray(assignments) ||
    !Array.isArray(team) ||
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

  // Calculate working days between dates (excluding weekends and plan excludes)
  function getWorkingDays(startDate, endDate, excludes) {
    let count = 0;
    const curDate = new Date(startDate.getTime());
    
    while (curDate <= endDate) {
      // Check if date is a weekend or excluded date
      if (!dateUtils.isWeekend(curDate) && !dateUtils.isExcludedDate(curDate, excludes)) {
        count++;
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  }

  // Get total working days in the plan period, properly accounting for all excludes
  const workingDays = getWorkingDays(startOfPlan, endOfPlan, plan.excludes || []);

  // Calculate total capacity based on working days
  const totalCapacityHours = team.reduce((sum, teamMember) => {
    const dailyHours = (teamMember.weeklyHours || 40) / 5; // Convert weekly hours to daily
    return sum + dailyHours * workingDays;
  }, 0);

  // We no longer need to subtract holidays separately since we're already
  // accounting for all excluded days (including holidays) in the workingDays calculation
  const adjustedCapacityHours = totalCapacityHours;

  // Calculate assigned hours from assignments
  const assignedHours = assignments.reduce((sum, assignment) => {
    const startDate = new Date(assignment.startDate);
    if (startDate <= endOfPlan && startDate >= startOfPlan) {
      const teamMember = team.find((t) => t.id === assignment.engineerId);
      const project = projects.find((p) => p.id === assignment.projectId);

      if (!teamMember || !project) return sum;

      // Calculate total weekly hours for the project (same as in generateGanttMarkup)
      const projectAssignments = assignments.filter(
        (a) => a.projectId === assignment.projectId,
      );
      const totalWeeklyHours = projectAssignments.reduce((weeklySum, a) => {
        const member = team.find((t) => t.id === a.engineerId);
        if (!member) return weeklySum;
        const percentage = a.percentage || 100;
        return weeklySum + (member.weeklyHours || 40) * (percentage / 100);
      }, 0);

      // Calculate duration in days (same as in generateGanttMarkup)
      const hoursPerDay = totalWeeklyHours / 5;
      const days = Math.max(1, Math.ceil(project.estimatedHours / hoursPerDay));

      // Convert days to hours for this specific team member's contribution
      const weeklyHours = teamMember.weeklyHours || 40;
      const percentage = assignment.percentage || 100;
      const teamMemberDailyHours = (weeklyHours / 5) * (percentage / 100);

      return sum + teamMemberDailyHours * days;
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
