import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { useProjectStore } from "./projectStore";
import { useTeamStore } from "./teamStore";
import logger from "../utils/logger";
import { clearAllCaches } from "../lib/scheduler";

// Maximum number of states to keep in history
const MAX_HISTORY_LENGTH = 20;

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
const UNDO_STACK_KEY = "undo_stack";
const REDO_STACK_KEY = "redo_stack";

const getInitialState = () => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  return storedData ? JSON.parse(storedData) : [];
};

const getInitialHistoryState = (planId) => {
  if (!planId) return { undoStack: [], redoStack: [] };
  
  const undoStackKey = `${UNDO_STACK_KEY}_${planId}`;
  const redoStackKey = `${REDO_STACK_KEY}_${planId}`;
  
  const storedUndoStack = localStorage.getItem(undoStackKey);
  const storedRedoStack = localStorage.getItem(redoStackKey);
  
  return {
    undoStack: storedUndoStack ? JSON.parse(storedUndoStack) : [],
    redoStack: storedRedoStack ? JSON.parse(storedRedoStack) : []
  };
};

const usePlanStore = create((set, get) => ({
  plans: getInitialState(),
  currentPlanId: null,
  initialized: false,
  undoStack: [],
  redoStack: [],
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
      
      // Load history state from localStorage
      const { undoStack, redoStack } = getInitialHistoryState(newCurrentPlanId);

      return {
        ...state,
        currentPlanId: newCurrentPlanId,
        initialized: true,
        undoStack,
        redoStack
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
  // Save current state to history before making changes
  saveToHistory: (actionName) => {
    try {
      const planId = get().currentPlanId;
      if (!planId) return;
      
      // Get current state from all stores
      const currentPlanState = {
        plans: get().plans,
        currentPlanId: planId
      };
      
      // Get project state
      const projectStore = useProjectStore.getState();
      const currentProjectState = projectStore ? {
        projects: projectStore.projects
      } : null;
      
      // Get team state
      const teamStore = useTeamStore.getState();
      const currentTeamState = teamStore ? {
        team: teamStore.team
      } : null;
      
      // Combined state
      const currentState = {
        plan: currentPlanState,
        project: currentProjectState,
        team: currentTeamState,
        actionName
      };
      
      set(state => {
        // Limit the size of the undo stack
        const undoStack = [currentState, ...state.undoStack].slice(0, MAX_HISTORY_LENGTH);
        const redoStack = []; // Clear redo stack when a new action is performed
        
        // Save to localStorage
        const undoStackKey = `${UNDO_STACK_KEY}_${planId}`;
        const redoStackKey = `${REDO_STACK_KEY}_${planId}`;
        
        localStorage.setItem(undoStackKey, JSON.stringify(undoStack));
        localStorage.setItem(redoStackKey, JSON.stringify(redoStack));
        
        return { undoStack, redoStack };
      });
    } catch (e) {
      logger.error("Failed to save history:", e);
    }
  },
  
  // Undo the last change
  undoChange: () => {
    const { undoStack, redoStack } = get();
    const planId = get().currentPlanId;
    
    if (!planId || undoStack.length === 0) return;
    
    // Get the last state from undo stack
    const [lastState, ...remainingUndoStack] = undoStack;
    
    try {
      // Save current state to redo stack
      const currentPlanState = {
        plans: get().plans,
        currentPlanId: get().currentPlanId
      };
      
      // Get project state
      const projectStore = useProjectStore.getState();
      const currentProjectState = projectStore ? {
        projects: projectStore.projects
      } : null;
      
      // Get team state
      const teamStore = useTeamStore.getState();
      const currentTeamState = teamStore ? {
        team: teamStore.team
      } : null;
      
      // Combined current state
      const currentState = {
        plan: currentPlanState,
        project: currentProjectState,
        team: currentTeamState,
        actionName: "current"
      };
      
      const newRedoStack = [currentState, ...redoStack];
      
      // Apply the previous plan state
      set({
        plans: lastState.plan.plans,
        currentPlanId: lastState.plan.currentPlanId,
        undoStack: remainingUndoStack,
        redoStack: newRedoStack
      });
      
      // Save plan state to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lastState.plan.plans));
      localStorage.setItem(CURRENT_PLAN_KEY, lastState.plan.currentPlanId?.toString() || "");
      
      // Save history to localStorage
      const undoStackKey = `${UNDO_STACK_KEY}_${planId}`;
      const redoStackKey = `${REDO_STACK_KEY}_${planId}`;
      localStorage.setItem(undoStackKey, JSON.stringify(remainingUndoStack));
      localStorage.setItem(redoStackKey, JSON.stringify(newRedoStack));
      
      // Restore project state if available
      if (lastState.project && projectStore) {
        const planId = lastState.plan.currentPlanId;
        if (planId) {
          // Save project state to localStorage
          localStorage.setItem(
            `projects_data_${planId}`,
            JSON.stringify(lastState.project.projects)
          );
          
          // Update project store state
          projectStore.setProjects(lastState.project.projects);
        }
      }
      
      // Restore team state if available
      if (lastState.team && teamStore) {
        const planId = lastState.plan.currentPlanId;
        if (planId) {
          // Save team state to localStorage
          localStorage.setItem(
            `engineers_data_${planId}`,
            JSON.stringify(lastState.team.team)
          );
          
          // Update team store state
          teamStore.setTeam(lastState.team.team);
        }
      }
      
      // Sync with other stores
      get().syncCurrentPlanId(lastState.plan.currentPlanId);
      
      // Clear caches to ensure schedule is recalculated
      clearAllCaches();
    } catch (e) {
      logger.error("Failed to undo change:", e);
    }
  },
  
  // Redo the last undone change
  redoChange: () => {
    const { redoStack } = get();
    const planId = get().currentPlanId;
    
    if (!planId || redoStack.length === 0) return;
    
    try {
      // Get the last state from redo stack
      const [nextState, ...remainingRedoStack] = redoStack;
      
      // Save current state to undo stack
      const currentPlanState = {
        plans: get().plans,
        currentPlanId: get().currentPlanId
      };
      
      // Get project state
      const projectStore = useProjectStore.getState();
      const currentProjectState = projectStore ? {
        projects: projectStore.projects
      } : null;
      
      // Get team state
      const teamStore = useTeamStore.getState();
      const currentTeamState = teamStore ? {
        team: teamStore.team
      } : null;
      
      // Combined current state
      const currentState = {
        plan: currentPlanState,
        project: currentProjectState,
        team: currentTeamState,
        actionName: "undone"
      };
      
      // Apply the next plan state
      set(state => {
        const newUndoStack = [currentState, ...state.undoStack];
        
        // Save history to localStorage
        const undoStackKey = `${UNDO_STACK_KEY}_${planId}`;
        const redoStackKey = `${REDO_STACK_KEY}_${planId}`;
        localStorage.setItem(undoStackKey, JSON.stringify(newUndoStack));
        localStorage.setItem(redoStackKey, JSON.stringify(remainingRedoStack));
        
        return {
          plans: nextState.plan.plans,
          currentPlanId: nextState.plan.currentPlanId,
          undoStack: newUndoStack,
          redoStack: remainingRedoStack
        };
      });
      
      // Save plan state to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState.plan.plans));
      localStorage.setItem(CURRENT_PLAN_KEY, nextState.plan.currentPlanId?.toString() || "");
      
      // Restore project state if available
      if (nextState.project && projectStore) {
        const planId = nextState.plan.currentPlanId;
        if (planId) {
          // Save project state to localStorage
          localStorage.setItem(
            `projects_data_${planId}`,
            JSON.stringify(nextState.project.projects)
          );
          
          // Update project store state
          projectStore.setProjects(nextState.project.projects);
        }
      }
      
      // Restore team state if available
      if (nextState.team && teamStore) {
        const planId = nextState.plan.currentPlanId;
        if (planId) {
          // Save team state to localStorage
          localStorage.setItem(
            `engineers_data_${planId}`,
            JSON.stringify(nextState.team.team)
          );
          
          // Update team store state
          teamStore.setTeam(nextState.team.team);
        }
      }
      
      // Sync with other stores
      get().syncCurrentPlanId(nextState.plan.currentPlanId);
      
      // Clear caches to ensure schedule is recalculated
      clearAllCaches();
    } catch (e) {
      logger.error("Failed to redo change:", e);
    }
  },
  
  // Clear history when changing plans
  clearHistory: (planId) => {
    if (planId) {
      const undoStackKey = `${UNDO_STACK_KEY}_${planId}`;
      const redoStackKey = `${REDO_STACK_KEY}_${planId}`;
      localStorage.removeItem(undoStackKey);
      localStorage.removeItem(redoStackKey);
    }
    set({ undoStack: [], redoStack: [] });
  },
  
  addPlan: (plan) => {
    get().saveToHistory("Add Plan");
    
    set((state) => {
      const newPlan = { id: uuidv4(), ...plan };
      const newState = {
        plans: [...state.plans, newPlan],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.plans));

      // Clear caches to ensure schedule is recalculated
      clearAllCaches();

      return newState;
    });
  },
  // New function to import a plan by regenerating all nested ids.
  importPlan: (plan) => {
    get().saveToHistory("Import Plan");
    
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
    });
  },
  updatePlan: (id, updates) => {
    get().saveToHistory("Update Plan");
    
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
    });
  },
  removePlan: (id) => {
    get().saveToHistory("Remove Plan");
    
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
    });
  },
  setCurrentPlanId: (id) => {
    // Clear history for the previous plan
    const prevPlanId = get().currentPlanId;
    if (prevPlanId && prevPlanId !== id) {
      get().clearHistory(prevPlanId);
    }
    
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
      
      // Load history for the new plan
      const { undoStack, redoStack } = getInitialHistoryState(id);

      return { 
        ...state, 
        currentPlanId: id, 
        plans: updatedPlans,
        undoStack,
        redoStack
      };
    });
  },
  clearPlans: () => {
    get().saveToHistory("Clear Plans");
    
    set((state) => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CURRENT_PLAN_KEY);

      // Clear the current plan ID in other stores
      get().syncCurrentPlanId(null);

      // Clear caches to ensure schedule is recalculated
      clearAllCaches();

      return { plans: [], currentPlanId: null };
    });
  },
}));

export { usePlanStore };
