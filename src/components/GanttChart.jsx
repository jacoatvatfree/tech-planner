import React, { useEffect } from "react";
import mermaid from "mermaid";
import { format } from "date-fns";

function GanttChart({ tasks }) {
  useEffect(() => {
    mermaid.initialize({
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
    });
  }, []);

  const generateMermaidSyntax = () => {
    const sections = {};

    // Group tasks by engineers
    tasks.forEach((task) => {
      task.assignedEngineers.forEach((engineerId) => {
        if (!sections[engineerId]) {
          sections[engineerId] = [];
        }
        sections[engineerId].push(task);
      });
    });

    let syntax = "gantt\n";
    syntax += "dateFormat YYYY-MM-DD\n";
    syntax += "title Resource Schedule\n\n";

    // Add sections for each engineer
    Object.entries(sections).forEach(([engineerId, engineerTasks]) => {
      syntax += `section Engineer ${engineerId}\n`;

      engineerTasks.forEach((task) => {
        const startDate = format(new Date(task.start_date), "yyyy-MM-dd");
        const duration = `${task.duration}d`;
        const progress = task.progress || 0;
        const allocation = task.allocation;

        // Color coding based on allocation
        const color =
          allocation > 100 ? "crit" : allocation < 80 ? "active" : "done";

        syntax += `${task.text} :${color}, ${startDate}, ${duration}\n`;
      });

      syntax += "\n";
    });

    return syntax;
  };

  return (
    <div className="w-full">
      <div className="mermaid">{generateMermaidSyntax()}</div>
    </div>
  );
}

export default GanttChart;
