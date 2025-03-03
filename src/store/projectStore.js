import { create } from "zustand";
import logger from "../utils/logger";

const STORAGE_KEY = "projects_data";

const getInitialState = (planId) => {
  const storedData = localStorage.getItem(`${STORAGE_KEY}_${planId}`);
  return storedData ? JSON.parse(storedData) : [];
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
      
      const newState = {
        projects: [...state.projects, project],
      };
      localStorage.setItem(
        `${STORAGE_KEY}_${planId}`,
        JSON.stringify(newState.projects),
      );
      return newState;
    }),
  updateProject: (updatedProject) =>
    set((state) => {
      const planId = state.currentPlanId;
      if (!planId) {
        logger.error("Cannot update project: No plan selected");
        return state;
      }
      
      const newState = {
        projects: state.projects.map((project) =>
          project.id === updatedProject.id ? updatedProject : project,
        ),
      };
      localStorage.setItem(
        `${STORAGE_KEY}_${planId}`,
        JSON.stringify(newState.projects),
      );
      return newState;
    }),
  removeProject: (id) =>
    set((state) => {
      const planId = state.currentPlanId;
      if (!planId) {
        logger.error("Cannot remove project: No plan selected");
        return state;
      }
      
      const newState = {
        projects: state.projects.filter((project) => project.id !== id),
      };
      localStorage.setItem(
        `${STORAGE_KEY}_${planId}`,
        JSON.stringify(newState.projects),
      );
      return newState;
    }),
  clearProjects: () =>
    set((state) => {
      const planId = state.currentPlanId;
      if (!planId) {
        logger.error("Cannot clear projects: No plan selected");
        return state;
      }
      
      localStorage.removeItem(`${STORAGE_KEY}_${planId}`);
      return { projects: [] };
    }),
  reprioritizeProjects: () =>
    set((state) => {
      const planId = state.currentPlanId;
      if (!planId) {
        logger.error("Cannot reprioritize projects: No plan selected");
        return state;
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
      return { projects: sortedProjects };
    }),
}));

export { useProjectStore };
