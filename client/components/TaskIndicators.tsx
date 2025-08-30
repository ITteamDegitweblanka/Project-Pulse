import React, { useState, useRef, useEffect } from 'react';
import { TaskStatus, TaskPriority, Severity, RiskLevel, ProjectStatus } from '../types';
import { Icon } from './ui/Icon';

export const TaskStatusIndicator: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const statusStyles: Partial<Record<TaskStatus, string>> = {
    [TaskStatus.NotStarted]: 'bg-gray-800 dark:bg-gray-700 text-white',
    [TaskStatus.InProgress]: 'bg-blue-600 dark:bg-blue-500/30 text-white dark:text-blue-200',
    [TaskStatus.OnHold]: 'bg-yellow-600 dark:bg-yellow-500/30 text-white dark:text-yellow-200',
    [TaskStatus.Blocked]: 'bg-red-600 dark:bg-red-500/30 text-white dark:text-red-200',
    [TaskStatus.UserTesting]: 'bg-orange-500 dark:bg-orange-500/30 text-white dark:text-orange-200',
    [TaskStatus.Update]: 'bg-slate-500 dark:bg-slate-700 text-white dark:text-slate-200',
    [TaskStatus.Completed]: 'bg-green-600 dark:bg-green-500/30 text-white dark:text-green-200',
  };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full w-full block text-center ${statusStyles[status]}`}>{status}</span>;
};

export const RiskIssueStatusIndicator: React.FC<{ status: TaskStatus }> = ({ status }) => {
    const statusInfo: Partial<Record<TaskStatus, { label: string; dot: string; text: string; }>> = {
        [TaskStatus.NotStarted]: { label: 'Open', dot: 'bg-red-500', text: 'text-red-800 dark:text-red-300' },
        [TaskStatus.InProgress]: { label: 'In Progress', dot: 'bg-yellow-500', text: 'text-yellow-800 dark:text-yellow-400' },
        [TaskStatus.OnHold]: { label: 'On Hold', dot: 'bg-purple-500', text: 'text-purple-800 dark:text-purple-400' },
        [TaskStatus.Blocked]: { label: 'Blocked', dot: 'bg-red-700', text: 'text-red-800 dark:text-red-300' },
        [TaskStatus.UserTesting]: { label: 'User Testing', dot: 'bg-orange-500', text: 'text-orange-800 dark:text-orange-400' },
        [TaskStatus.Update]: { label: 'Update', dot: 'bg-slate-500', text: 'text-slate-800 dark:text-slate-400' },
        [TaskStatus.Completed]: { label: 'Resolved', dot: 'bg-green-500', text: 'text-green-800 dark:text-green-400' },
    };
    const info = statusInfo[status];
    if (!info) return null;

    return (
        <span className={`inline-flex items-center gap-2 text-sm font-medium ${info.text}`}>
            <span className={`h-2 w-2 rounded-full ${info.dot}`}></span>
            {info.label}
        </span>
    );
};


export const TaskTypeIndicator: React.FC<{ type: 'risk' | 'issue' }> = ({ type }) => {
    const isRisk = type === 'risk';
    const styles = isRisk 
        ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
        : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300';
    const label = isRisk ? '🚨 BLOCKED' : 'Issue';
    return (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${styles}`}>
            {label}
        </span>
    );
};

export const TaskPriorityIndicator: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
    const priorityStyles: Record<TaskPriority, string> = {
        [TaskPriority.Low]: 'text-gray-400 dark:text-gray-400',
        [TaskPriority.Medium]: 'text-yellow-500 dark:text-yellow-400',
        [TaskPriority.High]: 'text-orange-500 dark:text-orange-400',
        [TaskPriority.Urgent]: 'text-red-600 dark:text-red-500',
    };
    const iconName: Record<TaskPriority, keyof typeof Icon.library> = {
        [TaskPriority.Low]: 'priority-low',
        [TaskPriority.Medium]: 'priority-medium',
        [TaskPriority.High]: 'priority-high',
        [TaskPriority.Urgent]: 'priority-urgent',
    };
    return <Icon name={iconName[priority]} className={`h-5 w-5 ${priorityStyles[priority]}`} title={priority}/>
};

