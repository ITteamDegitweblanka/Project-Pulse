

export const getWeekBoundaries = (date: Date) => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    const day = d.getUTCDay();
    // In UTC, Sunday is 0, Monday is 1. We want Monday to be the start of the week.
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); 
    const startOfWeek = new Date(d.setUTCDate(diff));

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
    endOfWeek.setUTCHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
};

export const getLastWeekBoundaries = (date: Date) => {
    const d = new Date(date);
    d.setDate(d.getDate() - 7);
    return getWeekBoundaries(d);
};

export const getNextWeekBoundaries = (date: Date) => {
    const d = new Date(date);
    d.setDate(d.getDate() + 7);
    return getWeekBoundaries(d);
};


export const timeSince = (dateString: string): string => {
    if (!dateString) return '';
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    if (seconds < 0) return 'in the future';
    if (seconds < 5) return 'just now';

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    return `${Math.floor(seconds)}s ago`;
};

export const getWeekStartDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getUTCDay(); // Sunday = 0, Monday = 1, etc.
  // Adjust to make Monday the start of the week.
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setUTCDate(diff));
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
};
