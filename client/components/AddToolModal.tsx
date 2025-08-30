import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { Tool } from '../types';

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  editingTool: Tool | null;
}

const AddToolModal: React.FC<AddToolModalProps> = ({ isOpen, onClose, onSave, editingTool }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(editingTool ? editingTool.name : '');
      setError('');
    }
  }, [isOpen, editingTool]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Tool name cannot be empty.');
      return;
    }
    onSave(name.trim());
  };

  const modalTitle = editingTool ? `Edit Tool: ${editingTool.name}` : 'Add New Tool';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="toolName" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
            Tool Name
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="toolName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 block w-full rounded-md bg-light-bg dark:bg-dark-bg border-light-border dark:border-dark-border focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2"
              placeholder="e.g., N8N"
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
            {editingTool ? 'Save Changes' : 'Add Tool'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddToolModal;
