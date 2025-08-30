
import React, { useState, useMemo } from 'react';
import { Task, TeamMember, TaskStatus } from '../types';
import Card from './ui/Card';
import StaffFilter from './StaffFilter';
import PerformanceChart from './PerformanceChart';
import { Icon } from './ui/Icon';

interface PerformanceViewProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  currentUser: TeamMember;
}

const PerformanceView: React.FC<PerformanceViewProps> = ({ tasks, teamMembers, currentUser }) => {
  const [staffFilterId, setStaffFilterId] = useState('all');

  const performanceData = useMemo(() => {
    const completedTasks = tasks.filter(t => 
        t.status === TaskStatus.Completed && 
        t.completedAt &&
        t.timeSpent !== undefined && 
        t.timeSaved !== undefined
    );

    const filteredTasks = staffFilterId === 'all' 
      ? completedTasks 
      : completedTasks.filter(t => t.assigneeId === staffFilterId);

    const getWeekStartDate = (dateString: string): string => {
      const date = new Date(dateString);
      const day = date.getUTCDay();
      const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust to make Monday the first day
      const monday = new Date(date.setUTCDate(diff));
      monday.setUTCHours(0, 0, 0, 0);
      return monday.toISOString().split('T')[0];
    };
    
    const weeklyData = filteredTasks.reduce((acc, task) => {
      if (!task.completedAt) return acc;
      const weekStart = getWeekStartDate(task.completedAt);
      if (!acc[weekStart]) {
        acc[weekStart] = { timeSpent: 0, timeSaved: 0 };
      }
      acc[weekStart].timeSpent += task.timeSpent!;
      acc[weekStart].timeSaved += task.timeSaved!;
      return acc;
    }, {} as Record<string, { timeSpent: number, timeSaved: number }>);

    const sortedWeeks = Object.keys(weeklyData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    const chartData = sortedWeeks.map(week => ({
      week,
      timeSpent: weeklyData[week].timeSpent,
      timeSaved: weeklyData[week].timeSaved,
    }));

    const totalSpent = filteredTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0);
    const totalSaved = filteredTasks.reduce((sum, t) => sum + (t.timeSaved || 0), 0);
    const efficiencyRatio = totalSpent > 0 ? (totalSaved / totalSpent) * 100 : 0;
    
    return { chartData, totalSpent, totalSaved, efficiencyRatio };
  }, [tasks, staffFilterId]);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">Performance Report</h1>
        <StaffFilter
          teamMembers={teamMembers}
          selectedId={staffFilterId}
          onChange={setStaffFilterId}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6">
            <h3 className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Total Time Spent</h3>
            <p className="mt-1 text-3xl font-semibold text-light-text-primary dark:text-dark-text-primary">{performanceData.totalSpent.toFixed(1)}h</p>
        </Card>
        <Card className="p-6">
            <h3 className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Total Time Saved</h3>
            <p className="mt-1 text-3xl font-semibold text-green-600 dark:text-green-400">{performanceData.totalSaved.toFixed(1)}h</p>
        </Card>
        <Card className="p-6">
            <h3 className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Efficiency Ratio</h3>
            <p className={`mt-1 text-3xl font-semibold ${performanceData.efficiencyRatio >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                {performanceData.efficiencyRatio.toFixed(1)}%
            </p>
        </Card>
      </div>

      <Card>
        <div className="p-6">
            <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">Weekly Performance</h2>
            {performanceData.chartData.length > 0 ? (
                 <PerformanceChart data={performanceData.chartData} />
            ) : (
                <div className="text-center py-20 text-light-text-secondary dark:text-dark-text-secondary">
                    <Icon name="trending-up" className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No completed tasks with time entries for the selected filter.</p>
                </div>
            )}
        </div>
      </Card>

    </div>
  );
};

export default PerformanceView;