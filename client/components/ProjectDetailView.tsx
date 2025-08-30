import React, { useMemo, useState, useEffect } from 'react';
import { Project, Task, TeamMember, ProjectStatus, TaskStatus, AuditLog, EndUserFeedback, Role } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import { Icon } from './ui/Icon';
import { RiskLevelIndicator, SeverityIndicator, ProjectStatusIndicator } from './TaskIndicators';
import { timeSince } from '../utils/date';
import { calculateProjectProgress } from '../utils/progress';
import ProjectTimerCard from './ProjectTimerCard';

interface ProjectDetailViewProps {
    projectId: string;
    onBack: () => void;
    projects: Project[];
    tasks: Task[];
    membersById: Record<string, TeamMember>;
    auditLogs: AuditLog[];
    onUpdateProject: (projectId:string, updates: Partial<Omit<Project, 'id'>>) => void;
    onDeleteProject: (projectId: string) => void;
    onAddSubProject: () => void;
    onOpenEditModal: (project: Project) => void;
    onOpenAddRiskIssueModal: (projectId: string) => void;
    currentUser: TeamMember;
    onProjectTimerAction: (projectId: string, action: 'start' | 'end' | 'hold' | 'resume') => void;
    onNavigateToRisksForProject: (projectId: string) => void;
    onOpenCompleteProjectModal: (project: Project, subProjectId?: string) => void;
    onOpenNotSatisfiedModal: (project: Project) => void;
    onOpenCompletedBlockedModal: (project: Project) => void;
    onOpenSelectToolsModal: (project: Project, newStatus: ProjectStatus) => void;
}

