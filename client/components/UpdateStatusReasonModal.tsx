import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskStatus } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { Icon } from './ui/Icon';

const ON_HOLD_REASONS = [
  "Waiting for user information",
  "Waiting for API",
  "Task clarity issue",
  "Planted",
];

const BLOCKED_REASONS = [
    "Waiting for user information",
    "Waiting for API",
    "Task clarity issue",
];

const RESUME_REASONS = [
  "User provided the Information",
  "Information no need",
];
const OTHER_REASON_VALUE = "other";

interface UpdateStatusReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  task: Task | null;
  newStatus: TaskStatus | null;
}

const UpdateStatusReasonModal: React.FC<UpdateStatusReasonModalProps> = ({ isOpen, onClose, onSubmit, task, newStatus }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReasonText, setOtherReasonText] = useState('');
  const [error, setError] = useState('');
  
  const { reasons, title, description } = useMemo(() => {
    if (!newStatus || !task) return { reasons: [], title: '', description: '' };
    switch (newStatus) {
        case TaskStatus.OnHold:
            return {
                reasons: ON_HOLD_REASONS,
                title: `Place Task on Hold: ${task.title}`,
                description: "Please provide a reason for placing this task on hold."
            };
        case TaskStatus.Blocked:
             return {
                reasons: BLOCKED_REASONS,
                title: `Block Task: ${task.title}`,
                description: "Please provide a reason for blocking this task."
            };
        default:
            // This is a catch-all, but mainly for resuming from on-hold.
            // A more specific check could be `if (task.status === TaskStatus.OnHold)`
            return {
                reasons: RESUME_REASONS,
                title: `Update Status for: ${task.title}`,
                description: "Please provide a reason for this status change."
            };
    }
  }, [newStatus, task]);

  useEffect(() => {
    if (isOpen) {
      setSelectedReason(reasons[0] || '');
      setOtherReasonText('');
      setError('');
    }
  }, [isOpen, reasons]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let finalReason = selectedReason;
    if (selectedReason === OTHER_REASON_VALUE) {
      if (!otherReasonText.trim()) {
        setError('Please enter a reason for choosing "Other".');
        return;
      }
      finalReason = otherReasonText.trim();
    }
    
    onSubmit(finalReason);
  };

  if (!task || !newStatus) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          {description}
        </p>

        <fieldset className="space-y-4">
            <legend className="sr-only">Reason for status change</legend>
            {reasons.map(reason => (
                <div key={reason} className="flex items-center">
                    <input
                        id={reason}
                        name="reason"
                        type="radio"
                        value={reason}
                        checked={selectedReason === reason}
                        onChange={() => setSelectedReason(reason)}
                        className="h-4 w-4 text-brand-primary focus:ring-brand-secondary border-gray-300 dark:border-gray-600 dark:bg-dark-bg"
                    />
                    <label htmlFor={reason} className="ml-3 block text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                        {reason}
                    </label>
                </div>
            ))}
             <div className="flex items-center">
                <input
                    id={OTHER_REASON_VALUE}
                    name="reason"
                    type="radio"
                    value={OTHER_REASON_VALUE}
                    checked={selectedReason === OTHER_REASON_VALUE}
                    onChange={() => setSelectedReason(OTHER_REASON_VALUE)}
                    className="h-4 w-4 text-brand-primary focus:ring-brand-secondary border-gray-300 dark:border-gray-600 dark:bg-dark-bg"
                />
                <label htmlFor={OTHER_REASON_VALUE} className="ml-3 block text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                    Other
                </label>
            </div>
            {selectedReason === OTHER_REASON_VALUE && (
                <div className="pl-7">
                    <label htmlFor="otherReasonText" className="sr-only">Custom reason</label>
                    <input
                        type="text"
                        id="otherReasonText"
                        value={otherReasonText}
                        onChange={(e) => setOtherReasonText(e.target.value)}
                        className="flex-1 block w-full rounded-md bg-light-bg dark:bg-dark-bg border-light-border dark:border-dark-border focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2"
                        placeholder="Please specify..."
                        autoFocus
                    />
                </div>
            )}
        </fieldset>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Update Status
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UpdateStatusReasonModal;