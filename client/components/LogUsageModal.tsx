import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';

interface LogUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSave: (projectId: string, savedHours: number) => void;
}

const LogUsageModal: React.FC<LogUsageModalProps> = ({ isOpen, onClose, project, onSave }) => {
  const [savedHours, setSavedHours] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSavedHours('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const hours = parseFloat(savedHours);
    if (isNaN(hours)) {
      setError('Please enter a valid number for hours saved.');
      return;
    }
    if (!project) return;
    onSave(project.id, hours);
  };

  if (!project) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Log Usage for: ${project.name}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="savedHours" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
            Time Saved by This Usage (Hours)
          </label>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
            Enter the estimated hours this automation/project saved for the beneficiary during this specific use.
          </p>
          <div className="mt-2">
            <input
              type="number"
              id="savedHours"
              value={savedHours}
              onChange={(e) => setSavedHours(e.target.value)}
              className="flex-1 block w-full rounded-md bg-light-bg dark:bg-dark-input border-light-border dark:border-dark-border focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 dark:text-dark-text-primary"
              placeholder="e.g., 2.5"
              step="0.1"
              required
              autoFocus
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Log Usage
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default LogUsageModal;