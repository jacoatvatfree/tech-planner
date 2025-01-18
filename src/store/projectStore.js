import { create } from "zustand";

const STORAGE_KEY = "projects_data";

const getInitialState = () => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  return storedData ? JSON.parse(storedData) : [];
};

const useProjectStore = create((set) => ({
  projects: getInitialState(),
  addProject: (project) =>
    set((state) => {
      const newState = {
        projects: [...state.projects, { ...project }],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.projects));
      return newState;
    }),
  updateProject: (id, updates) =>
    set((state) => {
      const newState = {
        projects: state.projects.map((proj) =>
          proj.id === id ? { ...proj, ...updates } : proj
        ),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.projects));
      return newState;
    }),
  removeProject: (id) =>
    set((state) => {
      const newState = {
        projects: state.projects.filter((proj) => proj.id !== id),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.projects));
      return newState;
    }),
  allocateEngineer: (projectId, engineerId, startDate, endDate) =>
    set((state) => {
      const newState = {
        projects: state.projects.map((proj) => {
          if (proj.id === projectId) {
            const newAllocations = [...(proj.allocations || [])];
            const existingAllocationIndex = newAllocations.findIndex(
              (a) => a.engineerId === engineerId
            );

            if (existingAllocationIndex >= 0) {
              newAllocations[existingAllocationIndex] = {
                engineerId,
                startDate,
                endDate,
                percentage: 100,
              };
            } else {
              newAllocations.push({
                engineerId,
                startDate,
                endDate,
                percentage: 100,
              });
            }

            return {
              ...proj,
              allocations: newAllocations,
            };
          }
          return proj;
        }),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.projects));
      return newState;
    }),
  clearProjects: () =>
    set(() => {
      localStorage.removeItem(STORAGE_KEY);
      return { projects: [] };
    }),
}));

export { useProjectStore };