const HealthStatusIndicator: React.FC<{ status: 'Red' | 'Yellow' | 'Green' }> = ({ status }) => {
    const styles = {
        Red: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
        Yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-600 dark:text-yellow-400', dot: 'bg-yellow-500' },
        Green: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-600 dark:text-green-400', dot: 'bg-green-500' },
    };
    const currentStyle = styles[status];
    const label = status === 'Red' ? 'Behind' : status === 'Yellow' ? 'At Risk' : 'On Track';
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded ${currentStyle.bg} ${currentStyle.text}`}>
            <span className={`h-2 w-2 rounded-full ${currentStyle.dot}`}></span>
            {label}
        </span>
    );
};

const InfoPair: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <h4 className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">{label}</h4>
        <div className="text-sm text-light-text-primary dark:text-dark-text-primary mt-1">{value}</div>
    </div>
);


const BudgetOverageCard: React.FC<{
    project: Project;
    hoursOver: number;
    onSaveReason: (reason: string) => void;
}> = ({ project, hoursOver, onSaveReason }) => {
    const [reason, setReason] = useState(project.overageReason || '');
    const [isEditing, setIsEditing] = useState(false);

    const handleSave = () => {
        onSaveReason(reason);
        setIsEditing(false);
    };

    return (
        <Card className="p-6 bg-red-100/50 dark:bg-red-900/30 border border-red-500/30">
            <div className="flex items-start gap-4">
                <Icon name="alert-triangle" className="h-8 w-8 text-red-500 flex-shrink-0 mt-1" />
                <div>
                    <h3 className="text-lg font-bold text-red-700 dark:text-red-300">Hours Overage Alert</h3>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        This project has exceeded its allocated hours by <span className="font-bold">{hoursOver.toFixed(0)}h</span>.
                    </p>
                    <div className="mt-4">
                        <label className="text-xs font-semibold text-red-700 dark:text-red-300">Reason for Overage:</label>
                        {isEditing ? (
                            <div className="flex items-center gap-2 mt-1">
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="block w-full rounded-md bg-light-bg dark:bg-dark-input border-red-300 dark:border-red-500/50 shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm p-2"
                                />
                                <Button onClick={handleSave} variant="primary" className="bg-red-600 hover:bg-red-700 focus:ring-red-500">Save</Button>
                                <Button onClick={() => setIsEditing(false)} variant="secondary">Cancel</Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm italic text-red-700 dark:text-red-300 flex-grow">{project.overageReason || 'No reason provided.'}</p>
                                <Button onClick={() => setIsEditing(true)} variant="secondary" className="!text-xs !px-2 !py-1">
                                    <Icon name="edit" className="h-3 w-3 mr-1" /> Edit
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

const IssueRiskTable: React.FC<{ title: string; items: Task[] }> = ({ title, items }) => {
    if (items.length === 0) {
        return (
            <div>
                <h4 className="text-base font-semibold text-light-text-primary dark:text-dark-text-primary">{title}</h4>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-2">None</p>
            </div>
        );
    }
    return (
        <div>
            <h4 className="text-base font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">{title}</h4>
            <div className="border border-light-border dark:border-dark-border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-light-border dark:divide-dark-border">
                    <thead className="bg-light-bg dark:bg-dark-bg/50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-2/5">Title</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Severity</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-light-border dark:divide-dark-border">
                        {items.map(item => (
                            <tr key={item.id}>
                                <td className="px-4 py-2 text-sm text-light-text-primary dark:text-dark-text-primary">{item.title}</td>
                                <td className="px-4 py-2">{item.severity && <SeverityIndicator severity={item.severity} />}</td>
                                <td className="px-4 py-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">{item.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const HoursSummaryRow: React.FC<{ label: string; value: string; progress?: number }> = ({ label, value, progress }) => (
    <div>
        <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{label}</span>
            <span className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">{value}</span>
        </div>
        {progress !== undefined && (
            <div className="w-full bg-light-border dark:bg-dark-border rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
        )}
    </div>
);

const EditableCommentSection: React.FC<{
    project: Project;
    onUpdateProject: (projectId: string, updates: Partial<Omit<Project, 'id'>>) => void;
    currentUser: TeamMember;
    membersById: Record<string, TeamMember>;
}> = ({ project, onUpdateProject, currentUser, membersById }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [comments, setComments] = useState(project.latestComments?.text || '');

    useEffect(() => {
        setComments(project.latestComments?.text || '');
    }, [project.latestComments]);

    const handleSave = () => {
        if (!comments.trim()) return;
        const newComment: Project['latestComments'] = {
            text: comments.trim(),
            authorId: currentUser.id,
            timestamp: new Date().toISOString()
        };
        onUpdateProject(project.id, { latestComments: newComment });
        setIsEditing(false);
    };

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="pt-4 border-t border-light-border dark:border-dark-border">
            <h4 className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Latest Comments</h4>
            {isEditing ? (
                 <div className="mt-1">
                    <textarea value={comments} onChange={e => setComments(e.target.value)} rows={3} className="block w-full rounded-md bg-light-bg dark:bg-dark-input border-light-border dark:border-dark-border shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2" />
                    <div className="flex gap-2 justify-end mt-2">
                        <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSave}>Save</Button>
                    </div>
                </div>
            ) : (
                <>
                    <p className="text-sm text-light-text-primary dark:text-dark-text-primary mt-1 italic">"{project.latestComments?.text || 'No comments yet.'}"</p>
                    {project.latestComments && (
                        <p className="text-xs text-right text-light-text-secondary dark:text-dark-text-secondary mt-1">
                            - {membersById[project.latestComments.authorId]?.name || 'Unknown'} on {formatDate(project.latestComments.timestamp)}
                        </p>
                    )}
                    <div className="text-right mt-2">
                        <Button variant="secondary" onClick={() => setIsEditing(true)} className="!text-xs !px-2 !py-1">
                            <Icon name="edit" className="h-3 w-3 mr-1" />
                            {project.latestComments ? 'Edit' : 'Add'} Comment
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

const EndUserFeedbackCard: React.FC<{ 
    project: Project; 
    onUpdateProject: (projectId: string, updates: Partial<Omit<Project, 'id'>>) => void; 
    currentUser: TeamMember;
    membersById: Record<string, TeamMember>;
}> = ({ project, onUpdateProject, currentUser, membersById }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [rating, setRating] = useState(project.endUserFeedback?.rating || 3);
    const [comments, setComments] = useState(project.endUserFeedback?.comments || '');
    
    useEffect(() => {
        if (project.endUserFeedback) {
            setRating(project.endUserFeedback.rating);
            setComments(project.endUserFeedback.comments);
        } else {
            setRating(3);
            setComments('');
        }
    }, [project.endUserFeedback]);

    const handleSave = () => {
        const feedback: EndUserFeedback = { 
            rating: Number(rating), 
            comments,
            authorId: currentUser.id,
            timestamp: new Date().toISOString()
        };
        onUpdateProject(project.id, { endUserFeedback: feedback });
        setIsEditing(false);
    };
    
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <Card className="p-6">
            <h3 className="font-semibold text-lg text-light-text-primary dark:text-dark-text-primary mb-4">End User Feedback</h3>
            {isEditing ? (
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Rating ({rating.toFixed(1)})</label>
                        <input
                            type="range"
                            min="1" max="5" step="0.1"
                            value={rating}
                            onChange={e => setRating(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Comments</label>
                        <textarea
                            value={comments}
                            onChange={e => setComments(e.target.value)}
                            rows={3}
                            className="mt-1 flex-1 block w-full rounded-md bg-light-bg dark:bg-dark-bg border-light-border dark:border-dark-border focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2"
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSave}>Save</Button>
                    </div>
                </div>
            ) : project.endUserFeedback ? (
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Icon key={i} name="star" className={`h-5 w-5 ${i < Math.round(project.endUserFeedback!.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                            ))}
                        </div>
                        <span className="font-bold text-lg text-light-text-primary dark:text-dark-text-primary">{project.endUserFeedback.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-sm italic text-light-text-primary dark:text-dark-text-primary">"{project.endUserFeedback.comments}"</p>
                    <p className="text-xs text-right text-light-text-secondary dark:text-dark-text-secondary mt-2">
                        - {membersById[project.endUserFeedback.authorId]?.name || 'Unknown User'} on {formatDate(project.endUserFeedback.timestamp)}
                    </p>
                    <div className="text-right">
                        <Button variant="secondary" onClick={() => setIsEditing(true)} className="!text-xs !px-2 !py-1">Edit</Button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-4">
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">No feedback submitted yet.</p>
                     <Button variant="secondary" onClick={() => setIsEditing(true)} className="!text-xs !px-2 !py-1 mt-2">Add Feedback</Button>
                </div>
            )}
        </Card>
    );
};

