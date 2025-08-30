
import React, { Fragment } from 'react';
import { Icon } from './Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = '2xl' }) => {
  if (!isOpen) return null;

  const sizeClasses: Record<string, string> = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  };
  
  const widthClass = sizeClasses[size] || sizeClasses['2xl'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose}></div>

      {/* Modal Panel */}
      <div className={`relative w-full ${widthClass} mx-4 transform rounded-xl bg-light-card dark:bg-dark-card text-left shadow-xl transition-all`}>
        <div className="p-6">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold leading-6 text-light-text-primary dark:text-dark-text-primary" id="modal-title">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-border dark:hover:bg-dark-border transition-colors"
              aria-label="Close"
            >
              <Icon name="close" className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
