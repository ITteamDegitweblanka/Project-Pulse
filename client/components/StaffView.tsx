


import React, { useMemo } from 'react';
import { TeamMember, Task, TaskStatus, Role, Project, TaskPriority } from '../types';
import Button from './ui/Button';
import Card from './ui/Card';
import { Icon } from './ui/Icon';
import { getWeekBoundaries } from '../utils/date';
import { TaskPriorityIndicator } from './TaskIndicators';

interface StaffViewProps {
  teamMembers: TeamMember[];
  tasks: Task[];
  projectsById: Record<string, Project>;
  onAddMember: () => void;
  onLogLeave: (member: TeamMember) => void;
  currentUser: TeamMember;
  onDeleteMember: (memberId: string) => void;
}

const isAdmin = (role: Role) => [Role.MD, Role.Director, Role.AdminManager, Role.OperationManager, Role.SuperLeader].includes(role);

const StaffView: React.FC<StaffViewProps> = ({ teamMembers, tasks, projectsById, onAddMember, onLogLeave, currentUser, onDeleteMember }) => {
  const canManageStaff = isAdmin(currentUser.role);

  const staffWorkload = useMemo(() => {
    const today = new Date();
    const { startOfWeek: thisWeekStart } = getWeekBoundaries(today);
    
    const lastWeekDate = new Date();
    lastWeekDate.setDate(today.getDate() - 7);
    const { startOfWeek: lastWeekStart, endOfWeek: lastWeekEnd } = getWeekBoundaries(lastWeekDate);

    return teamMembers.map(member => {
        const memberTasks = tasks.filter(t => t.assigneeId === member.id);

        const lastWeekTasks = memberTasks.filter(t => 
            t.status === TaskStatus.Completed && 
            t.completedAt &&
            new Date(t.completedAt) >= lastWeekStart && 
            new Date(t.completedAt) <= lastWeekEnd
        );

        const thisWeekTasks = memberTasks.filter(t => {
            const isOngoing = [TaskStatus.InProgress, TaskStatus.OnHold, TaskStatus.Blocked].includes(t.status);
            const isCompletedThisWeek = t.status === TaskStatus.Completed && t.completedAt && new Date(t.completedAt) >= thisWeekStart;
            return isOngoing || isCompletedThisWeek;
        });
        
        const upcomingTasks = memberTasks.filter(t => t.status === TaskStatus.NotStarted);

        return {
            ...member,
            lastWeekTasks,
            thisWeekTasks,
            upcomingTasks,
        };
    });
  }, [teamMembers, tasks]);
  
  const formatDateRange = (start: Date, end: Date): string => {
    const format = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${format(start)} - ${format(end)}`;
  };

  const { startOfWeek: thisWeekStart, endOfWeek: thisWeekEnd } = getWeekBoundaries(new Date());
  const lastWeekDate = new Date();
  lastWeekDate.setDate(new Date().getDate() - 7);
  const { startOfWeek: lastWeekStart, endOfWeek: lastWeekEnd } = getWeekBoundaries(lastWeekDate);

  const TaskChip: React.FC<{task: Task}> = ({ task }) => {
    const project = projectsById[task.projectId];
    return (
      <div className="flex items-start gap-2 p-1.5 rounded-md bg-light-bg dark:bg-dark-bg">
        <div className="mt-0.5">
            <TaskPriorityIndicator priority={task.priority} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary truncate">{task.title}</p>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary truncate">{project?.name || 'No Project'}</p>
        </div>
      </div>
    );
  }

  const handleDelete = (e: React.MouseEvent, member: TeamMember) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove ${member.name}?`)) {
      onDeleteMember(member.id);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">Staff Workload Summary</h1>
        {canManageStaff && (
          <Button onClick={onAddMember} variant="primary">
            <Icon name="user-plus" className="h-5 w-5 mr-2" />
            Add Staff
          </Button>
        )}
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed">
            <thead className="bg-light-bg dark:bg-dark-bg/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-1/4">Staff Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-1/4">
                  Last Week Tasks
                  <span className="block font-normal text-light-text-secondary/70 dark:text-dark-text-secondary/70">{formatDateRange(lastWeekStart, lastWeekEnd)}</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-1/4">
                  This Week Tasks
                  <span className="block font-normal text-light-text-secondary/70 dark:text-dark-text-secondary/70">{formatDateRange(thisWeekStart, thisWeekEnd)}</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-1/4">Upcoming Tasks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border dark:divide-dark-border">
              {staffWorkload.map(member => (
                <tr key={member.id} className="hover:bg-light-bg/50 dark:hover:bg-dark-bg/50 transition-colors duration-150 align-top group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-3 items-start">
                        <div className="flex items-center gap-3">
                            <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                            <span className="font-medium text-light-text-primary dark:text-dark-text-primary">{member.name}</span>
                        </div>
                        {canManageStaff && (
                            <div className="flex items-center gap-2">
                                <Button onClick={() => onLogLeave(member)} variant="secondary" className="px-2 py-1 text-xs">
                                    <Icon name="calendar" className="h-3 w-3 mr-1.5" />
                                    Log Leave
                                </Button>
                                {member.id !== currentUser.id && (
                                    <button
                                        onClick={(e) => handleDelete(e, member)}
                                        className="p-1.5 rounded-md text-light-text-secondary dark:text-dark-text-secondary transition-colors hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100"
                                        aria-label={`Remove ${member.name}`}
                                    >
                                        <Icon name="trash" className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      {member.lastWeekTasks.length > 0 ? (
                        member.lastWeekTasks.map(task => <TaskChip key={task.id} task={task} />)
                      ) : (
                        <p className="text-xs text-light-text-secondary/70 dark:text-dark-text-secondary/70">No completed tasks.</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                     <div className="flex flex-col gap-2">
                        {member.thisWeekTasks.length > 0 ? (
                          member.thisWeekTasks.map(task => <TaskChip key={task.id} task={task} />)
                        ) : (
                          <p className="text-xs text-light-text-secondary/70 dark:text-dark-text-secondary/70">No active tasks.</p>
                        )}
                      </div>
                  </td>
                  <td className="px-4 py-4">
                     <div className="flex flex-col gap-2">
                        {member.upcomingTasks.length > 0 ? (
                          member.upcomingTasks.map(task => <TaskChip key={task.id} task={task} />)
                        ) : (
                          <p className="text-xs text-light-text-secondary/70 dark:text-dark-text-secondary/70">No upcoming tasks.</p>
                        )}
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default StaffView;