const ProjectHistoryCard: React.FC<{ projectId: string; auditLogs: AuditLog[]; membersById: Record<string, TeamMember> }> = ({ projectId, auditLogs, membersById }) => {
    const projectLogs = useMemo(() => auditLogs.filter(log => log.projectId === projectId), [auditLogs, projectId]);

    return (
        <Card className="p-6">
            <h3 className="font-semibold text-lg text-light-text-primary dark:text-dark-text-primary mb-4">Project History</h3>
            <ul className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {projectLogs.map(log => (
                    <li key={log.id} className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                           <div className="p-1.5 rounded-full bg-light-border dark:bg-dark-border">
                             <Icon name="activity" className="h-4 w-4 text-light-text-secondary dark:text-dark-text-secondary" />
                           </div>
                        </div>
                        <div>
                            <p className="text-sm text-light-text-primary dark:text-dark-text-primary">
                                <span className="font-semibold">{log.userName}</span> {log.action.toLowerCase()}
                            </p>
                            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{log.details}</p>
                            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">{timeSince(log.timestamp)}</p>
                        </div>
                    </li>
                ))}
                {projectLogs.length === 0 && (
                     <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">No project-specific history.</p>
                )}
            </ul>
        </Card>
    );
};

const projectPhaseOptions = [
    { value: '01.Planning', label: '01.Planning', description: 'Initial project planning and requirements gathering' },
    { value: '02.Design', label: '02.Design', description: 'Design and architecture phase' },
    { value: '03.Development', label: '03.Development', description: 'Implementation and coding phase' },
    { value: '04.Testing', label: '04.Testing', description: 'Quality assurance and testing' },
    { value: '05.Closure', label: '05.Closure', description: 'Closure' },
];

const isAdmin = (role: Role) => [Role.MD, Role.Director, Role.AdminManager, Role.OperationManager, Role.SuperLeader].includes(role);

