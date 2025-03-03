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
      <select
        multiple
        value={selectedTeamMembers}
        onChange={(e) => {
          const selectedTeamMembers = Array.from(
            e.target.selectedOptions,
            (option) => option.value,
          );
          onTeamMemberSelect(selectedTeamMembers);
        }}
        className="form-select min-h-[120px]"
      >
        {team.map((teamMember) => (
          <option key={teamMember.id} value={teamMember.id}>
            {teamMember.name}
          </option>
        ))}
      </select>
    </div>
  );
}
