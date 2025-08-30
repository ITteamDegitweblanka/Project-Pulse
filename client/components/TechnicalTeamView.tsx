
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Project, Task, TeamMember, Team, Role, ProjectStatus, ProjectUser, ProjectFrequency, TaskStatus, Tool } from '../types';
import Button from './ui/Button';
import Card from './ui/Card';
import { Icon } from './ui/Icon';
import { calculateProjectProgress } from '../utils/progress';
import { ProjectStatusIndicator } from './TaskIndicators';
import TechnicalTeamPerformanceView from './TechnicalTeamPerformanceView';
import TechnicalTeamUpdateView from './TechnicalTeamUpdateView';

const isAdmin = (role: Role) => [Role.MD, Role.Director, Role.AdminManager, Role.OperationManager, Role.SuperLeader].includes(role);

interface TechnicalTeamViewProps {
  projects: Project[];
  tasks: Task[];
  teamMembers: TeamMember[];
  teams: Team[];
  tools: Tool[];
  membersById: Record<string, TeamMember>;
  projectsById: Record<string, Project>;
  onUpdateProject: (projectId: string, updates: Partial<Omit<Project, 'id'>>) => void;
  onDeleteProject: (projectId: string) => void;
  onSelectProject: (projectId: string) => void;
  currentUser: TeamMember;
  onOpenCompleteProjectModal: (project: Project) => void;
  onOpenNotSatisfiedModal: (project: Project) => void;
  onOpenCompletedBlockedModal: (project: Project) => void;
  onOpenLogUsageModal: (projectId: string) => void;
  onOpenSelectToolsModal: (project: Project, newStatus: ProjectStatus) => void;
  onOpenCompletedProjectsSummaryModal: (projects: Project[]) => void;
  onOpenLogSavedTimeModal: () => void;
  onNavigateToRisksForProject: (projectId: string) => void;
}

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="flex items-center gap-2">
        <div className="w-full bg-light-border dark:bg-dark-border rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary w-9 text-right">{progress.toFixed(0)}%</span>
    </div>
);


