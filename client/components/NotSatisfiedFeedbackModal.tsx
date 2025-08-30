import React, { useState, useEffect } from 'react';
import { Project, EndUserFeedback } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';

interface NotSatisfiedFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSubmit: (comments: string) => void;
}

const NotSatisfiedFeedbackModal: React.FC<NotSatisfiedFeedbackModalProps> = ({ isOpen, onClose, project, onSubmit }) => {
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setComments('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) {
      setError('Feedback comments are required to mark this project as not satisfied.');
      return;
    }
    onSubmit(comments.trim());
  };

  if (!project) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Feedback for: ${project.name}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="feedbackComments" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
            Reason for Dissatisfaction
          </label>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
            Please provide detailed comments from the end user explaining why the project outcome was not satisfactory.
          </p>
          <div className="mt-2">
            <textarea
              id="feedbackComments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={5}
              className="flex-1 block w-full rounded-md bg-light-bg dark:bg-dark-bg border-light-border dark:border-dark-border focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2"
              placeholder="Enter end user feedback here..."
              autoFocus
              required
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Submit Feedback & Update Status
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default NotSatisfiedFeedbackModal;