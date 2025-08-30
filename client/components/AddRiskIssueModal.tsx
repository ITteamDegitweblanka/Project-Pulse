import React, { useState, useEffect, useMemo } from 'react';
import { Role, TaskPriority, TaskStatus, Severity, TeamMember, Project, ProjectStatus, Task } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';

interface AddRiskIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    type: 'risk' | 'issue';
    projectId: string;
    priority: TaskPriority;
    severity: Severity;
    deadline: string;
    assigneeId: string | null;
    reason?: string;
  }) => void;
  projects: Project[];
  teamMembers: TeamMember[];
  editingItem: Task | null;
  defaultProjectId?: string | null;
}

const BLOCKED_REASONS = [
    "Waiting for user information",
    "Waiting for API",
    "Task clarity issue",
];
const OTHER_REASON_VALUE = "other";


const AddRiskIssueModal: React.FC<AddRiskIssueModalProps> = ({ isOpen, onClose, onSave, projects, teamMembers, editingItem, defaultProjectId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'risk' | 'issue'>('issue');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Medium);
  const [severity, setSeverity] = useState<Severity>(Severity.Medium);
  const [deadline, setDeadline] = useState('');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [otherReasonText, setOtherReasonText] = useState('');
  const [error, setError] = useState('');

  const isEditMode = !!editingItem;
  const isAddingBlocked = !isEditMode && type === 'risk';

  const projectOptions = useMemo(() => {
    const activeProjects = projects.filter(p => p.status !== ProjectStatus.Completed);
    const projectMap = new Map(activeProjects.map(p => [p.id, p]));
    const topLevelProjects = activeProjects.filter(p => !p.parentId || !projectMap.has(p.parentId));

    const options: { id: string; name: string }[] = [];

    const addProjectToList = (project: Project, level: number) => {
        options.push({
            id: project.id,
            name: `${'\u00A0\u00A0\u00A0\u00A0'.repeat(level)}${project.name}`
        });
        const children = activeProjects.filter(p => p.parentId === project.id).sort((a,b) => a.name.localeCompare(b.name));
        children.forEach(child => addProjectToList(child, level + 1));
    };

    topLevelProjects.sort((a,b) => a.name.localeCompare(b.name)).forEach(p => addProjectToList(p, 0));
    
    return options;
  }, [projects]);


  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        // Edit mode: populate form
        setTitle(editingItem.title);
        setDescription(editingItem.description || '');
        setType(editingItem.type === 'risk' ? 'risk' : 'issue');
        setProjectId(editingItem.projectId);
        setPriority(editingItem.priority);
        setSeverity(editingItem.severity || Severity.Medium);
        setDeadline(editingItem.deadline.split('T')[0]);
        setAssigneeId(editingItem.assigneeId);
      } else {
        // Add mode: reset form
        setTitle('');
        setDescription('');
        setType('issue');
        setProjectId(defaultProjectId || (projectOptions.length > 0 ? projectOptions[0].id : ''));
        setPriority(TaskPriority.Medium);
        setSeverity(Severity.Medium);
        setDeadline('');
        setAssigneeId(null);
      }
      setReason(BLOCKED_REASONS[0]);
      setOtherReasonText('');
      setError('');
    }
  }, [isOpen, editingItem, projects, projectOptions, defaultProjectId]);
  
  useEffect(() => {
    if (type === 'risk' && !isEditMode) {
      setReason(BLOCKED_REASONS[0]);
    } else {
      setReason('');
      setOtherReasonText('');
    }
  }, [type, isEditMode]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalReason: string | undefined = undefined;
    if (isAddingBlocked) {
        if (reason === OTHER_REASON_VALUE) {
            if (!otherReasonText.trim()) {
                setError('Please specify a reason for "Other"');
                return;
            }
            finalReason = otherReasonText.trim();
        } else {
            finalReason = reason;
        }
    }

    const finalTitle = isAddingBlocked ? finalReason : title.trim();

    if (!finalTitle || !projectId || !deadline) {
      setError('A reason/title, project, and deadline are required.');
      return;
    }

    onSave({
      title: finalTitle,
      description: description.trim(),
      type,
      projectId,
      priority,
      severity,
      deadline: new Date(deadline).toISOString(),
      assigneeId,
      reason: finalReason,
    });
  };
  
  const modalTitle = isEditMode
    ? `Edit ${editingItem.type === 'risk' ? '🚨 BLOCKED' : 'Issue'}` 
    : `Add New ${type === 'risk' ? '🚨 BLOCKED' : 'Issue'}`;
  const buttonText = isEditMode ? 'Save Changes' : 'Add';
  const inputStyles = "flex-1 block w-full rounded-md bg-light-bg dark:bg-dark-input border-light-border dark:border-dark-border focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 dark:text-dark-text-primary";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Type</label>
          <div className="mt-2 flex gap-4">
             <div className="flex items-center">
                <input id="issue" name="type" type="radio" value="issue" checked={type === 'issue'} onChange={() => setType('issue')} disabled={isEditMode} className="h-4 w-4 text-brand-primary focus:ring-brand-secondary border-gray-300 dark:border-gray-600 disabled:opacity-50" />
                <label htmlFor="issue" className="ml-2 block text-sm text-light-text-primary dark:text-dark-text-primary">Issue</label>
             </div>
             <div className="flex items-center">
                <input id="risk" name="type" type="radio" value="risk" checked={type === 'risk'} onChange={() => setType('risk')} disabled={isEditMode} className="h-4 w-4 text-brand-primary focus:ring-brand-secondary border-gray-300 dark:border-gray-600 disabled:opacity-50" />
                <label htmlFor="risk" className="ml-2 block text-sm text-light-text-primary dark:text-dark-text-primary">🚨 BLOCKED</label>
             </div>
          </div>
        </div>

        {isEditMode || type === 'issue' ? (
             <div>
                <label htmlFor="title" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Title</label>
                <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className={`mt-1 ${inputStyles}`} required />
            </div>
        ) : (
            <div>
                <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Reason for Block</label>
                <fieldset className="mt-2 space-y-2">
                    <legend className="sr-only">Reason for block</legend>
                    {BLOCKED_REASONS.map(r => (
                        <div key={r} className="flex items-center">
                            <input id={r} name="reason" type="radio" value={r} checked={reason === r} onChange={() => setReason(r)} className="h-4 w-4 text-brand-primary focus:ring-brand-secondary border-gray-300 dark:border-gray-600 dark:bg-dark-input" />
                            <label htmlFor={r} className="ml-3 block text-sm font-medium text-light-text-primary dark:text-dark-text-primary">{r}</label>
                        </div>
                    ))}
                    <div className="flex items-center">
                        <input id={OTHER_REASON_VALUE} name="reason" type="radio" value={OTHER_REASON_VALUE} checked={reason === OTHER_REASON_VALUE} onChange={() => setReason(OTHER_REASON_VALUE)} className="h-4 w-4 text-brand-primary focus:ring-brand-secondary border-gray-300 dark:border-gray-600 dark:bg-dark-input" />
                        <label htmlFor={OTHER_REASON_VALUE} className="ml-3 block text-sm font-medium text-light-text-primary dark:text-dark-text-primary">Other</label>
                    </div>
                    {reason === OTHER_REASON_VALUE && (
                        <div className="pl-7">
                            <input type="text" value={otherReasonText} onChange={e => setOtherReasonText(e.target.value)} className={inputStyles} placeholder="Please specify..." autoFocus />
                        </div>
                    )}
                </fieldset>
            </div>
        )}


        <div>
          <label htmlFor="description" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Description</label>
          <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`mt-1 ${inputStyles}`} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="projectId" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Project</label>
                <select id="projectId" value={projectId} onChange={e => setProjectId(e.target.value)} className={`mt-1 ${inputStyles}`} required>
                    <option value="" disabled>Select a project</option>
                    {projectOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Deadline</label>
                <input type="date" id="deadline" value={deadline} onChange={e => setDeadline(e.target.value)} className={`mt-1 ${inputStyles}`} required />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <label htmlFor="priority" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Priority</label>
                <select id="priority" value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className={`mt-1 ${inputStyles}`}>
                    {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="severity" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Severity</label>
                <select id="severity" value={severity} onChange={e => setSeverity(e.target.value as Severity)} className={`mt-1 ${inputStyles}`}>
                    {Object.values(Severity).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="assigneeId" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Assignee</label>
                <select id="assigneeId" value={assigneeId || ''} onChange={e => setAssigneeId(e.target.value || null)} className={`mt-1 ${inputStyles}`}>
                    <option value="">Unassigned</option>
                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
            </div>
        </div>

        {error && <p className="text-sm text-red-400 mt-4">{error}</p>}

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {buttonText}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddRiskIssueModal;