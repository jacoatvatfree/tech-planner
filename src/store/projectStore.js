import { create } from "zustand";
    import { usePlanStore } from "./planStore";

    const STORAGE_KEY = "projects_data";

    const getInitialState = (planId) => {
      const storedData = localStorage.getItem(`${STORAGE_KEY}_${planId}`);
      return storedData ? JSON.parse(storedData) : [];
    };

    const useProjectStore = create((set, get) => ({
      projects: [],
      initializeProjects: (planId) => {
        set({ projects: getInitialState(planId) });
      },
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
      updateProject: (id, updates) =>
        set((state) => {
          const { currentPlanId } = usePlanStore.getState();
          const newState = {
            projects: state.projects.map((project) =>
              project.id === id ? { ...project, ...updates } : project,
            ),
          };
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
    }));

    export { useProjectStore };
