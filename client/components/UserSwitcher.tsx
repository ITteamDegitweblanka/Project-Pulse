


import React, { useState, useRef, useEffect } from 'react';
import { Role, TeamMember } from '../types';
import { Icon } from './ui/Icon';

interface UserSwitcherProps {
  currentUser: TeamMember;
  onLogout: () => void;
}

const UserSwitcher: React.FC<UserSwitcherProps> = ({ currentUser, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  const roleColors: Record<string, string> = {
      [Role.MD]: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300',
      [Role.Director]: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300',
      [Role.AdminManager]: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
      [Role.OperationManager]: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
      [Role.SuperLeader]: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300',
      [Role.TeamLeader]: 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300',
      [Role.SubTeamLeader]: 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300',
      [Role.Staff]: 'bg-slate-200 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300',
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-light-card dark:bg-dark-card p-2 rounded-lg hover:bg-light-border dark:hover:bg-dark-border transition-colors w-48 text-left"
      >
        <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-8 h-8 rounded-full"/>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-light-text-primary dark:text-dark-text-primary">{currentUser.name}</p>
            <p className={`text-xs px-1.5 py-0.5 rounded-md inline-block ${roleColors[currentUser.role]}`}>{currentUser.role}</p>
        </div>
        <Icon name="chevrons-up-down" className="h-4 w-4 text-light-text-secondary dark:text-dark-text-secondary"/>
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-56 rounded-md shadow-lg bg-light-card dark:bg-dark-card ring-1 ring-light-border dark:ring-dark-border right-0">
          <div className="py-1">
            <button
              onClick={onLogout}
              className="w-full text-left px-3 py-2 text-sm flex items-center gap-3 text-red-500 dark:text-red-400 hover:bg-red-500/10"
            >
               <Icon name="log-out" className="w-5 h-5"/>
               <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSwitcher;