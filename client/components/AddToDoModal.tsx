import React, { useState, useEffect } from 'react';
import { ToDo, ToDoFrequency } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';

interface AddToDoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ToDo, 'id' | 'createdAt' | 'ownerId'>) => void;
  editingToDo: ToDo | null;
}

const AddToDoModal: React.FC<AddToDoModalProps> = ({ isOpen, onClose, onSave, editingToDo }) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [frequency, setFrequency] = useState<ToDoFrequency>(ToDoFrequency.Once);
  const [error, setError] = useState('');
  
  const isEditMode = !!editingToDo;

  useEffect(() => {
    if (isOpen) {
      if (editingToDo) {
        setTitle(editingToDo.title);
        setDueDate(editingToDo.dueDate);
        setDueTime(editingToDo.dueTime);
        setFrequency(editingToDo.frequency);
      } else {
        const now = new Date();
        setTitle('');
        setDueDate(now.toISOString().split('T')[0]);
        setDueTime(now.toTimeString().substring(0, 5));
        setFrequency(ToDoFrequency.Once);
      }
      setError('');
    }
  }, [isOpen, editingToDo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || !dueTime) {
      setError('Title, due date, and due time are required.');
      return;
    }
    onSave({
      title: title.trim(),
      dueDate,
      dueTime,
      frequency,
      isComplete: editingToDo ? editingToDo.isComplete : false,
    });
  };

  const modalTitle = isEditMode ? 'Edit To-Do' : 'Add New To-Do';
  const inputStyles = "block w-full rounded-md bg-light-bg dark:bg-dark-input border-light-border dark:border-dark-border shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 dark:text-dark-text-primary";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="todoTitle" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
            Title
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="todoTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputStyles}
              placeholder="e.g., Follow up with the design team"
              autoFocus
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                    Date
                </label>
                <input
                    type="date"
                    id="dueDate"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className={`mt-1 ${inputStyles}`}
                    required
                />
            </div>
             <div>
                <label htmlFor="dueTime" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                    Time
                </label>
                <input
                    type="time"
                    id="dueTime"
                    value={dueTime}
                    onChange={e => setDueTime(e.target.value)}
                    className={`mt-1 ${inputStyles}`}
                    required
                />
            </div>
        </div>
        
        <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                Frequency
            </label>
            <select
                id="frequency"
                value={frequency}
                onChange={e => setFrequency(e.target.value as ToDoFrequency)}
                className={`mt-1 ${inputStyles}`}
            >
                {Object.values(ToDoFrequency).map(freq => (
                    <option key={freq} value={freq}>{freq}</option>
                ))}
            </select>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {isEditMode ? 'Save Changes' : 'Add To-Do'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddToDoModal;