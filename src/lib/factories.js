import { v4 as uuidv4 } from 'uuid';

    /**
     * Create a new engineer
     */
    export const makeEngineer = ({
      name,
      weeklyHours = 40,
      allocations = []
    }) => ({
      id: uuidv4(),
      name,
      weeklyHours,
      allocations
    });

    /**
     * Create a new project
     */
    export const makeProject = ({
      name,
      description = "",
      estimatedHours,
      startAfter = null,
      endBefore = null,
      priority = 3,
      allocations = []
    }) => ({
      id: uuidv4(),
      name,
      description,
      estimatedHours,
      startAfter,
      endBefore,
      priority,
      allocations
    });

    /**
     * Create a new allocation
     */
    export const makeAllocation = ({
      projectId,
      engineerId,
      startDate,
      endDate,
      percentage = 100
    }) => ({
      projectId,
      engineerId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      percentage
    });

    /**
     * Create a new schedule
     */
    export const makeSchedule = ({
      startDate,
      endDate,
      projects = [],
      engineers = []
    }) => ({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      projects,
      engineers
    });

    /**
     * Create a new plan
     */
    export const makePlan = ({
      name,
      startDate,
      endDate
    }) => ({
      id: Date.now(),
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    });
