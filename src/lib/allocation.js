/**
 * Calculate available hours for an engineer in a given date range
 */
export const calculateAvailableHours = (engineer, startDate, endDate) => {
  const overlappingAllocations = engineer.allocations.filter(allocation => {
    const allocationStart = new Date(allocation.startDate);
    const allocationEnd = new Date(allocation.endDate);
    return allocationStart <= endDate && allocationEnd >= startDate;
  });

  const totalAllocatedPercentage = overlappingAllocations.reduce(
    (sum, allocation) => sum + allocation.percentage,
    0
  );

  const availablePercentage = Math.max(0, 100 - totalAllocatedPercentage);
  return (engineer.weeklyHours * availablePercentage) / 100;
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
export const isAllocationValid = (allocation, engineer, project) => {
  const availableHours = calculateAvailableHours(
    engineer,
    allocation.startDate,
    allocation.endDate
  );
  
  const requiredHours = (project.estimatedHours * allocation.percentage) / 100;
  return availableHours >= requiredHours;
};
