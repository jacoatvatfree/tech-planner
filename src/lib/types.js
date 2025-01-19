// Core type definitions using JSDoc for better TypeScript-like validation
    /**
     * @typedef {Object} Engineer
     * @property {string} id
     * @property {string} name
     * @property {number} weeklyHours
     * @property {Array<Allocation>} allocations
     */

    /**
     * @typedef {Object} Allocation
     * @property {string} projectId
     * @property {string} engineerId
     * @property {Date} startDate
     * @property {Date} endDate
     * @property {number} percentage
     */

    /**
     * @typedef {Object} Project
     * @property {string} id
     * @property {string} name
     * @property {number} estimatedHours
     * @property {Date} [startAfter]
     * @property {Date} [endBefore]
     * @property {number} priority
     * @property {Array<Allocation>} allocations
     */

    /**
     * @typedef {Object} Schedule
     * @property {Date} startDate
     * @property {Date} endDate
     * @property {Array<Project>} projects
     * @property {Array<Engineer>} engineers
     */

    /**
     * @typedef {Object} Plan
     * @property {string} id
     * @property {string} name
     * @property {Date} startDate
     * @property {Date} endDate
     */

    export {};
