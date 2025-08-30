import React from 'react';
import { TeamMember } from '../types';
import { Icon } from './ui/Icon';

interface AvailabilityTickerProps {
  members: TeamMember[];
}

const AvailabilityTicker: React.FC<AvailabilityTickerProps> = ({ members }) => {
  if (members.length === 0) {
    return null;
  }

  return (
    <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-lg p-4 mb-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary flex items-center mb-3">
        <Icon name="user-check" className="h-5 w-5 mr-2 text-green-500 dark:text-green-400" />
        <span>Available for Tasks</span>
        <span className="ml-2 font-mono text-sm bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full ring-1 ring-inset ring-green-300 dark:ring-green-500/30">{members.length}</span>
      </h3>
      <div className="flex flex-wrap gap-2">
        {members.map(member => (
          <span key={member.id} className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 text-sm font-medium px-3 py-1 rounded-full">
            {member.name}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AvailabilityTicker;