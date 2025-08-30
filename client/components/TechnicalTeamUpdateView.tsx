import React, { useState, useMemo, useEffect } from 'react';
import { Project, TeamMember, Role, Team, ProjectStatus } from '../types';
import { getWeekBoundaries, getLastWeekBoundaries, getNextWeekBoundaries } from '../utils/date';
import Card from './ui/Card';
import Dropdown from './ui/Dropdown';
import { Icon } from './ui/Icon';

interface TechnicalTeamUpdateViewProps {
  projects: Project[];
  teamMembers: TeamMember[];
  teams: Team[];
  onOpenCompletedProjectsSummaryModal: (projects: Project[]) => void;
}

const ProjectInfoLine: React.FC<{ project: Project }> = ({ project }) => {
    const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : 'N/A';

    const isCompleted = project.status === ProjectStatus.Completed || project.status === ProjectStatus.CompletedBlocked || project.status === ProjectStatus.CompletedNotSatisfied;
    const isNotStarted = project.status === ProjectStatus.NotStarted;
    
    let details = '';
    if (isNotStarted) {
        details = `Status: ${project.status}`;
    } else if (isCompleted) {
        details = `Starts: ${formatDate(project.startDate)} | End: ${formatDate(project.completedAt)} | Status: ${project.status}`;
    } else { // In progress states
        details = `Starts: ${formatDate(project.startDate)} | Last Update: ${formatDate(project.lastUpdate)} | Status: ${project.status}`;
    }

    return (
        <div className="text-xs">
            <p className="font-medium text-light-text-primary dark:text-dark-text-primary">{project.name}</p>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">{details}</p>
        </div>
    );
};

const ProjectListCell: React.FC<{projects: Project[]}> = ({ projects }) => (
    <td className="px-4 py-3 align-top">
        {projects.length > 0 ? (
            <ol className="space-y-2">
                {projects.map((p, index) => (
                    <li key={p.id} className="flex gap-2">
                        <span className="flex-shrink-0 font-medium text-xs w-7">{String(index + 1).padStart(2, '0')}.</span>
                        <ProjectInfoLine project={p} />
                    </li>
                ))}
            </ol>
        ) : (
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary italic">None</p>
        )}
    </td>
);

const StatCard: React.FC<{ label: string; value: string | number; icon: keyof typeof Icon.library; iconColor: string; }> = ({ label, value, icon, iconColor }) => (
    <div className="flex-1 p-6">
        <div className="flex items-center">
            <div className={`p-3 rounded-full mr-4 ${iconColor.replace('text-', 'bg-')}/20`}>
                <Icon name={icon} className={`h-7 w-7 ${iconColor}`} />
            </div>
            <div>
                <p className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">{label}</p>
                <p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">{value}</p>
            </div>
        </div>
    </div>
);


