import create from "zustand";

const STORAGE_KEY = "projects_data";

// Load initial state from localStorage
const getInitialState = () => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  return storedData ? JSON.parse(storedData) : [];
};

const useProjectStore = create((set) => ({
  projects: getInitialState(),
  addProject: (project) =>
    set((state) => {
      const newState = {
        projects: [...state.projects, { ...project, id: Date.now() }],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.projects));
      return newState;
    }),
  updateProject: (id, updates) =>
    set((state) => {
      const newState = {
        projects: state.projects.map((proj) =>
          proj.id === id ? { ...proj, ...updates } : proj,
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
  clearProjects: () =>
    set(() => {
      localStorage.removeItem(STORAGE_KEY);
      return { projects: [] };
    }),
}));

export default useProjectStore;
