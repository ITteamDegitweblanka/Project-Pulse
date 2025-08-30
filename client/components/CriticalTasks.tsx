
import React, { useState } from 'react';
import { Task, TeamMember, Project, Role, TaskStatus, StoreFile } from '../types';
import { Icon } from './ui/Icon';
import Card from './ui/Card';
import TaskList from './TaskList';

interface CriticalTasksProps {
  overdueTasks: Task[];
  dueSoonTasks: Task[];
  unassignedTasks: Task[];
  membersById: Record<string, TeamMember>;
  projectsById: Record<string, Project>;
  onUpdateTask: (taskId: string, updates: Partial<Omit<Task, 'id'>>) => void;
  onCompleteTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  currentUser: TeamMember;
  onOpenFile: (file: StoreFile) => void;
}

const CriticalTasks: React.FC<CriticalTasksProps> = ({ 
    overdueTasks, 
    dueSoonTasks,
    unassignedTasks,
    membersById, 
    projectsById,
    onUpdateTask,
    onCompleteTask,
    onDeleteTask,
    currentUser,
    onOpenFile,
}) => {
  const [expandedSection, setExpandedSection] = useState<'overdue' | 'due-soon' | 'unassigned' | null>(null);

  if (overdueTasks.length === 0 && dueSoonTasks.length === 0 && unassignedTasks.length === 0) {
    return null;
  }

  const renderSection = (
    type: 'overdue' | 'due-soon' | 'unassigned',
    title: string,
    tasks: Task[],
    iconName: keyof typeof Icon.library,
    colorClasses: { text: string; border: string; bg: string; }
  ) => {
    if (tasks.length === 0) return null;

    const isExpanded = expandedSection === type;

    return (
      <div className="mt-4 first:mt-2">
        <button
          onClick={() => setExpandedSection(isExpanded ? null : type)}
          className={`w-full text-left flex items-center justify-between p-3 rounded-lg transition-colors border ${colorClasses.border} ${isExpanded ? colorClasses.bg : 'bg-light-card dark:bg-dark-card hover:bg-light-border/30 dark:hover:bg-dark-border/30'}`}
          aria-expanded={isExpanded}
          aria-controls={`critical-tasks-${type}`}
        >
          <div className="flex items-center gap-3">
            <Icon name={iconName} className={`h-6 w-6 ${colorClasses.text}`} />
            <div className="flex items-baseline gap-2">
              <h3 className={`text-base font-semibold ${colorClasses.text}`}>{title}</h3>
              <span className="font-mono text-sm bg-light-bg dark:bg-dark-bg text-light-text-secondary dark:text-dark-text-secondary px-2 py-0.5 rounded-full">{tasks.length}</span>
            </div>
          </div>
          <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} className="h-5 w-5 text-light-text-secondary dark:text-dark-text-secondary transition-transform" />
        </button>

        {isExpanded && (
          <div id={`critical-tasks-${type}`} className={`border-t-0 border ${colorClasses.border} bg-light-card dark:bg-dark-card rounded-b-lg`}>
            <TaskList 
                tasks={tasks} 
                membersById={membersById} 
                projectsById={projectsById}
                onUpdateTask={onUpdateTask}
                onCompleteTask={onCompleteTask}
                onDeleteTask={onDeleteTask}
                teamMembers={[]}
                currentUser={currentUser}
                onOpenFile={onOpenFile}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="animate-fade-in border border-light-border dark:border-dark-border">
        <div className="p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">Action Required</h2>
            
            {renderSection(
                'overdue',
                'Overdue Tasks',
                overdueTasks,
                'alert-octagon',
                { text: 'text-red-500 dark:text-red-400', border: 'border-red-400/40 dark:border-red-500/40', bg: 'bg-red-400/10 dark:bg-red-500/10' }
            )}

            {renderSection(
                'due-soon',
                'Due Within 24 Hours',
                dueSoonTasks,
                'alert-triangle',
                { text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500/40 dark:border-yellow-500/40', bg: 'bg-yellow-400/10 dark:bg-yellow-500/10' }
            )}
            
            {renderSection(
                'unassigned',
                'Unassigned Tasks',
                unassignedTasks,
                'user-x',
                { text: 'text-purple-500 dark:text-purple-400', border: 'border-purple-500/40 dark:border-purple-500/40', bg: 'bg-purple-400/10 dark:bg-purple-500/10' }
            )}
        </div>
    </Card>
  );
};

export default CriticalTasks;