const TechnicalTeamUpdateView: React.FC<TechnicalTeamUpdateViewProps> = ({ projects, teamMembers, teams, onOpenCompletedProjectsSummaryModal }) => {
    const [selectedSubLeaderId, setSelectedSubLeaderId] = useState('all');
    const [selectedStaffId, setSelectedStaffId] = useState('all');
    
    const technicalTeam = useMemo(() => teams.find(t => t.name === 'Technical'), [teams]);
    const subLeaders = useMemo(() => {
        if (!technicalTeam) return [];
        return teamMembers.filter(m => m.teamId === technicalTeam.id && m.role === Role.SubTeamLeader);
    }, [teamMembers, technicalTeam]);
    
    const subLeaderOptions = useMemo(() => [
        { value: 'all', label: 'All Sub-Leaders' },
        ...subLeaders.map(sl => ({ value: sl.id, label: sl.name }))
    ], [subLeaders]);

    const staffOptions = useMemo(() => {
        if (!technicalTeam) return [{ value: 'all', label: 'All Staff' }];

        let availableStaff = teamMembers.filter(
            m => m.teamId === technicalTeam.id && m.role === Role.Staff
        );

        if (selectedSubLeaderId !== 'all') {
            availableStaff = availableStaff.filter(m => m.subTeamLeaderId === selectedSubLeaderId);
        }
        
        const options = availableStaff
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(s => ({ value: s.id, label: s.name }));
            
        return [{ value: 'all', label: 'All Staff' }, ...options];
    }, [teamMembers, technicalTeam, selectedSubLeaderId]);
    
    useEffect(() => {
        setSelectedStaffId('all');
    }, [selectedSubLeaderId]);

    const membersToDisplay = useMemo(() => {
        if (selectedStaffId !== 'all') {
            const selectedStaff = teamMembers.find(m => m.id === selectedStaffId);
            return selectedStaff ? [selectedStaff] : [];
        }

        const displayList: TeamMember[] = [];
        const sortedSubLeaders = [...subLeaders].sort((a, b) => a.name.localeCompare(b.name));

        if (selectedSubLeaderId === 'all') {
            sortedSubLeaders.forEach(sl => {
                displayList.push(sl);
                const staff = teamMembers
                    .filter(m => m.subTeamLeaderId === sl.id)
                    .sort((a, b) => a.name.localeCompare(b.name));
                displayList.push(...staff);
            });
            const unassignedStaff = teamMembers.filter(m => m.teamId === technicalTeam?.id && !m.subTeamLeaderId && m.role === Role.Staff);
            if (unassignedStaff.length > 0) {
                 displayList.push(...unassignedStaff);
            }
        } else {
            const selectedLeader = subLeaders.find(sl => sl.id === selectedSubLeaderId);
            if (selectedLeader) {
                // When a sub-leader is selected, only show their staff in the table.
                const staff = teamMembers
                    .filter(m => m.subTeamLeaderId === selectedLeader.id)
                    .sort((a, b) => a.name.localeCompare(b.name));
                displayList.push(...staff);
            }
        }
        return displayList;
    }, [selectedSubLeaderId, selectedStaffId, subLeaders, teamMembers, technicalTeam]);


    const today = new Date();
    const { startOfWeek: thisWeekStart, endOfWeek: thisWeekEnd } = getWeekBoundaries(today);
    const { startOfWeek: lastWeekStart, endOfWeek: lastWeekEnd } = getLastWeekBoundaries(today);
    const { startOfWeek: nextWeekStart, endOfWeek: nextWeekEnd } = getNextWeekBoundaries(today);

    const completedLast3Months = useMemo(() => {
        if (!technicalTeam) return [];
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const completedStatuses = [
            ProjectStatus.Completed,
            ProjectStatus.CompletedBlocked,
            ProjectStatus.CompletedNotSatisfied
        ];

        const allCompletedTechProjects = projects.filter(p => 
            p.teamId === technicalTeam.id &&
            p.completedAt && 
            new Date(p.completedAt) >= threeMonthsAgo &&
            completedStatuses.includes(p.status)
        );
        
        if (selectedStaffId !== 'all') {
            return allCompletedTechProjects.filter(p => p.leadId === selectedStaffId);
        }

        if (selectedSubLeaderId !== 'all') {
            const staffUnderLeader = teamMembers
                .filter(m => m.subTeamLeaderId === selectedSubLeaderId)
                .map(m => m.id);
            const membersToFilter = [selectedSubLeaderId, ...staffUnderLeader];
            return allCompletedTechProjects.filter(p => membersToFilter.includes(p.leadId));
        }

        return allCompletedTechProjects;

    }, [projects, technicalTeam, teamMembers, selectedSubLeaderId, selectedStaffId]);

    const summaryStats = useMemo(() => {
        const totalInvestedTime = completedLast3Months.reduce((sum, p) => sum + (p.usedHours || 0), 0);
        const totalSavedTime = completedLast3Months.reduce((sum, p) => sum + (p.savedHours || 0), 0);
        return {
            totalCompleted: completedLast3Months.length,
            totalInvestedTime,
            totalSavedTime
        };
    }, [completedLast3Months]);

    return (
        <div className="space-y-6">
            <div 
                className="bg-yellow-50 dark:bg-dark-card/50 rounded-lg shadow-md cursor-pointer hover:shadow-xl transition-shadow border border-yellow-100 dark:border-dark-border"
                onClick={() => onOpenCompletedProjectsSummaryModal(completedLast3Months)}
                role="button"
                tabIndex={0}
                aria-label="View summary of completed projects for the last 3 months"
            >
                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-yellow-200 dark:divide-dark-border">
                    <StatCard 
                        label="Completed Projects (Last 3 Months)" 
                        value={summaryStats.totalCompleted} 
                        icon="check-circle" 
                        iconColor="text-green-500"
                    />
                    <StatCard 
                        label="Time Invested" 
                        value={`${summaryStats.totalInvestedTime.toFixed(0)}h`}
                        icon="timer" 
                        iconColor="text-blue-500"
                    />
                    <StatCard 
                        label="Time Saved" 
                        value={`${summaryStats.totalSavedTime.toFixed(0)}h`}
                        icon="shield-check" 
                        iconColor="text-green-500"
                    />
                </div>
            </div>

            <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Dropdown
                        options={subLeaderOptions}
                        value={selectedSubLeaderId}
                        onChange={setSelectedSubLeaderId}
                        placeholder="Filter by Sub-Leader"
                    />
                    <Dropdown
                        options={staffOptions}
                        value={selectedStaffId}
                        onChange={setSelectedStaffId}
                        placeholder="Filter by Staff"
                    />
                </div>
            </Card>

            <Card className="overflow-x-auto">
                <table className="w-full text-left table-fixed">
                    <colgroup>
                        <col className="w-[15%]" />
                        <col className="w-[21.25%]" />
                        <col className="w-[21.25%]" />
                        <col className="w-[21.25%]" />
                        <col className="w-[21.25%]" />
                    </colgroup>
                    <thead className="bg-light-bg/50 dark:bg-dark-bg/30">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary">Name</th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary">In Progress Projects</th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary">Last Week Projects</th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary">This Week Projects</th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary">Next Week Project Plan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-light-border dark:divide-dark-border">
                        {membersToDisplay.map(member => {
                            const memberProjects = projects.filter(p => p.leadId === member.id);
                            
                            const inProgressProjects = memberProjects.filter(p => 
                                p.status === ProjectStatus.Started ||
                                p.status === ProjectStatus.UserTesting ||
                                p.status === ProjectStatus.Update ||
                                p.status === ProjectStatus.Blocked
                            );

                            const lastWeekProjects = memberProjects.filter(p => {
                                const completedDate = p.completedAt ? new Date(p.completedAt) : null;
                                return p.status === ProjectStatus.Completed && completedDate && completedDate >= lastWeekStart && completedDate <= lastWeekEnd;
                            });

                            const thisWeekProjects = memberProjects.filter(p => {
                                const startDate = new Date(p.startDate);
                                const completedDate = p.completedAt ? new Date(p.completedAt) : null;
                                const startedThisWeek = startDate >= thisWeekStart && startDate <= thisWeekEnd;
                                const completedThisWeek = completedDate && completedDate >= thisWeekStart && completedDate <= thisWeekEnd;
                                
                                const isInThisWeek = startedThisWeek || completedThisWeek;
                                const isNotNotStarted = p.status !== ProjectStatus.NotStarted;
                                
                                return isInThisWeek && isNotNotStarted;
                            });

                            const nextWeekProjects = memberProjects.filter(p => {
                                const startDate = new Date(p.startDate);
                                return startDate >= nextWeekStart && startDate <= nextWeekEnd;
                            });
                            
                            const isSubLeader = member.role === Role.SubTeamLeader;

                            return (
                                <tr key={member.id} className={`align-top ${isSubLeader ? 'bg-light-bg/50 dark:bg-dark-bg/30' : ''}`}>
                                    <td className={`px-4 py-3 font-semibold text-light-text-primary dark:text-dark-text-primary ${!isSubLeader ? 'pl-8' : ''}`}>
                                        {member.name}
                                        {!isSubLeader && <span className="ml-2 text-xs font-normal text-light-text-secondary dark:text-dark-text-secondary">({member.role})</span>}
                                    </td>
                                    <ProjectListCell projects={inProgressProjects} />
                                    <ProjectListCell projects={lastWeekProjects} />
                                    <ProjectListCell projects={thisWeekProjects} />
                                    <ProjectListCell projects={nextWeekProjects} />
                                </tr>
                            );
                        })}
                         {membersToDisplay.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-10 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                    No members to display for this selection.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default TechnicalTeamUpdateView;