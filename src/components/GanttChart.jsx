import React, { useEffect, useRef } from 'react'
import { gantt } from 'dhtmlx-gantt'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'
import { format } from 'date-fns'

function GanttChart({ tasks, onTaskUpdate }) {
  const ganttContainer = useRef(null)

  useEffect(() => {
    gantt.config.date_format = "%Y-%m-%d"
    gantt.config.scale_unit = "week"
    gantt.config.duration_unit = "hour"
    gantt.config.row_height = 40
    gantt.config.min_column_width = 50

    gantt.templates.task_class = (start, end, task) => {
      if (task.allocation > 100) return 'overallocated'
      if (task.allocation < 80) return 'underallocated'
      return ''
    }

    gantt.init(ganttContainer.current)
    gantt.parse({ data: tasks })

    gantt.attachEvent("onAfterTaskDrag", (id, mode) => {
      const task = gantt.getTask(id)
      onTaskUpdate(id, {
        start_date: task.start_date,
        end_date: task.end_date
      })
    })

    return () => {
      gantt.clearAll()
    }
  }, [])

  useEffect(() => {
    gantt.clearAll()
    gantt.parse({ data: tasks })
  }, [tasks])

  return (
    <div 
      ref={ganttContainer}
      className="w-full h-[600px]"
    />
  )
}

export default GanttChart
