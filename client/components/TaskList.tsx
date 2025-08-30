import React, { useState } from 'react';
import { Task, TeamMember, Project, TaskStatus, Role, StoreItem, StoreFile, StoreLink } from '../types';
import { Icon } from './ui/Icon';
import { TaskPriorityIndicator, TaskDifficultyIndicator, TaskStatusIndicator } from './TaskIndicators';

interface TaskListProps {
  tasks: Task[];
  membersById: Record<string, TeamMember>;
  projectsById: Record<string, Project>;
  onUpdateTask: (taskId: string, updates: Partial<Omit<Task, 'id'>>) => void;
  onDeleteTask?: (taskId:string) => void;
  teamMembers: TeamMember[];
  currentUser: TeamMember | null;
  showExtendedColumns?: boolean;
  onOpenFile: (file: StoreFile) => void;
  onCompleteTask: (task: Task) => void;
}

const isAdmin = (role: Role) => [Role.MD, Role.Director, Role.AdminManager, Role.OperationManager, Role.SuperLeader].includes(role);
const isLeader = (role: Role) => isAdmin(role) || [Role.TeamLeader, Role.SubTeamLeader].includes(role);

const isURL = (str: string) => {
  if (!str) return false;
  try {
    new URL(str);
    return str.startsWith('http');
  } catch (_) {
    return false;
  }
};

const StoreItemDisplay: React.FC<{ item: StoreItem, onOpenFile: (file: StoreFile) => void }> = ({ item, onOpenFile }) => {
    if (item.type === 'link') {
      return (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-brand-secondary hover:underline text-sm truncate" onClick={e => e.stopPropagation()}>
          <Icon name="link" className="h-4 w-4 flex-shrink-0" />
          <span className="truncate" title={item.url}>{item.url}</span>
        </a>
      );
    }
    // item.type === 'file'
    return (
      <button onClick={(e) => { e.stopPropagation(); onOpenFile(item); }} className="w-full flex items-center gap-1.5 text-light-text-secondary dark:text-dark-text-secondary text-sm hover:text-light-text-primary dark:hover:text-dark-text-primary text-left">
        <Icon name="file" className="h-4 w-4 flex-shrink-0" />
        <span className="truncate" title={item.name}>{item.name}</span>
      </button>
    );
};


