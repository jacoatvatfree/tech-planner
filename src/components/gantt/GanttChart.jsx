import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

const mermaidConfig = {
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
};

export default function GanttChart({ markup }) {
  const chartRef = useRef(null);
  const chartId = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    let mounted = true;

    const renderChart = async () => {
      try {
        await mermaid.initialize(mermaidConfig);

        if (mounted && chartRef.current) {
          chartRef.current.innerHTML = '';
          const { svg } = await mermaid.render(chartId.current, markup);
          
          if (mounted && chartRef.current) {
            chartRef.current.innerHTML = svg;
          }
        }
      } catch (error) {
        console.error('Mermaid rendering failed:', error);
        if (mounted && chartRef.current) {
          chartRef.current.innerHTML = `
            <div class="p-4 bg-red-50 text-red-700 rounded">
              Error rendering Gantt chart: ${error.message}
            </div>
          `;
        }
      }
    };

    renderChart();

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
    </div>
  );
}
