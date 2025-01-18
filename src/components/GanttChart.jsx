import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";

function GanttChart({ tasks, markup }) {
  const chartRef = useRef(null);
  const chartId = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    let mounted = true;

    const initializeMermaid = async () => {
      try {
        // Initialize mermaid with specific configuration
        await mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'default',
          gantt: {
            titleTopMargin: 25,
            barHeight: 20,
            barGap: 4,
            topPadding: 50,
            leftPadding: 75,
            gridLineStartPadding: 35,
            fontSize: 11,
            numberSectionStyles: 4,
            axisFormat: '%Y-%m-%d'
          }
        });

        if (mounted && chartRef.current) {
          // Clear previous content
          chartRef.current.innerHTML = '';
          
          // Render new chart
          const { svg } = await mermaid.render(chartId.current, markup);
          if (mounted && chartRef.current) {
            chartRef.current.innerHTML = svg;
          }
        }
      } catch (error) {
        console.error("Mermaid rendering failed:", error);
        if (mounted && chartRef.current) {
          chartRef.current.innerHTML = `
            <div class="p-4 bg-red-50 text-red-700 rounded">
              Error rendering Gantt chart: ${error.message}
            </div>
          `;
        }
      }
    };

    initializeMermaid();

    return () => {
      mounted = false;
      if (chartRef.current) {
        chartRef.current.innerHTML = '';
      }
    };
  }, [markup]);

  return (
    <div className="w-full">
      <div ref={chartRef} className="mermaid-container overflow-x-auto" />
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Mermaid Markup:
        </h3>
        <pre className="whitespace-pre-wrap text-sm font-mono bg-white p-4 rounded border border-gray-200">
          {markup}
        </pre>
      </div>
    </div>
  );
}

export default GanttChart;
