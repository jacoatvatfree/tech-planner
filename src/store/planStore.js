import { create } from "zustand";

const STORAGE_KEY = "plans_data";
const CURRENT_PLAN_KEY = "current_plan_id";

const getInitialState = () => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  return storedData ? JSON.parse(storedData) : [];
};

const usePlanStore = create((set, get) => ({
  plans: getInitialState(),
  currentPlanId: null,
  initialized: false,
  currentPlan: () =>
    get().plans.find((plan) => plan.id === get().currentPlanId),
  initializeFromStorage: () =>
    set((state) => {
      const storedCurrentPlanId = localStorage.getItem(CURRENT_PLAN_KEY);
      return {
        ...state,
        currentPlanId: storedCurrentPlanId
          ? parseInt(storedCurrentPlanId, 10)
          : null,
        initialized: true,
      };
    }),
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
          plan.id === id ? { ...plan, ...updates } : plan,
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
      // Remove associated data from localStorage
      localStorage.removeItem(`projects_data_${id}`);
      localStorage.removeItem(`engineers_data_${id}`);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.plans));
      return newState;
    }),
  setCurrentPlanId: (id) =>
    set((state) => {
      localStorage.setItem(CURRENT_PLAN_KEY, id?.toString() || "");
      return { ...state, currentPlanId: id };
    }),
  clearPlans: () =>
    set(() => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CURRENT_PLAN_KEY);
      return { plans: [], currentPlanId: null };
    }),
}));

export { usePlanStore };
