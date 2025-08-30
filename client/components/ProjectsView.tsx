

import React, { useState, useMemo, useEffect, Fragment } from 'react';
import { Project, Task, TeamMember, ProjectStatus, TaskStatus, Role, EndUserFeedback } from '../types';
import Button from './ui/Button';
import Card from './ui/Card';
import { Icon } from './ui/Icon';
import { calculateProjectProgress } from '../utils/progress';
import { ProjectStatusIndicator } from './TaskIndicators';

const isAdmin = (role: Role) => [Role.MD, Role.Director, Role.AdminManager, Role.OperationManager, Role.SuperLeader].includes(role);

interface ProjectsViewProps {
  projects: Project[];
  tasks: Task[];
  membersById: Record<string, TeamMember>;
  onAddProject: () => void;
  onUpdateProject: (projectId: string, updates: Partial<Omit<Project, 'id'>>) => void;
  onDeleteProject: (projectId: string) => void;
  onSelectProject: (projectId: string) => void;
  onOpenEditModal: (project: Project) => void;
  onSelectMember: (memberId: string) => void;
  onNavigateToRisksForProject: (projectId: string) => void;
  currentUser: TeamMember;
  onOpenCompleteProjectModal: (project: Project, subProjectId?: string) => void;
  onOpenNotSatisfiedModal: (project: Project) => void;
  onOpenCompletedBlockedModal: (project: Project) => void;
  onOpenSelectToolsModal: (project: Project, newStatus: ProjectStatus) => void;
}

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="flex items-center gap-2">
        <div className="w-full bg-light-border dark:bg-dark-border rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary w-9 text-right">{progress}%</span>
    </div>
);

const projectPhaseOptions = [
    { value: '01.Planning', label: '01.Planning', description: 'Initial project planning and requirements gathering' },
    { value: '02.Design', label: '02.Design', description: 'Design and architecture phase' },
    { value: '03.Development', label: '03.Development', description: 'Implementation and coding phase' },
    { value: '04.Testing', label: '04.Testing', description: 'Quality assurance and testing' },
    { value: '05.Closure', label: '05.Closure', description: 'Closure' },
];