const EditableUserCell: React.FC<{ 
    project: Project;
    teamMembers: TeamMember[];
    teams: Team[];
    onUpdateProject: (projectId: string, updates: Partial<Omit<Project, 'id'>>) => void;
}> = ({ project, teamMembers, teams, onUpdateProject }) => {
    const [isEditing, setIsEditing] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsEditing(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedUsers = useMemo(() => project.users || [], [project.users]);

    const handleSelectionChange = (type: 'user' | 'team', id: string) => {
        const isSelected = selectedUsers.some(u => u.type === type && u.id === id);
        let newSelection: ProjectUser[];
        if (isSelected) {
            newSelection = selectedUsers.filter(u => !(u.type === type && u.id === id));
        } else {
            newSelection = [...selectedUsers, { type, id }];
        }
        onUpdateProject(project.id, { users: newSelection });
    };

    const displayNames = selectedUsers.map(u => {
        if (u.type === 'user') {
            return teamMembers.find(tm => tm.id === u.id)?.name;
        }
        return `[T] ${teams.find(t => t.id === u.id)?.name}`;
    }).filter(Boolean).join(', ');

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full text-left p-1 rounded-md hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
            >
                {displayNames || <span className="italic text-gray-500 dark:text-dark-text-secondary opacity-70">Unassigned</span>}
            </button>
            {isEditing && (
                <div className="absolute z-10 mt-1 w-72 bg-light-card dark:bg-dark-card rounded-md shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-dark-border">
                    <div className="p-2 text-xs font-semibold border-b border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary">Assign Users & Teams</div>
                    <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                        <p className="text-xs font-bold text-light-text-secondary dark:text-dark-text-secondary">Teams</p>
                        {teams.map(team => (
                             <label key={`team-${team.id}`} className="flex items-center gap-2 p-1 rounded hover:bg-light-border dark:hover:bg-dark-border cursor-pointer">
                                <input type="checkbox" checked={selectedUsers.some(u => u.type === 'team' && u.id === team.id)} onChange={() => handleSelectionChange('team', team.id)} className="h-4 w-4 rounded text-brand-primary focus:ring-brand-secondary" />
                                <span className="text-sm">{team.name}</span>
                            </label>
                        ))}
                         <p className="text-xs font-bold text-light-text-secondary dark:text-dark-text-secondary pt-2 border-t border-light-border dark:border-dark-border">Users</p>
                        {teamMembers.map(member => (
                            <label key={`user-${member.id}`} className="flex items-center gap-2 p-1 rounded hover:bg-light-border dark:hover:bg-dark-border cursor-pointer">
                                <input type="checkbox" checked={selectedUsers.some(u => u.type === 'user' && u.id === member.id)} onChange={() => handleSelectionChange('user', member.id)} className="h-4 w-4 rounded text-brand-primary focus:ring-brand-secondary" />
                                <img src={member.avatarUrl} alt={member.name} className="h-6 w-6 rounded-full" />
                                <span className="text-sm">{member.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const EditableSavedHoursCell: React.FC<{
    project: Project;
    onUpdateProject: (projectId: string, updates: Partial<Omit<Project, 'id'>>) => void;
    canEdit: boolean;
}> = ({ project, onUpdateProject, canEdit }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(project.savedHours?.toString() || '0');
    
    useEffect(() => {
        setValue(project.savedHours?.toString() || '0')
    }, [project.savedHours]);

    if (!canEdit) {
        if (!project.savedHours || (project.status !== ProjectStatus.Completed && project.status !== ProjectStatus.CompletedBlocked && project.status !== ProjectStatus.CompletedNotSatisfied)) {
            return <div className="text-center"><span className="italic text-gray-500">-</span></div>;
        }
        return (
            <div className={`font-semibold w-full text-center p-1 rounded ${(project.savedHours || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                {(project.savedHours || 0).toFixed(1)}h
            </div>
        );
    }
    
    if (isEditing) {
        return (
            <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={() => {
                    onUpdateProject(project.id, { savedHours: parseFloat(value) || 0 });
                    setIsEditing(false);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        onUpdateProject(project.id, { savedHours: parseFloat(value) || 0 });
                        setIsEditing(false);
                    }
                }}
                className="w-20 text-center bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded p-1"
                autoFocus
            />
        );
    }

    return (
        <button
            onClick={() => setIsEditing(true)}
            className={`font-semibold w-full text-center p-1 rounded ${'cursor-pointer hover:bg-light-border/50 dark:hover:bg-dark-border/50'} ${(project.savedHours || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}
        >
            {(project.savedHours || 0).toFixed(1)}h
        </button>
    );
};

const TechnicalTeamView: React.FC<TechnicalTeamViewProps> = (props) => {
    const { projects, tasks, membersById, teams, teamMembers, tools, onUpdateProject, onDeleteProject, onSelectProject, currentUser, projectsById, onOpenCompleteProjectModal, onOpenNotSatisfiedModal, onOpenCompletedBlockedModal, onOpenLogUsageModal, onOpenSelectToolsModal, onOpenCompletedProjectsSummaryModal, onOpenLogSavedTimeModal, onNavigateToRisksForProject } = props;
    const [currentSubTab, setCurrentSubTab] = useState('projects');

    const technicalTeam = useMemo(() => teams.find(t => t.name.toLowerCase() === 'technical'), [teams]);

    const processedProjects = useMemo(() => {
        if (!technicalTeam) return [];
        const progressCache = new Map<string, number>();
        
        return projects
            .filter(p => p.teamId === technicalTeam.id)
            .map(p => {
                const progress = calculateProjectProgress(p, projects, tasks, progressCache);
                const children = projects.filter(child => child.parentId === p.id);
                const descendantIds = [p.id, ...children.map(c => c.id)];
                const relevantTasks = tasks.filter(t => descendantIds.includes(t.projectId));
                const openIssues = relevantTasks.filter(t => t.type === 'issue' && t.status !== TaskStatus.Completed).length;
                const openRisks = relevantTasks.filter(t => t.type === 'risk' && t.status !== TaskStatus.Completed).length;
                
                return {
                    ...p,
                    progress,
                    openIssues,
                    openRisks,
                };
            })
            .sort((a,b) => (a.status === ProjectStatus.Completed ? 1 : -1) - (b.status === ProjectStatus.Completed ? 1 : -1) || a.name.localeCompare(b.name));

    }, [projects, tasks, technicalTeam]);
    
    const canManage = isAdmin(currentUser.role);
    
    const handleStatusChange = (project: Project, newStatus: ProjectStatus) => {
        if (newStatus === project.status) return;

        if (newStatus === ProjectStatus.UserTesting) {
            if (project.parentId) { // Check if it's a sub-project
                const parentProject = projects.find(p => p.id === project.parentId);
                if (parentProject) {
                    const siblings = projects.filter(p => p.parentId === parentProject.id);
                    const otherIncompleteSiblings = siblings.filter(s => s.id !== project.id && s.status !== ProjectStatus.Completed);
                    
                    if (otherIncompleteSiblings.length === 0) {
                        onOpenSelectToolsModal(project, newStatus);
                    } else {
                        onUpdateProject(project.id, { status: newStatus });
                    }
                } else {
                    onUpdateProject(project.id, { status: newStatus }); // Orphaned sub-project case.
                }
            } else {
                // Not a sub-project, just update status directly without the modal.
                onUpdateProject(project.id, { status: newStatus });
            }
            return;
        }

        if (newStatus === ProjectStatus.Completed) {
            onOpenCompleteProjectModal(project);
            return;
        }
        
        if (newStatus === ProjectStatus.CompletedNotSatisfied) {
            onOpenNotSatisfiedModal(project);
        } else if (newStatus === ProjectStatus.CompletedBlocked) {
            onOpenCompletedBlockedModal(project);
        } else {
            onUpdateProject(project.id, { status: newStatus });
        }
    };

    const renderProjectsTable = () => (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-light-bg/50 dark:bg-dark-bg/30">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary w-[20%]">Project</th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary w-[18%]">Beneficiaries</th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-center w-[12%]">Status</th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-center w-[12%]">Progress</th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-center w-[12%]">Total Saved</th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-center w-[12%]">Issues/Blockers</th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-center w-[14%]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-light-border dark:divide-dark-border">
                        {processedProjects.map(project => {
                            const lead = membersById[project.leadId];
                            const canManageProject = canManage || currentUser.id === project.leadId;
                            return (
                                <tr key={project.id}>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-light-text-primary dark:text-dark-text-primary hover:text-brand-primary cursor-pointer" onClick={() => onSelectProject(project.id)}>{project.name}</div>
                                        <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Lead: {lead?.name || 'N/A'}</div>
                                    </td>
                                    <td className="px-4 py-3"><EditableUserCell project={project} teamMembers={teamMembers} teams={teams} onUpdateProject={onUpdateProject} /></td>
                                    <td className="px-4 py-3"><ProjectStatusIndicator status={project.status} onChange={(s) => handleStatusChange(project, s)} disabled={!canManageProject} /></td>
                                    <td className="px-4 py-3"><ProgressBar progress={project.progress} /></td>
                                    <td className="px-4 py-3"><EditableSavedHoursCell project={project} onUpdateProject={onUpdateProject} canEdit={canManageProject} /></td>
                                    <td className="px-4 py-3 text-center">
                                         <div className="flex flex-col items-center gap-1.5">
                                            {project.openIssues > 0 && <a onClick={() => onNavigateToRisksForProject(project.id)} className="flex items-center gap-1.5 text-red-500 hover:underline cursor-pointer text-xs"><Icon name="alert-triangle" className="h-3.5 w-3.5" />{project.openIssues} Issue(s)</a>}
                                            {project.openRisks > 0 && <a onClick={() => onNavigateToRisksForProject(project.id)} className="flex items-center gap-1.5 text-orange-500 dark:text-orange-400 hover:underline cursor-pointer text-xs">🚨 {project.openRisks} BLOCKED</a>}
                                            {project.openIssues === 0 && project.openRisks === 0 && <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">-</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-1">
                                            <Button variant="secondary" className="!px-2.5 !py-1 !text-xs" onClick={() => onOpenLogUsageModal(project.id)}>Log Usage</Button>
                                            {canManage && <Button variant="secondary" className="!p-1.5" onClick={() => onDeleteProject(project.id)}><Icon name="trash" className="h-4 w-4" /></Button>}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">Technical Team Hub</h1>
                    <p className="mt-1 text-light-text-secondary dark:text-dark-text-secondary">Manage and track technical projects and performance.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <Button variant="secondary" className="!px-3 !py-1.5" onClick={onOpenLogSavedTimeModal}>
                        <Icon name="plus" className="h-4 w-4 mr-2" />
                        Log Saved Time
                    </Button>
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-light-bg dark:bg-dark-bg">
                        <Button onClick={() => setCurrentSubTab('projects')} variant={currentSubTab === 'projects' ? 'primary' : 'secondary'} className={`!px-3 !py-1 !text-xs ${currentSubTab === 'projects' ? '' : '!shadow-none !bg-transparent'}`}>Projects</Button>
                        <Button onClick={() => setCurrentSubTab('performance')} variant={currentSubTab === 'performance' ? 'primary' : 'secondary'} className={`!px-3 !py-1 !text-xs ${currentSubTab === 'performance' ? '' : '!shadow-none !bg-transparent'}`}>Performance</Button>
                        <Button onClick={() => setCurrentSubTab('update')} variant={currentSubTab === 'update' ? 'primary' : 'secondary'} className={`!px-3 !py-1 !text-xs ${currentSubTab === 'update' ? '' : '!shadow-none !bg-transparent'}`}>Update</Button>
                    </div>
                </div>
            </div>

            {currentSubTab === 'projects' && renderProjectsTable()}
            {currentSubTab === 'performance' && <TechnicalTeamPerformanceView projects={processedProjects} teamMembers={teamMembers} teams={teams} />}
            {currentSubTab === 'update' && <TechnicalTeamUpdateView projects={processedProjects} teamMembers={teamMembers} teams={teams} onOpenCompletedProjectsSummaryModal={onOpenCompletedProjectsSummaryModal} />}
        </div>
    );
};

export default TechnicalTeamView;
