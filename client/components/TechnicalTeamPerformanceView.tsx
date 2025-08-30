import React, { useMemo, useState } from 'react';
import { Project, TeamMember, Team, ProjectStatus, ProjectFrequency } from '../types';
import Card from './ui/Card';
import { Icon } from './ui/Icon';
import PerformanceChart from './PerformanceChart';
import { getWeekStartDate } from '../utils/date';
import Button from './ui/Button';
import BeneficiaryDetailModal from './BeneficiaryDetailModal';

interface TechnicalTeamPerformanceViewProps {
  projects: Project[];
  teamMembers: TeamMember[];
  teams: Team[];
}

type SortableKeys = 'totalCompletedProjects' | 'returnOnTime' | 'totalTimeSpent' | 'totalTimeSaved' | 'avgHoursSaved';

interface PerformanceData {
    member: TeamMember;
    totalCompletedProjects: number;
    returnOnTime: number;
    totalTimeSpent: number;
    totalTimeSaved: number;
    avgHoursSaved: number;
    chartData: { week: string; timeSpent: number; timeSaved: number }[];
    staffBeneficiaryDetails: Map<string, { totalHoursSaved: number; projects: { id: string; name: string; savedHours: number; frequency?: ProjectFrequency; frequencyDetail?: string; }[] }>;
    teamBeneficiaryDetails: Map<string, { totalHoursSaved: number; projects: { id: string; name: string; savedHours: number; frequency?: ProjectFrequency; frequencyDetail?: string; }[] }>;
    staffBeneficiariesCount: number;
    teamBeneficiariesCount: number;
}