const ProjectRow: React.FC<{
    project: any;
    projects: Project[];
    tasks: Task[];
    lead: TeamMember | undefined;
    canManage: boolean;
    currentUser: TeamMember;
    onUpdateProject: (projectId: string, updates: Partial<Omit<Project, 'id'>>) => void;
    onDeleteProject: (projectId: string) => void;
    onSelectProject: (projectId: string) => void;
    onOpenEditModal: (project: Project) => void;
    onSelectMember: (memberId: string) => void;
    onNavigateToRisksForProject: (projectId: string) => void;
    onOpenCompleteProjectModal: (project: Project, subProjectId?: string) => void;
    onOpenNotSatisfiedModal: (project: Project) => void;
    onOpenCompletedBlockedModal: (project: Project) => void;
    onOpenSelectToolsModal: (project: Project, newStatus: ProjectStatus) => void;
}> = ({ project, projects, tasks, lead, canManage, currentUser, onUpdateProject, onDeleteProject, onSelectProject, onOpenEditModal, onSelectMember, onNavigateToRisksForProject, onOpenCompleteProjectModal, onOpenNotSatisfiedModal, onOpenCompletedBlockedModal, onOpenSelectToolsModal }) => {
    const [elapsedHours, setElapsedHours] = useState(0);
    const formatHours = (h: number) => (h < 0.1 && h > 0 ? '<0.1' : h.toFixed(1));

    const isCompleted = [
        ProjectStatus.Completed,
        ProjectStatus.CompletedBlocked,
        ProjectStatus.CompletedNotSatisfied,
    ].includes(project.status);

    const subProjects = useMemo(() => projects.filter(p => p.parentId === project.id), [projects, project.id]);
    
    const canManageAsAdmin = isAdmin(currentUser.role);
    const canManageAsLead = currentUser.id === project.leadId;

    const allowedStatuses = useMemo(() => Object.values(ProjectStatus).filter(status => {
        switch(status) {
            case ProjectStatus.Completed:
            case ProjectStatus.CompletedNotSatisfied:
                return canManageAsAdmin;
            case ProjectStatus.CompletedBlocked:
            case ProjectStatus.Blocked:
                return canManageAsAdmin || canManageAsLead;
            default:
                return canManageAsAdmin || canManageAsLead;
        }
    }), [canManageAsAdmin, canManageAsLead]);

    // Rule 2: Lock status if parent is complete and all children are complete
    const allSubProjectsCompleted = subProjects.length > 0 && subProjects.every(sp => sp.status === ProjectStatus.Completed);
    const isStatusLocked = project.status === ProjectStatus.Completed && allSubProjectsCompleted;

    const handleStatusChange = (newStatus: ProjectStatus) => {
        if (newStatus === project.status) return;
        
        if (newStatus === ProjectStatus.UserTesting) {
            if (project.parentId) { // It's a sub-project
                const parentProject = projects.find(p => p.id === project.parentId);
                if (parentProject) {
                    const siblings = projects.filter(p => p.parentId === project.parentId);
                    const otherIncompleteSiblings = siblings.filter(s => s.id !== project.id && s.status !== ProjectStatus.Completed);
                    
                    if (otherIncompleteSiblings.length === 0) {
                        onOpenSelectToolsModal(project, newStatus);
                    } else {
                        onUpdateProject(project.id, { status: newStatus });
                    }
                } else {
                    onUpdateProject(project.id, { status: newStatus }); // Orphan sub-project case
                }
            } else {
                // It's a parent project or standalone project. Just update status.
                onUpdateProject(project.id, { status: newStatus });
            }
            return;
        }

        // Handle completion logic first
        if (newStatus === ProjectStatus.Completed) {
            if (project.parentId) { // It's a sub-project
                const parentProject = projects.find(p => p.id === project.parentId);
                if (parentProject) {
                    const siblings = projects.filter(p => p.parentId === project.parentId);
                    const otherIncompleteSiblings = siblings.filter(s => s.id !== project.id && s.status !== ProjectStatus.Completed);
                    if (otherIncompleteSiblings.length === 0) {
                        onOpenCompleteProjectModal(parentProject, project.id);
                    } else {
                        onUpdateProject(project.id, { status: newStatus });
                    }
                } else {
                     onUpdateProject(project.id, { status: newStatus }); // Orphan sub-project case
                }
            } else { // It's a parent project or a standalone project
                if (subProjects.length > 0) { // It's a parent project
                     const someSubProjectsIncomplete = subProjects.some(sp => sp.status !== ProjectStatus.Completed);
                     if (someSubProjectsIncomplete) {
                         alert('Cannot complete this project because one or more sub-projects are not yet completed.');
                         return;
                     }
                }
                // It's a standalone project or a parent with all children complete
                onOpenCompleteProjectModal(project);
            }
            return; // Completion logic handled
        }
        
        // Handle other status changes
        if (newStatus === ProjectStatus.Blocked) {
            const descendantIds = [project.id, ...subProjects.map(sp => sp.id)];
            const hasActiveRisk = tasks.some(t => 
                descendantIds.includes(t.projectId) && 
                t.type === 'risk' && 
                t.status !== TaskStatus.Completed
            );
            if (!hasActiveRisk) {
                alert('A project can only be blocked if there is an active "BLOCKED" item (a risk) associated with it or its sub-projects. Please create one first.');
                return;
            }
            onUpdateProject(project.id, { status: newStatus });
        } else if (newStatus === ProjectStatus.CompletedNotSatisfied) {
            onOpenNotSatisfiedModal(project);
        } else if (newStatus === ProjectStatus.CompletedBlocked) {
            onOpenCompletedBlockedModal(project);
        } else {
            onUpdateProject(project.id, { status: newStatus });
        }
    };
    
    useEffect(() => {
        let interval: number | undefined;
        if (project.timerStartTime) {
            const updateElapsedTime = () => {
                const raw = project.timerStartTime as string;
                const isoLocal = raw.includes('T') ? raw : raw.replace(' ', 'T');
                const startMs = new Date(isoLocal).getTime();
                const elapsed = Math.max(0, Date.now() - startMs) / (1000 * 60 * 60);
                setElapsedHours(elapsed);
            };
            updateElapsedTime();
            interval = window.setInterval(updateElapsedTime, 1000);
        } else {
            setElapsedHours(0);
        }
        return () => clearInterval(interval);
    }, [project.timerStartTime]);

    const displayUsedHours = (project._derived.usedHours || 0) + elapsedHours;
    const remainingHours = project._derived.allocatedHours - displayUsedHours;

    const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }) : '-';

    return (
        <tr className="border-b border-light-border dark:border-dark-border hover:bg-light-bg/50 dark:hover:bg-dark-bg/50 transition-colors group">
            <td className="px-4 py-3 align-top">
                <div className={`flex items-center gap-2 ${project.parentId ? 'ml-6' : ''}`}>
                    {project.parentId && <Icon name="subdirectory-arrow-right" className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                    <div>
                        <a onClick={() => onSelectProject(project.id)} className="font-semibold text-light-text-primary dark:text-dark-text-primary hover:text-brand-primary cursor-pointer transition-colors">{project.name}</a>
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{project.code} - {project.department}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 align-top">
                {lead && (
                    <div onClick={() => onSelectMember(lead.id)} className="flex items-center gap-2 cursor-pointer group">
                        <img src={lead.avatarUrl} alt={lead.name} className="h-8 w-8 rounded-full" />
                        <span className="font-medium text-light-text-primary dark:text-dark-text-primary group-hover:text-brand-primary transition-colors">{lead.name}</span>
                    </div>
                )}
            </td>
            <td className="px-4 py-3 align-top">
                <ProjectStatusIndicator 
                    status={project.status} 
                    onChange={handleStatusChange}
                    disabled={!canManage || isStatusLocked}
                    allowedStatuses={allowedStatuses}
                />
            </td>
            <td className="px-4 py-3 align-top">
                {canManage ? (
                                         <select
                                                value={project.phase ?? ""}
                                                onChange={(e) => onUpdateProject(project.id, { phase: e.target.value })}
                                                disabled={project.status === ProjectStatus.Completed}
                                                className="w-full text-xs bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border focus:ring-brand-primary focus:border-brand-primary rounded p-1"
                                            >
                                                {projectPhaseOptions.map(phase => (
                                                    <option key={phase.value} value={phase.value} title={phase.description}>
                                                        {phase.label}
                                                    </option>
                                                ))}
                                            </select>
                ) : (
                     project.phase
                )}
            </td>
            <td className="px-4 py-3 align-top"><ProgressBar progress={project._derived.progress} /></td>
            <td className="px-4 py-3 align-top text-center text-sm">{formatDate(project.startDate)}</td>
            <td className="px-4 py-3 align-top text-center text-sm">{formatDate(project.completedAt)}</td>
            <td className="px-4 py-3 align-top text-center">
                <span className={`${project._derived.schedule === 'Behind' ? 'text-red-500' : 'text-light-text-primary dark:text-dark-text-primary'}`}>{project._derived.schedule}</span>
            </td>
            <td className="px-4 py-3 align-top">
                <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">{formatHours(displayUsedHours)}h / {project._derived.allocatedHours.toFixed ? project._derived.allocatedHours.toFixed(1) : project._derived.allocatedHours}h</p>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{formatHours(Math.max(0, remainingHours))}h remaining</p>
            </td>
            <td className="px-4 py-3 align-top">
                <div className="flex items-center gap-1.5 text-light-text-secondary dark:text-dark-text-secondary">
                    <Icon name="timer" className="h-4 w-4" />
                    <span>{project._derived.daysToMilestone} days</span>
                </div>
            </td>
            <td className="px-4 py-3 align-top">
                <div className="flex flex-col gap-1.5">
                    {project._derived.openIssues > 0 ? (
                        <a onClick={() => onNavigateToRisksForProject(project.id)} className="flex items-center gap-1.5 text-red-500 hover:underline cursor-pointer text-xs">
                            <Icon name="alert-triangle" className="h-3.5 w-3.5" />
                            <span>{project._derived.openIssues} Issue{project._derived.openIssues !== 1 ? 's' : ''}</span>
                        </a>
                    ) : null}
                    {project._derived.openRisks > 0 ? (
                         <a onClick={() => onNavigateToRisksForProject(project.id)} className="flex items-center gap-1.5 text-orange-500 dark:text-orange-400 hover:underline cursor-pointer text-xs">
                            <span className="text-sm">🚨</span>
                            <span className="font-semibold">{project._derived.openRisks} BLOCKED</span>
                        </a>
                    ) : null}
                    {(project._derived.openIssues === 0 && project._derived.openRisks === 0) && (
                        <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">-</span>
                    )}
                </div>
            </td>
            <td className="px-4 py-3 align-top">
                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onOpenEditModal(project)} title="Edit Project" className="p-1.5 rounded-md hover:bg-light-border dark:hover:bg-dark-border text-light-text-secondary dark:text-dark-text-secondary">
                        <Icon name="edit" className="h-4 w-4" />
                    </button>
                    {canManageAsAdmin && (
                        <button onClick={() => onDeleteProject(project.id)} title="Delete Project" className="p-1.5 rounded-md hover:bg-red-500/10 text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500">
                            <Icon name="trash" className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}


const ProjectsView: React.FC<ProjectsViewProps> = (props) => {
    const { projects, tasks, membersById, onAddProject, currentUser, onDeleteProject } = props;

    const canManageProjects = isAdmin(currentUser.role);

    const processedProjects = useMemo(() => {
        const projectsWithDerivedData = projects.map(p => {
            const children = projects.filter(child => child.parentId === p.id);
            const isParent = children.length > 0;
            
            const descendantIds = [p.id, ...children.map(c => c.id)];
            const relevantTasks = tasks.filter(t => descendantIds.includes(t.projectId));

            const allocatedHours = isParent ? children.reduce((acc, curr) => acc + curr.allocatedHours, 0) : p.allocatedHours;
            const usedHours = isParent
                ? children.reduce((acc, curr) => acc + Math.max(0, curr.usedHours || 0), 0)
                : Math.max(0, p.usedHours || 0);
            
            const progress = calculateProjectProgress(p, projects, tasks, new Map());
            
            const isBehind = relevantTasks.some(t => new Date(t.deadline) < new Date() && t.status !== TaskStatus.Completed);
            let schedule: 'Behind' | 'On Time' | 'At Risk';
            if(p.status === ProjectStatus.Completed) {
                schedule = 'On Time';
            } else if (isBehind) {
                schedule = 'Behind';
            } else if (p.riskLevel === 'High') {
                schedule = 'At Risk';
            } else {
                schedule = 'On Time';
            }
            
            const openIssuesCount = relevantTasks.filter(t => t.type === 'issue' && t.status !== TaskStatus.Completed).length;
            const openRisksCount = relevantTasks.filter(t => t.type === 'risk' && t.status !== TaskStatus.Completed).length;
            const ms = p.milestoneDate ? new Date(p.milestoneDate).getTime() : NaN;
            let daysToMilestone = 0;
            if (!Number.isNaN(ms)) {
                const diffTime = ms - Date.now();
                daysToMilestone = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            }
            
            return {
                ...p,
                isParent,
                _derived: {
                    schedule,
                    progress,
                    allocatedHours,
                    usedHours,
                    openIssues: openIssuesCount,
                    openRisks: openRisksCount,
                    daysToMilestone
                }
            };
        });

        const orderedList: any[] = [];
        const parentProjects = projectsWithDerivedData
            .filter(p => !p.parentId)
            .sort((a,b) => a.name.localeCompare(b.name));

        parentProjects.forEach(parent => {
            orderedList.push(parent);
            const children = projectsWithDerivedData
                .filter(p => p.parentId === parent.id)
                .sort((a,b) => a.name.localeCompare(b.name));
            orderedList.push(...children);
        });
        
        return orderedList;
    }, [projects, tasks]);


    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">All Projects</h1>
                    <p className="mt-1 text-light-text-secondary dark:text-dark-text-secondary">Track, manage, and collaborate on all projects.</p>
                </div>
                {canManageProjects && (
                    <Button onClick={onAddProject} variant="primary">
                        <Icon name="plus" className="h-5 w-5 mr-2" />
                        New Project
                    </Button>
                )}
            </div>

            <Card className="overflow-x-auto">
                <table className="w-full text-sm text-left table-fixed">
                    <thead className="bg-light-bg/50 dark:bg-dark-bg/30">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary w-[13%]">Project</th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-left w-[10%]">Lead</th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-center w-[10%]">Status</th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-left w-[10%]">Phase</th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-center w-[10%]">Progress</th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-center w-[8%]">Start Date</th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-center w-[8%]">Completed Date</th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-center w-[8%]">Schedule</th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-left w-[8%]">Hours</th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-left w-[8%]">Days to Milestone</th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-center w-[7%]">Issues / Blockers</th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-center w-[5%]">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedProjects.map(p => (
                            <ProjectRow
                                key={p.id}
                                project={p}
                                projects={projects}
                                tasks={tasks}
                                lead={membersById[p.leadId]}
                                canManage={canManageProjects}
                                currentUser={currentUser}
                                onUpdateProject={props.onUpdateProject}
                                onDeleteProject={onDeleteProject}
                                onSelectProject={props.onSelectProject}
                                onOpenEditModal={props.onOpenEditModal}
                                onSelectMember={props.onSelectMember}
                                onNavigateToRisksForProject={props.onNavigateToRisksForProject}
                                onOpenCompleteProjectModal={props.onOpenCompleteProjectModal}
                                onOpenNotSatisfiedModal={props.onOpenNotSatisfiedModal}
                                onOpenCompletedBlockedModal={props.onOpenCompletedBlockedModal}
                                onOpenSelectToolsModal={props.onOpenSelectToolsModal}
                            />
                        ))}
                    </tbody>
                </table>
                 {processedProjects.length === 0 && (
                  <div className="text-center py-20 text-light-text-secondary dark:text-dark-text-secondary">
                      <Icon name="briefcase" className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>No projects to display.</p>
                  </div>
                )}
            </Card>
        </div>
    );
};

export default ProjectsView;