
import React, { useState, useMemo } from 'react';
import { AuditLog, TeamMember } from '../types';
import Card from './ui/Card';
import { Icon } from './ui/Icon';

interface AuditLogViewProps {
  logs: AuditLog[];
  teamMembers: TeamMember[];
}

const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, teamMembers }) => {
  const [filterUserId, setFilterUserId] = useState('all');

  const filteredLogs = useMemo(() => {
    if (filterUserId === 'all') {
      return logs;
    }
    return logs.filter(log => log.userId === filterUserId);
  }, [logs, filterUserId]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">Audit Log</h1>
        <div className="relative">
          <select
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
            className="appearance-none w-full sm:w-56 bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border rounded-md pl-3 pr-10 py-2 text-sm text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            aria-label="Filter by user"
          >
            <option value="all">All Users</option>
            {teamMembers.map(member => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-light-text-secondary dark:text-dark-text-secondary">
            <Icon name="chevron-down" className="h-4 w-4" />
          </div>
        </div>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-light-border dark:divide-dark-border">
            <thead className="bg-light-bg dark:bg-dark-bg/30">
              <tr>
                <th scope="col" className="w-1/4 px-6 py-3 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">
                  Timestamp
                </th>
                <th scope="col" className="w-1/4 px-6 py-3 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">
                  User
                </th>
                <th scope="col" className="w-1/2 px-6 py-3 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-light-bg/50 dark:hover:bg-dark-bg/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                    {log.userName}
                  </td>
                  <td className="px-6 py-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">{log.action}</span>: {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="text-center py-20 text-light-text-secondary dark:text-dark-text-secondary">
              <Icon name="activity" className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No log entries found for the selected filter.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AuditLogView;
