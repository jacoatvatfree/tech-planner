import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from "react";
import mermaid from "mermaid";
import { CopyButton } from "../common/CopyButton";
import { debounce } from "../../utils/debounce";
import { mermaidConfig } from "../../config/mermaidConfig";

// Lazy load components that aren't needed for initial render
const DebugSection = lazy(() => import("./DebugSection").then(module => ({ 
  default: module.DebugSection 
})));

// Cache for rendered charts
const chartCache = new Map();

export default function GanttChart({ markup }) {
  const chartRef = useRef(null);
  const chartId = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);
  const [isRendering, setIsRendering] = useState(true);
  const [renderError, setRenderError] = useState(null);
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
  
  // Optimized chart rendering function
  const renderChart = useCallback(async () => {
    if (!chartRef.current) return;
    
    setIsRendering(true);
    setRenderError(null);
    
    try {
      // Check cache first
      if (chartCache.has(memoizedMarkup)) {
        chartRef.current.innerHTML = chartCache.get(memoizedMarkup);
        setIsRendering(false);
        return;
      }
      
      // Reset mermaid to clear any previous state
      await mermaid.initialize({
        ...mermaidConfig,
        startOnLoad: false,
        // Add performance optimizations for large charts
        gantt: {
          ...mermaidConfig.gantt,
          useMaxWidth: true,
          barGap: 4,
          topPadding: 10,
          bottomPadding: 10,
          fontFamily: 'Arial, sans-serif',
        }
      });

      // Clear previous content
      chartRef.current.innerHTML = "";
      
      // Render the chart
      const { svg } = await mermaid.render(chartId.current, memoizedMarkup);
      
      // Update the DOM
      if (chartRef.current) {
        chartRef.current.innerHTML = svg;
        
        // Cache the result (limit cache size to prevent memory issues)
        if (chartCache.size > 10) {
          // Remove oldest entry
          const firstKey = chartCache.keys().next().value;
          chartCache.delete(firstKey);
        }
        chartCache.set(memoizedMarkup, svg);
      }
    } catch (error) {
      setRenderError(error.message);
      
      // Show error message in chart container
      if (chartRef.current) {
        chartRef.current.innerHTML = `
          <div class="p-4 bg-red-50 text-red-700 rounded">
            <p class="font-bold">Error rendering Gantt chart:</p>
            <p>${error.message}</p>
          </div>
        `;
      }
    } finally {
      setIsRendering(false);
    }
  }, [memoizedMarkup]);
  
  // Debounced render function to prevent too many renders
  const debouncedRenderChart = useMemo(() => 
    debounce(renderChart, isLargeChart ? 500 : 300), 
  [renderChart, isLargeChart]);

  // Effect to render the chart when markup changes
  useEffect(() => {
    let mounted = true;
    
    if (mounted) {
      debouncedRenderChart();
    }
    
    return () => {
      mounted = false;
      
      // Clean up
      if (chartRef.current) {
        chartRef.current.innerHTML = "";
      }
      
      // Clean up any pending mermaid renders
      try {
        mermaid.mermaidAPI.reset();
      } catch (e) {
        // Silently handle reset errors
      }
    };
  }, [memoizedMarkup, debouncedRenderChart]);

  return (
    <div className="w-full space-y-8">
      {/* Chart container with loading state */}
      <div className="relative">
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Rendering chart...</p>
            </div>
          </div>
        )}
        <div
          ref={chartRef}
          className="mermaid-container overflow-x-auto bg-white p-4 rounded-lg border border-gray-200 min-h-[200px]"
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
