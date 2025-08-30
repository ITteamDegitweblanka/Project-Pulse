import React, { useState, useEffect, useRef } from 'react';
import { Project, ProjectStatus } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import { Icon } from './ui/Icon';

interface ProjectTimerCardProps {
    project: Project;
    onProjectTimerAction: (projectId: string, action: 'start' | 'end' | 'hold' | 'resume') => void;
}

const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const ProjectTimerCard: React.FC<ProjectTimerCardProps> = ({ project, onProjectTimerAction }) => {
    const [tick, setTick] = useState(0);
    const startMsRef = useRef<number>(0);

    const isTimerRunning = !!project.timerStartTime;

    useEffect(() => {
        // Capture a stable start timestamp when the timer (re)starts
        if (isTimerRunning) {
            const raw = project.timerStartTime as string;
            const isoLocal = raw.includes('T') ? raw : raw.replace(' ', 'T');
            const parsed = new Date(isoLocal).getTime();
            startMsRef.current = Number.isFinite(parsed) ? parsed : Date.now();
        } else {
            startMsRef.current = 0;
        }
    }, [isTimerRunning, project.timerStartTime]);

    useEffect(() => {
        let interval: number | undefined;
        if (isTimerRunning) {
            interval = window.setInterval(() => setTick(t => t + 1), 1000);
        } else {
            setTick(0);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const elapsedMs = isTimerRunning && startMsRef.current > 0 ? Math.max(0, Date.now() - startMsRef.current) : 0;
    const baseUsedHours = Math.max(0, project.usedHours || 0);
    const totalUsedMs = baseUsedHours * 3600 * 1000 + elapsedMs;
    const isCompleted = [
        ProjectStatus.Completed,
        ProjectStatus.CompletedBlocked,
        ProjectStatus.CompletedNotSatisfied,
    ].includes(project.status);

    const renderButtons = () => {
        if (isTimerRunning) {
            return (
                <div className="flex items-center gap-4">
                    <Button variant="secondary" onClick={() => onProjectTimerAction(project.id, 'hold')}>
                        <Icon name="pause" className="h-5 w-5 mr-2" />
                        Hold
                    </Button>
                    <Button variant="primary" className="bg-red-600 hover:bg-red-700 focus:ring-red-500" onClick={() => onProjectTimerAction(project.id, 'end')}>
                        <Icon name="stop-circle" className="h-5 w-5 mr-2" />
                        End
                    </Button>
                </div>
            );
        }
        
        // Timer is not running. Check if it's paused or not started.
        if (project.status === ProjectStatus.Started && (project.usedHours || 0) > 0) {
            // It has been worked on before, so it's paused.
             return (
                <Button variant="primary" onClick={() => onProjectTimerAction(project.id, 'resume')}>
                    <Icon name="play" className="h-5 w-5 mr-2" />
                    Resume
                </Button>
            );
        }

        // It has never been worked on.
        return (
            <Button variant="primary" onClick={() => onProjectTimerAction(project.id, 'start')}>
                <Icon name="play" className="h-5 w-5 mr-2" />
                Start
            </Button>
        );
    };

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">Project Timer</h3>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Tracked Time</p>
                </div>
                <div className={`text-4xl font-mono font-bold tracking-wider ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-light-text-primary dark:text-dark-text-primary'}`}>
                    {formatTime(totalUsedMs)}
                </div>
                <div>
                    {isCompleted ? (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                            <Icon name="check-circle" className="h-5 w-5" />
                            <span className="font-semibold text-sm">Completed</span>
                        </div>
                    ) : (
                        renderButtons()
                    )}
                </div>
            </div>
        </Card>
    );
};

export default ProjectTimerCard;