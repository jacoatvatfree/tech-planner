import { create } from "zustand";
import logger from "../utils/logger";

const STORAGE_KEY = "engineers_data";

const getInitialState = (planId) => {
  const storedData = localStorage.getItem(`${STORAGE_KEY}_${planId}`);
  return storedData ? JSON.parse(storedData) : [];
};

const useEngineerStore = create((set, get) => ({
  engineers: [],
  currentPlanId: null, // Store the current plan ID locally
  setCurrentPlanId: (planId) => set({ currentPlanId: planId }),
  initializeEngineers: (planId) => {
    set({ engineers: getInitialState(planId), currentPlanId: planId });
  },
  addEngineer: (engineer) =>
    set((state) => {
      const planId = state.currentPlanId;
      if (!planId) {
        logger.error("Cannot add engineer: No plan selected");
        return state;
      }
      const newState = {
        engineers: [...state.engineers, { ...engineer, planId }],
      };
      localStorage.setItem(
        `${STORAGE_KEY}_${planId}`,
        JSON.stringify(newState.engineers),
      );
      return newState;
    }),
  updateEngineer: (id, updates) =>
    set((state) => {
      const planId = state.currentPlanId;
      if (!planId) {
        logger.error("Cannot update engineer: No plan selected");
        return state;
      }
      const newState = {
        engineers: state.engineers.map((engineer) =>
          engineer.id === id ? { ...engineer, ...updates } : engineer,
        ),
      };
      localStorage.setItem(
        `${STORAGE_KEY}_${planId}`,
        JSON.stringify(newState.engineers),
      );
      return newState;
    }),
  removeEngineer: (id) =>
    set((state) => {
      const planId = state.currentPlanId;
      if (!planId) {
        logger.error("Cannot remove engineer: No plan selected");
        return state;
      }
      const newState = {
        engineers: state.engineers.filter((engineer) => engineer.id !== id),
      };
      localStorage.setItem(
        `${STORAGE_KEY}_${planId}`,
        JSON.stringify(newState.engineers),
      );
      return newState;
    }),
  clearEngineers: () =>
    set((state) => {
      const planId = state.currentPlanId;
      if (!planId) {
        logger.error("Cannot clear engineers: No plan selected");
        return state;
      }
      localStorage.removeItem(`${STORAGE_KEY}_${planId}`);
      return { engineers: [] };
    }),
}));

export { useEngineerStore };
