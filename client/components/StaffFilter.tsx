
import React, { useMemo } from 'react';
import { TeamMember } from '../types';
import Dropdown from './ui/Dropdown';

interface StaffFilterProps {
  teamMembers: TeamMember[];
  selectedId: string;
  onChange: (id: string) => void;
}

const StaffFilter: React.FC<StaffFilterProps> = ({ teamMembers, selectedId, onChange }) => {
  const options = useMemo(() => {
    const memberOptions = teamMembers
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(member => ({
        value: member.id,
        label: member.name,
      }));
    
    return [
      { value: 'all', label: 'All Staff' },
      ...memberOptions,
    ];
  }, [teamMembers]);

  return (
    <div className="w-full sm:w-56">
      <Dropdown
        options={options}
        value={selectedId}
        onChange={onChange}
        placeholder="Filter by staff"
      />
    </div>
  );
};

export default StaffFilter;
