
import React, { useMemo } from 'react';
import { TeamMember, Task, TaskStatus, Role } from '../types';
import Card from './ui/Card';
import { Icon } from './ui/Icon';

interface TeamOverviewProps {
  teamMembers: TeamMember[];
  tasks: Task[];
  onSelectMember: (memberId: string) => void;
  currentUser: TeamMember;
  onDeleteMember: (memberId: string) => void;
  membersOnLeaveToday: Set<string>;
}

const isAdmin = (role: Role) => [Role.MD, Role.Director, Role.AdminManager, Role.OperationManager, Role.SuperLeader].includes(role);

const TeamOverview: React.FC<TeamOverviewProps> = ({ 
  teamMembers, 
  tasks, 
  onSelectMember, 
  currentUser,
  onDeleteMember,
  membersOnLeaveToday,
}) => {

  const membersWithTaskCounts = useMemo(() => {
    return teamMembers.map(member => {
      const assignedTasks = tasks.filter(task => task.assigneeId === member.id && task.status !== TaskStatus.Completed);
      return {
        ...member,
        taskCount: assignedTasks.length
      };
    });
  }, [teamMembers, tasks]);
  
  const canManageTeam = isAdmin(currentUser.role);

  const handleDelete = (e: React.MouseEvent, member: TeamMember) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove ${member.name}?`)) {
      onDeleteMember(member.id);
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">Team Load</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {membersWithTaskCounts.map(member => {
            const isOnLeave = membersOnLeaveToday.has(member.id);

            return (
              <div 
                key={member.id} 
                className={`group relative flex flex-col items-center text-center p-3 rounded-lg bg-light-bg dark:bg-dark-bg/50 transition-all hover:scale-105 hover:bg-light-border dark:hover:bg-dark-border/50 cursor-pointer ${isOnLeave ? 'opacity-60' : ''}`}
                onClick={() => onSelectMember(member.id)}
                aria-label={`View performance for ${member.name}`}
                role="button"
              >
                {canManageTeam && member.id !== currentUser.id && (
                  <button
                    onClick={(e) => handleDelete(e, member)}
                    className="absolute top-1 right-1 p-1 rounded-full text-light-text-secondary dark:text-dark-text-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-400 z-10"
                    aria-label={`Remove ${member.name}`}
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                )}
                <div className="relative">
                  <img src={member.avatarUrl} alt={member.name} className={`w-20 h-20 rounded-full mb-3 ring-2 transition-all ring-light-border dark:ring-dark-border ${isOnLeave ? 'grayscale' : ''}`} />
                  {isOnLeave && (
                    <span className="absolute bottom-2 -right-1 block rounded-full bg-yellow-400 dark:bg-yellow-500 p-1.5 ring-4 ring-light-bg dark:ring-dark-bg/50" title="On Leave">
                      <Icon name="calendar" className="h-4 w-4 text-white dark:text-dark-bg" />
                    </span>
                  )}
                </div>
                <p className="font-medium text-light-text-primary dark:text-dark-text-primary text-sm">{member.name}</p>
                 {isOnLeave ? (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold mt-1">On Leave</p>
                  ) : (
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                      {member.taskCount} active task{member.taskCount !== 1 ? 's' : ''}
                    </p>
                  )}
              </div>
            )
          })}
        </div>
        
      </div>
    </Card>
  );
};

export default TeamOverview;