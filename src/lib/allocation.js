/**
 * Calculate available hours for a team member in a given date range
 */
export const calculateAvailableHours = (teamMember, startDate, endDate) => {
  const overlappingAllocations = teamMember.allocations.filter(allocation => {
    const allocationStart = new Date(allocation.startDate);
    const allocationEnd = new Date(allocation.endDate);
    return allocationStart <= endDate && allocationEnd >= startDate;
  });

  const totalAllocatedPercentage = overlappingAllocations.reduce(
    (sum, allocation) => sum + allocation.percentage,
    0
  );

  const availablePercentage = Math.max(0, 100 - totalAllocatedPercentage);
  return (teamMember.weeklyHours * availablePercentage) / 100;
};

/**
 * Create a new allocation
 */
export const createAllocation = ({
  projectId,
  engineerId,
  startDate,
  endDate,
  percentage
}) => ({
  projectId,
  engineerId,
  startDate: new Date(startDate),
  endDate: new Date(endDate),
  percentage
});

/**
 * Check if an allocation is valid
 */
export const isAllocationValid = (allocation, teamMember, project) => {
  const availableHours = calculateAvailableHours(
    teamMember,
    allocation.startDate,
    allocation.endDate
  );
  
  const requiredHours = (project.estimatedHours * allocation.percentage) / 100;
  return availableHours >= requiredHours;
};
