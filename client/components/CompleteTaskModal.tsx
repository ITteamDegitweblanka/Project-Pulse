import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { Icon } from './ui/Icon';

interface CompleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onComplete: (timeSpent: number, timeSaved: number, reference: string) => void;
}

const CompleteTaskModal: React.FC<CompleteTaskModalProps> = ({ isOpen, onClose, task, onComplete }) => {
  const [timeSpent, setTimeSpent] = useState('');
  const [timeSaved, setTimeSaved] = useState('');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && task) {
      setTimeSpent(task.timeSpent?.toFixed(2) || '0.00');
      setTimeSaved(task.timeSaved?.toString() || '');
      setReference(task.completionReference || '');
      setError('');
    }
  }, [isOpen, task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const spent = parseFloat(timeSpent);
    const saved = parseFloat(timeSaved);

    if (isNaN(spent) || spent < 0) {
      setError('Please enter a valid, non-negative number for hours spent.');
      return;
    }

    if (isNaN(saved)) {
      setError('Please enter a valid number for hours saved.');
      return;
    }

    onComplete(spent, saved, reference);
  };

  if (!task) return null;
  
  const inputStyles = "flex-1 block w-full rounded-md bg-light-bg dark:bg-dark-input border-light-border dark:border-dark-border focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 dark:text-dark-text-primary";


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Complete Task: ${task.title}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          Please log the time metrics for this task to mark it as completed.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="timeSpent" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
              Total Hours Spent
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="timeSpent"
                value={timeSpent}
                onChange={(e) => setTimeSpent(e.target.value)}
                className={inputStyles}
                placeholder="e.g., 8.5"
                step="0.1"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="timeSaved" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
              Total Hours Saved (vs. estimate)
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="timeSaved"
                value={timeSaved}
                onChange={(e) => setTimeSaved(e.target.value)}
                className={inputStyles}
                placeholder="e.g., 2"
                step="0.1"
                required
                autoFocus
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="completionReference" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
            Completion Reference (optional link)
          </label>
          <div className="mt-1">
            <input
              type="url"
              id="completionReference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={inputStyles}
              placeholder="https://example.com/document.pdf"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Log Time & Complete
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CompleteTaskModal;