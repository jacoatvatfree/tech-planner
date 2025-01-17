import React from "react";
import { Scheduler } from "@bitnoi.se/react-scheduler";

function BitnoiseScheduler({ tasks }) {
  // Get unique engineer names for rows
  const uniqueEngineers = [
    ...new Set(tasks.flatMap((task) => task.assignedEngineers)),
  ];

  // Create rows configuration with required properties
  const rows = uniqueEngineers.map((engineer) => ({
    id: engineer,
    label: engineer,
    data: {
      name: engineer,
    },
  }));

  // Transform tasks into the format expected by the scheduler
  const schedulerData = tasks.flatMap((task) =>
    task.assignedEngineers.map((engineer) => ({
      itemId: `${task.id}-${engineer}`,
      row: engineer,
      start: new Date(task.start_date).getTime(),
      end: (() => {
        const endDate = new Date(task.start_date);
        endDate.setDate(endDate.getDate() + task.duration);
        return endDate.getTime();
      })(),
      text: task.text,
      subtext: `${task.allocation}% allocated`,
      bgColor:
        task.allocation > 100
          ? "#FEE2E2"
          : task.allocation < 80
            ? "#DCFCE7"
            : "#FEF9C3",
      selectedBgColor: "#60A5FA",
      type:
        task.allocation > 100
          ? "error"
          : task.allocation < 80
            ? "success"
            : "warning",
    })),
  );

  // Calculate date range
  const calendarStart = new Date(
    Math.min(...tasks.map((task) => new Date(task.start_date))),
  );
  const calendarEnd = new Date(
    Math.max(
      ...tasks.map((task) => {
        const end = new Date(task.start_date);
        end.setDate(end.getDate() + task.duration);
        return end;
      }),
    ),
  );

  return (
    <div className="h-[600px]">
      <Scheduler
        items={schedulerData}
        rows={rows}
        isLoading={false}
        onItemClick={(item) => console.log("Item clicked:", item)}
        config={{
          zoom: 1,
          locale: "en-US",
          calendar: {
            hours: { from: 0, to: 24 },
            startDate: calendarStart,
            endDate: calendarEnd,
          },
          style: {
            displayDensity: "comfortable",
            timeFormat: "12",
          },
        }}
      />
    </div>
  );
}

export default BitnoiseScheduler;
