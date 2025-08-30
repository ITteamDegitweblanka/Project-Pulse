import React, { useMemo, useState } from 'react';
import { Project, Task, TeamMember, TaskStatus } from '../types';
import Card from './ui/Card';
import { Icon } from './ui/Icon';

interface StaffReportViewProps {
  teamMembers: TeamMember[];
  tasks: Task[];
  projectsById: Record<string, Project>;
}

const StaffReportView: React.FC<StaffReportViewProps> = ({ teamMembers, tasks, projectsById }) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const staffReports = useMemo(() => {
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    return teamMembers.map(member => {
        const completedTasksInRange = tasks.filter(task => {
            if (task.assigneeId !== member.id || task.status !== TaskStatus.Completed || !task.completedAt) {
                return false;
            }
            const completedDate = new Date(task.completedAt);
            return completedDate >= start && completedDate <= end;
        });

        const totalTimeSpent = completedTasksInRange.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
        const totalTimeSaved = completedTasksInRange.reduce((sum, task) => sum + (task.timeSaved || 0), 0);

        const projectsMap = new Map<string, Project>();
        tasks.forEach(task => {
            if (task.assigneeId === member.id) {
                const project = projectsById[task.projectId];
                if (project && !projectsMap.has(project.id)) {
                    projectsMap.set(project.id, project);
                }
            }
        });

        const projects = Array.from(projectsMap.values()).sort((a,b) => a.name.localeCompare(b.name));

        return {
            member,
            projects,
            totalTimeSpent,
            totalTimeSaved,
        };
    }).sort((a, b) => a.member.name.localeCompare(b.member.name));
  }, [teamMembers, tasks, projectsById, startDate, endDate]);

  return (
    <Card>
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">Staff Time & Project Report</h2>
            <div className="flex items-center gap-4">
                <div>
                    <label htmlFor="startDate" className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mr-2">From:</label>
                    <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="rounded-md bg-light-bg dark:bg-dark-input border-light-border dark:border-dark-border shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2"
                    />
                </div>
                 <div>
                    <label htmlFor="endDate" className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mr-2">To:</label>
                    <input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="rounded-md bg-light-bg dark:bg-dark-input border-light-border dark:border-dark-border shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2"
                    />
                </div>
            </div>
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="min-w-full">
            <thead className="border-y border-light-border dark:border-dark-border">
              <tr>
                <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-[20%]">Staff Member</th>
                <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-[50%]">Projects</th>
                <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-[15%]">Time Spent</th>
                <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-[15%]">Time Saved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border dark:divide-dark-border">
              {staffReports.map(report => (
                <tr key={report.member.id} className="hover:bg-light-bg/50 dark:hover:bg-dark-bg/50 transition-colors">
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center gap-3">
                        <img src={report.member.avatarUrl} alt={report.member.name} className="w-8 h-8 rounded-full" />
                        <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">{report.member.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    {report.projects.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                        {report.projects.map(p => (
                            <span key={p.id} className="px-2 py-1 text-xs font-medium rounded-full bg-light-bg dark:bg-dark-bg text-light-text-secondary dark:text-dark-text-secondary">{p.name}</span>
                        ))}
                        </div>
                    ) : (
                        <span className="text-xs italic text-light-text-secondary/70 dark:text-dark-text-secondary/70">No projects assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 align-top">
                     <span className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">{report.totalTimeSpent.toFixed(1)}h</span>
                  </td>
                  <td className="px-6 py-4 align-top">
                     <span className={`text-sm font-semibold ${report.totalTimeSaved >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        {report.totalTimeSaved.toFixed(1)}h
                     </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {staffReports.length === 0 && (
            <div className="text-center py-20 text-light-text-secondary dark:text-dark-text-secondary">
              <Icon name="users" className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No staff members found.</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default StaffReportView;
