import React, { useState, useMemo, Suspense, lazy } from "react";
import { CopyButton } from "../common/CopyButton";
import MermaidDiagram from "../common/MermaidDiagram";

// Lazy load components that aren't needed for initial render
const DebugSection = lazy(() => import("./DebugSection").then(module => ({ 
  default: module.DebugSection 
})));

export default function GanttChart({ markup }) {
  const [showDebug, setShowDebug] = useState(false);
  
  // Memoize the markup to prevent unnecessary re-renders
  const memoizedMarkup = useMemo(() => markup, [markup]);
  
  // Check if markup is too large (could cause performance issues)
  const isLargeChart = useMemo(() => {
    if (!markup) return false;
    
    // Count the number of tasks in the chart
    const taskCount = (markup.match(/\n\s+\w+.*:/g) || []).length;
    return taskCount > 100; // Consider charts with more than 100 tasks as "large"
  }, [markup]);

  return (
    <div className="w-full space-y-8">
      {/* Chart container */}
      <div className="relative">
        <MermaidDiagram 
          code={memoizedMarkup} 
          className="overflow-x-auto bg-white p-4 rounded-lg border border-gray-200 min-h-[200px]"
        />
      </div>

      {/* Markup display (collapsed for large charts by default) */}
      <div className="p-4 bg-gray-50 rounded-lg print:hidden">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-600">
                Mermaid Markup {isLargeChart && "(Large Chart)"}
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showDebug ? "Hide Debug" : "Show Debug"}
                </button>
                <CopyButton text={markup} />
              </div>
            </div>
            {!isLargeChart && (
              <pre className="mt-2 whitespace-pre-wrap text-sm font-mono bg-white p-4 rounded border border-gray-200 overflow-x-auto max-h-[300px]">
                {markup}
              </pre>
            )}
          </div>
        </div>
      </div>
      
      {/* Lazy-loaded debug section */}
      {showDebug && (
        <Suspense fallback={<div>Loading debug info...</div>}>
          <DebugSection />
        </Suspense>
      )}
    </div>
  );
}
