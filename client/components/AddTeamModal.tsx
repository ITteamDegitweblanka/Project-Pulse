
import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { Team } from '../types';

interface AddTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  editingTeam: Team | null;
}

const AddTeamModal: React.FC<AddTeamModalProps> = ({ isOpen, onClose, onSave, editingTeam }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingTeam) {
        setName(editingTeam.name);
        setDescription(editingTeam.description);
      } else {
        setName('');
        setDescription('');
      }
      setError('');
    }
  }, [isOpen, editingTeam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Team name is required.');
      return;
    }
    onSave(name.trim(), description.trim());
  };

  const modalTitle = editingTeam ? `Edit Team: ${editingTeam.name}` : 'Add New Team';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="teamName" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
            Team Name
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="teamName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 block w-full rounded-md bg-light-bg dark:bg-dark-bg border-light-border dark:border-dark-border focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2"
              placeholder="e.g., Alpha Team"
              autoFocus
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="teamDescription" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
            Description
          </label>
          <div className="mt-1">
            <textarea
              id="teamDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="flex-1 block w-full rounded-md bg-light-bg dark:bg-dark-bg border-light-border dark:border-dark-border focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2"
              placeholder="e.g., Frontend and UI/UX specialists"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {editingTeam ? 'Save Changes' : 'Add Team'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTeamModal;
