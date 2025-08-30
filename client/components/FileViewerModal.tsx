
import React from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { StoreFile } from '../types';
import { Icon } from './ui/Icon';

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: StoreFile | null;
}

const FileViewerModal: React.FC<FileViewerModalProps> = ({ isOpen, onClose, file }) => {
  if (!isOpen || !file) return null;

  const renderContent = () => {
    const { mimeType, content, name } = file;
    if (mimeType.startsWith('image/')) {
      return <img src={content} alt={name} className="max-w-full max-h-[70vh] object-contain mx-auto" />;
    }
    if (mimeType === 'application/pdf') {
      return <iframe src={content} title={name} className="w-full h-[75vh]" frameBorder="0"></iframe>;
    }
    if (mimeType.startsWith('text/')) {
        try {
            const base64Content = content.split(',')[1] || '';
            const decodedContent = atob(base64Content);
            return <pre className="w-full h-full bg-light-bg dark:bg-dark-bg p-4 rounded-md overflow-auto text-sm whitespace-pre-wrap">{decodedContent}</pre>
        } catch (e) {
            console.error("Error decoding text content:", e);
            return <p>Could not display text file content.</p>;
        }
    }
    
    const baseStyles = 'inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-light-bg dark:focus:ring-offset-dark-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
    const variantStyles = 'bg-brand-primary hover:bg-brand-primary/90 text-white focus:ring-brand-primary';

    // Fallback for other file types
    return (
        <div className="text-center py-10">
            <Icon name="file" className="h-16 w-16 mx-auto text-light-text-secondary dark:text-dark-text-secondary mb-4" />
            <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">{name}</p>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-6">Preview is not available for this file type.</p>
            <a href={content} download={name} className={`${baseStyles} ${variantStyles}`}>Download File</a>
        </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Viewing: ${file.name}`}>
        <div className="min-h-[200px]">{renderContent()}</div>
        <div className="pt-4 flex justify-end">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
    </Modal>
  );
};

export default FileViewerModal;
