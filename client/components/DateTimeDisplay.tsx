import React, { useState, useEffect } from 'react';
import { Icon } from './ui/Icon';

const DateTimeDisplay: React.FC = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000); // Update every second

    return () => {
      clearInterval(timer); // Cleanup interval on component unmount
    };
  }, []);

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  };

  return (
    <div className="flex items-center gap-4 text-light-text-secondary dark:text-dark-text-secondary text-sm font-medium">
        <div className="flex items-center gap-2">
            <Icon name="calendar" className="h-5 w-5" />
            <span>{currentDateTime.toLocaleDateString(undefined, dateOptions)}</span>
        </div>
        <div className="w-px h-5 bg-light-border dark:bg-dark-border"></div>
        <div className="flex items-center gap-2">
            <Icon name="timer" className="h-5 w-5" />
            <span>{currentDateTime.toLocaleTimeString(undefined, timeOptions)}</span>
        </div>
    </div>
  );
};

export default DateTimeDisplay;