const SubProjectTimer: React.FC<{
    project: Project;
    onProjectTimerAction: (projectId: string, action: 'start' | 'end' | 'hold' | 'resume') => void;
}> = ({ project, onProjectTimerAction }) => {
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        let interval: number | undefined;
        if (project.timerStartTime) {
            const update = () => {
                const raw = project.timerStartTime as string;
                const isoLocal = raw.includes('T') ? raw : raw.replace(' ', 'T');
                const startMs = new Date(isoLocal).getTime();
                const elapsed = Math.max(0, Date.now() - startMs);
                setElapsedTime(elapsed);
            };
            update();
            interval = window.setInterval(update, 1000);
        } else {
            setElapsedTime(0);
        }
        return () => clearInterval(interval);
    }, [project.timerStartTime]);

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const totalUsedMs = Math.max(0, project.usedHours || 0) * 3600 * 1000 + elapsedTime;
    const isTimerRunning = !!project.timerStartTime;
    const isCompleted = [
        ProjectStatus.Completed,
        ProjectStatus.CompletedBlocked,
        ProjectStatus.CompletedNotSatisfied,
    ].includes(project.status);

    if (isCompleted) {
        return (
            <div className="flex items-center justify-center gap-2 text-xs text-green-600 dark:text-green-400">
                <Icon name="check-circle" className="h-4 w-4" />
                <span>Completed</span>
            </div>
        );
    }
    
    const holdButtonClasses = "!px-2.5 !py-1 !text-xs !bg-transparent dark:!bg-transparent !border-slate-400 dark:!border-slate-500 !text-slate-600 dark:!text-slate-300 hover:!bg-slate-200 dark:hover:!bg-slate-700";
    const endButtonClasses = "!px-2.5 !py-1 !text-xs !bg-red-600 hover:!bg-red-700 focus:!ring-red-500 !text-white border-transparent";
    const startButtonClasses = "!px-2.5 !py-1 !text-xs";

    return (
        <div className="flex flex-col items-center gap-2">
             <div className="font-mono text-lg font-bold text-light-text-primary dark:text-dark-text-primary">
                {formatTime(totalUsedMs)}
            </div>
            <div className="flex items-center justify-center gap-1">
                {isTimerRunning ? (
                    <>
                        <Button onClick={() => onProjectTimerAction(project.id, 'hold')} variant="secondary" className={holdButtonClasses}>
                            <Icon name="pause" className="h-4 w-4 mr-1" />
                            Hold
                        </Button>
                        <Button onClick={() => onProjectTimerAction(project.id, 'end')} variant="primary" className={endButtonClasses}>
                            <Icon name="stop-circle" className="h-4 w-4 mr-1" />
                            End
                        </Button>
                    </>
                ) : (
                    <Button onClick={() => onProjectTimerAction(project.id, (project.usedHours || 0) > 0 && project.status === ProjectStatus.Started ? 'resume' : 'start')} variant="primary" className={startButtonClasses}>
                         <Icon name="play" className="h-4 w-4 mr-1" />
                        {(project.usedHours || 0) > 0 && project.status === ProjectStatus.Started ? 'Resume' : 'Start'}
                    </Button>
                )}
            </div>
        </div>
    );
};

