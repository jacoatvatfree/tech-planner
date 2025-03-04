import logger from "./logger";

/**
 * @deprecated Convert allocations to teamMemberIds
 * This function is used for backward compatibility and will be removed in a future version.
 */
export function deprecatedAllocationsToTeamMemberIds(allocations = []) {
  if (!allocations.length) return [];
  
  logger.warn("DEPRECATED: Using allocations instead of teamMemberIds");
  return [...new Set(allocations.map(allocation => allocation.engineerId))];
}

/**
 * @deprecated Check if data uses the old engineers format instead of team
 * This function is used for backward compatibility and will be removed in a future version.
 */
export function deprecatedGetTeamData(data) {
  if (data.team) return data.team;
  if (data.engineers) {
    logger.warn("DEPRECATED: Using 'engineers' instead of 'team'");
    return data.engineers;
  }
  return [];
}

/**
 * @deprecated Get the appropriate team initialization function
 * This function is used for backward compatibility and will be removed in a future version.
 */
export function deprecatedLogEngineerTerminology() {
  logger.warn("DEPRECATED: Using 'engineer' terminology instead of 'team member'");
}
