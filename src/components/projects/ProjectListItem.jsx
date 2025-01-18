import React from "react";
import { format } from "date-fns";
import { PencilIcon, TrashIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { useProjectStore } from "../../store/projectStore";
import { useEngineerStore } from "../../store/engineerStore";
import AllocatedEngineers from "./AllocatedEngineers";

export default function ProjectListItem({ project }) {
  const { updateProject, removeProject } = useProjectStore();
  const { engineers } = useEngineerStore();

  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", project.id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <li
      draggable="true"
      onDragStart={handleDragStart}
      className="px-6 py-4 cursor-move hover:bg-gray-50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="cursor-move">
            <Bars3Icon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-medium text-gray-900">
                {project.name}
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Priority: {project.priority}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {project.estimatedHours}h
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">{project.description}</p>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <span className="font-medium">Start After:</span>
                <span>
                  {project.startAfter
                    ? format(new Date(project.startAfter), "MMM d, yyyy")
                    : "Not set"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">End Before:</span>
                <span>
                  {project.endBefore
                    ? format(new Date(project.endBefore), "MMM d, yyyy")
                    : "Not set"}
                </span>
              </div>
            </div>
            <div className="mt-2">
              <AllocatedEngineers project={project} engineers={engineers} />
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => updateProject(project.id)}
            className="p-2 text-blue-600 hover:text-blue-800"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => removeProject(project.id)}
            className="p-2 text-red-600 hover:text-red-800"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </li>
  );
}
