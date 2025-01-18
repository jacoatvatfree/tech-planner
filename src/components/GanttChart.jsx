import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";
// import { format } from "date-fns";

function GanttChart({ tasks, markup }) {
  const chartRef = useRef(null);
  const chartId = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    let mounted = true;

    const initializeMermaid = async () => {
      await mermaid.initialize({
        theme: "default",
        gantt: {
          titleTopMargin: 25,
          barHeight: 20,
          barGap: 4,
          topPadding: 50,
          leftPadding: 75,
          gridLineStartPadding: 35,
          fontSize: 11,
          numberSectionStyles: 4,
          axisFormat: "%Y-%m-%d",
        },
        startOnLoad: true,
        securityLevel: "loose",
      });

      // Wait a tick for the DOM to be ready
      await new Promise((resolve) => setTimeout(resolve, 0));

      if (mounted && chartRef.current) {
        try {
          const { svg } = await mermaid.render(chartId.current, markup);
          if (mounted && chartRef.current) {
            chartRef.current.innerHTML = svg;
          }
        } catch (error) {
          console.error("Mermaid rendering failed:", error);
        }
      }
    };

    initializeMermaid();
    // Cleanup function
    return () => {
      mounted = false;
      if (chartRef.current) {
        chartRef.current.innerHTML = "";
      }
    };
  }, [markup]);

  useEffect(() => {
    if (chartRef.current) {
      // Clear previous chart
      chartRef.current.innerHTML = markup;
      // Reinitialize mermaid parsing
      mermaid.contentLoaded();
    }
  }, [markup]);

  // const generateMermaidSyntax = () => {
  //   const sections = {};
  //
  //   // Group tasks by engineers
  //   tasks.forEach((task) => {
  //     task.assignedEngineers.forEach((engineerId) => {
  //       if (!sections[engineerId]) {
  //         sections[engineerId] = [];
  //       }
  //       sections[engineerId].push(task);
  //     });
  //   });
  //
  //   let syntax = "gantt\n";
  //   syntax += "dateFormat YYYY-MM-DD\n";
  //   syntax += "title Resource Schedule\n\n";
  //
  //   // Add sections for each engineer
  //   Object.entries(sections).forEach(([engineerId, engineerTasks]) => {
  //     syntax += `section Engineer ${engineerId}\n`;
  //
  //     engineerTasks.forEach((task) => {
  //       const startDate = format(new Date(task.start_date), "yyyy-MM-dd");
  //       const duration = `${task.duration}d`;
  //       const progress = task.progress || 0;
  //       const allocation = task.allocation;
  //
  //       // Color coding based on allocation
  //       const color =
  //         allocation > 100 ? "crit" : allocation < 80 ? "active" : "done";
  //
  //       syntax += `${task.text} :${color}, ${startDate}, ${duration}\n`;
  //     });
  //
  //     syntax += "\n";
  //   });
  //
  //   return syntax;
  // };

  return (
    <div className="w-full">
      <div ref={chartRef} className="mermaid-container" />
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Mermaid Markdown:
        </h3>
        <pre className="whitespace-pre-wrap text-sm font-mono bg-white p-4 rounded border border-gray-200">
          {markup}
        </pre>
      </div>
    </div>
  );
}

export default GanttChart;
