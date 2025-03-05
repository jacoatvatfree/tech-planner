import { create } from "zustand";
import logger from "../utils/logger";
import { clearAllCaches } from "../lib/scheduler";
import { deprecatedAllocationsToTeamMemberIds } from "../utils/deprecatedCompatibility";
import { usePlanStore } from "./planStore";

const STORAGE_KEY = "projects_data";

const getInitialState = (planId) => {
  const storedData = localStorage.getItem(`${STORAGE_KEY}_${planId}`);
  
  if (!storedData) return [];
  
  // Parse the stored data
  const projects = JSON.parse(storedData);
  
  // Convert allocations to teamMemberIds for each project
  return projects.map(project => {
    // If the project already has teamMemberIds, return it as is
    if (project.teamMemberIds?.length) {
      return project;
    }
    
  // If the project has allocations, convert them to teamMemberIds and discard allocations
  if (project.allocations?.length) {
    // Extract unique engineerIds from allocations using deprecated utility
    const teamMemberIds = deprecatedAllocationsToTeamMemberIds(project.allocations);
    
    // Return a new project object with teamMemberIds and without allocations
    const { allocations, ...projectWithoutAllocations } = project;
    return {
      ...projectWithoutAllocations,
      teamMemberIds
    };
  }
    
    // If the project has neither, return it with an empty teamMemberIds array
    return {
      ...project,
      teamMemberIds: []
    };
  });
};

