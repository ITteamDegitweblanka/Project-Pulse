import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project, Team, TeamMember, ProjectUser, ProjectFrequency } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { Icon } from './ui/Icon';

interface LogSavedTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onSave: (logs: { projectId: string, savedHours: number }[]) => void;
  teamMembers: TeamMember[];
  teams: Team[];
  onUpdateProject: (projectId: string, updates: Partial<Omit<Project, 'id'>>) => void;
}

const getFrequencyDisplay = (project: Project) => {
    if (!project.frequency) return '-';
    let detail = '';
    if (project.frequencyDetail) {
        switch(project.frequency) {
            case ProjectFrequency.Weekly:
            case ProjectFrequency.Monthly:
            case ProjectFrequency.ThreeWeeksOnce:
                detail = `(${project.frequencyDetail})`;
                break;
            case ProjectFrequency.TwiceAMonth:
                detail = `(on the ${project.frequencyDetail.replace(',', ' & ')}th)`;
                break;
            case ProjectFrequency.SpecificDates:
                 try {
                    const dates = JSON.parse(project.frequencyDetail);
                    if (Array.isArray(dates) && dates.length > 0) {
                        detail = `(${dates.length} dates)`;
                    }
                } catch { /* ignore */ }
                break;
        }
    }
    return `${project.frequency} ${detail}`;
};

const EditableUserCell: React.FC<{ 
    project: Project;
    teamMembers: TeamMember[];
    teams: Team[];
    onUpdateProject: (projectId: string, updates: Partial<Omit<Project, 'id'>>) => void;
}> = ({ project, teamMembers, teams, onUpdateProject }) => {
    const [isEditing, setIsEditing] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsEditing(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedUsers = useMemo(() => project.users || [], [project.users]);

    const handleSelectionChange = (type: 'user' | 'team', id: string) => {
        const isSelected = selectedUsers.some(u => u.type === type && u.id === id);
        let newSelection: ProjectUser[];
        if (isSelected) {
            newSelection = selectedUsers.filter(u => !(u.type === type && u.id === id));
        } else {
            newSelection = [...selectedUsers, { type, id }];
        }
        onUpdateProject(project.id, { users: newSelection });
    };

    const displayNames = selectedUsers.map(u => {
        if (u.type === 'user') {
            return teamMembers.find(tm => tm.id === u.id)?.name;
        }
        return `[T] ${teams.find(t => t.id === u.id)?.name}`;
    }).filter(Boolean).join(', ');

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full text-left p-1 rounded-md hover:bg-light-border dark:hover:bg-dark-border transition-colors text-xs text-light-text-primary dark:text-dark-text-primary"
            >
                {displayNames || <span className="italic text-light-text-secondary dark:text-dark-text-secondary">Unassigned</span>}
            </button>
            {isEditing && (
                <div className="absolute z-10 mt-1 w-72 bg-light-card dark:bg-dark-card rounded-md shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-dark-border">
                    <div className="p-2 text-xs font-semibold border-b border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary">Assign Users & Teams</div>
                    <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                        <p className="text-xs font-bold text-light-text-secondary dark:text-dark-text-secondary">Teams</p>
                        {teams.map(team => (
                             <label key={`team-${team.id}`} className="flex items-center gap-2 p-1 rounded hover:bg-light-border dark:hover:bg-dark-border cursor-pointer">
                                <input type="checkbox" checked={selectedUsers.some(u => u.type === 'team' && u.id === team.id)} onChange={() => handleSelectionChange('team', team.id)} className="h-4 w-4 rounded text-brand-primary focus:ring-brand-secondary" />
                                <span className="text-sm">{team.name}</span>
                            </label>
                        ))}
                         <p className="text-xs font-bold text-light-text-secondary dark:text-dark-text-secondary pt-2 border-t border-light-border dark:border-dark-border">Users</p>
                        {teamMembers.map(member => (
                            <label key={`user-${member.id}`} className="flex items-center gap-2 p-1 rounded hover:bg-light-border dark:hover:bg-dark-border cursor-pointer">
                                <input type="checkbox" checked={selectedUsers.some(u => u.type === 'user' && u.id === member.id)} onChange={() => handleSelectionChange('user', member.id)} className="h-4 w-4 rounded text-brand-primary focus:ring-brand-secondary" />
                                <img src={member.avatarUrl} alt={member.name} className="h-6 w-6 rounded-full" />
                                <span className="text-sm">{member.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const LogSavedTimeModal: React.FC<LogSavedTimeModalProps> = ({ isOpen, onClose, projects, onSave, teamMembers, teams, onUpdateProject }) => {
  const [logs, setLogs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setLogs({});
    }
  }, [isOpen]);

  const handleLogChange = (projectId: string, value: string) => {
    setLogs(prev => ({ ...prev, [projectId]: value }));
  };

  const handleSubmit = () => {
    const finalLogs = Object.entries(logs)
      .map(([projectId, savedHoursStr]) => ({
        projectId,
        savedHours: parseFloat(savedHoursStr)
      }))
      .filter(log => !isNaN(log.savedHours));

    if (finalLogs.length > 0) {
      onSave(finalLogs);
    }
    onClose();
  };
  
  const getLastLoggedDate = (project: Project) => {
    if (!project.lastUsedBy || project.lastUsedBy.length === 0) return 'Never';
    const lastLog = [...project.lastUsedBy].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    return new Date(lastLog.date).toLocaleDateString();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Saved Time for Completed Projects">
      {projects.length > 0 ? (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-5 gap-4 px-2 py-1 text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary">
                <div className="col-span-1">Project</div>
                <div className="col-span-1">Beneficiaries</div>
                <div className="col-span-1">Frequency</div>
                <div className="col-span-1">Last Logged</div>
                <div className="col-span-1">Saved Hours</div>
            </div>
          {projects.map(project => (
            <div key={project.id} className="grid grid-cols-5 gap-4 items-center p-2 bg-light-bg dark:bg-dark-bg/50 rounded-md">
              <div className="col-span-1">
                <p className="font-medium text-light-text-primary dark:text-dark-text-primary text-sm">{project.name}</p>
              </div>
               <div className="col-span-1">
                 <EditableUserCell
                    project={project}
                    teamMembers={teamMembers}
                    teams={teams}
                    onUpdateProject={onUpdateProject}
                 />
               </div>
              <div className="col-span-1">
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                  {getFrequencyDisplay(project)}
                </p>
              </div>
              <div className="col-span-1">
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                  {getLastLoggedDate(project)}
                </p>
              </div>
              <div>
                <label htmlFor={`saved-hours-${project.id}`} className="sr-only">Saved Hours</label>
                <input
                  type="number"
                  id={`saved-hours-${project.id}`}
                  value={logs[project.id] || ''}
                  onChange={(e) => handleLogChange(project.id, e.target.value)}
                  className="w-full rounded-md bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2"
                  placeholder="Hours"
                  step="0.1"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
          No projects are currently due for a time-saving entry.
        </p>
      )}

      <div className="pt-6 flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant="primary" onClick={handleSubmit} disabled={Object.keys(logs).length === 0 || projects.length === 0}>
          Save Logs
        </Button>
      </div>
    </Modal>
  );
};

export default LogSavedTimeModal;