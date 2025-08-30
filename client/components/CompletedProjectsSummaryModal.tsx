
import React from 'react';
import { Project, Team, TeamMember } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface CompletedProjectsSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  teams: Team[];
  teamMembers: TeamMember[];
}

const CompletedProjectsSummaryModal: React.FC<CompletedProjectsSummaryModalProps> = ({ isOpen, onClose, projects, teams, teamMembers }) => {
  if (!isOpen) return null;

  const getBeneficiaryNames = (projectUsers: Project['users']) => {
    if (!projectUsers || projectUsers.length === 0) return 'N/A';
    return projectUsers.map(u => {
      if (u.type === 'user') {
        return teamMembers.find(m => m.id === u.id)?.name;
      }
      return `[T] ${teams.find(t => t.id === u.id)?.name}`;
    }).filter(Boolean).join(', ');
  };

  const getLastUsageInfo = (project: Project) => {
    if (!project.lastUsedBy || project.lastUsedBy.length === 0) {
      return {
        user: 'N/A',
        date: 'Never',
        savedTime: '-',
      };
    }
    const lastLog = [...project.lastUsedBy].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const user = teamMembers.find(m => m.id === lastLog.userId)?.name || 'Unknown';
    const date = new Date(lastLog.date).toLocaleDateString();
    const savedTime = lastLog.savedHours !== undefined ? `${lastLog.savedHours.toFixed(1)}h` : '-';
    
    return { user, date, savedTime };
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Completed Projects (Last 3 Months)" size="7xl">
      <div className="max-h-[70vh] overflow-y-auto pr-2">
        <table className="w-full text-sm text-left table-fixed">
          <thead className="bg-light-bg/50 dark:bg-dark-bg/30 sticky top-0">
            <tr>
              <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary w-[25%]">Project Name</th>
              <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary w-[25%]">Beneficiaries</th>
              <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary w-[12%]">Last Used By</th>
              <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary w-[12%]">Last Used Date</th>
              <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary w-[13%]">Last Saved Time</th>
              <th className="px-4 py-3 font-semibold text-light-text-secondary dark:text-dark-text-secondary w-[13%]">Total Saved (h)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-border dark:divide-dark-border">
            {projects.sort((a,b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()).map(project => {
              const lastUsage = getLastUsageInfo(project);
              return (
              <tr key={project.id} className="hover:bg-light-bg/50 dark:hover:bg-dark-bg/50 transition-colors">
                <td className="px-4 py-3 font-medium text-light-text-primary dark:text-dark-text-primary align-top truncate" title={project.name}>{project.name}</td>
                <td className="px-4 py-3 text-xs text-light-text-secondary dark:text-dark-text-secondary align-top truncate" title={getBeneficiaryNames(project.users)}>{getBeneficiaryNames(project.users)}</td>
                <td className="px-4 py-3 text-center text-xs text-light-text-secondary dark:text-dark-text-secondary align-top">{lastUsage.user}</td>
                <td className="px-4 py-3 text-center text-xs text-light-text-secondary dark:text-dark-text-secondary align-top">{lastUsage.date}</td>
                <td className={`px-4 py-3 text-center text-xs font-semibold align-top ${lastUsage.savedTime !== '-' ? 'text-green-600 dark:text-green-400' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>{lastUsage.savedTime}</td>
                <td className={`px-4 py-3 text-center font-semibold ${(project.savedHours || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                  {(project.savedHours || 0).toFixed(1)}
                </td>
              </tr>
              )
            })}
             {projects.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center py-10 text-light-text-secondary dark:text-dark-text-secondary">
                        No projects completed in the last 3 months.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pt-6 flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default CompletedProjectsSummaryModal;
