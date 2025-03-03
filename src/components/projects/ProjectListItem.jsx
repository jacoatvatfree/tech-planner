import React from "react";
import { format } from "date-fns";
import { PencilIcon, TrashIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { useProjectStore } from "../../store/projectStore";
import { useTeamStore } from "../../store/teamStore";

export default function ProjectListItem({
  project,
  onEdit,
  onDragStart,
  onUpdateAllocations,
  onUpdateCompletion,
}) {
  const { removeProject } = useProjectStore();
  const { team } = useTeamStore();

  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", project.id);
    e.dataTransfer.effectAllowed = "move";
    onDragStart();
  };

  return (
    <div
      draggable="true"
      onDragStart={handleDragStart}
      className="px-6 py-3 cursor-move hover:bg-gray-50 border-b border-gray-100"
    >
      <div className="flex items-center gap-3">
        <div className="cursor-move text-gray-400">
          <Bars3Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 grid grid-cols-[3fr,1fr,2fr,auto] gap-4">
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

          {/* Column 2: Dates & Completion */}
          <div className="space-y-2">
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">
                Start After
              </div>
              <div className="text-sm text-gray-900">
                {project.startAfter
                  ? format(new Date(project.startAfter), "MMM d")
                  : "Not set"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">
                End Before
              </div>
              <div className="text-sm text-gray-900">
                {project.endBefore
                  ? format(new Date(project.endBefore), "MMM d")
                  : "Not set"}
              </div>
            </div>
          </div>

          {/* Column 3: Team Members */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 mb-2">
              Team Members
            </div>
            <div className="space-y-2">
              {team.map((teamMember) => {
                const isAssigned = project.teamMemberIds?.includes(teamMember.id) || 
                  // For backward compatibility with old format
                  project.allocations?.some(a => a.engineerId === teamMember.id);
                
                return (
                  <div
                    key={teamMember.id}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      id={`team-member-${teamMember.id}-${project.id}`}
                      checked={isAssigned}
                      onChange={(e) => {
                        // Get current team member IDs (from either format)
                        const currentTeamMemberIds = project.teamMemberIds || 
                          (project.allocations?.map(a => a.engineerId) || []);
                        
                        if (e.target.checked) {
                          // Add team member
                          onUpdateAllocations([
                            ...currentTeamMemberIds.filter(id => id !== teamMember.id),
                            teamMember.id
                          ]);
                        } else {
                          // Remove team member
                          onUpdateAllocations(
                            currentTeamMemberIds.filter(id => id !== teamMember.id)
                          );
                        }
                      }}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`team-member-${teamMember.id}-${project.id}`}
                      className="text-sm text-gray-700"
                    >
                      {teamMember.name}
                    </label>
                  </div>
                );
              })}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={project.percentComplete || 0}
                  onChange={(e) =>
                    onUpdateCompletion(project.id, parseInt(e.target.value))
                  }
                  className="w-40 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm text-gray-600 w-20">
                  {project.percentComplete || 0}% complete
                </span>
              </div>
            </div>
          </div>
          {/* Column 4: Actions */}
          <div className="flex space-x-2">
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
      </div>
    </div>
  );
}
