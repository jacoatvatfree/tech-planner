import { create } from "zustand";
import { usePlanStore } from "./planStore";

const STORAGE_KEY = "projects_data";

const getInitialState = (planId) => {
  const storedData = localStorage.getItem(`${STORAGE_KEY}_${planId}`);
  return storedData ? JSON.parse(storedData) : [];
};

const useProjectStore = create((set, get) => ({
  projects: [],
  schedule: {
    assignments: [],
    scheduledProjects: [],
    resourceUtilization: {
      allocated: 0,
      available: 0,
      percentage: 0,
    },
  },
  initializeProjects: (planId) => {
    set({ projects: getInitialState(planId) });
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
      const { currentPlanId } = usePlanStore.getState();
      const newState = {
        projects: [...state.projects, project],
      };
      localStorage.setItem(
        `${STORAGE_KEY}_${currentPlanId}`,
        JSON.stringify(newState.projects),
      );
      return newState;
    }),
  updateProject: (updatedProject) =>
    set((state) => {
      console.log("projectStore: Updating with:", updatedProject);
      const { currentPlanId } = usePlanStore.getState();
      const newState = {
        projects: state.projects.map((project) =>
          project.id === updatedProject.id ? updatedProject : project,
        ),
      };
      console.log("projectStore: New state:", newState.projects);
      localStorage.setItem(
        `${STORAGE_KEY}_${currentPlanId}`,
        JSON.stringify(newState.projects),
      );
      return newState;
    }),
  removeProject: (id) =>
    set((state) => {
      const { currentPlanId } = usePlanStore.getState();
      const newState = {
        projects: state.projects.filter((project) => project.id !== id),
      };
      localStorage.setItem(
        `${STORAGE_KEY}_${currentPlanId}`,
        JSON.stringify(newState.projects),
      );
      return newState;
    }),
  clearProjects: () =>
    set(() => {
      const { currentPlanId } = usePlanStore.getState();
      localStorage.removeItem(`${STORAGE_KEY}_${currentPlanId}`);
      return { projects: [] };
    }),
  reprioritizeProjects: () =>
    set((state) => {
      const { currentPlanId } = usePlanStore.getState();
      const sortedProjects = [...state.projects]
        .sort((a, b) => a.priority - b.priority)
        .map((project, index) => ({
          ...project,
          priority: index + 1,
        }));

      localStorage.setItem(
        `${STORAGE_KEY}_${currentPlanId}`,
        JSON.stringify(sortedProjects),
      );
      return { projects: sortedProjects };
    }),
}));

export { useProjectStore };
