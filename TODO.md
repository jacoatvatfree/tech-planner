# Performance Optimization TODO List

This document outlines the tasks needed to address the infinite loop/recurring call issues causing high CPU usage and crashes on the dashboard and schedule pages.

## Store Architecture Issues

- [x] **Break circular dependencies between stores**
  - ✅ Refactored the direct references between stores (planStore, projectStore, engineerStore)
  - ✅ Replaced direct store access via `usePlanStore.getState()` with local state in each store
  - ✅ Implemented a controlled synchronization approach via the `syncCurrentPlanId` method
  - ✅ Modified components to use the new store structure
  - Files modified: `src/store/planStore.js`, `src/store/projectStore.js`, `src/store/engineerStore.js`, `src/components/PlanSelector.jsx`, `src/pages/Dashboard.jsx`, `src/pages/GanttView.jsx`

- [x] **Optimize store selectors**
  - ✅ Replaced broad selectors with more granular ones to prevent unnecessary re-renders
  - ✅ Used computed selectors for derived data
  - ✅ Implemented proper memoization for filtered data
  - Files modified: `src/pages/Dashboard.jsx`, `src/pages/GanttView.jsx`

## Computation Optimization

- [x] **Optimize the `calculateSchedule` function**
  - ✅ Added memoization for expensive calculations
  - ✅ Broke down the function into smaller, more focused functions
  - ✅ Added caching for repeated calculations
  - ✅ Added safety limits to prevent infinite loops
  - File modified: `src/lib/scheduler/calculateSchedule.js`

- [x] **Optimize the `generateGanttMarkup` function**
  - ✅ Reduced complexity and nested loops
  - ✅ Added multi-level caching for generated markup
  - ✅ Removed unnecessary console.log statements
  - ✅ Added safety limits to prevent infinite loops
  - File modified: `src/lib/scheduler/generateGanttMarkup.js`

- [x] **Optimize date calculations**
  - ✅ Added multi-level caching for date calculations
  - ✅ Optimized date utility functions with early returns and null checks
  - ✅ Added safety limits to prevent infinite loops
  - ✅ Improved memory management with cache size limits
  - File modified: `src/lib/scheduler/dateUtils.js`

## Component Rendering Optimization

- [x] **Reduce re-renders in GanttView**
  - ✅ Optimized useEffect dependencies with useCallback
  - ✅ Implemented proper memoization for expensive calculations
  - ✅ Removed unnecessary console.log statements
  - Files modified: `src/pages/GanttView.jsx`

- [x] **Reduce re-renders in Dashboard**
  - ✅ Optimized useEffect dependencies with useCallback
  - ✅ Implemented proper memoization for expensive calculations
  - ✅ Separated calculation logic from render logic
  - Files modified: `src/pages/Dashboard.jsx`

- [x] **Optimize Mermaid.js rendering**
  - ✅ Added caching for rendered charts
  - ✅ Implemented lazy loading for debug components
  - ✅ Added loading indicators and error handling
  - ✅ Optimized rendering of large charts
  - Files modified: `src/components/gantt/GanttChart.jsx`, `src/components/gantt/DebugSection.jsx`

## Event Handling

- [x] **Optimize custom event handling**
  - ✅ Replaced the 'planSwitched' custom event with direct store synchronization
  - ✅ Implemented a controlled approach for cross-store communication via the `syncCurrentPlanId` method
  - Files modified: `src/store/planStore.js`

## Debugging and Monitoring

- [x] **Remove or disable excessive console logging**
  - ✅ Created a centralized logging utility with configurable log levels
  - ✅ Replaced direct console calls with logger utility
  - ✅ Added ability to disable logs in production
  - ✅ Implemented proper error handling with logging
  - Files modified: `src/utils/logger.js`, `src/store/planStore.js`, `src/store/projectStore.js`, `src/store/engineerStore.js`, `src/pages/GanttView.jsx`, `src/components/PlanSelector.jsx`

- [ ] **Add performance monitoring**
  - Consider adding performance monitoring to identify bottlenecks
  - Implement React's Profiler API or a similar tool
  - Files to add: New performance monitoring utilities

## Data Management

- [ ] **Implement pagination or virtualization for large datasets**
  - Consider implementing pagination or virtualization for large plans
  - Optimize how large data structures are handled
  - Files to modify: Components displaying large datasets

- [ ] **Optimize localStorage usage**
  - Review how data is stored and retrieved from localStorage
  - Consider implementing a more efficient storage strategy
  - Files to modify: Store files using localStorage
