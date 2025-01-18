import React from "react";
import { format } from "date-fns";
import { PencilIcon, TrashIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { useProjectStore } from "../../store/projectStore";
import { useEngineerStore } from "../../store/engineerStore";
import AllocatedEngineers from "./AllocatedEngineers";

export default function ProjectListItem({ project, onEdit, onDragStart }) {
  const { removeProject } = useProjectStore();
  const { engineers } = useEngineerStore();

  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", project.id);
    e.dataTransfer.effectAllowed = "move";
    onDragStart();
  };

  return (
    <li
      draggable="true"
      onDragStart={handleDragStart}
      className="px-6 py-3 cursor-move hover:bg-gray-50 border-b border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="cursor-move text-gray-400">
            <Bars3Icon className="h-5 w-5" />
          </div>

          <div className="flex-1 grid grid-cols-3 gap-8">
            {/* Column 1: Basic Info */}
            <div className="space-y-2">
              <h3 className="text-base font-medium text-gray-900 leading-tight">
                {project.name}
              </h3>
              <p className="text-sm text-gray-600 leading-snug line-clamp-2">
                {project.description}
              </p>
              <div className="flex gap-2 pt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Priority: {project.priority}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {project.estimatedHours}h
                </span>
              </div>
            </div>

            {/* Column 2: Dates */}
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">
                  Start After
                </div>
                <div className="text-sm text-gray-900">
                  {project.startAfter
                    ? format(new Date(project.startAfter), "MMM d, yyyy")
                    : "Not set"}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">
                  End Before
                </div>
                <div className="text-sm text-gray-900">
                  {project.endBefore
                    ? format(new Date(project.endBefore), "MMM d, yyyy")
                    : "Not set"}
                </div>
              </div>
            </div>

            {/* Column 3: Engineers */}
            <div>
              <AllocatedEngineers project={project} engineers={engineers} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => onEdit(project)}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => removeProject(project.id)}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </li>
  );
}
