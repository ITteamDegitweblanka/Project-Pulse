

import React, { useMemo } from 'react';
import { Project, Task, TeamMember, TaskStatus, ProjectStatus, StoreFile, ExecutiveSummary } from '../types';
import Card from './ui/Card';
import { Icon } from './ui/Icon';
import CriticalTasks from './CriticalTasks';
import { calculateProjectProgress } from '../utils/progress';

interface ExecutiveDashboardProps {
  executiveSummary: ExecutiveSummary | null;
  projects: Project[];
  tasks: Task[];
  teamMembers: TeamMember[];
  membersById: Record<string, TeamMember>;
  projectsById: Record<string, Project>;
  onSelectProject: (projectId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Omit<Task, 'id'>>) => void;
  onCompleteTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  currentUser: TeamMember;
  onOpenFile: (file: StoreFile) => void;
}

const HealthStatusIndicator: React.FC<{ status: 'Red' | 'Green' | 'Yellow' }> = ({ status }) => {
    const styles = {
        Red: {
            classes: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300',
            dot: 'bg-red-500'
        },
        Green: {
            classes: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300',
            dot: 'bg-green-500'
        },
        Yellow: {
            classes: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-400',
            dot: 'bg-yellow-500'
        }
    };
    const currentStyle = styles[status];
    return (
        <span className={`inline-flex items-center gap-2 px-2.5 py-1 text-xs font-medium rounded-full ${currentStyle.classes}`}>
            <span className={`h-2 w-2 rounded-full ${currentStyle.dot}`}></span>
            {status}
        </span>
    );
};