export const TaskDifficultyIndicator: React.FC<{ score: number }> = ({ score }) => {
  const getColorClasses = () => {
      if (score <= 3) return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 ring-green-500/30'; // Easy
      if (score <= 7) return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 ring-yellow-500/30'; // Medium
      return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 ring-red-500/30'; // Hard
  };

  return (
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-inset ${getColorClasses()}`}>
          {score}
      </div>
  );
};

export const SeverityIndicator: React.FC<{ severity: Severity }> = ({ severity }) => {
    const styles: Record<Severity, {dot: string, text: string}> = {
        Critical: { dot: 'bg-red-500', text: 'text-red-800 dark:text-red-300' },
        High: { dot: 'bg-orange-500', text: 'text-orange-800 dark:text-orange-300' },
        Medium: { dot: 'bg-yellow-500', text: 'text-yellow-800 dark:text-yellow-300' },
        Low: { dot: 'bg-green-500', text: 'text-green-800 dark:text-green-300' },
    };
    const currentStyle = styles[severity];
    return (
        <span className={`inline-flex items-center gap-2 text-sm font-medium ${currentStyle.text}`}>
            <span className={`h-2 w-2 rounded-full ${currentStyle.dot}`}></span>
            {severity}
        </span>
    );
};

export const RiskLevelIndicator: React.FC<{ level: RiskLevel }> = ({ level }) => {
    const styles: Record<RiskLevel, string> = {
        High: 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 ring-red-600/20',
        Medium: 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 ring-orange-600/20',
        Low: 'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300 ring-green-600/20',
    };
    return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ring-1 ring-inset ${styles[level]}`}>{level}</span>
};

const projectStatusStyles: Record<ProjectStatus, string> = {
    [ProjectStatus.NotStarted]: 'bg-slate-400 text-white dark:bg-slate-600',
    [ProjectStatus.Started]: 'bg-blue-600 text-white dark:bg-blue-500',
    [ProjectStatus.UserTesting]: 'bg-amber-600 text-white dark:bg-amber-700',
    [ProjectStatus.Update]: 'bg-purple-600 text-white dark:bg-purple-500',
    [ProjectStatus.Blocked]: 'bg-red-600 text-white dark:bg-red-500',
    [ProjectStatus.Completed]: 'bg-green-600 text-white dark:bg-green-500',
    [ProjectStatus.CompletedBlocked]: 'bg-red-600 text-white dark:bg-red-500',
    [ProjectStatus.CompletedNotSatisfied]: 'bg-amber-600 text-white dark:bg-amber-700',
};

const ProjectStatusPill: React.FC<{ status: ProjectStatus, disabled?: boolean, className?: string }> = ({ status, disabled, className }) => (
    <span className={`px-2 py-1 text-xs font-medium rounded-full w-full block text-center ${projectStatusStyles[status]} ${className} ${disabled ? 'opacity-70' : ''}`}>
        {status}
    </span>
);


export const ProjectStatusIndicator: React.FC<{
    status: ProjectStatus;
    onChange: (newStatus: ProjectStatus) => void;
    disabled?: boolean;
    allowedStatuses?: ProjectStatus[];
}> = ({ status, onChange, disabled, allowedStatuses }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const statusesToShow = allowedStatuses || Object.values(ProjectStatus);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (newStatus: ProjectStatus) => {
        onChange(newStatus);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full ${disabled ? 'cursor-not-allowed' : ''}`}
            >
                <ProjectStatusPill status={status} disabled={disabled} />
            </button>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-light-card dark:bg-dark-card rounded-md shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-dark-border">
                    <ul className="py-1">
                        {statusesToShow.map(s => (
                            <li
                                key={s}
                                onClick={() => handleSelect(s)}
                                className="px-2 py-1 text-xs text-light-text-primary dark:text-dark-text-primary hover:bg-light-border dark:hover:bg-dark-border cursor-pointer"
                            >
                                <ProjectStatusPill status={s} />
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};