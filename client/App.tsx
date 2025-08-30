

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Project, Task, TeamMember, TaskStatus, ProjectStatus, Role, StoreFile, ExecutiveSummary, SystemConfiguration, ProjectPhase, Department, RiskLevelSetting, TaskPriority, Severity, Notification, Leave, AuditLog, MemberPerformance, Team, ProjectFrequency, EndUserFeedback, Tool, ToDo, ToDoFrequency, ProjectUser } from './types';
import Header from './components/Header';
import AddMemberModal from './components/AddMemberModal';
import AddProjectModal from './components/AddProjectModal';
import ProjectsView from './components/ProjectsView';
import * as api from './services/api';
import { Icon } from './components/ui/Icon';
import Sidebar from './components/Sidebar';
import LoginView from './components/LoginView';
import CompleteTaskModal from './components/CompleteTaskModal';
import UpdateStatusReasonModal from './components/UpdateStatusReasonModal';
import FileViewerModal from './components/FileViewerModal';
import ProjectDetailView from './components/ProjectDetailView';
import ExecutiveDashboard from './components/ExecutiveDashboard';
import RisksAndIssuesView from './components/RisksAndIssuesView';
import SettingsView from './components/SettingsView';
import AddRiskIssueModal from './components/AddRiskIssueModal';
import AddLeaveModal from './components/AddLeaveModal';
import MemberPerformanceView from './components/MemberPerformanceView';
import StaffPage from './components/StaffPage';
import AddTeamModal from './components/AddTeamModal';
import TechnicalTeamView from './components/TechnicalTeamView';
import CompleteProjectModal from './components/CompleteProjectModal';
import NotSatisfiedFeedbackModal from './components/NotSatisfiedFeedbackModal';
import CompletedBlockedCommentModal from './components/CompletedBlockedCommentModal';
import AddToolModal from './components/AddToolModal';
import SelectToolsModal from './components/SelectToolsModal';
import BeneficiaryDetailModal from './components/BeneficiaryDetailModal';
import ToDoView from './components/ToDoView';
import AddToDoModal from './components/AddToDoModal';
import LogUsageModal from './components/LogUsageModal';
import CompletedProjectsSummaryModal from './components/CompletedProjectsSummaryModal';
import LogSavedTimeModal from './components/LogSavedTimeModal';
import { getWeekBoundaries } from './utils/date';

const isAdmin = (role: Role) => [Role.MD, Role.Director, Role.AdminManager, Role.OperationManager, Role.SuperLeader].includes(role);

const speak = (text: string) => {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    }
};

// Normalize a project object coming from the server into the shape the UI expects
const normalizeProjectResponse = (p: any): Project => {
  const users = Array.isArray(p?.users) ? p.users.map((u: any) => ({ ...u, id: String(u.id) })) : p?.users;
  return {
    ...p,
    id: String(p.id),
    leadId: String(p.leadId ?? p.owner_id ?? p.lead_id ?? ''),
    teamId: (p.teamId ?? p.team_id) != null ? String(p.teamId ?? p.team_id) : undefined,
    usedHours: Math.max(0, Number(p.usedHours) || 0),
    allocatedHours: Number(p.allocatedHours) || 0,
    additionalHours: Number(p.additionalHours) || 0,
    savedHours: p.savedHours != null ? Number(p.savedHours) : p.savedHours,
    expectedSavedHours: p.expectedSavedHours != null ? Number(p.expectedSavedHours) : p.expectedSavedHours,
    users,
  } as unknown as Project;
};