const SubProjectsCard: React.FC<{ 
    subProjects: Project[]; 
    allProjects: Project[]; 
    allTasks: Task[]; 
    membersById: Record<string, TeamMember>;
    onAddSubProject: () => void;
    onUpdateProject: (projectId: string, updates: Partial<Omit<Project, 'id'>>) => void;
    onProjectTimerAction: (projectId: string, action: 'start' | 'end' | 'hold' | 'resume') => void;
    onNavigateToRisksForProject: (projectId: string) => void;
    currentUser: TeamMember;
    onOpenCompleteProjectModal: (project: Project, subProjectId?: string) => void;
    onOpenNotSatisfiedModal: (project: Project) => void;
    onOpenCompletedBlockedModal: (project: Project) => void;
    onOpenSelectToolsModal: (project: Project, newStatus: ProjectStatus) => void;
}> = ({ subProjects, allProjects, allTasks, membersById, onAddSubProject, onUpdateProject, onProjectTimerAction, onNavigateToRisksForProject, currentUser, onOpenCompleteProjectModal, onOpenNotSatisfiedModal, onOpenCompletedBlockedModal, onOpenSelectToolsModal }) => {
    
    const subProjectsWithData = useMemo(() => {
        const progressCache = new Map<string, number>();
        return subProjects.map(sp => {
            const progress = calculateProjectProgress(sp, allProjects, allTasks, progressCache);
            const staffOnProject = Array.from(
                new Set(allTasks.filter(t => t.projectId === sp.id && t.assigneeId).map(t => t.assigneeId))
            ).map(id => membersById[id! as unknown as string]).filter((member): member is TeamMember => !!member);

            const relevantTasks = allTasks.filter(t => t.projectId === sp.id);
            const openIssues = relevantTasks.filter(t => t.type === 'issue' && t.status !== TaskStatus.Completed).length;
            const openRisks = relevantTasks.filter(t => t.type === 'risk' && t.status !== TaskStatus.Completed).length;

            return { ...sp, progress, staff: staffOnProject, openIssues, openRisks };
        });
    }, [subProjects, allProjects, allTasks, membersById]);

    const handleStatusChange = (project: Project, newStatus: ProjectStatus) => {
        if (newStatus === project.status) return;

        if (newStatus === ProjectStatus.UserTesting) {
            const parentId = project.parentId;
            if (parentId) {
                const siblings = allProjects.filter(p => p.parentId === parentId);
                const otherIncompleteSiblings = siblings.filter(s => s.id !== project.id && s.status !== ProjectStatus.Completed);

                if (otherIncompleteSiblings.length === 0) {
                    onOpenSelectToolsModal(project, newStatus);
                } else {
                    onUpdateProject(project.id, { status: newStatus });
                }
            } else {
                onUpdateProject(project.id, { status: newStatus });
            }
            return;
        }

        if (newStatus === ProjectStatus.Completed) {
            const parentProject = allProjects.find(p => p.id === project.parentId);
            if (!parentProject) {
                onUpdateProject(project.id, { status: newStatus });
                return;
            }

            const siblings = allProjects.filter(p => p.parentId === project.parentId);
            const otherIncompleteSiblings = siblings.filter(s => s.id !== project.id && s.status !== ProjectStatus.Completed);

            if (otherIncompleteSiblings.length === 0) {
                onOpenCompleteProjectModal(parentProject, project.id);
            } else {
                onUpdateProject(project.id, { status: newStatus });
            }
            return;
        }

        switch (newStatus) {
            case ProjectStatus.Blocked:
                const hasActiveRisk = allTasks.some(t => 
                    t.projectId === project.id && 
                    t.type === 'risk' && 
                    t.status !== TaskStatus.Completed
                );
                if (!hasActiveRisk) {
                    alert('A project can only be blocked if there is an active "BLOCKED" item (a risk) associated with it. Please create one first.');
                    return;
                }
                onUpdateProject(project.id, { status: newStatus });
                break;
            case ProjectStatus.CompletedNotSatisfied:
                onOpenNotSatisfiedModal(project);
                break;
            case ProjectStatus.CompletedBlocked:
                onOpenCompletedBlockedModal(project);
                break;
            default:
                onUpdateProject(project.id, { status: newStatus });
                break;
        }
    };
    
    return (
        <Card>
            <div className="p-6">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg text-light-text-primary dark:text-dark-text-primary">Sub-Projects</h3>
                    <Button onClick={onAddSubProject} variant="secondary" className="!text-xs !px-2.5 !py-1.5">
                        <Icon name="plus" className="h-3 w-3 mr-1.5" />
                        Add Sub-Project
                    </Button>
                </div>
            </div>
            {subProjects.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-light-bg/50 dark:bg-dark-bg/30">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary w-[30%]">Project</th>
                                <th className="px-6 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-center w-[12%]">Phase</th>
                                <th className="px-6 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-center w-[12%]">Status</th>
                                <th className="px-6 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-center w-[15%]">Progress</th>
                                <th className="px-6 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-center w-[15%]">Issues / Blockers</th>
                                <th className="px-6 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-center w-[16%]">Timer</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subProjectsWithData.map(sp => {
                                const canManageAsAdmin = isAdmin(currentUser.role);
                                const canManageAsLead = currentUser.id === sp.leadId;
                                const canManageThisProject = canManageAsAdmin || canManageAsLead;

                                const allowedStatuses = Object.values(ProjectStatus).filter(status => {
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
                                });

                                return (
                                <tr key={sp.id} className="border-t border-light-border dark:border-dark-border">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">{sp.name}</p>
                                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Weight: {sp.weight}%</p>
                                        <div className="flex -space-x-2 mt-2">
                                            {sp.staff.slice(0, 5).map(member => (
                                                <img
                                                    key={member.id}
                                                    src={member.avatarUrl}
                                                    alt={member.name}
                                                    title={member.name}
                                                    className="h-6 w-6 rounded-full ring-2 ring-light-card dark:ring-dark-card"
                                                />
                                            ))}
                                            {sp.staff.length > 5 && (
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 ring-2 ring-light-card dark:ring-dark-card">
                                                    +{sp.staff.length - 5}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <select
                                            value={sp.phase}
                                            onChange={(e) => onUpdateProject(sp.id, { phase: e.target.value })}
                                            disabled={sp.status === ProjectStatus.Completed}
                                            className="w-full text-xs bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border focus:ring-brand-primary focus:border-brand-primary rounded p-1"
                                        >
                                            {projectPhaseOptions.map(phase => (
                                            <option key={phase.value} value={phase.value} title={phase.description}>
                                                {phase.label}
                                            </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <div className="w-36 mx-auto">
                                            <ProjectStatusIndicator 
                                                status={sp.status} 
                                                onChange={(newStatus) => handleStatusChange(sp, newStatus)}
                                                disabled={!canManageThisProject}
                                                allowedStatuses={allowedStatuses}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <div className="flex items-center gap-2">
                                            <div className="w-full bg-light-border dark:bg-dark-border rounded-full h-1.5">
                                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${sp.progress}%` }}></div>
                                            </div>
                                            <span className="font-semibold text-light-text-primary dark:text-dark-text-primary w-8 text-right">{sp.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-middle text-center">
                                        <div className="flex flex-col items-center gap-1.5">
                                            {sp.openIssues > 0 ? (
                                                <a onClick={() => onNavigateToRisksForProject(sp.id)} className="flex items-center gap-1.5 text-red-500 hover:underline cursor-pointer text-xs">
                                                    <Icon name="alert-triangle" className="h-3.5 w-3.5" />
                                                    <span>{sp.openIssues} Issue{sp.openIssues !== 1 ? 's' : ''}</span>
                                                </a>
                                            ) : null}
                                            {sp.openRisks > 0 ? (
                                                <a onClick={() => onNavigateToRisksForProject(sp.id)} className="flex items-center gap-1.5 text-orange-500 dark:text-orange-400 hover:underline cursor-pointer text-xs">
                                                    <span className="text-sm">🚨</span>
                                                    <span className="font-semibold">{sp.openRisks} BLOCKED</span>
                                                </a>
                                            ) : null}
                                            {(sp.openIssues === 0 && sp.openRisks === 0) && (
                                                <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-middle text-center">
                                        {canManageThisProject && (
                                            <SubProjectTimer project={sp} onProjectTimerAction={onProjectTimerAction} />
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-sm text-center py-4 text-light-text-secondary dark:text-dark-text-secondary -mt-4">No sub-projects have been added yet.</p>
            )}
        </Card>
    );
};


const ProjectDetailView: React.FC<ProjectDetailViewProps> = (props) => {
    const { projectId, onBack, projects, tasks, membersById, auditLogs, onUpdateProject, onDeleteProject, onAddSubProject, onOpenEditModal, onOpenAddRiskIssueModal, currentUser, onOpenCompleteProjectModal, onOpenNotSatisfiedModal, onOpenCompletedBlockedModal, onOpenSelectToolsModal, onProjectTimerAction, onNavigateToRisksForProject } = props;
    const project = useMemo(() => projects.find(p => p.id === projectId), [projectId, projects]);
    const [tick, setTick] = useState(0);

    const isParent = useMemo(() => project ? projects.some(p => p.parentId === project.id) : false, [project, projects]);

    useEffect(() => {
        let interval: number | undefined;
        const shouldTick = project && (project.timerStartTime || (isParent && projects.some(p => p.parentId === project.id && !!p.timerStartTime)));
        if (shouldTick) {
            interval = window.setInterval(() => {
                setTick(t => t + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [project, projects, isParent]);
    
    const stats = useMemo(() => {
        if (!project) return null;
        
        const progressCache = new Map<string, number>();
        const progress = calculateProjectProgress(project, projects, tasks, progressCache);

        const children = projects.filter(p => p.parentId === project.id);
        const isParent = children.length > 0;
        
        let currentSessionElapsedMs = 0;
        const parseLocal = (s: string) => new Date((s.includes('T') ? s : s.replace(' ', 'T'))).getTime();
        if (!isParent && project.timerStartTime) {
            const startMs = parseLocal(project.timerStartTime as string);
            currentSessionElapsedMs = Math.max(0, Date.now() - startMs);
        } else if (isParent) {
            currentSessionElapsedMs = children.reduce((total, child) => {
                if (child.timerStartTime) {
                    const startMs = parseLocal(child.timerStartTime as string);
                    return total + Math.max(0, Date.now() - startMs);
                }
                return total;
            }, 0);
        }

        const baseUsedHours = isParent
            ? children.reduce((sum, c) => sum + Math.max(0, c.usedHours || 0), 0)
            : Math.max(0, project.usedHours || 0);
        const usedHours = Math.max(0, baseUsedHours + (currentSessionElapsedMs / (1000 * 60 * 60)));
        
        const allocatedHours = isParent ? children.reduce((sum, c) => sum + c.allocatedHours, 0) : project.allocatedHours;
        
        const hoursOver = Math.max(0, usedHours - allocatedHours);
        const hoursUsagePercent = allocatedHours > 0 ? (usedHours / allocatedHours) * 100 : 0;
        
        const descendantIds = [project.id, ...children.map(c => c.id)];
        const relevantTasks = tasks.filter(t => descendantIds.includes(t.projectId));

        const isBehindOnTasks = relevantTasks.some(t => new Date(t.deadline) < new Date() && t.status !== TaskStatus.Completed);
        const issues = relevantTasks.filter(t => t.type === 'issue' && t.status !== TaskStatus.Completed);
        const risks = relevantTasks.filter(t => t.type === 'risk' && t.status !== TaskStatus.Completed);

        // New Health Status logic based on progress vs. time usage
        const calculateHealthStatus = (
            proj: Project,
            progress: number,
            timeUsagePercent: number,
            isBehindOnTasks: boolean
        ): 'Red' | 'Yellow' | 'Green' => {
            // Priority 1: Override statuses
            if (proj.status === ProjectStatus.Completed) return 'Green';
            if (proj.status === ProjectStatus.Blocked) return 'Red';
            if (proj.status === ProjectStatus.NotStarted) return 'Green';

            // Priority 2: Hours overage is always critical
            if (timeUsagePercent > 100) return 'Red';

            // Priority 3: Fallback for projects with no allocated hours (e.g., parents) or no time spent
            if (isNaN(timeUsagePercent) || timeUsagePercent === 0) {
                return isBehindOnTasks ? 'Red' : 'Green';
            }

            // Priority 4: Main logic comparing progress to time usage
            const deviation = timeUsagePercent - progress;

            if (deviation > 25) return 'Red';      // Critically behind
            if (deviation > 10) return 'Yellow';   // At risk

            // If progress is good but tasks are overdue, flag as 'At Risk'
            if (isBehindOnTasks) return 'Yellow';
            
            return 'Green'; // On track
        };

        const healthStatus = calculateHealthStatus(project, progress, hoursUsagePercent, isBehindOnTasks);

        return { progress, issues, risks, children, usedHours, allocatedHours, hoursOver, hoursUsagePercent, healthStatus };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project, projects, tasks, tick]);

    if (!project || !stats) {
        return <div className="text-center p-8">Project not found.</div>
    }

    const { progress, issues, risks, children, usedHours, allocatedHours, hoursOver, hoursUsagePercent, healthStatus } = stats;
    
    const lead = membersById[project.leadId];
    const endUser = project.endUserId ? membersById[project.endUserId] : null;

    const canManage = isAdmin(currentUser.role);
    
    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-full bg-light-card dark:bg-dark-card hover:bg-light-border dark:hover:bg-dark-border transition-colors">
                        <Icon name="arrow-left" className="h-5 w-5 text-light-text-primary dark:text-dark-text-primary" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">{project.name}</h1>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{project.code} - {project.department}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {canManage && (
                        <>
                            <Button variant="secondary" onClick={() => onOpenEditModal(project)}>
                                <Icon name="edit" className="h-4 w-4 mr-2" />
                                Edit Project
                            </Button>
                            <Button variant="secondary" onClick={onAddSubProject}>
                                <Icon name="plus" className="h-4 w-4 mr-2" />
                                Add Sub-Project
                            </Button>
                        </>
                    )}
                     <Button variant="primary" onClick={() => onOpenAddRiskIssueModal(project.id)}>
                        <Icon name="plus" className="h-4 w-4 mr-2" />
                        Add Blocked/Issue
                    </Button>
                    {canManage && (
                        <Button variant="secondary" className="!bg-red-500/10 hover:!bg-red-500/20 !text-red-500 !border-red-500/20" onClick={() => onDeleteProject(project.id)}>
                            <Icon name="trash" className="h-4 w-4 mr-2" />
                            Delete Project
                        </Button>
                    )}
                </div>
            </div>

            {hoursOver > 0 && <BudgetOverageCard project={project} hoursOver={hoursOver} onSaveReason={(reason) => onUpdateProject(project.id, { overageReason: reason })} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 lg:col-span-2 space-y-6">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <InfoPair label="Project Lead" value={lead?.name || 'N/A'} />
                        <InfoPair label="End User" value={endUser?.name || 'N/A'} />
                        <InfoPair label="Health Status" value={<HealthStatusIndicator status={healthStatus} />} />
                        <InfoPair label="Risk Level" value={<RiskLevelIndicator level={project.riskLevel} />} />
                   </div>
                   <div className="space-y-4">
                        <IssueRiskTable title="Open Issues" items={issues} />
                        <IssueRiskTable title="Open Blockers" items={risks} />
                   </div>
                   <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary pt-4 border-t border-light-border dark:border-dark-border">
                       {project.description}
                   </p>
                </Card>
                <div className="space-y-6">
                    <Card className="p-6 space-y-4">
                        <h3 className="font-semibold text-lg text-light-text-primary dark:text-dark-text-primary mb-2">Hours Summary</h3>
                        <HoursSummaryRow label="Used / Allocated" value={`${usedHours.toFixed(1)}h / ${allocatedHours.toFixed(1)}h`} progress={hoursUsagePercent} />
                        <HoursSummaryRow label="Additional Hours" value={`${project.additionalHours}h`} />
                        <EditableCommentSection project={project} onUpdateProject={onUpdateProject} currentUser={currentUser} membersById={membersById} />
                    </Card>
                   
                    {project.status === ProjectStatus.Completed && (
                        <EndUserFeedbackCard project={project} onUpdateProject={onUpdateProject} currentUser={currentUser} membersById={membersById} />
                    )}
                     {project.status === ProjectStatus.CompletedNotSatisfied && project.endUserFeedback && (
                         <Card className="p-6 bg-orange-100/50 dark:bg-orange-900/30 border border-orange-500/30">
                            <h4 className="font-semibold text-orange-700 dark:text-orange-300">Reason for Dissatisfaction</h4>
                            <p className="text-sm italic text-orange-600 dark:text-orange-400 mt-2">"{project.endUserFeedback.comments}"</p>
                         </Card>
                     )}
                </div>
            </div>

            {!isParent && <ProjectTimerCard project={project} onProjectTimerAction={onProjectTimerAction} />}
            
            <ProjectHistoryCard projectId={project.id} auditLogs={auditLogs} membersById={membersById} />

            {isParent && (
                <SubProjectsCard
                    subProjects={children}
                    allProjects={projects}
                    allTasks={tasks}
                    membersById={membersById}
                    onAddSubProject={onAddSubProject}
                    onUpdateProject={onUpdateProject}
                    onProjectTimerAction={onProjectTimerAction}
                    onNavigateToRisksForProject={onNavigateToRisksForProject}
                    currentUser={currentUser}
                    onOpenCompleteProjectModal={onOpenCompleteProjectModal}
                    onOpenNotSatisfiedModal={onOpenNotSatisfiedModal}
                    onOpenCompletedBlockedModal={onOpenCompletedBlockedModal}
                    onOpenSelectToolsModal={onOpenSelectToolsModal}
                />
            )}
        </div>
    );
};

export default ProjectDetailView;