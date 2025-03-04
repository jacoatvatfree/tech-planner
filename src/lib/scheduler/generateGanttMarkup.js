import { dateUtils } from "./dateUtils";
import logger from "../../utils/logger";

// Cache for expensive calculations
const markupCache = {
  assignmentDetails: new Map(),
  engineerMarkup: new Map(),
  projectMarkup: new Map(),
  fullMarkup: new Map(),
};

// Clear cache when needed - exported for use in stores
export function clearMarkupCache() {
  markupCache.assignmentDetails.clear();
  markupCache.engineerMarkup.clear();
  markupCache.projectMarkup.clear();
  markupCache.fullMarkup.clear();
  logger.debug("Markup cache cleared");
}

// Memoized version of calculateAssignmentDetails
function memoizedCalculateAssignmentDetails(
  assignment,
  engineers,
  projects,
  assignments,
  safeEndDate,
) {
  const cacheKey = `${assignment.projectId}_${assignment.engineerId}_${assignment.startDate}`;

  // Temporarily disable caching to ensure fresh markup generation
  // if (markupCache.assignmentDetails.has(cacheKey)) {
  //   return markupCache.assignmentDetails.get(cacheKey);
  // }

  // Check for null or epoch dates
  const assignmentStartDate = assignment.startDate
    ? new Date(assignment.startDate)
    : null;
  if (!assignmentStartDate || assignmentStartDate.getFullYear() === 1970) {
    throw new Error("Invalid or epoch date");
  }

  const startDate = dateUtils.getNextWeekday(assignmentStartDate);
  if (isNaN(startDate.getTime())) throw new Error("Invalid date");

  // Find the project
  const project = projects.find((p) => p.id === assignment.projectId);
  if (!project) throw new Error(`Project not found: ${assignment.projectId}`);

  // Calculate total weekly hours for the project (memoize this calculation in the future if needed)
  const projectAssignments = assignments.filter(
    (a) => a.projectId === assignment.projectId,
  );

  let totalWeeklyHours = 0;
  for (const a of projectAssignments) {
    const eng = engineers.find((e) => e.id === a.engineerId);
    if (!eng) continue;
    const percentage = a.percentage || 100;
    totalWeeklyHours += (eng.weeklyHours || 40) * (percentage / 100);
  }

  // Calculate duration in working days
  const hoursPerDay = totalWeeklyHours / 5;
  const days = Math.max(1, Math.ceil(project.estimatedHours / hoursPerDay));

  // Calculate if project ends after endBefore date
  let projectEndDate = new Date(startDate);
  for (let i = 0; i < Math.min(days, 365); i++) {
    // Limit to prevent infinite loops
    projectEndDate = dateUtils.getNextWeekday(
      new Date(projectEndDate.setDate(projectEndDate.getDate() + 1)),
    );
  }

  const isCritical =
    (project.endBefore && projectEndDate > new Date(project.endBefore)) ||
    projectEndDate > safeEndDate;

  const shortId = assignment.projectId.substring(0, 8);
  const percentageLabel =
    assignment.percentage < 100
      ? ` (${Math.round(assignment.percentage)}%)`
      : "";

  const completionLabel =
    project.percentComplete === 100
      ? "done,"
      : project.percentComplete > 0
        ? "active,"
        : "";

  const criticalLabel = isCritical ? "crit," : "";

  const result = {
    startDate,
    days,
    shortId,
    percentageLabel,
    completionLabel,
    criticalLabel,
    project,
  };

  markupCache.assignmentDetails.set(cacheKey, result);
  return result;
}

