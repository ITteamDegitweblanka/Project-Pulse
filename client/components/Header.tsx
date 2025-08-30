

import React, { useState, useRef, useEffect } from 'react';
import Button from './ui/Button';
import { Icon } from './ui/Icon';
import UserSwitcher from './UserSwitcher';
import { Role, TeamMember, Notification } from '../types';
import DateTimeDisplay from './DateTimeDisplay';
import NotificationsPanel from './NotificationsPanel';

interface HeaderProps {
  currentUser: TeamMember;
  onLogout: () => void;
  theme: string;
  onToggleTheme: () => void;
  notifications: Notification[];
  unreadNotificationCount: number;
  onNotificationClick: (notification: Notification) => void;
  onMarkAllAsRead: () => void;
  isNotificationsPanelOpen: boolean;
  onToggleNotificationsPanel: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    currentUser, 
    onLogout, 
    theme, 
    onToggleTheme, 
    notifications, 
    unreadNotificationCount, 
    onNotificationClick, 
    onMarkAllAsRead,
    isNotificationsPanelOpen,
    onToggleNotificationsPanel
}) => {
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        if(isNotificationsPanelOpen) {
            onToggleNotificationsPanel();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsPanelOpen, onToggleNotificationsPanel]);


  return (
    <header className="bg-light-card dark:bg-dark-card shadow-md sticky top-0 z-40">
      <div className="flex items-center justify-between h-20 border-b border-light-border dark:border-dark-border px-8">
        <DateTimeDisplay />
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-border dark:hover:bg-dark-border transition-colors"
            aria-label="Toggle theme"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-5 w-5" />
          </button>
          
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={onToggleNotificationsPanel}
              className="p-2 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-border dark:hover:bg-dark-border transition-colors relative"
              aria-label="Toggle notifications"
            >
              <Icon name="bell" className="h-5 w-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {unreadNotificationCount}
                </span>
              )}
            </button>
            {isNotificationsPanelOpen && (
              <NotificationsPanel
                notifications={notifications}
                onNotificationClick={onNotificationClick}
                onMarkAllAsRead={onMarkAllAsRead}
              />
            )}
          </div>
          
          <UserSwitcher currentUser={currentUser} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
};

export default Header;