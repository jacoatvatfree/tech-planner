import { calculateAvailableHours, createAllocation, isAllocationValid } from './allocation';

/**
 * Calculate project duration based on allocations and estimated hours
 */
const calculateProjectDuration = (project, allocations) => {
  const totalAllocationPercentage = allocations.reduce(
    (sum, allocation) => sum + allocation.percentage,
    0
  );
  
  const effectiveHoursPerWeek = (totalAllocationPercentage / 100) * 40;
  const durationWeeks = Math.ceil(project.estimatedHours / effectiveHoursPerWeek);
  return durationWeeks * 7; // Convert to days
};

/**
 * Find the earliest possible start date for a project
 */
const findEarliestStartDate = (project, engineers) => {
  const baseDate = project.startAfter || new Date();
  
  // Find the latest date when any required engineer becomes available
  const latestAvailability = Math.max(
    ...engineers.map(engineer => {
      const lastAllocation = [...engineer.allocations]
        .sort((a, b) => b.endDate - a.endDate)[0];
      return lastAllocation ? lastAllocation.endDate.getTime() : baseDate.getTime();
    })
  );
  
  return new Date(Math.max(baseDate.getTime(), latestAvailability));
};

/**
 * Schedule projects based on priority and constraints
 */
export const scheduleProjects = (schedule) => {
  const prioritizedProjects = [...schedule.projects]
    .sort((a, b) => a.priority - b.priority);
  
  const newSchedule = { ...schedule, projects: [] };
  
  for (const project of prioritizedProjects) {
    const startDate = findEarliestStartDate(project, schedule.engineers);
    const proposedAllocations = [];
    
    // Try to allocate engineers
    for (const engineer of schedule.engineers) {
      const availableHours = calculateAvailableHours(
        engineer,
        startDate,
        schedule.endDate
      );
      
      if (availableHours > 0) {
        const allocation = createAllocation({
          projectId: project.id,
          engineerId: engineer.id,
          startDate,
          endDate: new Date(startDate.getTime() + calculateProjectDuration(project, proposedAllocations) * 86400000),
          percentage: Math.min(100, (project.estimatedHours / availableHours) * 100)
        });
        
        if (isAllocationValid(allocation, engineer, project)) {
          proposedAllocations.push(allocation);
        }
      }
    }
    
    if (proposedAllocations.length > 0) {
      newSchedule.projects.push({
        ...project,
        allocations: proposedAllocations
      });
    }
  }
  
  return newSchedule;
};

/**
 * Calculate schedule metrics
 */
export const calculateScheduleMetrics = (schedule) => {
  const metrics = {
    engineerUtilization: {},
    projectCompletionDates: {},
    conflicts: []
  };
  
  // Calculate engineer utilization
  schedule.engineers.forEach(engineer => {
    const totalHoursAvailable = engineer.weeklyHours * 
      ((schedule.endDate - schedule.startDate) / (7 * 86400000));
    
    const totalHoursAllocated = engineer.allocations.reduce((sum, allocation) => {
      const durationWeeks = (allocation.endDate - allocation.startDate) / (7 * 86400000);
      return sum + (durationWeeks * engineer.weeklyHours * (allocation.percentage / 100));
    }, 0);
    
    metrics.engineerUtilization[engineer.id] = 
      (totalHoursAllocated / totalHoursAvailable) * 100;
  });
  
  // Calculate project completion dates and find conflicts
  schedule.projects.forEach(project => {
    const lastAllocation = [...project.allocations]
      .sort((a, b) => b.endDate - a.endDate)[0];
      
    metrics.projectCompletionDates[project.id] = lastAllocation?.endDate;
    
    if (project.endBefore && lastAllocation?.endDate > project.endBefore) {
      metrics.conflicts.push({
        type: 'deadline_missed',
        projectId: project.id,
        expected: project.endBefore,
        actual: lastAllocation.endDate
      });
    }
  });
  
  return metrics;
};
