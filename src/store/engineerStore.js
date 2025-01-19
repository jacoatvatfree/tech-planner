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
        set({ engineers: getInitialState(planId) });
      },
      addEngineer: (engineer) =>
        set((state) => {
          const { currentPlanId } = usePlanStore.getState();
          const newState = {
            engineers: [...state.engineers, engineer],
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
