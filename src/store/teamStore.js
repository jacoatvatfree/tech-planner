import { create } from "zustand";
import logger from "../utils/logger";
import { clearAllCaches } from "../lib/scheduler";
import { deprecatedLogEngineerTerminology } from "../utils/deprecatedCompatibility";
import { usePlanStore } from "./planStore";

const STORAGE_KEY = "engineers_data"; // Keep for backward compatibility

const getInitialState = (planId) => {
  const storedData = localStorage.getItem(`${STORAGE_KEY}_${planId}`);
  return storedData ? JSON.parse(storedData) : [];
};

const useTeamStore = create((set, get) => ({
  team: [],
  currentPlanId: null, // Store the current plan ID locally
  setCurrentPlanId: (planId) => set({ currentPlanId: planId }),
  initializeTeam: (planId) => {
    set({ team: getInitialState(planId), currentPlanId: planId });
  },
  setTeam: (team) => set({ team }),
  addTeamMember: (teamMember) =>
    set((state) => {
      const planId = state.currentPlanId;
      if (!planId) {
        logger.error("Cannot add team member: No plan selected");
        return state;
      }
      
      // Save current state to history before making changes
      try {
        const planStore = usePlanStore.getState();
        if (planStore && planStore.saveToHistory) {
          planStore.saveToHistory("Add Team Member");
        }
      } catch (e) {
        logger.error("Failed to save history:", e);
      }
      
      const newState = {
        team: [...state.team, { ...teamMember, planId }],
      };
      localStorage.setItem(
        `${STORAGE_KEY}_${planId}`,
        JSON.stringify(newState.team),
      );

      // Clear caches to ensure schedule is recalculated
      clearAllCaches();

      return newState;
    }),
  updateTeamMember: (id, updates) =>
    set((state) => {
      const planId = state.currentPlanId;
      if (!planId) {
        logger.error("Cannot update team member: No plan selected");
        return state;
      }
      
      // Save current state to history before making changes
      try {
        const planStore = usePlanStore.getState();
        if (planStore && planStore.saveToHistory) {
          planStore.saveToHistory("Update Team Member");
        }
      } catch (e) {
        logger.error("Failed to save history:", e);
      }
      
      const newState = {
        team: state.team.map((teamMember) =>
          teamMember.id === id ? { ...teamMember, ...updates } : teamMember,
        ),
      };
      localStorage.setItem(
        `${STORAGE_KEY}_${planId}`,
        JSON.stringify(newState.team),
      );

      // Clear caches to ensure schedule is recalculated
      clearAllCaches();

      return newState;
    }),
  removeTeamMember: (id) =>
    set((state) => {
      const planId = state.currentPlanId;
      if (!planId) {
        logger.error("Cannot remove team member: No plan selected");
        return state;
      }
      
      // Save current state to history before making changes
      try {
        const planStore = usePlanStore.getState();
        if (planStore && planStore.saveToHistory) {
          planStore.saveToHistory("Remove Team Member");
        }
      } catch (e) {
        logger.error("Failed to save history:", e);
      }
      
      const newState = {
        team: state.team.filter((teamMember) => teamMember.id !== id),
      };
      localStorage.setItem(
        `${STORAGE_KEY}_${planId}`,
        JSON.stringify(newState.team),
      );

      // Clear caches to ensure schedule is recalculated
      clearAllCaches();

      return newState;
    }),
  clearTeam: () =>
    set((state) => {
      const planId = state.currentPlanId;
      if (!planId) {
        logger.error("Cannot clear team: No plan selected");
        return state;
      }
      
      // Save current state to history before making changes
      try {
        const planStore = usePlanStore.getState();
        if (planStore && planStore.saveToHistory) {
          planStore.saveToHistory("Clear Team");
        }
      } catch (e) {
        logger.error("Failed to save history:", e);
      }
      
      localStorage.removeItem(`${STORAGE_KEY}_${planId}`);

      // Clear caches to ensure schedule is recalculated
      clearAllCaches();

      return { team: [] };
    }),
  // Deprecated aliases for backward compatibility
  /**
   * @deprecated Use team instead of engineers
   */
  get engineers() {
    deprecatedLogEngineerTerminology();
    return get().team;
  },
  /**
   * @deprecated Use initializeTeam instead
   */
  initializeEngineers: (planId) => {
    deprecatedLogEngineerTerminology();
    return get().initializeTeam(planId);
  },
  /**
   * @deprecated Use addTeamMember instead
   */
  addEngineer: (engineer) => {
    deprecatedLogEngineerTerminology();
    return get().addTeamMember(engineer);
  },
  /**
   * @deprecated Use updateTeamMember instead
   */
  updateEngineer: (id, updates) => {
    deprecatedLogEngineerTerminology();
    return get().updateTeamMember(id, updates);
  },
  /**
   * @deprecated Use removeTeamMember instead
   */
  removeEngineer: (id) => {
    deprecatedLogEngineerTerminology();
    return get().removeTeamMember(id);
  },
  /**
   * @deprecated Use clearTeam instead
   */
  clearEngineers: () => {
    deprecatedLogEngineerTerminology();
    return get().clearTeam();
  },
}));

export { useTeamStore };
/**
 * @deprecated Use useTeamStore instead
 */
export const useEngineerStore = useTeamStore;