const TaskList: React.FC<TaskListProps> = ({ tasks, membersById, projectsById, onUpdateTask, onDeleteTask, teamMembers, currentUser, showExtendedColumns = false, onOpenFile, onCompleteTask }) => {
  const [editing, setEditing] = useState<{ taskId: string; field: 'deadline' | 'assignee' | 'endUser' | 'difficulty' | 'comments' | 'userRequirements' | 'store' } | null>(null);

  if (tasks.length === 0) {
    return <p className="text-light-text-secondary dark:text-dark-text-secondary text-center py-10 px-6">No tasks to display.</p>;
  }
  
  const canEditTaskDetails = (): boolean => currentUser ? isLeader(currentUser.role) : false;
  const canDelete = (): boolean => currentUser ? isAdmin(currentUser.role) : false;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true,
    });
  };
  
  const handleDelete = (taskId: string) => {
    if (canDelete() && onDeleteTask && window.confirm('Are you sure you want to delete this task?')) {
      onDeleteTask(taskId);
    }
  }

  const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
    if (newStatus === task.status) return;

    if (!task.assigneeId && task.status === TaskStatus.NotStarted && newStatus !== TaskStatus.Blocked) {
        alert("Please assign this task to a team member before changing its status from 'Not started'.");
        return;
    }

    if (newStatus === TaskStatus.Completed) {
        onCompleteTask(task);
    } else {
        onUpdateTask(task.id, { status: newStatus });
    }
  };


  const handleStoreItemDelete = (taskId: string, index: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.store) return;
    const newStore = [...task.store];
    newStore.splice(index, 1);
    onUpdateTask(taskId, { store: newStore });
  };

  const handleStoreItemAdd = (taskId: string, item: StoreItem) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      const newStore = [...(task.store || []), item];
      onUpdateTask(taskId, { store: newStore });
  };

  const handleStoreFileUpload = (e: React.ChangeEvent<HTMLInputElement>, taskId: string) => {
      if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
              const newFileItem: StoreFile = {
                  type: 'file',
                  name: file.name,
                  mimeType: file.type,
                  content: event.target?.result as string,
              };
              handleStoreItemAdd(taskId, newFileItem);
          };
          reader.readAsDataURL(file);
      }
      if (e.target) {
          e.target.value = '';
      }
  };

  const EditableCell: React.FC<{
    taskId: string;
    field: 'comments' | 'userRequirements';
    value: string | undefined;
    isTextarea?: boolean;
    canEdit: boolean;
  }> = ({ taskId, field, value, isTextarea, canEdit }) => {
    const isEditing = editing?.taskId === taskId && editing.field === field;

    if (isEditing) {
      const commonProps = {
        defaultValue: value || '',
        onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          onUpdateTask(taskId, { [field]: e.target.value });
          setEditing(null);
        },
        autoFocus: true,
        className: "block w-full text-sm bg-light-bg dark:bg-dark-input border-light-border dark:border-dark-border focus:ring-brand-primary focus:border-brand-primary rounded p-1 dark:text-dark-text-primary"
      };
      return isTextarea ? <textarea {...commonProps} rows={3} /> : <input {...commonProps} type="text" />;
    }

    return (
      <p
        onClick={() => canEdit && setEditing({ taskId, field })}
        className={`text-sm text-light-text-secondary dark:text-dark-text-secondary w-full min-h-[24px] ${canEdit ? 'cursor-pointer hover:bg-light-border/50 dark:hover:bg-dark-border/50 rounded -m-1 p-1' : ''}`}
      >
        {value || <span className="italic text-gray-500 dark:text-gray-400 opacity-70">empty</span>}
      </p>
    );
  };


  return (
    <div className="flow-root">
      {/* Desktop-only Header */}
      <div className="hidden xl:grid grid-cols-12 gap-x-6 px-6 py-2 border-b border-light-border dark:border-dark-border">
        <div className={`col-span-${showExtendedColumns ? '2' : '3'} text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary`}>Task</div>
        <div className="col-span-1 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary text-center">Status</div>
        <div className="col-span-1 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary text-center">Difficulty</div>
        {showExtendedColumns && (
          <>
            <div className="col-span-1 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Comments</div>
            <div className="col-span-1 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Users are required to give us</div>
          </>
        )}
        <div className="col-span-2 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Deadline</div>
        <div className={`col-span-${showExtendedColumns ? '1' : '2'} text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary`}>Assignee</div>
        <div className={`col-span-${showExtendedColumns ? '1' : '2'} text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary`}>End User</div>
        {showExtendedColumns && <div className="col-span-1 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Store</div>}
        <div className="col-span-1 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary text-center">Actions</div>
      </div>
      <div className="divide-y divide-light-border dark:divide-dark-border">
        {tasks.map((task) => {
          const assignee = task.assigneeId ? membersById[task.assigneeId] : null;
          const endUser = task.endUserId ? membersById[task.endUserId] : null;
          const project = projectsById[task.projectId];
          
          return (
            <div key={task.id} className="relative p-4 xl:p-0 hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors duration-150 group">
              <div className="xl:grid xl:grid-cols-12 xl:gap-x-6 xl:items-center xl:p-6">
                
                {/* Task Title & Project (xl) */}
                <div className={`xl:col-span-${showExtendedColumns ? '2' : '3'} flex items-start xl:items-center gap-3`}>
                  <div className="mt-1 xl:mt-0 flex-shrink-0">
                    <TaskPriorityIndicator priority={task.priority} />
                  </div>
                  <div className="min-w-0 flex-grow">
                    <p className="font-medium text-light-text-primary dark:text-dark-text-primary">{task.title}</p>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{project?.name || 'No Project'}</p>
                    {task.status === TaskStatus.Completed && (task.timeSpent !== undefined || task.completionReference) && (
                      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                        {task.timeSpent !== undefined && (
                          <div className="flex items-center gap-1.5">
                            <Icon name="timer" className="h-4 w-4" />
                            <span>{task.timeSpent.toFixed(2)}h Spent</span>
                          </div>
                        )}
                        {task.timeSaved !== undefined && (
                          <div className="flex items-center gap-1.5">
                            <Icon name="shield-check" className="h-4 w-4 text-green-400" />
                            <span className={task.timeSaved > 0 ? 'text-green-500 dark:text-green-400' : ''}>
                              {task.timeSaved > 0 ? `${task.timeSaved}h Saved` : 'No time saving'}
                            </span>
                          </div>
                        )}
                        {task.completionReference && (
                          <div className="flex items-center gap-1.5">
                            <Icon name="link" className="h-4 w-4 text-brand-secondary" />
                            <a href={task.completionReference} target="_blank" rel="noopener noreferrer" className="text-brand-secondary hover:underline">
                              View Reference
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Separator */}
                <div className="h-4 xl:hidden"></div>

                {/* Mobile grid & Desktop columns */}
                <div className="grid grid-cols-2 gap-4 xl:contents">
                  
                  {/* Status */}
                  <div className="xl:col-span-1">
                    <label className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary xl:hidden">Status</label>
                    <div className="mt-1 xl:mt-0">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                        disabled={task.status === TaskStatus.Completed}
                        className="w-full appearance-none bg-light-card dark:bg-dark-input border-light-border dark:border-dark-border dark:text-dark-text-primary rounded-md pl-3 pr-8 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        aria-label={`Current status: ${task.status}. Change status.`}
                      >
                        {Object.values(TaskStatus).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Difficulty (New Column) */}
                  <div className="xl:col-span-1">
                    <label className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary xl:hidden">Difficulty</label>
                    <div className="flex justify-start xl:justify-center items-center mt-1 xl:mt-0">
                      {editing?.taskId === task.id && editing.field === 'difficulty' ? (
                        <select
                          value={task.difficulty}
                          onChange={(e) => {
                              onUpdateTask(task.id, { difficulty: parseInt(e.target.value, 10) });
                              setEditing(null);
                          }}
                          onBlur={() => setEditing(null)}
                          autoFocus
                          className="bg-light-card dark:bg-dark-input border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded py-0.5 text-xs focus:ring-brand-primary focus:border-brand-primary"
                        >
                            {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                      ) : (
                          <button
                            onClick={() => canEditTaskDetails() && task.status !== TaskStatus.Completed && setEditing({ taskId: task.id, field: 'difficulty' })}
                            className={`transition-transform ${canEditTaskDetails() && task.status !== TaskStatus.Completed ? 'hover:scale-110' : 'cursor-not-allowed'}`}
                            disabled={!canEditTaskDetails() || task.status === TaskStatus.Completed}
                            title={`Difficulty: ${task.difficulty}/10`}
                          >
                              <TaskDifficultyIndicator score={task.difficulty} />
                          </button>
                      )}
                    </div>
                  </div>
                  
                  {showExtendedColumns && (
                    <>
                      {/* Comments */}
                      <div className="xl:col-span-1">
                        <label className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary xl:hidden">Comments</label>
                        <div className="mt-1 xl:mt-0">
                            <EditableCell taskId={task.id} field="comments" value={task.comments} isTextarea canEdit={canEditTaskDetails() && task.status !== TaskStatus.Completed} />
                        </div>
                      </div>

                      {/* User Requirements */}
                      <div className="xl:col-span-1">
                        <label className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary xl:hidden">Users are required to give us</label>
                        <div className="mt-1 xl:mt-0">
                            <EditableCell taskId={task.id} field="userRequirements" value={task.userRequirements} isTextarea canEdit={canEditTaskDetails() && task.status !== TaskStatus.Completed} />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Deadline */}
                  <div className="xl:col-span-2">
                      <label className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary xl:hidden">
                        {task.status === TaskStatus.Completed ? 'Completed On' : 'Deadline'}
                      </label>
                      {editing?.taskId === task.id && editing.field === 'deadline' ? (
                        <input
                          type="datetime-local"
                          defaultValue={new Date(new Date(task.deadline).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                          onBlur={(e) => {
                            if (e.target.value) {
                              onUpdateTask(task.id, { deadline: new Date(e.target.value).toISOString() });
                            }
                            setEditing(null);
                          }}
                          autoFocus
                          className="bg-light-bg dark:bg-dark-input border-light-border dark:border-dark-border rounded p-1 text-sm w-full text-light-text-primary dark:text-dark-text-primary focus:ring-brand-primary focus:border-brand-primary"
                        />
                      ) : (
                        <div
                          className={`flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1 xl:mt-0 p-1 -m-1 rounded-md ${canEditTaskDetails() && task.status !== TaskStatus.Completed ? 'cursor-pointer hover:bg-light-border dark:hover:bg-dark-border' : 'cursor-not-allowed opacity-70'}`}
                          onClick={() => canEditTaskDetails() && task.status !== TaskStatus.Completed && setEditing({ taskId: task.id, field: 'deadline' })}
                        >
                          {task.status === TaskStatus.Completed && task.completedAt ? (
                            <>
                              <Icon name="check-circle" className="h-4 w-4 text-green-500 dark:text-green-400" />
                              <span title={new Date(task.completedAt).toLocaleString()}>{formatDate(task.completedAt)}</span>
                            </>
                          ) : (
                            <>
                              <Icon name="calendar" className="h-4 w-4" />
                              <span>{formatDate(task.deadline)}</span>
                            </>
                          )}
                        </div>
                      )}
                  </div>

                  {/* Assignee */}
                  <div className={`xl:col-span-${showExtendedColumns ? '1' : '2'}`}>
                      <label className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary xl:hidden">Assignee</label>
                      {editing?.taskId === task.id && editing.field === 'assignee' ? (
                        <select
                          value={task.assigneeId ?? ''}
                          onChange={(e) => {
                            onUpdateTask(task.id, { assigneeId: e.target.value || null });
                            setEditing(null);
                          }}
                          onBlur={() => setEditing(null)}
                          autoFocus
                          className="bg-light-card dark:bg-dark-input border-light-border dark:border-dark-border rounded p-1 text-sm w-full text-light-text-primary dark:text-dark-text-primary focus:ring-brand-primary focus:border-brand-primary truncate"
                        >
                          <option value="">Unassigned</option>
                          {teamMembers.map((member) => (
                            <option key={member.id} value={member.id}>{member.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div
                          className={`flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1 xl:mt-0 min-w-0 p-1 -m-1 rounded-md ${canEditTaskDetails() && task.status !== TaskStatus.Completed ? 'cursor-pointer hover:bg-light-border dark:hover:bg-dark-border' : 'cursor-not-allowed opacity-70'}`}
                          onClick={() => canEditTaskDetails() && task.status !== TaskStatus.Completed && setEditing({ taskId: task.id, field: 'assignee' })}
                        >
                          {assignee ? (
                            <>
                              <img className="h-6 w-6 rounded-full flex-shrink-0" src={assignee.avatarUrl} alt={assignee.name} />
                              <span className="truncate">{assignee.name}</span>
                            </>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">Unassigned</span>
                          )}
                        </div>
                      )}
                  </div>

                   {/* End User */}
                   <div className={`xl:col-span-${showExtendedColumns ? '1' : '2'}`}>
                      <label className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary xl:hidden">End User</label>
                      {editing?.taskId === task.id && editing.field === 'endUser' ? (
                        <select
                          value={task.endUserId ?? ''}
                          onChange={(e) => {
                            onUpdateTask(task.id, { endUserId: e.target.value || null });
                            setEditing(null);
                          }}
                          onBlur={() => setEditing(null)}
                          autoFocus
                          className="bg-light-card dark:bg-dark-input border-light-border dark:border-dark-border rounded p-1 text-sm w-full text-light-text-primary dark:text-dark-text-primary focus:ring-brand-primary focus:border-brand-primary truncate"
                        >
                          <option value="">None</option>
                          {teamMembers.map((member) => (
                            <option key={member.id} value={member.id}>{member.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div
                          className={`flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1 xl:mt-0 min-w-0 p-1 -m-1 rounded-md ${canEditTaskDetails() && task.status !== TaskStatus.Completed ? 'cursor-pointer hover:bg-light-border dark:hover:bg-dark-border' : 'cursor-not-allowed opacity-70'}`}
                          onClick={() => canEditTaskDetails() && task.status !== TaskStatus.Completed && setEditing({ taskId: task.id, field: 'endUser' })}
                        >
                          {endUser ? (
                            <>
                              <img className="h-6 w-6 rounded-full flex-shrink-0" src={endUser.avatarUrl} alt={endUser.name} />
                              <span className="truncate">{endUser.name}</span>
                            </>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">None</span>
                          )}
                        </div>
                      )}
                  </div>

                  {showExtendedColumns && (
                    <div className="xl:col-span-1">
                      <label className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary xl:hidden">Store</label>
                      <div className="mt-1 xl:mt-0">
                        {editing?.taskId === task.id && editing.field === 'store' ? (
                           <div className="flex flex-col gap-2" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) { setEditing(null); } }}>
                            <div className="max-h-24 overflow-y-auto flex flex-col gap-1 pr-1 border border-light-border dark:border-dark-border rounded-md p-1">
                                {(task.store || []).map((item, index) => (
                                    <div key={index} className="flex items-center justify-between text-xs bg-light-bg dark:bg-dark-bg/50 p-1.5 rounded">
                                        <span className="truncate pr-2">{item.type === 'link' ? item.url : item.name}</span>
                                        <button
                                            onMouseDown={e => e.preventDefault()}
                                            onClick={() => handleStoreItemDelete(task.id, index)}
                                            className="p-0.5 rounded-full hover:bg-red-500/20 text-red-400 flex-shrink-0"
                                            aria-label="Remove item"
                                        >
                                            <Icon name="close" className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                {(!task.store || task.store.length === 0) && <p className="text-xs text-center text-light-text-secondary/70 p-2">No items.</p>}
                            </div>
                            <input
                                type="text"
                                placeholder="Add a link and press Enter"
                                className="block w-full text-sm bg-light-bg dark:bg-dark-input border-light-border dark:border-dark-border focus:ring-brand-primary focus:border-brand-primary rounded p-1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const url = e.currentTarget.value;
                                        if (isURL(url)) {
                                            handleStoreItemAdd(task.id, { type: 'link', url });
                                            e.currentTarget.value = '';
                                        }
                                    }
                                }}
                            />
                            <input type="file" id={`store-file-input-${task.id}`} className="hidden" onChange={(e) => handleStoreFileUpload(e, task.id)} />
                            <button
                                type="button"
                                className="self-start inline-flex items-center gap-2 px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-brand-secondary hover:bg-brand-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary"
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => document.getElementById(`store-file-input-${task.id}`)?.click()}
                            >
                                <Icon name="upload" className="h-4 w-4" />
                                Upload File
                            </button>
                           </div>
                        ) : (
                            <div
                                onClick={() => canEditTaskDetails() && task.status !== TaskStatus.Completed && setEditing({ taskId: task.id, field: 'store' })}
                                className={`w-full min-h-[24px] rounded -m-1 p-1 ${canEditTaskDetails() && task.status !== TaskStatus.Completed ? 'cursor-pointer hover:bg-light-border/50 dark:hover:bg-dark-border/50' : ''}`}
                            >
                               <div className="flex flex-col gap-1.5 py-1">
                                {(task.store || []).map((item, index) => (
                                    <StoreItemDisplay key={index} item={item} onOpenFile={onOpenFile} />
                                ))}
                                {(!task.store || task.store.length === 0) && (
                                    <span className="italic text-gray-500 dark:text-gray-400 opacity-70">empty</span>
                                )}
                                </div>
                            </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Actions (New Column) */}
                  <div className="xl:col-span-1">
                     <div className="absolute top-2 right-2 xl:static flex items-center justify-end xl:justify-center">
                        {onDeleteTask && canDelete() && (
                            <button 
                                onClick={() => handleDelete(task.id)}
                                className="p-1 rounded-full text-light-text-secondary dark:text-dark-text-secondary xl:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-400"
                                aria-label="Delete task"
                            >
                                <Icon name="trash" className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskList;