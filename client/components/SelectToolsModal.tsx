import React, { useState, useEffect, useMemo } from 'react';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { Icon } from './ui/Icon';
import { Tool } from '../types';

interface SelectToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (selectedToolIds: string[]) => void;
  allTools: Tool[];
  initialSelectedIds?: string[];
}

const SelectToolsModal: React.FC<SelectToolsModalProps> = ({ isOpen, onClose, onSubmit, allTools, initialSelectedIds = [] }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(initialSelectedIds));
      setSearchQuery('');
    }
  }, [isOpen, initialSelectedIds]);
  
  const filteredTools = useMemo(() => {
    if (!searchQuery) return allTools;
    return allTools.filter(tool => tool.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allTools, searchQuery]);

  const handleToggle = (toolId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(toolId)) {
        newSet.delete(toolId);
      } else {
        newSet.add(toolId);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    onSubmit(Array.from(selectedIds));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Tools Used">
      <div className="space-y-4">
        <div className="relative">
          <Icon name="search" className="pointer-events-none absolute inset-y-0 left-3 flex items-center h-full w-5 text-gray-400 dark:text-gray-500" />
          <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-light-bg dark:bg-dark-input border border-light-border dark:border-dark-border rounded-md pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-light-text-primary dark:text-dark-text-primary"
          />
        </div>

        <div className="max-h-60 overflow-y-auto p-2 border border-light-border dark:border-dark-border rounded-md space-y-2">
          {filteredTools.length > 0 ? (
            filteredTools.map(tool => (
              <label key={tool.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-light-bg/50 dark:hover:bg-dark-bg/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.has(tool.id)}
                  onChange={() => handleToggle(tool.id)}
                  className="h-4 w-4 rounded text-brand-primary focus:ring-brand-secondary border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">{tool.name}</span>
              </label>
            ))
          ) : (
            <p className="text-sm text-center py-4 text-light-text-secondary dark:text-dark-text-secondary">No tools match your search.</p>
          )}
        </div>
      </div>
      <div className="pt-6 flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant="primary" onClick={handleSubmit}>
          Save Tools
        </Button>
      </div>
    </Modal>
  );
};

export default SelectToolsModal;
