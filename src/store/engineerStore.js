import { create } from "zustand";
import { usePlanStore } from "./planStore";

const STORAGE_KEY = "engineers_data";

const getInitialState = (planId) => {
  const storedData = localStorage.getItem(`${STORAGE_KEY}_${planId}`);
  return storedData ? JSON.parse(storedData) : [];
};

const useEngineerStore = create((set, get) => ({
  engineers: [],
  initializeEngineers: (planId) => {
    const initialData = getInitialState(planId);
    console.log("Initializing Engineers for Plan:", planId, initialData);
    const currentEngineers = get().engineers;
    // Only set if we have new data or no current engineers
    if (initialData.length > 0 || currentEngineers.length === 0) {
      set({ engineers: initialData });
    }
  },
  addEngineer: (engineer) =>
    set((state) => {
      const { currentPlanId } = usePlanStore.getState();
      if (!currentPlanId) {
        console.error("Cannot add engineer: No plan selected");
        return state;
      }
      const newState = {
        engineers: [...state.engineers, { ...engineer, planId: currentPlanId }],
      };
      localStorage.setItem(
        `${STORAGE_KEY}_${currentPlanId}`,
        JSON.stringify(newState.engineers),
      );
      return newState;
    }),
  updateEngineer: (id, updates) =>
    set((state) => {
      const { currentPlanId } = usePlanStore.getState();
      const newState = {
        engineers: state.engineers.map((engineer) =>
          engineer.id === id ? { ...engineer, ...updates } : engineer,
        ),
      };
      localStorage.setItem(
        `${STORAGE_KEY}_${currentPlanId}`,
        JSON.stringify(newState.engineers),
      );
      return newState;
    }),
  removeEngineer: (id) =>
    set((state) => {
      const { currentPlanId } = usePlanStore.getState();
      const newState = {
        engineers: state.engineers.filter((engineer) => engineer.id !== id),
      };
      localStorage.setItem(
        `${STORAGE_KEY}_${currentPlanId}`,
        JSON.stringify(newState.engineers),
      );
      return newState;
    }),
  clearEngineers: () =>
    set(() => {
      const { currentPlanId } = usePlanStore.getState();
      localStorage.removeItem(`${STORAGE_KEY}_${currentPlanId}`);
      return { engineers: [] };
    }),
}));

export { useEngineerStore };
