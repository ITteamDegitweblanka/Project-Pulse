
import React, { useMemo } from 'react';
import { ToDo, TeamMember, ToDoFrequency } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import { Icon } from './ui/Icon';

interface ToDoViewProps {
  toDos: ToDo[];
  currentUser: TeamMember;
  onAddToDo: () => void;
  onEditToDo: (todo: ToDo) => void;
  onUpdateToDo: (todoId: string, updates: Partial<Omit<ToDo, 'id'>>) => void;
  onDeleteToDo: (todoId: string) => void;
}

const ToDoItem: React.FC<{
    todo: ToDo;
    onUpdate: (id: string, updates: Partial<Omit<ToDo, 'id'>>) => void;
    onDelete: (id: string) => void;
    onEdit: (todo: ToDo) => void;
}> = ({ todo, onUpdate, onDelete, onEdit }) => {

    const handleToggle = () => {
        onUpdate(todo.id, { isComplete: !todo.isComplete });
    };

    const isRecurring = todo.frequency !== ToDoFrequency.Once;

    return (
        <div className="flex items-center gap-3 p-3 group transition-colors hover:bg-light-bg/50 dark:hover:bg-dark-bg/50">
            <input
                type="checkbox"
                checked={todo.isComplete}
                onChange={handleToggle}
                className="h-5 w-5 rounded text-brand-primary focus:ring-brand-secondary border-gray-300 dark:border-gray-600 bg-light-card dark:bg-dark-card"
                aria-label={`Mark "${todo.title}" as complete`}
            />
            <div className={`flex-1 min-w-0 ${todo.isComplete ? 'line-through text-light-text-secondary dark:text-dark-text-secondary' : 'text-light-text-primary dark:text-dark-text-primary'}`}>
                <p className="font-medium">{todo.title}</p>
                <div className="flex items-center gap-3 text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
                    <div className="flex items-center gap-1">
                        <Icon name="timer" className="h-3.5 w-3.5" />
                        <span>{todo.dueTime}</span>
                    </div>
                    {isRecurring && (
                        <div className="flex items-center gap-1">
                            <Icon name="activity" className="h-3.5 w-3.5" />
                            <span>{todo.frequency}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!todo.isComplete && (
                     <button onClick={() => onEdit(todo)} className="p-1.5 rounded-md hover:bg-light-border dark:hover:bg-dark-border text-light-text-secondary dark:text-dark-text-secondary">
                        <Icon name="edit" className="h-4 w-4" />
                    </button>
                )}
                <button onClick={() => onDelete(todo.id)} className="p-1.5 rounded-md hover:bg-red-500/10 text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500">
                    <Icon name="trash" className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};


const ToDoView: React.FC<ToDoViewProps> = ({ toDos, currentUser, onAddToDo, onEditToDo, onUpdateToDo, onDeleteToDo }) => {
  const userToDos = useMemo(() => toDos.filter(t => t.ownerId === currentUser.id), [toDos, currentUser.id]);

  const { today, upcoming, completed } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const t: ToDo[] = [];
    const u: ToDo[] = [];
    const c: ToDo[] = [];
    
    userToDos.forEach(todo => {
      if (todo.isComplete) {
        c.push(todo);
      } else if (todo.dueDate === todayStr) {
        t.push(todo);
      } else {
        u.push(todo);
      }
    });

    // Sort by due time
    t.sort((a,b) => a.dueTime.localeCompare(b.dueTime));
    u.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() || a.dueTime.localeCompare(b.dueTime));
    c.sort((a,b) => new Date(b.lastCompletedAt || b.createdAt).getTime() - new Date(a.lastCompletedAt || a.createdAt).getTime());

    return { today: t, upcoming: u, completed: c };
  }, [userToDos]);
  
  const ToDoList: React.FC<{title: string, todos: ToDo[], emptyText: string}> = ({ title, todos, emptyText }) => (
    <Card>
        <div className="p-6">
            <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">{title}</h2>
        </div>
        {todos.length > 0 ? (
            <div className="divide-y divide-light-border dark:divide-dark-border">
                {todos.map(todo => (
                    <ToDoItem key={todo.id} todo={todo} onUpdate={onUpdateToDo} onDelete={onDeleteToDo} onEdit={onEditToDo} />
                ))}
            </div>
        ) : (
            <p className="px-6 pb-6 text-sm text-light-text-secondary dark:text-dark-text-secondary">{emptyText}</p>
        )}
    </Card>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">My To-Do List</h1>
          <p className="mt-1 text-light-text-secondary dark:text-dark-text-secondary">Plan your work and stay organized.</p>
        </div>
        <Button onClick={onAddToDo} variant="primary">
          <Icon name="plus" className="h-5 w-5 mr-2" />
          Add To-Do
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
            <ToDoList title="Today" todos={today} emptyText="Nothing scheduled for today. Add a new to-do!" />
        </div>
        <div className="space-y-6">
            <ToDoList title="Upcoming" todos={upcoming} emptyText="No upcoming to-dos." />
        </div>
        <div className="space-y-6">
            <ToDoList title="Completed" todos={completed} emptyText="No completed to-dos yet." />
        </div>
      </div>
    </div>
  );
};

export default ToDoView;
