import React from 'react';
import { Notification } from '../types';
import { Icon } from './ui/Icon';
import { timeSince } from '../utils/date';

interface NotificationsPanelProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllAsRead: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ notifications, onNotificationClick, onMarkAllAsRead }) => {
  return (
    <div className="absolute z-30 mt-2 w-80 sm:w-96 rounded-lg shadow-2xl bg-light-card dark:bg-dark-card ring-1 ring-light-border dark:ring-dark-border right-0 origin-top-right animate-fade-in">
      <div className="p-4 border-b border-light-border dark:border-dark-border flex justify-between items-center">
        <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">Notifications</h3>
        {notifications.some(n => !n.isRead) && (
            <button
                onClick={onMarkAllAsRead}
                className="text-xs font-semibold text-brand-primary hover:underline"
            >
                Mark all as read
            </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          <ul className="divide-y divide-light-border dark:divide-dark-border">
            {notifications.map(notification => (
              <li key={notification.id}>
                <button
                  onClick={() => onNotificationClick(notification)}
                  className="w-full text-left p-4 hover:bg-light-bg/50 dark:hover:bg-dark-bg/50 flex gap-4 items-start"
                >
                  <div className="flex-shrink-0 mt-1 relative">
                    {!notification.isRead && (
                        <span className="absolute -left-1 -top-1 block h-2.5 w-2.5 rounded-full bg-brand-primary ring-2 ring-light-card dark:ring-dark-card"></span>
                    )}
                    <div className={`p-1.5 rounded-full ${notification.isRead ? 'bg-light-border dark:bg-dark-border' : 'bg-brand-primary/10'}`}>
                        <Icon name={notification.link?.includes('project') ? 'briefcase' : 'bell'} className={`h-5 w-5 ${notification.isRead ? 'text-light-text-secondary dark:text-dark-text-secondary' : 'text-brand-primary'}`} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm text-light-text-primary dark:text-dark-text-primary ${!notification.isRead && 'font-semibold'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                        {timeSince(notification.createdAt)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12 px-4">
             <Icon name="check-circle" className="h-12 w-12 mx-auto text-green-500/50 mb-3" />
            <p className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">All caught up!</p>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">You have no new notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;