import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { useProjectStore } from "./projectStore";
import { useTeamStore } from "./teamStore";
import logger from "../utils/logger";
import { clearAllCaches } from "../lib/scheduler";

// Helper function to recursively regenerate all "id" properties in an object or array.
// This assigns a new uuid for every property named "id".
function regenerateIds(obj) {
  if (Array.isArray(obj)) {
    return obj.map((item) => regenerateIds(item));
  } else if (obj && typeof obj === "object") {
    const newObj = {};
    for (const key in obj) {
      if (key === "id") {
        newObj[key] = uuidv4();
      } else {
        newObj[key] = regenerateIds(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

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
      const newCurrentPlanId = storedCurrentPlanId ? storedCurrentPlanId : null;

      // Initialize other stores with the current plan ID
      if (newCurrentPlanId) {
        get().syncCurrentPlanId(newCurrentPlanId);
      }

      return {
        ...state,
        currentPlanId: newCurrentPlanId,
        initialized: true,
      };
    }),
  // Synchronize the current plan ID with other stores
  syncCurrentPlanId: (id) => {
    // Update the project store
    try {
      const projectStore = useProjectStore.getState();
      if (projectStore && projectStore.setCurrentPlanId) {
        projectStore.setCurrentPlanId(id);
        if (id) projectStore.initializeProjects(id);
      }
    } catch (e) {
      logger.error("Failed to sync plan ID with project store:", e);
    }

    // Update the team store
    try {
      const teamStore = useTeamStore.getState();
      if (teamStore && teamStore.setCurrentPlanId) {
        teamStore.setCurrentPlanId(id);
        if (id) teamStore.initializeEngineers(id);
      }
    } catch (e) {
      logger.error("Failed to sync plan ID with team store:", e);
    }
  },
  addPlan: (plan) =>
    set((state) => {
      const newPlan = { id: uuidv4(), ...plan };
      const newState = {
        plans: [...state.plans, newPlan],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.plans));

      // Clear caches to ensure schedule is recalculated
      clearAllCaches();

      return newState;
    }),
  // New function to import a plan by regenerating all nested ids.
  importPlan: (plan) =>
    set((state) => {
      // Recursively regenerate ids in the imported plan.
      const regeneratedPlan = regenerateIds(plan);
      // Remove the root id so that addPlan can assign a new one.
      delete regeneratedPlan.id;
      const newPlan = { id: uuidv4(), ...regeneratedPlan };
      const newState = {
        plans: [...state.plans, newPlan],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.plans));

      // Clear caches to ensure schedule is recalculated
      clearAllCaches();

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

      // Clear caches to ensure schedule is recalculated
      clearAllCaches();

      return newState;
    }),
  removePlan: (id) =>
    set((state) => {
      const newState = {
        plans: state.plans.filter((plan) => plan.id !== id),
      };
      // Remove associated data from localStorage.
      localStorage.removeItem(`projects_data_${id}`);
      localStorage.removeItem(`team_data_${id}`);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.plans));

      // Clear caches to ensure schedule is recalculated
      clearAllCaches();

      return newState;
    }),
  setCurrentPlanId: (id) =>
    set((state) => {
      localStorage.setItem(CURRENT_PLAN_KEY, id?.toString() || "");

      // Force a shallow update of the active plan to trigger UI refresh
      const updatedPlans = state.plans.map((plan) => {
        if (plan.id === id) {
          return { ...plan };
        }
        return plan;
      });

      // Synchronize with other stores
      get().syncCurrentPlanId(id);

      // Clear caches to ensure schedule is recalculated
      clearAllCaches();

      return { ...state, currentPlanId: id, plans: updatedPlans };
    }),
  clearPlans: () =>
    set((state) => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CURRENT_PLAN_KEY);

      // Clear the current plan ID in other stores
      get().syncCurrentPlanId(null);

      // Clear caches to ensure schedule is recalculated
      clearAllCaches();

      return { plans: [], currentPlanId: null };
    }),
}));

export { usePlanStore };
