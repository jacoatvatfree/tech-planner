import { create } from "zustand";

    const STORAGE_KEY = "plans_data";

    const getInitialState = () => {
      const storedData = localStorage.getItem(STORAGE_KEY);
      return storedData ? JSON.parse(storedData) : [];
    };

    const usePlanStore = create((set) => ({
      plans: getInitialState(),
      currentPlanId: null,
      addPlan: (plan) =>
        set((state) => {
          const newState = {
            plans: [...state.plans, { ...plan, id: Date.now() }],
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.plans));
          return newState;
        }),
      updatePlan: (id, updates) =>
        set((state) => {
          const newState = {
            plans: state.plans.map((plan) =>
              plan.id === id ? { ...plan, ...updates } : plan
            ),
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.plans));
          return newState;
        }),
      removePlan: (id) =>
        set((state) => {
          const newState = {
            plans: state.plans.filter((plan) => plan.id !== id),
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.plans));
          return newState;
        }),
      setCurrentPlanId: (id) => set({ currentPlanId: id }),
      clearPlans: () =>
        set(() => {
          localStorage.removeItem(STORAGE_KEY);
          return { plans: [] };
        }),
    }));

    export { usePlanStore };
