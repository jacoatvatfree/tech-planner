/**
 * Check if a team member is available for a project in a given date range
 * @param {string} teamMemberId - The ID of the team member
 * @param {Date} startDate - The start date to check
 * @param {Date} endDate - The end date to check
 * @param {Array} assignments - Current assignments
 * @returns {boolean} - Whether the team member is available
 */
export const isTeamMemberAvailable = (teamMemberId, startDate, endDate, assignments) => {
  // Check if the team member has any overlapping assignments
  const overlappingAssignments = assignments.filter(assignment => {
    // Check if assignment has engineerId (old format) or teamMemberId (new format)
    const assignmentTeamMemberId = assignment.teamMemberId || assignment.engineerId;
    if (assignmentTeamMemberId !== teamMemberId) return false;
    
    const assignmentStart = new Date(assignment.startDate);
    const assignmentEnd = new Date(assignment.endDate);
    
    // Check for overlap
    return !(endDate <= assignmentStart || startDate >= assignmentEnd);
  });
  
  // If there are any overlapping assignments, the team member is not available
  return overlappingAssignments.length === 0;
};

/**
 * Calculate project duration in weeks based on team members and estimated hours
 * @param {Object} project - The project
 * @param {Array} teamMembers - Array of team members assigned to the project
 * @returns {number} - Duration in weeks
 */
export const calculateProjectDuration = (project, teamMembers) => {
  // Calculate total hours per day across all team members (at 100%)
  const hoursPerDay = teamMembers.reduce((sum, teamMember) => {
    const dailyHours = (teamMember.weeklyHours || 40) / 5;
    return sum + dailyHours;
  }, 0);
  
  // If no team members or hours per day is 0, return 0
  if (hoursPerDay === 0) return 0;
  
  // Calculate days needed
  const daysNeeded = project.estimatedHours / hoursPerDay;
  
  // Convert to weeks (5 working days per week)
  return daysNeeded / 5;
};
