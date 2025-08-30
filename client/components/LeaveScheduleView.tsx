


import React, { useMemo } from 'react';
import { Leave, TeamMember, Role } from '../types';
import Card from './ui/Card';
import { Icon } from './ui/Icon';
import Button from './ui/Button';

interface LeaveScheduleViewProps {
  leave: Leave[];
  teamMembers: TeamMember[];
  membersById: Record<string, TeamMember>;
  onDeleteLeave: (leaveId: string) => void;
  currentUser: TeamMember;
  onAddLeaveClick: () => void;
}

const isAdmin = (role: Role) => [Role.MD, Role.Director, Role.AdminManager, Role.OperationManager, Role.SuperLeader].includes(role);

const LeaveScheduleView: React.FC<LeaveScheduleViewProps> = ({ leave, teamMembers, membersById, onDeleteLeave, currentUser, onAddLeaveClick }) => {
  const canManageLeave = isAdmin(currentUser.role);

  const sortedLeave = useMemo(() => {
    return [...leave].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [leave]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC', // Dates are stored as ISO, treat as UTC
    });
  };

  const handleDelete = (leaveEntry: Leave) => {
    const member = membersById[leaveEntry.memberId];
    if (window.confirm(`Are you sure you want to delete the leave for ${member?.name || 'this member'} from ${formatDate(leaveEntry.startDate)} to ${formatDate(leaveEntry.endDate)}?`)) {
      onDeleteLeave(leaveEntry.id);
    }
  };
  
  const getStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const todayStartUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    const startUTC = new Date(startDate).getTime();
    const endUTC = new Date(endDate).getTime();

    if (todayStartUTC >= startUTC && todayStartUTC <= endUTC) {
      return { text: 'Active', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-500/20' };
    }
    if (todayStartUTC < startUTC) {
      return { text: 'Upcoming', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/20' };
    }
    return { text: 'Past', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-500/20' };
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
          Leave Schedule
        </h1>
        {canManageLeave && (
            <Button onClick={onAddLeaveClick} variant="primary">
                <Icon name="plus" className="h-5 w-5 mr-2" />
                Add Leave
            </Button>
        )}
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-light-bg dark:bg-dark-bg/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Team Member</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary text-center">Status</th>
                {canManageLeave && <th className="px-6 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border dark:divide-dark-border">
              {sortedLeave.map(leaveEntry => {
                const member = membersById[leaveEntry.memberId];
                if (!member) return null;
                
                const status = getStatus(leaveEntry.startDate, leaveEntry.endDate);

                return (
                  <tr key={leaveEntry.id} className="hover:bg-light-bg/50 dark:hover:bg-dark-bg/50 transition-colors duration-150 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-full" />
                        <span className="font-medium text-light-text-primary dark:text-dark-text-primary">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">{formatDate(leaveEntry.startDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">{formatDate(leaveEntry.endDate)}</td>
                    <td className="px-6 py-4 text-light-text-secondary dark:text-dark-text-secondary">{leaveEntry.reason || <span className="italic opacity-60">Not provided</span>}</td>
                    <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${status.bg} ${status.color}`}>
                            {status.text}
                        </span>
                    </td>
                    {canManageLeave && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(leaveEntry)}
                          className="p-1 rounded-full text-light-text-secondary dark:text-dark-text-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-400"
                          aria-label="Delete leave entry"
                        >
                          <Icon name="trash" className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sortedLeave.length === 0 && (
             <div className="text-center py-20 text-light-text-secondary dark:text-dark-text-secondary">
                <Icon name="calendar" className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No leave entries have been scheduled.</p>
             </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LeaveScheduleView;