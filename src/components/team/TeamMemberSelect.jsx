import React from "react";
import { useTeamStore } from "../../store/teamStore";

export default function TeamMemberSelect({
  selectedTeamMembers,
  onTeamMemberSelect,
}) {
  const { team } = useTeamStore();

  return (
    <div>
      <label className="form-label">Allocate Team Members</label>
      <div className="flex flex-col gap-2">
        {team.map((teamMember) => (
          <label key={teamMember.id} className="flex items-center space-x-2">
            <input
              type="checkbox"
              value={teamMember.id}
              checked={selectedTeamMembers.includes(teamMember.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  onTeamMemberSelect([...selectedTeamMembers, teamMember.id]);
                } else {
                  onTeamMemberSelect(selectedTeamMembers.filter(id => id !== teamMember.id));
                }
              }}
              className="form-checkbox"
            />
            <span>{teamMember.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
