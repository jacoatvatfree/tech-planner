import create from "zustand";

const STORAGE_KEY = "engineers_data";

// Load initial state from localStorage
const getInitialState = () => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  return storedData ? JSON.parse(storedData) : [];
};

const useEngineerStore = create((set) => ({
  engineers: getInitialState(),
  addEngineer: (engineer) =>
    set((state) => {
      const newState = {
        engineers: [...state.engineers, { ...engineer, id: Date.now() }],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.engineers));
      return newState;
    }),
  updateEngineer: (id, updates) =>
    set((state) => {
      const newState = {
        engineers: state.engineers.map((eng) =>
          eng.id === id ? { ...eng, ...updates } : eng,
        ),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.engineers));
      return newState;
    }),
  removeEngineer: (id) =>
    set((state) => {
      const newState = {
        engineers: state.engineers.filter((eng) => eng.id !== id),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.engineers));
      return newState;
    }),
  clearEngineers: () =>
    set(() => {
      localStorage.removeItem(STORAGE_KEY);
      return { engineers: [] };
    }),
}));

export default useEngineerStore;