// Generate markup for a single assignment
function generateAssignmentMarkup(assignment, details, itemName) {
  const escapedName = itemName.replace(/[:#]/g, " ");
  return `        ${escapedName}${details.percentageLabel} :${details.completionLabel}${details.criticalLabel}${details.shortId}, ${dateUtils.toISOLocalString(details.startDate)}, ${details.days}d\n`;
}

// Generate markup for an engineer's assignments
function generateEngineerMarkup(
  engineer,
  engineerAssignments,
  engineers,
  projects,
  allAssignments,
  safeEndDate,
) {
  const cacheKey = `${engineer.id}_${JSON.stringify(engineerAssignments.map((a) => a.id))}`;

  // Temporarily disable caching to ensure fresh markup generation
  // if (markupCache.engineerMarkup.has(cacheKey)) {
  //   return markupCache.engineerMarkup.get(cacheKey);
  // }

  let markup = `\n    section ${engineer.name}\n`;

  if (engineerAssignments.length === 0) {
    markup += `    No assignments :${dateUtils.toISOLocalString(new Date())}, 1d\n`;
    markupCache.engineerMarkup.set(cacheKey, markup);
    return markup;
  }

  for (const assignment of engineerAssignments) {
    const project = projects.find((p) => p.id === assignment.projectId);
    if (!project) continue;

    try {
      const details = memoizedCalculateAssignmentDetails(
        assignment,
        engineers,
        projects,
        allAssignments,
        safeEndDate,
      );

      markup += generateAssignmentMarkup(
        assignment,
        details,
        `${project.name} (${Math.round(project.percentComplete || 0)}%)`,
      );
    } catch (error) {
      // Skip invalid assignments silently
    }
  }

  markupCache.engineerMarkup.set(cacheKey, markup);
  return markup;
}

// Generate markup for a project's assignments
function generateProjectMarkup(
  project,
  projectAssignments,
  engineers,
  projects,
  allAssignments,
  safeEndDate,
) {
  const cacheKey = `${project.id}_${JSON.stringify(projectAssignments.map((a) => a.id))}`;

  // Temporarily disable caching to ensure fresh markup generation
  // if (markupCache.projectMarkup.has(cacheKey)) {
  //   return markupCache.projectMarkup.get(cacheKey);
  // }

  let markup = `\n    section ${project.name} (${Math.round(project.percentComplete || 0)}%)\n`;

  if (projectAssignments.length === 0) {
    markup += `    No assignments :${dateUtils.toISOLocalString(new Date())}, 1d\n`;
    markupCache.projectMarkup.set(cacheKey, markup);
    return markup;
  }

  for (const assignment of projectAssignments) {
    const engineer = engineers.find((e) => e.id === assignment.engineerId);
    if (!engineer) continue;

    try {
      const details = memoizedCalculateAssignmentDetails(
        assignment,
        engineers,
        projects,
        allAssignments,
        safeEndDate,
      );

      markup += generateAssignmentMarkup(assignment, details, engineer.name);
    } catch (error) {
      // Skip invalid assignments silently
    }
  }

  markupCache.projectMarkup.set(cacheKey, markup);
  return markup;
}

// Main function to generate Gantt markup
export function generateGanttMarkup(
  assignments = [],
  engineers = [],
  projects = [],
  plan = {},
  viewType = "resource", // 'resource' or 'project'
  baseUrl = "" // Base URL for links (protocol, host, port)
) {
  // Create a cache key based on inputs
  const cacheKey = `${viewType}_${plan?.id || ""}_${assignments.length}_${engineers.length}_${projects.length}`;

  // Temporarily disable caching to ensure fresh markup generation
  // if (markupCache.fullMarkup.has(cacheKey)) {
  //   return markupCache.fullMarkup.get(cacheKey);
  // }

  // Clear cache if it gets too large (prevent memory leaks)
  if (markupCache.fullMarkup.size > 10) {
    clearMarkupCache();
  }

  const excludes = plan.excludes?.join(",") || "weekends";

  // Create safe dates
  const safeStartDate = plan.startDate ? new Date(plan.startDate) : new Date();
  const safeEndDate = plan.endDate ? new Date(plan.endDate) : new Date();

  // Basic validation
  if (!assignments?.length || !engineers?.length || !projects?.length) {
    const noDataMarkup = `gantt
      dateFormat YYYY/MM/DD
      title ${plan.name || "Resource Planner"}
      section No Data
      No assignments found :2024/01/01, 1d`;

    markupCache.fullMarkup.set(cacheKey, noDataMarkup);
    return noDataMarkup;
  }

  // Check for invalid dates
  if (isNaN(safeStartDate.getTime()) || isNaN(safeEndDate.getTime())) {
    const errorMarkup = `gantt
    dateFormat YYYY/MM/DD
    title ${plan.name || "Resource Planner"}
    section Error
    Invalid dates :2024/01/01, 1d`;

    markupCache.fullMarkup.set(cacheKey, errorMarkup);
    return errorMarkup;
  }

  // Initialize markup
  let markup = `gantt
    dateFormat YYYY/MM/DD
    title ${[plan.name, "Resource Planner"].join(" - ")}
    axisFormat %Y/%m/%d
    tickInterval 1week
    excludes ${excludes}
    
    section Start
        s :milestone, ${dateUtils.toISOLocalString(safeStartDate)}, 0d
    `;

  // Generate sections based on view type
  if (viewType === "resource") {
    // Pre-sort assignments by start date to avoid repeated sorting
    const sortedAssignmentsByEngineer = new Map();

    for (const engineer of engineers) {
      const engineerAssignments = assignments
        .filter((a) => a.engineerId === engineer.id)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      sortedAssignmentsByEngineer.set(engineer.id, engineerAssignments);

      markup += generateEngineerMarkup(
        engineer,
        engineerAssignments,
        engineers,
        projects,
        assignments,
        safeEndDate,
      );
    }
  } else if (viewType === "project") {
    // Pre-sort assignments by start date to avoid repeated sorting
    const sortedAssignmentsByProject = new Map();

    for (const project of projects) {
      const projectAssignments = assignments
        .filter((a) => a.projectId === project.id)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      sortedAssignmentsByProject.set(project.id, projectAssignments);

      markup += generateProjectMarkup(
        project,
        projectAssignments,
        engineers,
        projects,
        assignments,
        safeEndDate,
      );
    }
  }

  markup += "\n    section End\n";
  markup += `        e :milestone, ${dateUtils.toISOLocalString(safeEndDate)}, 0d\n\n`;

  // Add click commands for each project
  projects.forEach(project => {
    const shortId = project.id.substring(0, 8);
    const url = baseUrl ? `${baseUrl}/schedule/p/${shortId}` : `/schedule/p/${shortId}`;
    markup += `  click ${shortId} href "${url}"\n`;
  });

  markupCache.fullMarkup.set(cacheKey, markup);
  return markup;
}