const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ 
    executiveSummary, 
    projects,
    tasks,
    membersById,
    projectsById,
    onSelectProject,
    onUpdateTask,
    onCompleteTask,
    onDeleteTask,
    currentUser,
    onOpenFile
 }) => {

    const { overdueTasks, dueSoonTasks, unassignedTasks } = useMemo(() => {
        const now = new Date();
        const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        const overdue = tasks.filter(t => t.status !== TaskStatus.Completed && new Date(t.deadline) < now);
        const dueSoon = tasks.filter(t => t.status !== TaskStatus.Completed && new Date(t.deadline) >= now && new Date(t.deadline) <= twentyFourHoursFromNow);
        const unassigned = tasks.filter(t => !t.assigneeId && t.status !== TaskStatus.Completed);

        return { overdueTasks: overdue, dueSoonTasks: dueSoon, unassignedTasks: unassigned };
    }, [tasks]);

    const attentionProjects = useMemo(() => {
        const progressCache = new Map<string, number>();
        return projects.map(project => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const isBehind = projectTasks.some(t => new Date(t.deadline) < new Date() && t.status !== TaskStatus.Completed);
            const isAtRisk = project.status === ProjectStatus.UserTesting || project.status === ProjectStatus.Update;
            const healthStatus: 'Red' | 'Green' | 'Yellow' = isBehind ? 'Red' : (isAtRisk ? 'Yellow' : 'Green');
            
            const progress = calculateProjectProgress(project, projects, tasks, progressCache);
            
            const milestoneDate = new Date(project.milestoneDate);
            const today = new Date();
            const diffTime = milestoneDate.getTime() - today.getTime();
            const daysToMilestone = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return { ...project, healthStatus, progress, daysToMilestone };
        })
        .filter(p => p.healthStatus === 'Red' || p.healthStatus === 'Yellow')
        .sort((a, b) => a.daysToMilestone - b.daysToMilestone);
    }, [projects, tasks]);
    
    if (!executiveSummary) {
        return <div>Loading dashboard...</div>;
    }
    
    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">Executive Dashboard</h1>
                <p className="mt-1 text-light-text-secondary dark:text-dark-text-secondary">Your 30-second snapshot of project portfolio performance</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Projects" 
                    value={
                        <div className="flex items-baseline gap-2">
                            <span>{executiveSummary.totalProjects.value.total}</span>
                            <span className="text-base font-medium text-light-text-secondary dark:text-dark-text-secondary">
                                ({executiveSummary.totalProjects.value.parent} parent, {executiveSummary.totalProjects.value.children} child)
                            </span>
                        </div>
                    } 
                    subtext={executiveSummary.totalProjects.changeText} 
                    icon="briefcase" 
                    changeColor="text-green-500" 
                />
                <StatCard title="Total Allocated Hours" value={`${executiveSummary.totalAllocatedHours.value.toLocaleString()}h`} subtext={executiveSummary.totalAllocatedHours.changeText} icon="timer" changeColor="text-green-500" />
                <StatCard title="Open Issues" value={executiveSummary.openIssues.value.toString()} subtext={executiveSummary.openIssues.changeText} icon="alert-triangle" changeColor="text-red-500" />
                <StatCard title="Team Members" value={executiveSummary.teamMembers.value.toString()} subtext={executiveSummary.teamMembers.changeText} icon="users" changeColor="text-green-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <h3 className="font-semibold text-lg text-light-text-primary dark:text-dark-text-primary mb-4 flex items-center gap-2">
                           <Icon name="trending-up" className="h-5 w-5" /> RAG Status Distribution
                        </h3>
                        <div className="space-y-4">
                            <RagStatusRow label="On Track" color="green" value={executiveSummary.ragDistribution.green} total={executiveSummary.totalProjects.value.total} />
                            <RagStatusRow label="At Risk" color="yellow" value={executiveSummary.ragDistribution.yellow} total={executiveSummary.totalProjects.value.total} />
                            <RagStatusRow label="Critical" color="red" value={executiveSummary.ragDistribution.red} total={executiveSummary.totalProjects.value.total} />
                        </div>
                    </Card>

                    <Card>
                        <div className="p-6">
                            <h3 className="font-semibold text-lg text-light-text-primary dark:text-dark-text-primary mb-4 flex items-center gap-2">
                                <Icon name="alert-triangle" className="h-5 w-5 text-red-500" /> Projects Requiring Immediate Attention
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-light-border dark:border-dark-border">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Project ID</th>
                                        <th className="px-6 py-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Project Name</th>
                                        <th className="px-6 py-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Lead</th>
                                        <th className="px-6 py-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Status</th>
                                        <th className="px-6 py-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-[15%]">Progress</th>
                                        <th className="px-6 py-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Days to Milestone</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-light-border dark:divide-dark-border">
                                    {attentionProjects.map(project => (
                                        <tr key={project.id}>
                                            <td className="px-6 py-4 text-sm font-mono text-light-text-secondary dark:text-dark-text-secondary">{project.code}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => onSelectProject(project.id)}>{project.name}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-light-text-primary dark:text-dark-text-primary">{membersById[project.leadId]?.name || 'N/A'}</td>
                                            <td className="px-6 py-4"><HealthStatusIndicator status={project.healthStatus} /></td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-full bg-light-border dark:bg-dark-input rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{width: `${project.progress}%`}}></div></div>
                                                    <span className="text-sm font-medium">{project.progress}%</span>
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 text-sm font-medium ${project.daysToMilestone < 5 ? 'text-red-500' : ''}`}>
                                                <div className="flex items-center gap-1.5">
                                                  <Icon name="timer" className="h-4 w-4" />
                                                  {project.daysToMilestone} days
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card className="p-6">
                         <h3 className="font-semibold text-lg text-light-text-primary dark:text-dark-text-primary mb-4 flex items-center gap-2">
                           <Icon name="trend-line" className="h-5 w-5" /> Key Trends
                        </h3>
                        <div className="space-y-3">
                            <KeyTrendRow label="Projects Delivered On Time" value={`${executiveSummary.keyTrends.onTimeDeliveryPercent}%`} color="green" />
                            <KeyTrendRow label="Hours Utilization" value={`${executiveSummary.keyTrends.hoursUtilizationPercent}%`} color="yellow" />
                            <KeyTrendRow label="Issue Resolution Time" value={`${executiveSummary.keyTrends.issueResolutionTimeDays} days`} color="red" />
                        </div>
                    </Card>
                </div>
            </div>

            <div className="pt-6">
                <CriticalTasks
                    overdueTasks={overdueTasks}
                    dueSoonTasks={dueSoonTasks}
                    unassignedTasks={unassignedTasks}
                    membersById={membersById}
                    projectsById={projectsById}
                    onUpdateTask={onUpdateTask}
                    onCompleteTask={onCompleteTask}
                    onDeleteTask={onDeleteTask}
                    currentUser={currentUser}
                    onOpenFile={onOpenFile}
                />
            </div>
        </div>
    );
};


const StatCard: React.FC<{title:string; value:React.ReactNode; subtext:string; icon:keyof typeof Icon.library; changeColor: string;}> = ({title, value, subtext, icon, changeColor}) => (
    <Card className="p-5">
        <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">{title}</h3>
            <Icon name={icon} className="h-5 w-5 text-light-text-secondary dark:text-dark-text-secondary" />
        </div>
        <div className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mt-2">{value}</div>
        <p className={`text-sm font-semibold mt-1 ${changeColor}`}>{subtext}</p>
    </Card>
);

const RagStatusRow: React.FC<{label:string; color:'green' | 'yellow' | 'red'; value: number; total: number}> = ({ label, color, value, total }) => {
    const colors = {
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        red: 'bg-red-500'
    };
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between items-center text-sm mb-1.5">
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${colors[color]}`}></span>
                    <span className="text-light-text-primary dark:text-dark-text-primary">{label}</span>
                </div>
                <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">{value}</span>
            </div>
            <div className="w-full bg-light-border dark:bg-dark-border rounded-full h-2">
                <div className={`${colors[color]} h-2 rounded-full`} style={{width: `${percentage}%`}}></div>
            </div>
        </div>
    );
};

const KeyTrendRow: React.FC<{label: string; value: string; color: 'green' | 'yellow' | 'red'}> = ({ label, value, color }) => {
     const colors = {
        green: 'bg-green-100/50 dark:bg-green-900/30 text-green-800 dark:text-green-300',
        yellow: 'bg-yellow-100/50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
        red: 'bg-red-100/50 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    };
    return (
        <div className={`p-3 rounded-lg flex justify-between items-center ${colors[color]}`}>
            <span className="font-medium text-sm">{label}</span>
            <div className="flex items-center gap-2 font-bold text-sm">
                <Icon name="trending-up" className="h-4 w-4" />
                <span>{value}</span>
            </div>
        </div>
    );
};

export default ExecutiveDashboard;