const useProjectStore = create((set, get) => ({
  projects: [],
  currentPlanId: null, // Store the current plan ID locally
  schedule: {
    assignments: [],
    scheduledProjects: [],
    resourceUtilization: {
      allocated: 0,
      available: 0,
      percentage: 0,
    },
  },
  setCurrentPlanId: (planId) => set({ currentPlanId: planId }),
  initializeProjects: (planId) => {
    set({ projects: getInitialState(planId), currentPlanId: planId });
  },
  setProjects: (projects) => set({ projects }),
  setSchedule: (scheduleData) =>
    set((state) => ({
      schedule: {
        assignments: scheduleData.assignments,
        scheduledProjects: scheduleData.scheduledProjects,
        resourceUtilization: scheduleData.resourceUtilization,
      },
    })),
  addProject: (project) =>
    set((state) => {
      const planId = state.currentPlanId;
      if (!planId) {
        logger.error("Cannot add project: No plan selected");
        return state;
      }
      
      // Save current state to history before making changes
      try {
        const planStore = usePlanStore.getState();
        if (planStore && planStore.saveToHistory) {
          planStore.saveToHistory("Add Project");
        }
      } catch (e) {
        logger.error("Failed to save history:", e);
      }
      
      // Convert allocations to teamMemberIds if needed
      let projectWithTeamMemberIds = project;
      
      if (!project.teamMemberIds && project.allocations?.length) {
        // Extract unique engineerIds from allocations using deprecated utility
        const teamMemberIds = deprecatedAllocationsToTeamMemberIds(project.allocations);
        
        // Create a new project with teamMemberIds and without allocations
        const { allocations, ...projectWithoutAllocations } = project;
        projectWithTeamMemberIds = {
          ...projectWithoutAllocations,
          teamMemberIds
        };
      } else if (!project.teamMemberIds) {
        // Ensure project has teamMemberIds array even if empty
        projectWithTeamMemberIds = {
          ...project,
          teamMemberIds: []
        };
      }
      
      const newState = {
        projects: [...state.projects, projectWithTeamMemberIds],
      };
      localStorage.setItem(
        `${STORAGE_KEY}_${planId}`,
        JSON.stringify(newState.projects),
      );
      
      // Clear caches to ensure schedule is recalculated
      clearAllCaches();
      
      return newState;
    }),
  updateProject: (updatedProject) =>
    set((state) => {
      const planId = state.currentPlanId;
      if (!planId) {
        logger.error("Cannot update project: No plan selected");
        return state;
      }
      
      // Save current state to history before making changes
      try {
        const planStore = usePlanStore.getState();
        if (planStore && planStore.saveToHistory) {
          planStore.saveToHistory("Update Project");
        }
      } catch (e) {
        logger.error("Failed to save history:", e);
      }
      
      // Convert allocations to teamMemberIds if needed
      let projectWithTeamMemberIds = updatedProject;
      
      if (!updatedProject.teamMemberIds && updatedProject.allocations?.length) {
        // Extract unique engineerIds from allocations using deprecated utility
        const teamMemberIds = deprecatedAllocationsToTeamMemberIds(updatedProject.allocations);
        
        // Create a new project with teamMemberIds and without allocations
        const { allocations, ...projectWithoutAllocations } = updatedProject;
        projectWithTeamMemberIds = {
          ...projectWithoutAllocations,
          teamMemberIds
        };
      } else if (!updatedProject.teamMemberIds) {
        // Ensure project has teamMemberIds array even if empty
        projectWithTeamMemberIds = {
          ...updatedProject,
          teamMemberIds: []
        };
      }
      
      const newState = {
        projects: state.projects.map((project) =>
          project.id === updatedProject.id ? projectWithTeamMemberIds : project,
        ),
      };
      localStorage.setItem(
        `${STORAGE_KEY}_${planId}`,
        JSON.stringify(newState.projects),
      );
      
      // Clear caches to ensure schedule is recalculated
      clearAllCaches();
      
      return newState;
    }),
  removeProject: (id) =>
    set((state) => {
      const planId = state.currentPlanId;
      if (!planId) {
        logger.error("Cannot remove project: No plan selected");
        return state;
      }
      
      // Save current state to history before making changes
      try {
        const planStore = usePlanStore.getState();
        if (planStore && planStore.saveToHistory) {
          planStore.saveToHistory("Remove Project");
        }
      } catch (e) {
        logger.error("Failed to save history:", e);
      }
      
      const newState = {
        projects: state.projects.filter((project) => project.id !== id),
      };
      localStorage.setItem(
        `${STORAGE_KEY}_${planId}`,
        JSON.stringify(newState.projects),
      );
      
      // Clear caches to ensure schedule is recalculated
      clearAllCaches();
      
      return newState;
    }),
  clearProjects: () =>
    set((state) => {
      const planId = state.currentPlanId;
      if (!planId) {
        logger.error("Cannot clear projects: No plan selected");
        return state;
      }
      
      // Save current state to history before making changes
      try {
        const planStore = usePlanStore.getState();
        if (planStore && planStore.saveToHistory) {
          planStore.saveToHistory("Clear Projects");
        }
      } catch (e) {
        logger.error("Failed to save history:", e);
      }
      
      localStorage.removeItem(`${STORAGE_KEY}_${planId}`);
      
      // Clear caches to ensure schedule is recalculated
      clearAllCaches();
      
      return { projects: [] };
    }),
  reprioritizeProjects: () =>
    set((state) => {
      const planId = state.currentPlanId;
      if (!planId) {
        logger.error("Cannot reprioritize projects: No plan selected");
        return state;
      }
      
      // Save current state to history before making changes
      try {
        const planStore = usePlanStore.getState();
        if (planStore && planStore.saveToHistory) {
          planStore.saveToHistory("Reprioritize Projects");
        }
      } catch (e) {
        logger.error("Failed to save history:", e);
      }
      
      const sortedProjects = [...state.projects]
        .sort((a, b) => a.priority - b.priority)
        .map((project, index) => ({
          ...project,
          priority: index + 1,
        }));

      localStorage.setItem(
        `${STORAGE_KEY}_${planId}`,
        JSON.stringify(sortedProjects),
      );
      
      // Clear caches to ensure schedule is recalculated
      clearAllCaches();
      
      return { projects: sortedProjects };
    }),
}));

export { useProjectStore };
