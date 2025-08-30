import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';

interface CompletedBlockedCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSubmit: (comments: string) => void;
}

const CompletedBlockedCommentModal: React.FC<CompletedBlockedCommentModalProps> = ({ isOpen, onClose, project, onSubmit }) => {
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && project) {
      setComments(project.latestComments?.text || '');
      setError('');
    }
  }, [isOpen, project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) {
      setError('Comments are required to set this status.');
      return;
    }
    onSubmit(comments.trim());
  };

  if (!project) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Comment for: ${project.name}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="managerComments" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
            Project Manager Comments
          </label>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
            Provide a final comment explaining the circumstances of this project's completion. This will become the "Latest Comment".
          </p>
          <div className="mt-2">
            <textarea
              id="managerComments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={5}
              className="flex-1 block w-full rounded-md bg-light-bg dark:bg-dark-bg border-light-border dark:border-dark-border focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2"
              placeholder="e.g., Project completed but was significantly delayed by API issues..."
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
            Save Comment & Update Status
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CompletedBlockedCommentModal;