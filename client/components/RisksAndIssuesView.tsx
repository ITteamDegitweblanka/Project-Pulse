
import React, { useState, useMemo } from 'react';
import { Project, Task, TeamMember, TaskStatus, Role, Severity } from '../types';
import Card from './ui/Card';
import { Icon } from './ui/Icon';
import Dropdown from './ui/Dropdown';
import { SeverityIndicator, RiskIssueStatusIndicator, TaskTypeIndicator } from './TaskIndicators';
import Button from './ui/Button';

interface RisksAndIssuesViewProps {
  tasks: Task[];
  projectsById: Record<string, Project>;
  membersById: Record<string, TeamMember>;
  currentUser: TeamMember;
  onAddRiskIssue: () => void;
  onEditRiskIssue: (task: Task) => void;
  onSelectProject: (projectId: string) => void;
  projectIdFilter: string | null;
  onClearProjectFilter: () => void;
}

const isAdmin = (role: Role) => [Role.MD, Role.Director, Role.AdminManager, Role.OperationManager, Role.SuperLeader].includes(role);
const isLeader = (role: Role) => isAdmin(role) || [Role.TeamLeader, Role.SubTeamLeader].includes(role);

const RisksAndIssuesView: React.FC<RisksAndIssuesViewProps> = ({ tasks, projectsById, membersById, currentUser, onAddRiskIssue, onEditRiskIssue, onSelectProject, projectIdFilter, onClearProjectFilter }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'risk', 'issue'
    const [severityFilter, setSeverityFilter] = useState('all'); // 'all', 'Critical', ...
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'Not Started', ...
    
    const canAddRiskIssue = isLeader(currentUser.role);

    const allRisksAndIssues = useMemo(() => tasks.filter((t): t is Task & { type: 'risk' | 'issue' } => t.type === 'risk' || t.type === 'issue'), [tasks]);

    const stats = useMemo(() => {
        const openItems = allRisksAndIssues.filter(t => t.status !== TaskStatus.Completed);
        return {
            totalOpen: openItems.length,
            critical: openItems.filter(t => t.severity === 'Critical').length,
            inProgress: allRisksAndIssues.filter(t => t.status === TaskStatus.InProgress).length,
            resolved: allRisksAndIssues.filter(t => t.status === TaskStatus.Completed).length,
        };
    }, [allRisksAndIssues]);

    const filteredItems = useMemo(() => {
        return allRisksAndIssues.filter(item => {
            const searchLower = searchQuery.toLowerCase();
            const project = projectsById[item.projectId];
            const assignee = item.assigneeId ? membersById[item.assigneeId] : null;

            if (searchQuery && 
                !item.title.toLowerCase().includes(searchLower) &&
                !(item.code && item.code.toLowerCase().includes(searchLower)) &&
                !(project && project.name.toLowerCase().includes(searchLower)) &&
                !(assignee && assignee.name.toLowerCase().includes(searchLower))
            ) {
                return false;
            }
            if (typeFilter !== 'all' && item.type !== typeFilter) return false;
            if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
            if (statusFilter !== 'all' && item.status !== statusFilter) return false;
            if (projectIdFilter && item.projectId !== projectIdFilter) return false;
            return true;
        }).sort((a,b) => new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime());
    }, [allRisksAndIssues, searchQuery, typeFilter, severityFilter, statusFilter, projectIdFilter, projectsById, membersById]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };
    
    const typeOptions = [
        { value: 'all', label: 'All Types' },
        { value: 'risk', label: '🚨 BLOCKED' },
        { value: 'issue', label: 'Issue' },
    ];
    const severityOptions = [
        { value: 'all', label: 'All Severities' },
        { value: 'Critical', label: 'Critical' },
        { value: 'High', label: 'High' },
        { value: 'Medium', label: 'Medium' },
        { value: 'Low', label: 'Low' },
    ];
    const statusOptions = [
        { value: 'all', label: 'All Statuses' },
        ...Object.values(TaskStatus).map(s => ({ value: s, label: s }))
    ];


    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">Blocked & Issues Management</h1>
                    <p className="mt-1 text-light-text-secondary dark:text-dark-text-secondary">Track and manage project blockers and issues</p>
                </div>
                {canAddRiskIssue && (
                    <Button onClick={onAddRiskIssue} variant="primary">
                        <Icon name="plus" className="h-5 w-5 mr-2" />
                        Add Item
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Open" value={stats.totalOpen} icon="alert-triangle" iconColor="text-red-500" />
                <StatCard title="Critical" value={stats.critical} icon="alert-triangle" iconColor="text-red-500" />
                <StatCard title="In Progress" value={stats.inProgress} icon="timer" iconColor="text-yellow-500" />
                <StatCard title="Resolved" value={stats.resolved} icon="check-circle" iconColor="text-green-500" />
            </div>

            <Card className="p-4 space-y-4">
                {projectIdFilter && (
                    <div className="flex items-center justify-between p-2 bg-blue-100 dark:bg-blue-900/50 rounded-md">
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            Showing items for project: <span className="font-bold">{projectsById[projectIdFilter]?.name}</span>
                        </p>
                        <button onClick={onClearProjectFilter} className="p-1 rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                            <Icon name="close" className="h-4 w-4" />
                        </button>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <div className="relative md:col-span-2 lg:col-span-1">
                        <Icon name="search" className="pointer-events-none absolute inset-y-0 left-3 flex items-center h-full w-5 text-gray-400 dark:text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search by title, ID, project..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-light-bg dark:bg-dark-input border border-light-border dark:border-dark-border rounded-md pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-light-text-primary dark:text-dark-text-primary"
                        />
                    </div>
                    <Dropdown options={typeOptions} value={typeFilter} onChange={setTypeFilter} placeholder="Filter by type" showPlaceholderOnAll />
                    <Dropdown options={severityOptions} value={severityFilter} onChange={setSeverityFilter} placeholder="Filter by severity" showPlaceholderOnAll />
                    <Dropdown options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Filter by status" showPlaceholderOnAll />
                </div>
            </Card>

            <Card>
                <div className="px-6 pt-6">
                    <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">All Blocked & Issues</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-light-border dark:border-dark-border">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-[12%]">ID / Type</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-[28%]">Title</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-[15%]">Project</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Severity</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Assignee</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Last Updated</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-light-border dark:divide-dark-border">
                            {filteredItems.map(item => {
                                const project = projectsById[item.projectId];
                                const assignee = item.assigneeId ? membersById[item.assigneeId] : null;
                                return (
                                <tr key={item.id} className="hover:bg-light-bg/50 dark:hover:bg-dark-bg/50 transition-colors duration-150 align-top">
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-sm text-light-text-primary dark:text-dark-text-primary">{item.code}</div>
                                        {item.type && <TaskTypeIndicator type={item.type} />}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-light-text-primary dark:text-dark-text-primary">{item.title}</p>
                                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1 truncate">{item.description}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {project ? (
                                            <div>
                                                <div className="font-medium text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => onSelectProject(project.id)}>{project.name}</div>
                                                <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{project.code}</div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-red-400 italic">Project not available</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{item.severity && <SeverityIndicator severity={item.severity} />}</td>
                                    <td className="px-6 py-4"><RiskIssueStatusIndicator status={item.status} /></td>
                                    <td className="px-6 py-4">
                                        {assignee ? (
                                            <div className="flex items-center gap-2 text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                                                <Icon name="user" className="h-4 w-4 text-light-text-secondary dark:text-dark-text-secondary"/>
                                                <span>{assignee.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary italic">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">{formatDate(item.lastUpdated)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => onSelectProject(item.projectId)} disabled={!project} className="px-3 py-1 text-sm font-medium bg-light-bg dark:bg-dark-input border border-light-border dark:border-dark-border/50 rounded-md hover:bg-light-border dark:hover:bg-dark-border text-light-text-primary dark:text-dark-text-primary disabled:opacity-50">View</button>
                                            <button onClick={() => onEditRiskIssue(item)} disabled={!canAddRiskIssue} className="px-3 py-1 text-sm font-medium bg-light-bg dark:bg-dark-input border border-light-border dark:border-dark-border/50 rounded-md hover:bg-light-border dark:hover:bg-dark-border text-light-text-primary dark:text-dark-text-primary disabled:opacity-50">Edit</button>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredItems.length === 0 && (
                        <p className="text-light-text-secondary dark:text-dark-text-secondary text-center py-10 px-6">No items match the current filters.</p>
                    )}
                </div>
            </Card>
        </div>
    );
};

const StatCard: React.FC<{title: string, value: number, icon: keyof typeof Icon.library, iconColor: string}> = ({ title, value, icon, iconColor}) => (
    <Card className="p-5 flex justify-between items-center">
        <div>
            <h3 className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">{title}</h3>
            <p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-light-bg dark:bg-dark-input`}>
            <Icon name={icon} className={`h-6 w-6 ${iconColor}`} />
        </div>
    </Card>
);


export default RisksAndIssuesView;