const App: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [toDos, setToDos] = useState<ToDo[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [leave, setLeave] = useState<Leave[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  // Settings State
  const [systemConfiguration, setSystemConfiguration] = useState<SystemConfiguration | null>(null);
  const [projectPhases, setProjectPhases] = useState<ProjectPhase[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [riskLevels, setRiskLevels] = useState<RiskLevelSetting[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(() => {
  const savedUser = localStorage.getItem('currentUser');
  return savedUser ? JSON.parse(savedUser) : null;
});

  const [theme, setTheme] = useState('light');

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [addProjectModalParentId, setAddProjectModalParentId] = useState<string | null>(null);
  const [isAddRiskIssueModalOpen, setIsAddRiskIssueModalOpen] = useState(false);
  const [editingRiskIssue, setEditingRiskIssue] = useState<Task | null>(null);
  const [addRiskIssueModalProjectId, setAddRiskIssueModalProjectId] = useState<string | null>(null);
  const [isAddToDoModalOpen, setIsAddToDoModalOpen] = useState(false);
  const [editingToDo, setEditingToDo] = useState<ToDo | null>(null);
  
  const [activeTab, setActiveTab] = useState(() => {
  const savedTab = localStorage.getItem('activeTab');
  return savedTab || 'dashboard';
});
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [projectToComplete, setProjectToComplete] = useState<Project | null>(null);
  const [triggeringSubProjectId, setTriggeringSubProjectId] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<StoreFile | null>(null);
  const [viewingProjectId, setViewingProjectId] = useState<string | null>(null);
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const [isAddLeaveModalOpen, setIsAddLeaveModalOpen] = useState(false);
  const [memberForLeaveLog, setMemberForLeaveLog] = useState<TeamMember | null>(null);
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);
  const [memberPerformance, setMemberPerformance] = useState<MemberPerformance | null>(null);
  const [riskIssueProjectFilterId, setRiskIssueProjectFilterId] = useState<string | null>(null);

  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const [viewingTeamId, setViewingTeamId] = useState<string | null>(null);
  
  const [projectForStatusChange, setProjectForStatusChange] = useState<Project | null>(null);
  const [isNotSatisfiedModalOpen, setIsNotSatisfiedModalOpen] = useState(false);
  const [isCompletedBlockedModalOpen, setIsCompletedBlockedModalOpen] = useState(false);

  // Tools Modals
  const [isAddToolModalOpen, setIsAddToolModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [isSelectToolsModalOpen, setIsSelectToolsModalOpen] = useState(false);
  const [projectForToolsSelection, setProjectForToolsSelection] = useState<{ project: Project; newStatus: ProjectStatus; } | null>(null);
  const [projectToLogUsage, setProjectToLogUsage] = useState<Project | null>(null);
  const [isCompletedProjectsSummaryModalOpen, setIsCompletedProjectsSummaryModalOpen] = useState(false);
  const [summaryProjects, setSummaryProjects] = useState<Project[]>([]);
  const [isLogSavedTimeModalOpen, setIsLogSavedTimeModalOpen] = useState(false);
  const [projectsToLogSavedTime, setProjectsToLogSavedTime] = useState<Project[]>([]);


  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
  const [
            membersData, 
            projectsData, 
            tasksData, 
            toDosData,
            leaveData,
            auditLogsData,
            configData,
            phasesData,
            deptsData,
            riskLevelsData,
            teamsData,
            toolsData,
        ] = await Promise.all([
          api.getTeamMembers(),
          api.getProjects(),
          api.getTasks(),
          api.getToDos(),
          api.getLeave(),
          api.getAuditLogs(),
          api.getSystemConfiguration(),
          api.getProjectPhases(),
          api.getDepartments(),
          api.getRiskLevels(),
          api.getTeams(),
          api.getTools(),
        ]);
        // Normalize members: ensure string IDs and teamId
        const normalizedMembers = membersData.map(m => ({
          ...m,
          id: String(m.id),
          teamId: (m.teamId ?? m.team_id ?? undefined) ? String(m.teamId ?? m.team_id) : undefined,
          subTeamLeaderId: m.subTeamLeaderId != null ? String(m.subTeamLeaderId) : m.subTeamLeaderId,
        }));
        setTeamMembers(normalizedMembers);

        // Normalize teams: ensure string IDs
        const normalizedTeams = teamsData.map(t => ({ ...t, id: String(t.id) }));
        setTeams(normalizedTeams);

        // Normalize projects from DB shape to frontend shape
        const normalizedProjects = projectsData.map((p: any) => {
          const users = Array.isArray(p.users) ? p.users.map((u: any) => ({ ...u, id: String(u.id) })) : p.users;
          return {
            ...p,
            id: String(p.id),
            leadId: String(p.leadId ?? p.owner_id ?? p.lead_id ?? ''),
            teamId: (p.teamId ?? p.team_id) != null ? String(p.teamId ?? p.team_id) : undefined,
            usedHours: Math.max(0, Number(p.usedHours) || 0),
            allocatedHours: Number(p.allocatedHours) || 0,
            additionalHours: Number(p.additionalHours) || 0,
            savedHours: p.savedHours != null ? Number(p.savedHours) : p.savedHours,
            expectedSavedHours: p.expectedSavedHours != null ? Number(p.expectedSavedHours) : p.expectedSavedHours,
            users,
          } as any;
        });
        setProjects(normalizedProjects as any);
        setTasks(tasksData);
        setToDos(toDosData);
        setLeave(leaveData);
        setAuditLogs(auditLogsData);
        setSystemConfiguration(configData);
        setProjectPhases(phasesData);
        setDepartments(deptsData);
        setRiskLevels(riskLevelsData);
        setTools(toolsData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to load dashboard data. Please try again later. (${message})`);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

    const executiveSummary = useMemo((): ExecutiveSummary | null => {
        if (isLoading) {
            return null;
        }

        const projectsWithOpenIssues = new Set<string>();
        tasks.forEach(task => {
            if (task.type === 'issue' && task.status !== TaskStatus.Completed) {
                projectsWithOpenIssues.add(task.projectId);
            }
        });
        
        const parentProjectsCount = projects.filter(p => !p.parentId).length;
        const childProjectsCount = projects.filter(p => !!p.parentId).length;
        const totalProjects = projects.length;

        const totalAllocatedHours = projects
            .filter(p => !projectsWithOpenIssues.has(p.id))
            .reduce((sum, p) => sum + p.allocatedHours, 0);

        const openIssues = tasks.filter(t => t.type === 'issue' && t.status !== TaskStatus.Completed).length;
        const totalMembers = teamMembers.length;
        
        const ragDistribution = { green: 0, yellow: 0, red: 0 };
        projects.forEach(project => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const isBehind = projectTasks.some(t => new Date(t.deadline) < new Date() && t.status !== TaskStatus.Completed);
            const isAtRisk = project.status === ProjectStatus.UserTesting || project.status === ProjectStatus.Update;
            
            if (isBehind) {
                ragDistribution.red++;
            } else if (isAtRisk) {
                ragDistribution.yellow++;
            } else {
                ragDistribution.green++;
            }
        });

        const keyTrends = {
            onTimeDeliveryPercent: 85,
            hoursUtilizationPercent: 78,
            issueResolutionTimeDays: 4.2,
        };

        return {
            totalProjects: { 
                value: { total: totalProjects, parent: parentProjectsCount, children: childProjectsCount }, 
                changeText: "from live data" 
            },
            totalAllocatedHours: { value: totalAllocatedHours, changeText: "active projects" },
            openIssues: { value: openIssues, changeText: "from live data" },
            teamMembers: { value: totalMembers, changeText: "from live data" },
            ragDistribution,
            keyTrends,
        };
    }, [projects, tasks, teamMembers, isLoading]);

  const handleLogin = async (username: string, password: string):Promise<void> => {
  try {
    const user = await api.authenticateUser(username, password);
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setActiveTab('dashboard');
    localStorage.setItem('activeTab', 'dashboard');
  } catch(err) {
    // rethrow to be caught by login form
    throw err;
  }
  };

  const handleLogout = () => {
  setCurrentUser(null);
  localStorage.removeItem('currentUser');
  };
    
  const addNotification = useCallback((message: string, recipientId: string, link?: string) => {
      const newNotification: Notification = {
        id: `notif-${Date.now()}-${Math.random()}`,
        recipientId,
        message,
        link,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications(prev => [newNotification, ...prev]);

      if (currentUser && recipientId === currentUser.id) {
          speak(`New notification: ${message}`);
      }
  }, [currentUser]);
  
  useEffect(() => {
    if (!currentUser) return;
    const notifiedToDos = new Set<string>(); // Prevent re-notifying in the same session

    const checkReminders = () => {
        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

        toDos.forEach(todo => {
            if (todo.ownerId === currentUser.id && !todo.isComplete && !notifiedToDos.has(todo.id)) {
                const [year, month, day] = todo.dueDate.split('-').map(Number);
                const [hour, minute] = todo.dueTime.split(':').map(Number);
                const dueDateTime = new Date(year, month - 1, day, hour, minute);

                if (dueDateTime > now && dueDateTime <= fiveMinutesFromNow) {
                    addNotification(
                        `Reminder: "${todo.title}" is due soon.`,
                        currentUser.id,
                        'todo'
                    );
                    notifiedToDos.add(todo.id);
                }
            }
        });
    };

    const intervalId = setInterval(checkReminders, 30 * 1000); // Check every 30 seconds
    return () => clearInterval(intervalId);
  }, [toDos, currentUser, addNotification]);

  const addAuditLog = async (action: string, details: string, projectId?: string) => {
    if (!currentUser) return;
    const logEntry = {
      user_id: currentUser.id,
      action,
      entity_type: 'project',
      entity_id: projectId || '',
      timestamp: new Date().toISOString(),
      details,
    };
    const newLog = await api.addAuditLogEntry(logEntry);
    setAuditLogs(prev => [newLog, ...prev].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const updateTask = async (taskId: string, updates: Partial<Omit<Task, 'id'>>) => {
    try {
        const oldTask = tasks.find(t => t.id === taskId);
        if (!oldTask) {
            console.error("Task not found for update.");
            return;
        }

        const updatedTask = await api.updateTask(taskId, updates);
        
        // NOTIFICATION LOGIC
        if (
            updates.status === TaskStatus.Completed &&
            oldTask.status !== TaskStatus.Completed &&
            (oldTask.type === 'issue')
        ) {
            const project = projectsById[oldTask.projectId];
            if (project && project.leadId) {
                const lead = membersById[project.leadId];
                if (lead) {
                    addNotification(
                        `Issue "${updatedTask.title}" in project "${project.name}" has been resolved.`,
                        lead.id,
                        `project:${project.id}`
                    );
                }
            }
        }
        
        if (updates.assigneeId && updates.assigneeId !== oldTask.assigneeId) {
            const assignee = membersById[updates.assigneeId as string];
            const project = projectsById[updatedTask.projectId];
            if (assignee && project) {
                addNotification(
                    `You have been assigned a ${updatedTask.type || 'task'}: "${updatedTask.title}" in project "${project.name}".`,
                    assignee.id,
                    `project:${project.id}`
                );
            }
        }

        const changedFields = Object.keys(updates).join(', ');
        addAuditLog('Update Task', `updated "${oldTask.title}" with new: ${changedFields}`, oldTask.projectId);

        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId ? updatedTask : task
          )
        );
    } catch (err) {
        console.error("Failed to update task:", err);
    }
  };

  const handleCompleteTask = async (timeSpent: number, timeSaved: number, completionReference: string) => {
    if (!completingTask) return;
    await updateTask(completingTask.id, {
      status: TaskStatus.Completed,
      timeSpent: timeSpent,
      timeSaved,
      completedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      completionReference,
      statusReason: '', // Clear reason on completion
    });
    setCompletingTask(null);
  };
  
  const deleteTask = async (taskId: string) => {
    try {
        const taskToDelete = tasks.find(t => t.id === taskId);
        if (!taskToDelete) return;
        await api.deleteTask(taskId);
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
        addAuditLog('Delete Task', `deleted task "${taskToDelete.title}"`, taskToDelete.projectId);
    } catch (err) {
        console.error("Failed to delete task:", err);
    }
  };

  const addMember = async (name: string, role: Role, password: string, teamId?: string, subTeamLeaderId?: string, officeLocation?: string) => {
    const newMember = await api.addMember(name, role, password, teamId, subTeamLeaderId, officeLocation);
    // Reload team members and teams to ensure UI is up-to-date
    const [membersData, teamsData] = await Promise.all([
      api.getTeamMembers(),
      api.getTeams()
    ]);
    setTeamMembers(membersData);
    setTeams(teamsData);
    addAuditLog('Add Member', `added new member "${name}" with role ${role}`);
    setIsAddMemberModalOpen(false);
  };

  const deleteMember = async (memberId: string) => {
    try {
      const member = membersById[memberId];
      if (!member) return;
      await api.deleteMember(memberId);
      setTeamMembers(prev => prev.filter(m => m.id !== memberId));
      addAuditLog('Delete Member', `deleted member "${member.name}"`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      alert(`Delete Failed: ${message}`);
    }
  };

  const onUpdateMemberRole = async (memberId: string, role: Role) => {
    try {
      const member = membersById[memberId];
      const updatedMember = await api.updateMemberRole(memberId, role);
      setTeamMembers(prev => prev.map(m => (m.id === memberId ? updatedMember : m)));
      addAuditLog('Update Member Role', `changed role for "${member.name}" to ${role}`);
      if (currentUser?.id === memberId) {
        setCurrentUser(updatedMember);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      alert(`Role Change Failed: ${message}`);
      throw err;
    }
  };

  const handleOpenAddProjectModal = (parentId: string | null = null) => {
      setAddProjectModalParentId(parentId);
      setEditingProject(null);
      setIsProjectModalOpen(true);
  };
  
  const handleOpenEditProjectModal = (project: Project) => {
      setEditingProject(project);
      setAddProjectModalParentId(null);
      setIsProjectModalOpen(true);
  };

  const handleCloseProjectModal = () => {
      setAddProjectModalParentId(null);
      setEditingProject(null);
      setIsProjectModalOpen(false);
  };

  const addProject = async (projectData: {
    name: string;
    allocatedHours: number;
    leadId: string;
    parentId?: string;
    weight?: number;
    users?: ProjectUser[];
    frequency?: ProjectFrequency;
    frequencyDetail?: string;
    expectedSavedHours?: number;
    description: string;
    end_date: string;
    beneficiary: string;
    // May include team info from modal
    team_id?: number | string;
    teamId?: string;
  }) => {
  // Map modal data to required API fields
  const now = new Date().toISOString();
  const resolvedTeamId = (projectData as any).team_id ?? (projectData as any).teamId;
  const teamIdNumber = resolvedTeamId !== undefined && resolvedTeamId !== '' ? Number(resolvedTeamId) : NaN;
  if (!Number.isFinite(teamIdNumber) || teamIdNumber <= 0) {
    throw new Error('Please select a valid team before submitting.');
  }
  const apiProject = {
    name: projectData.name,
    description: projectData.description,
    end_date: projectData.end_date,
    status: 'Not started',
    owner_id: Number(projectData.leadId),
    team_id: teamIdNumber,
  allocatedHours: Number(projectData.allocatedHours) || 0,
  usedHours: 0,
    beneficiary: projectData.beneficiary,
    created_at: now,
    // Optionally add other fields from projectData if needed
  };
  const newProject = await api.addProject(apiProject);
  // Normalize for client usage
  const normalized = {
    ...newProject,
    id: String(newProject.id ?? newProject.insertId ?? ''),
    leadId: String(newProject.leadId ?? newProject.owner_id ?? projectData.leadId),
    allocatedHours: Number(newProject.allocatedHours ?? projectData.allocatedHours ?? 0),
    usedHours: Number(newProject.usedHours ?? 0),
    milestoneDate: newProject.milestoneDate ?? newProject.end_date ?? projectData.end_date,
  } as any;
  setProjects(prev => [...prev, normalized]);

  addAuditLog('Create Project', `created new project "${newProject.name}"`, newProject.id);

  if (newProject.leadId) {
    const lead = membersById[newProject.leadId];
    if (lead && lead.id !== currentUser?.id) {
      addNotification(
        `${currentUser?.name} created "${newProject.name}" and assigned you as project lead.`,
        lead.id,
        `project:${newProject.id}`
      );
    }
  }

  handleCloseProjectModal();
  };
  
  const handleOpenAddRiskIssueModal = (projectId: string | null = null) => {
    setEditingRiskIssue(null);
    setAddRiskIssueModalProjectId(projectId);
    setIsAddRiskIssueModalOpen(true);
  };

  const handleOpenEditRiskIssueModal = (task: Task) => {
    setEditingRiskIssue(task);
    setAddRiskIssueModalProjectId(task.projectId);
    setIsAddRiskIssueModalOpen(true);
  };

  const handleCloseRiskIssueModal = () => {
    setIsAddRiskIssueModalOpen(false);
    setEditingRiskIssue(null);
    setAddRiskIssueModalProjectId(null);
  };

  const handleSaveRiskIssue = async (data: {
    title: string;
    description: string;
    type: 'risk' | 'issue';
    projectId: string;
    priority: TaskPriority;
    severity: Severity;
    deadline: string;
    assigneeId: string | null;
    reason?: string;
  }) => {
    try {
      if (editingRiskIssue) {
        await updateTask(editingRiskIssue.id, {
            title: data.title,
            description: data.description,
            type: data.type,
            projectId: data.projectId,
            priority: data.priority,
            severity: data.severity,
            deadline: data.deadline,
            assigneeId: data.assigneeId,
        });
      } else {
        const isRisk = data.type === 'risk';
        const newTask: Omit<Task, 'id'> = {
            title: data.title,
            description: data.description,
            type: data.type,
            projectId: data.projectId,
            priority: data.priority,
            severity: data.severity,
            deadline: data.deadline,
            assigneeId: data.assigneeId,
            status: TaskStatus.NotStarted,
            statusReason: isRisk ? data.reason : undefined,
            difficulty: 5, // default difficulty
            endUserId: null,
            lastUpdated: new Date().toISOString(),
        };
        const addedTask = await api.addTask(newTask);
        setTasks(prev => [...prev, addedTask]);
        
        const typeLabel = addedTask.type === 'risk' ? 'Blocked' : (addedTask.type || 'task');
        addAuditLog(`Create ${typeLabel}`, `created new ${typeLabel}: "${addedTask.title}"`, addedTask.projectId);

        const project = projectsById[addedTask.projectId];
        if (project) {
            // Notify assignee
            if (addedTask.assigneeId) {
                const assignee = membersById[addedTask.assigneeId];
                if (assignee && assignee.id !== currentUser?.id) {
                    addNotification(
                        `You've been assigned a new ${typeLabel}: "${addedTask.title}" in project "${project.name}".`,
                        assignee.id,
                        `project:${project.id}`
                    );
                }
            }
            // Notify project lead
            if (project.leadId && project.leadId !== addedTask.assigneeId && project.leadId !== currentUser?.id) {
                const lead = membersById[project.leadId];
                if (lead) {
                    addNotification(
                        `A new ${typeLabel} "${addedTask.title}" was created in your project "${project.name}".`,
                        lead.id,
                        `project:${project.id}`
                    );
                }
            }
        }
      }
      handleCloseRiskIssueModal();
    } catch (err) {
        console.error("Failed to save risk/issue:", err);
    }
  };

  const handleUpdateProject = async (projectId: string, updates: Partial<Omit<Project, 'id'>>) => {
    try {
  const updatedProject = normalizeProjectResponse(await api.updateProject(projectId, updates));
      
      let allProjects = projects.map(p => (p.id === projectId ? updatedProject : p));
      let finalUpdatedParent: Project | null = null;
      
      if (updatedProject.parentId) {
        const parent = allProjects.find(p => p.id === updatedProject.parentId);
        if (parent) {
          const children = allProjects.filter(p => p.parentId === parent.id);
          const allChildrenCompleted = children.every(c => c.status === ProjectStatus.Completed);
          const anyChildStarted = children.some(c => c.status !== ProjectStatus.NotStarted);

          let newParentStatus: ProjectStatus;
          if (allChildrenCompleted) {
            newParentStatus = ProjectStatus.Completed;
          } else if (anyChildStarted) {
            newParentStatus = ProjectStatus.Started;
          } else {
            newParentStatus = ProjectStatus.NotStarted;
          }

          if (parent.status !== newParentStatus) {
            finalUpdatedParent = normalizeProjectResponse(await api.updateProject(parent.id, { status: newParentStatus }));
          }
        }
      }

      setProjects(prevProjects => {
        let newProjects = prevProjects.map(p => (p.id === projectId ? updatedProject : p));
        if (finalUpdatedParent) {
          newProjects = newProjects.map(p => (p.id === finalUpdatedParent!.id ? finalUpdatedParent : p));
        }
        return newProjects;
      });

      const changedFields = Object.keys(updates).join(', ');
      addAuditLog('Update Project', `updated fields: ${changedFields}`, projectId);
    } catch (err) {
      console.error("Failed to update project:", err);
    }
  };

  const handleProjectTimerAction = async (projectId: string, action: 'start' | 'end' | 'hold' | 'resume') => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    let updates: Partial<Project> = {};
    const now = new Date();

  switch(action) {
        case 'start':
        case 'resume':
            updates = {
                status: ProjectStatus.Started,
                timerStartTime: now.toISOString(),
            };
            break;
  case 'end':
      if (project.timerStartTime) {
        const raw = project.timerStartTime as string;
        const isoLocal = raw.includes('T') ? raw : raw.replace(' ', 'T');
        const startMs = new Date(isoLocal).getTime();
    const elapsedHours = Math.max(0, now.getTime() - startMs) / (1000 * 60 * 60);
        updates.usedHours = Math.max(0, project.usedHours || 0) + elapsedHours;
            }
            updates.timerStartTime = null;
            updates.status = ProjectStatus.Completed;
            updates.completedAt = now.toISOString();
            break;
  case 'hold':
      if (project.timerStartTime) {
        const raw = project.timerStartTime as string;
        const isoLocal = raw.includes('T') ? raw : raw.replace(' ', 'T');
        const startMs = new Date(isoLocal).getTime();
    const elapsedHours = Math.max(0, now.getTime() - startMs) / (1000 * 60 * 60);
        updates.usedHours = Math.max(0, project.usedHours || 0) + elapsedHours;
            }
            updates.timerStartTime = null;
            updates.status = ProjectStatus.Started; // Keep it started
            break;
    }
    
    // Optimistic UI update
    const prevProject = { ...project };
  const applyOptimistic = (p: Project): Project => {
      switch (action) {
        case 'start':
        case 'resume':
          return { ...p, status: ProjectStatus.Started, timerStartTime: now.toISOString() };
        case 'end': {
          let added = 0;
          if (p.timerStartTime) {
            const raw = p.timerStartTime as string;
            const isoLocal = raw.includes('T') ? raw : raw.replace(' ', 'T');
            const startMs = new Date(isoLocal).getTime();
            added = Math.max(0, now.getTime() - startMs) / (1000 * 60 * 60);
          }
          return { ...p, timerStartTime: null, status: ProjectStatus.Completed, completedAt: now.toISOString(), usedHours: Math.max(0, p.usedHours || 0) + added };
        }
        case 'hold': {
          let added = 0;
          if (p.timerStartTime) {
            const raw = p.timerStartTime as string;
            const isoLocal = raw.includes('T') ? raw : raw.replace(' ', 'T');
            const startMs = new Date(isoLocal).getTime();
            added = Math.max(0, now.getTime() - startMs) / (1000 * 60 * 60);
          }
          return { ...p, timerStartTime: null, status: ProjectStatus.Started, usedHours: Math.max(0, p.usedHours || 0) + added };
        }
        default:
          return p;
      }
    };

    setProjects(prev => prev.map(p => (p.id === projectId ? applyOptimistic(p as Project) : p)));

    try {
      await handleUpdateProject(projectId, updates);
      addAuditLog('Update Project Timer', `Timer action: ${action}`, projectId);
    } catch (e) {
      // Revert on failure
      setProjects(prev => prev.map(p => (p.id === projectId ? prevProject : p)));
      throw e;
    }
  };

  const deleteProject = async (projectId: string) => {
    const projectToDelete = projectsById[projectId];
    if (!projectToDelete) return;

    const children = projects.filter(p => p.parentId === projectId);
    let confirmMessage = `Are you sure you want to delete the project "${projectToDelete.name}"? This action cannot be undone.`;
    if (children.length > 0) {
        confirmMessage += `\n\nThis will also delete its ${children.length} sub-project(s) and all associated tasks.`;
    } else {
        confirmMessage += `\n\nThis will also delete all associated tasks.`;
    }

    if (window.confirm(confirmMessage)) {
        try {
            const { deletedProjectIds } = await api.deleteProject(projectId);
            
            setProjects(prevProjects => prevProjects.filter(p => !(deletedProjectIds ?? []).includes(p.id)));
            setTasks(prevTasks => prevTasks.filter(t => !(deletedProjectIds ?? []).includes(t.projectId)));

            addAuditLog('Delete Project', `Deleted project "${projectToDelete.name}" and its descendants.`, projectToDelete.parentId || projectId);
            
            if (viewingProjectId && deletedProjectIds.includes(viewingProjectId)) {
                handleBackFromProjectView();
            }
        } catch (err) {
            console.error("Failed to delete project:", err);
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            alert(`Delete failed: ${message}`);
        }
    }
  };

    const handleSaveToDo = async (data: Omit<ToDo, 'id' | 'createdAt' | 'ownerId'>) => {
        if (!currentUser) return;
        if (editingToDo) {
            const updated = await api.updateTodo(editingToDo.id, data);
            setToDos(prev => prev.map(t => t.id === updated.id ? updated : t));
            addAuditLog('Update ToDo', `Updated to-do: "${updated.title}"`);
        } else {
            const newTodoData: Omit<ToDo, 'id'> = {
                ...data,
                ownerId: currentUser.id,
                createdAt: new Date().toISOString(),
            };
            const added = await api.addTodo(newTodoData);
            setToDos(prev => [...prev, added]);
            addAuditLog('Create ToDo', `Created to-do: "${added.title}"`);
        }
        setIsAddToDoModalOpen(false);
        setEditingToDo(null);
    };

    const handleUpdateToDo = async (todoId: string, updates: Partial<Omit<ToDo, 'id'>>) => {
        const todo = toDos.find(t => t.id === todoId);
        if (!todo) return;

        let finalUpdates = { ...updates };

        if (updates.isComplete && todo.frequency !== ToDoFrequency.Once) {
            finalUpdates.isComplete = false; 
            finalUpdates.lastCompletedAt = new Date().toISOString();
            
            const [year, month, day] = todo.dueDate.split('-').map(Number);
            const currentDueDateUTC = new Date(Date.UTC(year, month - 1, day));
            let nextDueDateUTC = new Date(currentDueDateUTC);

            switch(todo.frequency) {
                case ToDoFrequency.Daily: nextDueDateUTC.setUTCDate(nextDueDateUTC.getUTCDate() + 1); break;
                case ToDoFrequency.Weekly: nextDueDateUTC.setUTCDate(nextDueDateUTC.getUTCDate() + 7); break;
                case ToDoFrequency.Monthly: nextDueDateUTC.setUTCMonth(nextDueDateUTC.getUTCMonth() + 1); break;
            }
            finalUpdates.dueDate = nextDueDateUTC.toISOString().split('T')[0];
        }

        const updated = await api.updateTodo(todoId, finalUpdates);
        setToDos(prev => prev.map(t => t.id === updated.id ? updated : t));
    };

    const handleDeleteToDo = async (todoId: string) => {
        const todo = toDos.find(t => t.id === todoId);
        if (!todo) return;
        if (window.confirm(`Are you sure you want to delete the to-do: "${todo.title}"?`)) {
            await api.deleteTodo(todoId);
            setToDos(prev => prev.filter(t => t.id !== todoId));
            addAuditLog('Delete ToDo', `Deleted to-do: "${todo.title}"`);
        }
    };


  const handleOpenFile = (file: StoreFile) => {
    setViewingFile(file);
  };

  const handleCloseFileViewer = () => {
    setViewingFile(null);
  };

  const handleLogLeave = (member: TeamMember | null) => {
    setMemberForLeaveLog(member);
    setIsAddLeaveModalOpen(true);
  };
  
  const handleAddLeave = async (leaveData: Omit<Leave, 'id'>) => {
    const newLeave = await api.addLeave(leaveData);
    setLeave(prev => [...prev, newLeave]);
    const member = membersById[leaveData.memberId];
    addAuditLog('Log Leave', `logged leave for "${member?.name}"`);
    setIsAddLeaveModalOpen(false);
  };
  
  const handleDeleteLeave = async (leaveId: string) => {
    await api.deleteLeave(leaveId);
    setLeave(prev => prev.filter(l => l.id !== leaveId));
  };

  const handleSelectMember = async (memberId: string) => {
    setViewingMemberId(memberId);
    const performanceData = await api.getMemberPerformance(memberId);
    setMemberPerformance(performanceData);
    setActiveTab('team'); // Ensure team tab is visually active
  };

  const handleBackFromMemberView = () => {
    setViewingMemberId(null);
    setMemberPerformance(null);
  };

  const handleOpenAddTeamModal = () => {
      setEditingTeam(null);
      setIsAddTeamModalOpen(true);
  };

  const handleOpenEditTeamModal = (team: Team) => {
      setEditingTeam(team);
      setIsAddTeamModalOpen(true);
  };

  const handleSaveTeam = async (name: string, description: string) => {
      if (editingTeam) {
          const updatedTeam = await api.updateTeam(editingTeam.id, { name, description });
          setTeams(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));
          addAuditLog('Update Team', `updated team "${updatedTeam.name}"`);
      } else {
          const newTeam = await api.addTeam(name, description);
          setTeams(prev => [...prev, newTeam]);
          addAuditLog('Create Team', `created new team "${newTeam.name}"`);
      }
      setIsAddTeamModalOpen(false);
      setEditingTeam(null);
  };

  const handleDeleteTeam = async (teamId: string) => {
      if (window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
          try {
              const team = teams.find(t => t.id === teamId);
              await api.deleteTeam(teamId);
              setTeams(prev => prev.filter(t => t.id !== teamId));
              if (team) {
                addAuditLog('Delete Team', `deleted team "${team.name}"`);
              }
          } catch (err) {
              const message = err instanceof Error ? err.message : 'An unknown error occurred.';
              alert(`Delete Failed: ${message}`);
          }
      }
  };
  
  const handleOpenCompleteProjectModal = (project: Project, subProjectId?: string) => {
    setProjectToComplete(project);
    setTriggeringSubProjectId(subProjectId || null);
  };
  
  const handleCloseCompleteProjectModal = () => {
    setProjectToComplete(null);
    setTriggeringSubProjectId(null);
  };

  const handleCompleteProject = async (data: { savedHours: number, frequency: ProjectFrequency, frequencyDetail?: string }) => {
    if (!projectToComplete) return;
    
    // This is the parent project
    await handleUpdateProject(projectToComplete.id, {
        ...data,
        status: ProjectStatus.Completed,
        completedAt: new Date().toISOString(),
    });
    
    // This is the sub-project that triggered the parent completion
    if (triggeringSubProjectId) {
        await handleUpdateProject(triggeringSubProjectId, {
            status: ProjectStatus.Completed,
            completedAt: new Date().toISOString(),
        });
    }

    handleCloseCompleteProjectModal();
  };

    const handleOpenNotSatisfiedModal = (project: Project) => {
        setProjectForStatusChange(project);
        setIsNotSatisfiedModalOpen(true);
    };

    const handleOpenCompletedBlockedModal = (project: Project) => {
        setProjectForStatusChange(project);
        setIsCompletedBlockedModalOpen(true);
    };

    const handleNotSatisfiedSubmit = async (comments: string) => {
        if (!projectForStatusChange || !currentUser) return;
        
        const feedback: EndUserFeedback = {
            rating: 1, // Hardcoded for "Not Satisfied"
            comments,
            authorId: currentUser.id,
            timestamp: new Date().toISOString(),
        };

        await handleUpdateProject(projectForStatusChange.id, {
            status: ProjectStatus.CompletedNotSatisfied,
            endUserFeedback: feedback,
            completedAt: new Date().toISOString(),
        });
        setIsNotSatisfiedModalOpen(false);
        setProjectForStatusChange(null);
    };

    const handleCompletedBlockedSubmit = async (comments: string) => {
        if (!projectForStatusChange || !currentUser) return;
        const newComment = {
            text: comments,
            authorId: currentUser.id,
            timestamp: new Date().toISOString()
        };
        await handleUpdateProject(projectForStatusChange.id, {
            status: ProjectStatus.CompletedBlocked,
            latestComments: newComment,
            completedAt: new Date().toISOString(),
        });
        setIsCompletedBlockedModalOpen(false);
        setProjectForStatusChange(null);
    };
    
    // New Handlers for Tools
    const handleOpenAddToolModal = () => {
        setEditingTool(null);
        setIsAddToolModalOpen(true);
    };

    const handleOpenEditToolModal = (tool: Tool) => {
        setEditingTool(tool);
        setIsAddToolModalOpen(true);
    };

    const handleSaveTool = async (name: string) => {
        if (editingTool) {
            const updated = await api.updateTool(editingTool.id, { name });
            setTools(prev => prev.map(t => t.id === updated.id ? updated : t));
        } else {
            const newTool = await api.addTool(name);
            setTools(prev => [...prev, newTool]);
        }
        setIsAddToolModalOpen(false);
        setEditingTool(null);
    };

    const handleDeleteTool = async (toolId: string) => {
        try {
            if (window.confirm('Are you sure you want to delete this tool?')) {
                await api.deleteTool(toolId);
                setTools(prev => prev.filter(t => t.id !== toolId));
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            alert(`Delete Failed: ${message}`);
        }
    };
    
    const handleOpenSelectToolsModal = (project: Project, newStatus: ProjectStatus) => {
        setProjectForToolsSelection({ project, newStatus });
        setIsSelectToolsModalOpen(true);
    };

    const handleSelectToolsSubmit = async (selectedToolIds: string[]) => {
        if (!projectForToolsSelection) return;
        const { project, newStatus } = projectForToolsSelection;
        await handleUpdateProject(project.id, {
            status: newStatus,
            toolsUsed: selectedToolIds,
        });
        setIsSelectToolsModalOpen(false);
        setProjectForToolsSelection(null);
    };

    const handleOpenLogUsageModal = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        
        const completedStatuses = [ProjectStatus.Completed, ProjectStatus.CompletedBlocked, ProjectStatus.CompletedNotSatisfied];
        if (!completedStatuses.includes(project.status)) {
            alert("Saved time can only be logged for completed projects. Please complete the project first.");
            return;
        }

        setProjectToLogUsage(project);
    };

    const handleSaveProjectUsage = async (projectId: string, savedHours: number) => {
        if (!currentUser) return;
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const now = new Date().toISOString();
        const newUsageEntry = { userId: currentUser.id, date: now, savedHours };
        const newUsage = [...(project.lastUsedBy || []), newUsageEntry];
        const totalSavedHours = (project.savedHours || 0) + savedHours;

        await handleUpdateProject(projectId, { lastUsedBy: newUsage, savedHours: totalSavedHours });
        addAuditLog('Log Project Usage', `logged ${savedHours} saved hours for "${project.name}"`, projectId);
        setProjectToLogUsage(null);
    };

    const handleOpenCompletedProjectsSummaryModal = (projects: Project[]) => {
        setSummaryProjects(projects);
        setIsCompletedProjectsSummaryModalOpen(true);
    };

    const handleOpenLogSavedTimeModal = () => {
        const now = new Date();
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const { startOfWeek } = getWeekBoundaries(now);
        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

        const dueProjects = projects.filter(p => {
            if (p.status !== ProjectStatus.Completed || !p.frequency) {
                return false;
            }

            const lastLog = p.lastUsedBy && p.lastUsedBy.length > 0
                ? [...p.lastUsedBy].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                : null;

            if (!lastLog) return true;

            const lastLogDate = new Date(lastLog.date);
            lastLogDate.setUTCHours(0, 0, 0, 0);

            switch (p.frequency) {
                case ProjectFrequency.Daily:
                    return lastLogDate.getTime() < today.getTime();
                case ProjectFrequency.Weekly:
                    return lastLogDate < startOfWeek;
                case ProjectFrequency.Monthly:
                    return lastLogDate < startOfMonth;
                case ProjectFrequency.TwiceAMonth:
                    const [d1, d2] = (p.frequencyDetail || "1,15").split(',').map(Number);
                    const firstDueDate = new Date(startOfMonth);
                    firstDueDate.setUTCDate(d1);
                    const secondDueDate = new Date(startOfMonth);
                    secondDueDate.setUTCDate(d2);
                    if (today >= firstDueDate && lastLogDate < firstDueDate) return true;
                    if (today >= secondDueDate && lastLogDate < secondDueDate) return true;
                    return false;
                case ProjectFrequency.ThreeWeeksOnce:
                    const threeWeeksInMs = 21 * 24 * 60 * 60 * 1000;
                    return today.getTime() - lastLogDate.getTime() >= threeWeeksInMs;
                case ProjectFrequency.SpecificDates:
                    try {
                        const dates = JSON.parse(p.frequencyDetail || '[]') as string[];
                        const futureDueDates = dates
                            .map(d => new Date(`${d}T00:00:00.000Z`))
                            .filter(d => d.getTime() > lastLogDate.getTime());
                        return futureDueDates.some(dueDate => dueDate.getTime() <= today.getTime());
                    } catch { return false; }
                default:
                    return false;
            }
        });
        setProjectsToLogSavedTime(dueProjects);
        setIsLogSavedTimeModalOpen(true);
    };

    const handleLogSavedTime = async (logs: { projectId: string; savedHours: number }[]) => {
        if (!currentUser) return;
        const now = new Date().toISOString();

        const updatePromises = logs.map(log => {
            const project = projects.find(p => p.id === log.projectId);
            if (!project) return Promise.resolve();
            
            const auditDetails = `Logged ${log.savedHours.toFixed(1)} saved hours for "${project.name}". Beneficiaries: ${
                (project.users || []).map(u => {
                    if (u.type === 'user') return teamMembers.find(m => m.id === u.id)?.name;
                    return `Team ${teams.find(t => t.id === u.id)?.name}`;
                }).filter(Boolean).join(', ') || 'N/A'
            }. Logged by ${currentUser.name} on ${new Date(now).toLocaleDateString()}.`;

            addAuditLog('Log Project Usage', auditDetails, log.projectId);


            const newUsageEntry = { userId: currentUser.id, date: now, savedHours: log.savedHours };
            const newUsage = [...(project.lastUsedBy || []), newUsageEntry];
            const totalSavedHours = (project.savedHours || 0) + log.savedHours;

            return handleUpdateProject(log.projectId, { lastUsedBy: newUsage, savedHours: totalSavedHours });
        });

        await Promise.all(updatePromises);
        setIsLogSavedTimeModalOpen(false);
    };


  const membersById = useMemo(() => {
    return teamMembers.reduce((acc, member) => {
      acc[member.id] = member;
      return acc;
    }, {} as Record<string, TeamMember>);
  }, [teamMembers]);
  
  const projectsById = useMemo(() => {
    return projects.reduce((acc, project) => {
      acc[project.id] = project;
      return acc;
    }, {} as Record<string, Project>);
  }, [projects]);

  const tasksById = useMemo(() => {
    return tasks.reduce((acc, task) => {
      acc[task.id] = task;
      return acc;
    }, {} as Record<string, Task>);
  }, [tasks]);

  const handleSelectProject = (projectId: string) => {
    setViewingProjectId(projectId);
  };
  
  const handleBackFromProjectView = () => {
    setViewingProjectId(null);
  };

  const handleNavigateToRisksForProject = (projectId: string) => {
    setRiskIssueProjectFilterId(projectId);
    setActiveTab('risks-issues');
  };
  
  const handleClearRiskIssueProjectFilter = () => {
    setRiskIssueProjectFilterId(null);
  }

  const handleTabChange = (tabId: string) => {
    if (tabId === 'risks-issues' && riskIssueProjectFilterId) {
        setRiskIssueProjectFilterId(null);
    }
    setViewingProjectId(null);
    setViewingMemberId(null);
    setViewingTeamId(null);
    setActiveTab(tabId);
  }

  const renderContent = () => {
    if (viewingProjectId) {
        return (
            <ProjectDetailView
                projectId={viewingProjectId}
                onBack={handleBackFromProjectView}
                projects={projects}
                tasks={tasks}
                membersById={membersById}
                auditLogs={auditLogs}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={deleteProject}
                onAddSubProject={() => handleOpenAddProjectModal(viewingProjectId)}
                onOpenEditModal={handleOpenEditProjectModal}
                onOpenAddRiskIssueModal={handleOpenAddRiskIssueModal}
                currentUser={currentUser!}
                onProjectTimerAction={handleProjectTimerAction}
                onNavigateToRisksForProject={handleNavigateToRisksForProject}
                onOpenCompleteProjectModal={handleOpenCompleteProjectModal}
                onOpenNotSatisfiedModal={handleOpenNotSatisfiedModal}
                onOpenCompletedBlockedModal={handleOpenCompletedBlockedModal}
                onOpenSelectToolsModal={handleOpenSelectToolsModal}
            />
        );
    }
    
    if (viewingMemberId && memberPerformance) {
        const member = membersById[viewingMemberId];
        const memberProjects = projects.filter(p => p.leadId === viewingMemberId);
        const memberProjectIds = new Set(memberProjects.map(p => p.id));
        const memberTasks = tasks.filter(t => memberProjectIds.has(t.projectId) || t.assigneeId === viewingMemberId);
        return (
            <MemberPerformanceView
                member={member}
                performance={memberPerformance}
                projects={memberProjects}
                tasks={memberTasks}
                membersById={membersById}
                onBack={handleBackFromMemberView}
                onSelectProject={handleSelectProject}
            />
        );
    }

    return renderMainView();
  };

  const renderMainView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ExecutiveDashboard 
                    executiveSummary={executiveSummary}
                    projects={projects}
                    tasks={tasks}
                    teamMembers={teamMembers}
                    membersById={membersById}
                    projectsById={projectsById}
                    onSelectProject={handleSelectProject}
                    onUpdateTask={updateTask}
                    onCompleteTask={(task) => setCompletingTask(task)}
                    onDeleteTask={deleteTask}
                    currentUser={currentUser!}
                    onOpenFile={handleOpenFile}
                />;
      case 'projects':
        return <ProjectsView
          projects={projects}
          tasks={tasks}
          membersById={membersById}
          onAddProject={() => handleOpenAddProjectModal()}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={deleteProject}
          onSelectProject={handleSelectProject}
          onOpenEditModal={handleOpenEditProjectModal}
          onSelectMember={handleSelectMember}
          onNavigateToRisksForProject={handleNavigateToRisksForProject}
          currentUser={currentUser!}
          onOpenCompleteProjectModal={handleOpenCompleteProjectModal}
          onOpenNotSatisfiedModal={handleOpenNotSatisfiedModal}
          onOpenCompletedBlockedModal={handleOpenCompletedBlockedModal}
          onOpenSelectToolsModal={handleOpenSelectToolsModal}
        />;
      case 'technical-team':
            return <TechnicalTeamView 
                projects={projects}
                tasks={tasks}
                teamMembers={teamMembers}
                teams={teams}
                tools={tools}
                membersById={membersById}
                projectsById={projectsById}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={deleteProject}
                onSelectProject={handleSelectProject}
                currentUser={currentUser!}
                onOpenCompleteProjectModal={handleOpenCompleteProjectModal}
                onOpenNotSatisfiedModal={handleOpenNotSatisfiedModal}
                onOpenCompletedBlockedModal={handleOpenCompletedBlockedModal}
                onOpenLogUsageModal={handleOpenLogUsageModal}
                onOpenSelectToolsModal={handleOpenSelectToolsModal}
                onOpenCompletedProjectsSummaryModal={handleOpenCompletedProjectsSummaryModal}
                onOpenLogSavedTimeModal={handleOpenLogSavedTimeModal}
                onNavigateToRisksForProject={handleNavigateToRisksForProject}
            />;
       case 'todo':
        return <ToDoView
            toDos={toDos}
            currentUser={currentUser!}
            onAddToDo={() => { setEditingToDo(null); setIsAddToDoModalOpen(true); }}
            onEditToDo={(todo) => { setEditingToDo(todo); setIsAddToDoModalOpen(true); }}
            onUpdateToDo={handleUpdateToDo}
            onDeleteToDo={handleDeleteToDo}
        />;
      case 'team':
        return <StaffPage
                    teams={teams}
                    teamMembers={teamMembers}
                    viewingTeamId={viewingTeamId}
                    onSelectTeam={(teamId) => setViewingTeamId(teamId)}
                    onBackFromTeamView={() => setViewingTeamId(null)}
                    onSelectMember={handleSelectMember}
                />;
      case 'risks-issues':
        return <RisksAndIssuesView
          tasks={tasks}
          projectsById={projectsById}
          membersById={membersById}
          currentUser={currentUser!}
          onAddRiskIssue={() => handleOpenAddRiskIssueModal()}
          onEditRiskIssue={handleOpenEditRiskIssueModal}
          onSelectProject={handleSelectProject}
          projectIdFilter={riskIssueProjectFilterId}
          onClearProjectFilter={handleClearRiskIssueProjectFilter}
        />;
      case 'settings':
        return <SettingsView
            systemConfiguration={systemConfiguration}
            projectPhases={projectPhases}
            departments={departments}
            riskLevels={riskLevels}
            teams={teams}
            teamMembers={teamMembers}
            tools={tools}
            currentUser={currentUser!}
            onOpenAddTeamModal={handleOpenAddTeamModal}
            onOpenEditTeamModal={handleOpenEditTeamModal}
            onDeleteTeam={handleDeleteTeam}
            onOpenAddMemberModal={() => setIsAddMemberModalOpen(true)}
            onDeleteMember={deleteMember}
            onUpdateMemberRole={onUpdateMemberRole}
            onOpenAddToolModal={handleOpenAddToolModal}
            onOpenEditToolModal={handleOpenEditToolModal}
            onDeleteTool={handleDeleteTool}
        />;
      default:
        return <div>Select a tab</div>;
    }
  };

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  const unreadNotifications = notifications.filter(n => !n.isRead && n.recipientId === currentUser.id);

  const handleNotificationClick = (notification: Notification) => {
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
    setIsNotificationsPanelOpen(false);
    if (notification.link) {
      if (notification.link.startsWith('project:')) {
        const projectId = notification.link.split(':')[1];
        handleSelectProject(projectId);
      } else if (notification.link === 'todo') {
        setActiveTab('todo');
      }
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => n.recipientId === currentUser!.id ? { ...n, isRead: true } : n));
  }

  return (
    <div className={`flex h-screen bg-light-bg text-light-text-primary dark:bg-dark-bg dark:text-dark-text-primary transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <Sidebar 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            currentUser={currentUser}
        />
        <main className="flex-1 flex flex-col h-screen overflow-y-auto">
            <Header 
                currentUser={currentUser} 
                onLogout={handleLogout} 
                theme={theme}
                onToggleTheme={toggleTheme}
                notifications={notifications.filter(n => n.recipientId === currentUser.id)}
                unreadNotificationCount={unreadNotifications.length}
                onNotificationClick={handleNotificationClick}
                onMarkAllAsRead={markAllNotificationsAsRead}
                isNotificationsPanelOpen={isNotificationsPanelOpen}
                onToggleNotificationsPanel={() => setIsNotificationsPanelOpen(prev => !prev)}
            />
            <div className="flex-1 p-8">
                {isLoading && <div>Loading...</div>}
                {error && <div className="text-red-500">{error}</div>}
                {!isLoading && !error && renderContent()}
            </div>
        </main>

        {isAddMemberModalOpen && <AddMemberModal isOpen={isAddMemberModalOpen} onClose={() => setIsAddMemberModalOpen(false)} onAddMember={addMember} teams={teams} teamMembers={teamMembers} />}
        
        {isProjectModalOpen && <AddProjectModal 
            isOpen={isProjectModalOpen} 
            onClose={handleCloseProjectModal} 
            onAddProject={addProject} 
            onUpdateProject={handleUpdateProject}
            teamMembers={teamMembers}
            parentId={addProjectModalParentId}
            editingProject={editingProject}
            teams={teams}
        />}

        {isAddRiskIssueModalOpen && <AddRiskIssueModal
            isOpen={isAddRiskIssueModalOpen}
            onClose={handleCloseRiskIssueModal}
            onSave={handleSaveRiskIssue}
            projects={projects}
            teamMembers={teamMembers}
            editingItem={editingRiskIssue}
            defaultProjectId={addRiskIssueModalProjectId}
        />}

        {isAddToDoModalOpen && <AddToDoModal
            isOpen={isAddToDoModalOpen}
            onClose={() => { setIsAddToDoModalOpen(false); setEditingToDo(null); }}
            onSave={handleSaveToDo}
            editingToDo={editingToDo}
        />}

        {completingTask && <CompleteTaskModal 
            isOpen={!!completingTask} 
            onClose={() => setCompletingTask(null)}
            task={completingTask}
            onComplete={handleCompleteTask}
        />}

        {viewingFile && <FileViewerModal isOpen={!!viewingFile} onClose={handleCloseFileViewer} file={viewingFile} />}

        {isAddLeaveModalOpen && <AddLeaveModal 
            isOpen={isAddLeaveModalOpen} 
            onClose={() => setIsAddLeaveModalOpen(false)}
            onAddLeave={handleAddLeave}
            member={memberForLeaveLog}
            teamMembers={teamMembers}
        />}

        {isAddTeamModalOpen && <AddTeamModal
            isOpen={isAddTeamModalOpen}
            onClose={() => setIsAddTeamModalOpen(false)}
            onSave={handleSaveTeam}
            editingTeam={editingTeam}
        />}

        {projectToComplete && <CompleteProjectModal
            isOpen={!!projectToComplete}
            onClose={handleCloseCompleteProjectModal}
            project={projectToComplete}
            onComplete={handleCompleteProject}
        />}
        
        {isNotSatisfiedModalOpen && <NotSatisfiedFeedbackModal
            isOpen={isNotSatisfiedModalOpen}
            onClose={() => setIsNotSatisfiedModalOpen(false)}
            project={projectForStatusChange}
            onSubmit={handleNotSatisfiedSubmit}
        />}

        {isCompletedBlockedModalOpen && <CompletedBlockedCommentModal
            isOpen={isCompletedBlockedModalOpen}
            onClose={() => setIsCompletedBlockedModalOpen(false)}
            project={projectForStatusChange}
            onSubmit={handleCompletedBlockedSubmit}
        />}

        {isAddToolModalOpen && <AddToolModal
            isOpen={isAddToolModalOpen}
            onClose={() => setIsAddToolModalOpen(false)}
            onSave={handleSaveTool}
            editingTool={editingTool}
        />}

        {isSelectToolsModalOpen && projectForToolsSelection && <SelectToolsModal
            isOpen={isSelectToolsModalOpen}
            onClose={() => setIsSelectToolsModalOpen(false)}
            onSubmit={handleSelectToolsSubmit}
            allTools={tools}
            initialSelectedIds={projectForToolsSelection.project.toolsUsed}
        />}
        
        {projectToLogUsage && <LogUsageModal
            isOpen={!!projectToLogUsage}
            onClose={() => setProjectToLogUsage(null)}
            project={projectToLogUsage}
            onSave={handleSaveProjectUsage}
        />}
        
        {isCompletedProjectsSummaryModalOpen && <CompletedProjectsSummaryModal
            isOpen={isCompletedProjectsSummaryModalOpen}
            onClose={() => setIsCompletedProjectsSummaryModalOpen(false)}
            projects={summaryProjects}
            teams={teams}
            teamMembers={teamMembers}
        />}

        {isLogSavedTimeModalOpen && <LogSavedTimeModal
            isOpen={isLogSavedTimeModalOpen}
            onClose={() => setIsLogSavedTimeModalOpen(false)}
            projects={projectsToLogSavedTime}
            onSave={handleLogSavedTime}
            teamMembers={teamMembers}
            teams={teams}
            onUpdateProject={handleUpdateProject}
        />}
    </div>
  );
};

export default App;
