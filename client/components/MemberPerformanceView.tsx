
import React, { useMemo } from 'react';
import { MemberPerformance, Project, ProjectStatus, Task, TaskStatus, TeamMember } from '../types';
import Card from './ui/Card';
import { Icon } from './ui/Icon';

interface MemberPerformanceViewProps {
    member: TeamMember;
    performance: MemberPerformance;
    projects: Project[];
    tasks: Task[];
    membersById: Record<string, TeamMember>;
    onBack: () => void;
    onSelectProject: (projectId: string) => void;
}

const MemberPerformanceView: React.FC<MemberPerformanceViewProps> = ({ member, performance, projects, onBack, onSelectProject, tasks, membersById }) => {
    if (!member || !performance) {
        return (
            <div className="p-6 text-center text-light-text-secondary dark:text-dark-text-secondary">
                Loading member performance...
            </div>
        );
    }
    const safeProjects = Array.isArray(projects) ? projects : [];
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    
    const projectsWithData = useMemo(() => {
        return safeProjects.map(p => {
            const projectTasks = safeTasks.filter(t => t.projectId === p.id);
            const isBehind = projectTasks.some(t => new Date(t.deadline) < new Date() && t.status !== TaskStatus.Completed);
            const totalEstimatedHours = projectTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
            const timeSpent = projectTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0);
            const completion = totalEstimatedHours > 0 ? Math.round((timeSpent / totalEstimatedHours) * 100) : p.status === ProjectStatus.Completed ? 100 : 0;
            return {
                ...p,
                isBehind,
                completion,
            };
        }).sort((a,b) => (a.status === ProjectStatus.Completed ? 1 : -1) - (b.status === ProjectStatus.Completed ? 1: -1) || a.name.localeCompare(b.name));
    }, [safeProjects, safeTasks]);
    
    const totalProjectsManaged = useMemo(() => {
        const managedProjects = safeProjects.filter(p => p.leadId === member.id);
        return {
            total: managedProjects.length,
            active: managedProjects.filter(p => p.status !== ProjectStatus.Completed).length,
            completed: managedProjects.filter(p => p.status === ProjectStatus.Completed).length,
        };
    }, [safeProjects, member.id]);

    const StatCard: React.FC<{title:string; value:string; change?:number; subtext?:string; icon:keyof typeof Icon.library;}> = ({title, value, change, subtext, icon}) => (
        <Card className="p-5">
            <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">{title}</h3>
                <Icon name={icon} className="h-5 w-5 text-light-text-secondary dark:text-dark-text-secondary" />
            </div>
            <p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mt-2">{value}</p>
            {change !== undefined && (
                 <p className={`text-sm font-semibold mt-1 flex items-center gap-1 ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    <Icon name={change >= 0 ? 'trending-up' : 'arrow-left'} className={`h-4 w-4 ${change >= 0 ? '' : 'transform rotate-90'}`} />
                    {change > 0 ? '+' : ''}{change}% vs last quarter
                </p>
            )}
            {subtext && <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">{subtext}</p>}
        </Card>
    );

    const EfficiencyBar: React.FC<{label: string; value: string; percentage: number}> = ({label, value, percentage}) => (
        <div>
            <div className="flex justify-between items-center mb-1 text-sm">
                <span className="text-light-text-primary dark:text-dark-text-primary">{label}</span>
                <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">{value}</span>
            </div>
            <div className="w-full bg-light-border dark:bg-dark-border rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: `${percentage}%`}}></div>
            </div>
        </div>
    );
    
    const initials = member.name ? member.name.split(' ').map(n => n[0]).join('') : '';

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-full bg-light-card dark:bg-dark-card hover:bg-light-border dark:hover:bg-dark-border transition-colors">
                        <Icon name="arrow-left" className="h-5 w-5 text-light-text-primary dark:text-dark-text-primary" />
                    </button>
                    <div className="flex items-center gap-3">
                                                <div className="relative">
                                                        {member.avatarUrl ? (
                                                                <>
                                                                    <img src={member.avatarUrl} alt={member.name} className="w-14 h-14 rounded-full object-cover" />
                                                                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-light-bg dark:border-dark-bg bg-blue-600 text-white text-xs font-bold">
                                                                        {initials}
                                                                    </span>
                                                                </>
                                                        ) : (
                                                                <div className="w-14 h-14 rounded-full bg-light-border dark:bg-dark-border flex items-center justify-center">
                                                                    <span className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary">{initials}</span>
                                                                </div>
                                                        )}
                                                </div>
                        <div>
                            <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">{member.name}</h1>
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{member.title || ''}{member.officeLocation ? ` • ${member.officeLocation}` : ''}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {(member.certifications || []).map(cert => (
                        <span key={cert} className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-300 dark:ring-blue-500/30">
                            {cert}
                        </span>
                    ))}
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Project Success Rate" value={`${performance.projectSuccessRate.value}%`} change={performance.projectSuccessRate.change} icon="target" />
                <StatCard title="On-Time Delivery" value={`${performance.onTimeDelivery.value}%`} change={performance.onTimeDelivery.change} icon="timer" />
                <StatCard title="Stakeholder Satisfaction" value={`${performance.stakeholderSatisfaction.value}/5.0`} change={performance.stakeholderSatisfaction.change} icon="star" />
                <StatCard title="Total Projects Led" value={`${totalProjectsManaged.total}`} subtext={`${totalProjectsManaged.completed} completed, ${totalProjectsManaged.active} active`} icon="check-circle" />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Efficiency Metrics */}
                    <Card className="p-6">
                        <h3 className="font-semibold text-lg text-light-text-primary dark:text-dark-text-primary mb-4 flex items-center gap-2">
                            <Icon name="bolt" className="h-5 w-5" /> Efficiency Metrics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <EfficiencyBar label="Issue Resolution Time" value={`${performance.efficiencyMetrics.issueResolutionTimeDays} days avg`} percentage={100 - (performance.efficiencyMetrics.issueResolutionTimeDays/5)*100} />
                            <EfficiencyBar label="Resource Utilization" value={`${performance.efficiencyMetrics.resourceUtilization}%`} percentage={performance.efficiencyMetrics.resourceUtilization} />
                            <EfficiencyBar label="Change Request Efficiency" value={`${performance.efficiencyMetrics.changeRequestEfficiency}%`} percentage={performance.efficiencyMetrics.changeRequestEfficiency} />
                            <EfficiencyBar label="Risk Mitigation Score" value={`${performance.efficiencyMetrics.riskMitigationScore}%`} percentage={performance.efficiencyMetrics.riskMitigationScore} />
                        </div>
                    </Card>

                    {/* Recent Projects */}
                    <Card>
                        <div className="px-6 pt-6">
                            <h3 className="font-semibold text-lg text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
                                <Icon name="calendar" className="h-5 w-5" /> Recent Projects
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-light-border dark:border-dark-border">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Project</th>
                                        <th className="px-6 py-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Status</th>
                                        <th className="px-6 py-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-[20%]">Completion</th>
                                        <th className="px-6 py-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Client Satisfaction</th>
                                        <th className="px-6 py-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projectsWithData.map(p => (
                                        <tr key={p.id} className="border-b border-light-border dark:border-dark-border last:border-0 hover:bg-light-bg/50 dark:hover:bg-dark-bg/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-light-text-primary dark:text-dark-text-primary">{p.name}</p>
                                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{p.code}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full ${p.isBehind ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'}`}>
                                                    <span className={`h-2 w-2 rounded-full ${p.isBehind ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                                    {p.isBehind ? 'Red' : 'Green'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-full bg-light-border dark:bg-dark-input rounded-full h-2">
                                                        <div className="bg-blue-600 h-2 rounded-full" style={{width: `${p.completion}%`}}></div>
                                                    </div>
                                                    <span className="text-sm font-medium w-9 text-right">{p.completion}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 text-yellow-500">
                                                    <Icon name="star" className="h-4 w-4" />
                                                    <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">{p.endUserFeedback ? `${p.endUserFeedback.rating.toFixed(1)}/5.0` : 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => onSelectProject(p.id)} className="px-3 py-1 text-sm font-medium bg-light-bg dark:bg-dark-input border border-light-border dark:border-dark-border/50 rounded-md hover:bg-light-border dark:hover:bg-dark-border text-light-text-primary dark:text-dark-text-secondary">View Project</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
                {/* Performance Rating */}
                <div className="lg:col-span-1">
                    <Card className="p-6 text-center">
                        <h3 className="font-semibold text-lg text-light-text-primary dark:text-dark-text-primary mb-4 flex items-center justify-center gap-2">
                            <Icon name="user-check" className="h-5 w-5" /> Performance Rating
                        </h3>
                        <p className="text-6xl font-bold text-blue-600 dark:text-blue-400">{performance.overallPerformance.score}%</p>
                        <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300">
                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                            {performance.overallPerformance.rating}
                        </span>

                        <div className="mt-8 space-y-6 text-left">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Team Satisfaction</span>
                                <span className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">{performance.teamSatisfaction}/5.0</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Avg Project Duration</span>
                                <span className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">{performance.avgProjectDurationMonths}m</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MemberPerformanceView;