const TechnicalTeamPerformanceView: React.FC<TechnicalTeamPerformanceViewProps> = ({ projects, teamMembers, teams }) => {
    const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({ key: 'totalTimeSaved', direction: 'descending' });
    const [beneficiaryModalData, setBeneficiaryModalData] = useState<PerformanceData | null>(null);
    
    const technicalTeam = useMemo(() => teams.find(t => t.name === 'Technical'), [teams]);

    const performanceData: PerformanceData[] = useMemo(() => {
        if (!technicalTeam) return [];
        const technicalMembers = teamMembers.filter(m => m.teamId === technicalTeam.id);

        return technicalMembers.map(member => {
            const completedProjects = projects.filter(p =>
                p.leadId === member.id &&
                (p.status === ProjectStatus.Completed || p.status === ProjectStatus.CompletedBlocked || p.status === ProjectStatus.CompletedNotSatisfied)
            );
            
            const totalCompletedProjects = completedProjects.length;
            const totalTimeSpent = completedProjects.reduce((sum, p) => sum + (p.usedHours || 0), 0);
            const totalTimeSaved = completedProjects.reduce((sum, p) => sum + (p.savedHours || 0), 0);
            const returnOnTime = totalTimeSpent > 0 ? (totalTimeSaved / totalTimeSpent) * 100 : 0;
            const avgHoursSaved = totalCompletedProjects > 0 ? totalTimeSaved / totalCompletedProjects : 0;
            
            const weeklyData = completedProjects.reduce((acc, project) => {
              if (!project.completedAt) return acc;
              const weekStart = getWeekStartDate(project.completedAt);
              if (!acc[weekStart]) acc[weekStart] = { timeSpent: 0, timeSaved: 0 };
              acc[weekStart].timeSpent += project.usedHours || 0;
              acc[weekStart].timeSaved += project.savedHours || 0;
              return acc;
            }, {} as Record<string, { timeSpent: number; timeSaved: number }>);

            const sortedWeeks = Object.keys(weeklyData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
            const chartData = sortedWeeks.map(week => ({ week, timeSpent: weeklyData[week].timeSpent, timeSaved: weeklyData[week].timeSaved }));

            const staffBeneficiaryDetails = new Map<string, { totalHoursSaved: number; projects: any[] }>();
            const teamBeneficiaryDetails = new Map<string, { totalHoursSaved: number; projects: any[] }>();

            completedProjects.forEach(project => {
                if (project.savedHours && project.savedHours > 0 && project.users && project.users.length > 0) {
                    const hoursPerEntity = project.savedHours / project.users.length;
                    const projectInfo = {
                        id: project.id,
                        name: project.name,
                        savedHours: hoursPerEntity,
                        frequency: project.frequency,
                        frequencyDetail: project.frequencyDetail,
                    };

                    project.users.forEach(userRef => {
                        const map = userRef.type === 'user' ? staffBeneficiaryDetails : teamBeneficiaryDetails;
                        const existing = map.get(userRef.id) || { totalHoursSaved: 0, projects: [] };
                        
                        existing.totalHoursSaved += hoursPerEntity;
                        existing.projects.push(projectInfo);
                        
                        map.set(userRef.id, existing);
                    });
                }
            });


            return {
                member, totalCompletedProjects, returnOnTime, totalTimeSpent, totalTimeSaved, avgHoursSaved,
                chartData,
                staffBeneficiaryDetails,
                teamBeneficiaryDetails,
                staffBeneficiariesCount: staffBeneficiaryDetails.size,
                teamBeneficiariesCount: teamBeneficiaryDetails.size,
            };
        });
    }, [technicalTeam, teamMembers, projects]);

    const sortedPerformanceData = useMemo(() => {
        let sortableItems = [...performanceData];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue, bValue;
                if (sortConfig.key === 'memberName') {
                    aValue = a.member.name;
                    bValue = b.member.name;
                } else {
                    aValue = a[sortConfig.key as SortableKeys];
                    bValue = b[sortConfig.key as SortableKeys];
                }
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [performanceData, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    if (!technicalTeam) {
        return <Card className="p-6 text-center text-light-text-secondary dark:text-dark-text-secondary">"Technical" team not found.</Card>;
    }

    if (performanceData.length === 0) {
        return <Card className="p-6 text-center text-light-text-secondary dark:text-dark-text-secondary">No members found in the Technical Team.</Card>;
    }
    
    const handleOpenBeneficiaryModal = (data: PerformanceData) => {
        if (data.staffBeneficiariesCount > 0 || data.teamBeneficiariesCount > 0) {
            setBeneficiaryModalData(data);
        }
    };


    const renderSummaryTable = () => (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-light-bg/50 dark:bg-dark-bg/30">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary w-[20%]"><SortableHeader label="Member" sortKey="memberName" /></th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-right w-[10%]"><SortableHeader label="Completed" sortKey="totalCompletedProjects" /></th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-right w-[12%]"><SortableHeader label="Time Invested" sortKey="totalTimeSpent" /></th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-right w-[12%]"><SortableHeader label="Time Saved" sortKey="totalTimeSaved" /></th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-right w-[12%]"><SortableHeader label="Return on Time (%)" sortKey="returnOnTime" /></th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-right w-[14%]"><SortableHeader label="Avg Saved / Project" sortKey="avgHoursSaved" /></th>
                            <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary text-center w-[20%]">Beneficiaries</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-light-border dark:divide-dark-border">
                        {sortedPerformanceData.map(data => (
                            <tr key={data.member.id} className="hover:bg-light-bg/50 dark:hover:bg-dark-bg/50 transition-colors group">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <img src={data.member.avatarUrl} alt={data.member.name} className="w-8 h-8 rounded-full" />
                                        <span className="font-medium text-light-text-primary dark:text-dark-text-primary">{data.member.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 font-medium text-right">{data.totalCompletedProjects}</td>
                                <td className="px-4 py-3 text-right">{data.totalTimeSpent.toFixed(1)}h</td>
                                <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">{data.totalTimeSaved.toFixed(1)}h</td>
                                <td className={`px-4 py-3 text-right font-bold ${data.returnOnTime >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>{data.returnOnTime.toFixed(0)}%</td>
                                <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">{data.avgHoursSaved.toFixed(1)}h</td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-4">
                                        <button onClick={() => handleOpenBeneficiaryModal(data)} disabled={data.staffBeneficiariesCount === 0} className="flex items-center gap-1.5 text-xs hover:text-brand-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-current transition-colors">
                                            <Icon name="user" className="h-4 w-4"/> {data.staffBeneficiariesCount} Staff
                                        </button>
                                        <button onClick={() => handleOpenBeneficiaryModal(data)} disabled={data.teamBeneficiariesCount === 0} className="flex items-center gap-1.5 text-xs hover:text-brand-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-current transition-colors">
                                            <Icon name="users" className="h-4 w-4"/> {data.teamBeneficiariesCount} Teams
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );

    const SortableHeader: React.FC<{label: string, sortKey: string}> = ({ label, sortKey }) => (
        <button onClick={() => requestSort(sortKey)} className="flex items-center gap-1 hover:text-light-text-primary dark:hover:text-dark-text-primary w-full justify-end">
            <span>{label}</span>
            {sortConfig.key === sortKey && <Icon name={sortConfig.direction === 'ascending' ? 'chevron-up' : 'chevron-down'} className="h-4 w-4" />}
        </button>
    );

    const renderDetailedCards = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {performanceData.map(data => (
                <Card key={data.member.id} className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <img src={data.member.avatarUrl} alt={data.member.name} className="w-12 h-12 rounded-full" />
                        <div>
                            <h3 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">{data.member.name}</h3>
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{data.member.title}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center mb-4 border-y border-light-border dark:border-dark-border py-4">
                        <div>
                            <p className="text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Completed</p>
                            <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mt-1">{data.totalCompletedProjects}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Return on Time</p>
                            <p className={`text-2xl font-bold mt-1 ${data.returnOnTime >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>{data.returnOnTime.toFixed(0)}%</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Hours (Invest/Save)</p>
                            <p className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary mt-1">{data.totalTimeSpent.toFixed(1)}h / <span className="text-green-600 dark:text-green-400">{data.totalTimeSaved.toFixed(1)}h</span></p>
                        </div>
                    </div>
                    
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2 text-center">Weekly Performance</h4>
                        {data.chartData.length > 0 ? (
                            <div><PerformanceChart data={data.chartData} /></div>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-sm text-light-text-secondary dark:text-dark-text-secondary bg-light-bg dark:bg-dark-bg/50 rounded-lg">No completed project data.</div>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-light-border dark:border-dark-border">
                        <h4 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-3 text-center">Time Saved Breakdown</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h5 className="text-xs font-bold uppercase text-light-text-secondary dark:text-dark-text-secondary mb-2">For Staff</h5>
                                <ul className="space-y-2">
                                    {Array.from(data.staffBeneficiaryDetails.entries()).length > 0 ? (
                                        Array.from(data.staffBeneficiaryDetails.entries()).sort(([, a], [, b]) => b.totalHoursSaved - a.totalHoursSaved).map(([userId, details]) => {
                                            const user = teamMembers.find(tm => tm.id === userId);
                                            return user ? (
                                                <li key={userId} className="flex justify-between items-center text-xs">
                                                    <div className="flex items-center gap-1.5 truncate"><img src={user.avatarUrl} className="h-4 w-4 rounded-full"/><span className="text-light-text-primary dark:text-dark-text-primary truncate">{user.name}</span></div>
                                                    <span className="font-semibold text-green-600 dark:text-green-400">{details.totalHoursSaved.toFixed(1)}h</span>
                                                </li>
                                            ) : null;
                                        })
                                    ) : ( <li className="italic text-light-text-secondary dark:text-dark-text-secondary text-xs">None</li> )}
                                </ul>
                            </div>
                            <div>
                                <h5 className="text-xs font-bold uppercase text-light-text-secondary dark:text-dark-text-secondary mb-2">For Teams</h5>
                                <ul className="space-y-2">
                                    {Array.from(data.teamBeneficiaryDetails.entries()).length > 0 ? (
                                        Array.from(data.teamBeneficiaryDetails.entries()).sort(([, a], [, b]) => b.totalHoursSaved - a.totalHoursSaved).map(([teamId, details]) => {
                                            const team = teams.find(t => t.id === teamId);
                                            return team ? (
                                                <li key={teamId} className="flex justify-between items-center text-xs">
                                                    <div className="flex items-center gap-1.5 truncate"><Icon name="users" className="h-4 w-4"/><span className="text-light-text-primary dark:text-dark-text-primary truncate">{team.name}</span></div>
                                                    <span className="font-semibold text-green-600 dark:text-green-400">{details.totalHoursSaved.toFixed(1)}h</span>
                                                </li>
                                            ) : null;
                                        })
                                    ) : ( <li className="italic text-light-text-secondary dark:text-dark-text-secondary text-xs">None</li> )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">Team Performance Analysis</h2>
                 <div className="flex items-center gap-1 p-1 rounded-lg bg-light-bg dark:bg-dark-bg">
                    <Button onClick={() => setViewMode('summary')} variant={viewMode === 'summary' ? 'primary' : 'secondary'} className={`!px-3 !py-1 !text-xs ${viewMode === 'summary' ? '' : '!shadow-none !bg-transparent'}`}>Summary</Button>
                    <Button onClick={() => setViewMode('detailed')} variant={viewMode === 'detailed' ? 'primary' : 'secondary'} className={`!px-3 !py-1 !text-xs ${viewMode === 'detailed' ? '' : '!shadow-none !bg-transparent'}`}>Detailed</Button>
                </div>
            </div>
            {viewMode === 'summary' ? renderSummaryTable() : renderDetailedCards()}
            {beneficiaryModalData && (
                <BeneficiaryDetailModal
                    isOpen={!!beneficiaryModalData}
                    onClose={() => setBeneficiaryModalData(null)}
                    data={beneficiaryModalData}
                    allMembers={teamMembers}
                    allTeams={teams}
                />
            )}
        </div>
    );
};

export default TechnicalTeamPerformanceView;