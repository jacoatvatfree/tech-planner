export function calculateQuarterlyCapacity(engineers, assignments) {
  // Get current date and end of quarter
  const now = new Date();
  const endOfQuarter = new Date(now);
  endOfQuarter.setMonth(Math.ceil((now.getMonth() + 1) / 3) * 3, 0);
  endOfQuarter.setHours(23, 59, 59, 999);

  // Calculate total available hours for all engineers until end of quarter
  const weeksUntilEndOfQuarter = Math.ceil(
    (endOfQuarter - now) / (7 * 24 * 60 * 60 * 1000),
  );
  const totalCapacityHours = engineers.reduce((sum, engineer) => {
    const weeklyHours = engineer.weeklyHours || 40;
    return sum + weeklyHours * weeksUntilEndOfQuarter;
  }, 0);

  // Calculate assigned hours from assignments
  const assignedHours = assignments.reduce((sum, assignment) => {
    const startDate = new Date(assignment.startDate);
    const endDate = new Date(assignment.startDate);
    endDate.setDate(endDate.getDate() + assignment.weeksNeeded * 7);

    // Only count assignments that overlap with the current quarter
    if (startDate <= endOfQuarter && endDate >= now) {
      const engineer = engineers.find((e) => e.id === assignment.engineerId);
      const weeklyHours = engineer?.weeklyHours || 40;
      const percentage = assignment.percentage || 100;

      // Calculate overlapping weeks
      const overlapStart = startDate < now ? now : startDate;
      const overlapEnd = endDate > endOfQuarter ? endOfQuarter : endDate;
      const overlapWeeks = Math.ceil(
        (overlapEnd - overlapStart) / (7 * 24 * 60 * 60 * 1000),
      );

      return sum + weeklyHours * (percentage / 100) * overlapWeeks;
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
