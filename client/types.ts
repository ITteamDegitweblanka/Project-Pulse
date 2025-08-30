
export interface Team {
  id: string;
  name: string;
  description: string;
}

export enum TaskStatus {
  NotStarted = '01.Task not started',
  InProgress = '02.Task is started',
  OnHold = '02a.On Hold',
  Blocked = '02b.Blocked',
  UserTesting = '03.User - Testing',
  Update = '04.Update',
  Completed = '05.Completed',
}

export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Urgent = 'Urgent',
}

export enum Role {
  MD = 'MD',
  Director = 'Director',
  AdminManager = 'Admin Manager',
  OperationManager = 'Operation Manager',
  SuperLeader = 'Super Leader',
  TeamLeader = 'Team Leader',
  SubTeamLeader = 'Sub-team Leader',
  Staff = 'Staff',
}

export interface TeamMember {
  id: string;
  name: string;
  avatarUrl: string;
  role: Role;
  title: string;
  certifications: string[];
  teamId?: string;
  subTeamLeaderId?: string;
  officeLocation?: string;
}

export enum ProjectStatus {
  NotStarted = 'Not started',
  Started = 'Started',
  UserTesting = 'User - Testing',
  Update = 'Update',
  Blocked = 'Blocked',
  Completed = 'Completed',
  CompletedBlocked = 'Completed Blocked',
  CompletedNotSatisfied = 'Completed, Not Satisfied',
}

export type RiskLevel = 'Low' | 'Medium' | 'High';
export enum Severity {
    Critical = 'Critical',
    High = 'High',
    Medium = 'Medium',
    Low = 'Low'
}

export interface EndUserFeedback {
    rating: number; // 1-5
    comments: string;
    authorId: string;
    timestamp: string; // ISO String
}

export enum ProjectFrequency {
    Daily = 'Daily',
    Weekly = 'Weekly',
    TwiceAMonth = 'Twice a month',
    ThreeWeeksOnce = '3 weeks once',
    Monthly = 'Monthly',
    SpecificDates = 'Specific Dates',
}

export type ProjectUser = {
    type: 'user' | 'team';
    id: string;
};

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  leadId: string;
  endUserId?: string;
  phase: string;
  milestoneDate: string; // Next Milestone date
  code: string;
  department: string;
  description: string;
  riskLevel: RiskLevel;
  startDate: string;
  targetEndDate: string;
  lastUpdate: string;
  latestComments: { text: string; authorId: string; timestamp: string } | null;
  allocatedHours: number;
  additionalHours: number;
  team: { memberId: string; projectRole: string; allocation: number }[];
  endUserFeedback?: EndUserFeedback;
  overageReason?: string;
  parentId?: string;
  weight?: number; // As a percentage, e.g. 50 for 50%
  usedHours: number;
  timerStartTime: string | null;
  teamId?: string;
  frequency?: ProjectFrequency;
  users?: ProjectUser[];
  savedHours?: number;
  completedAt?: string;
  frequencyDetail?: string;
  toolsUsed?: string[];
  lastUsedBy?: { userId: string; date: string; savedHours?: number }[];
  expectedSavedHours?: number;
}

export interface StoreLink {
  type: 'link';
  url: string;
}

export interface StoreFile {
  type: 'file';
  name: string;
  content: string; // data: url
  mimeType: string;
}

export type StoreItem = StoreLink | StoreFile;


export interface Task {
  id: string;
  title: string;
  description:string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string; // ISO string format
  assigneeId: string | null;
  endUserId: string | null;
  projectId: string;
  timeSpent?: number;
  timeSaved?: number;
  difficulty: number;
  completedAt?: string; // ISO string format
  completionReference?: string;
  statusReason?: string;
  comments?: string;
  userRequirements?: string;
  store?: StoreItem[];
  estimatedHours?: number;
  type?: 'task' | 'issue' | 'risk';
  severity?: Severity;
  code?: string;
  lastUpdated?: string;
}

export interface ExecutiveSummary {
  totalProjects: { value: { total: number; parent: number; children: number; }; changeText: string };
  totalAllocatedHours: { value: number; changeText: string };
  openIssues: { value: number; changeText: string };
  openBlockers: { value: number; changeText: string };
  teamMembers: { value: number; changeText: string };
  ragDistribution: {
    green: number;
    yellow: number;
    red: number;
  };
  keyTrends: {
    onTimeDeliveryPercent: number;
    hoursUtilizationPercent: number;
    issueResolutionTimeDays: number;
  };
}

export interface Leave {
  id: string;
  memberId: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  reason?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO string
  userId: string;
  userName: string;
  action: string;
  details: string;
  projectId?: string;
}

export interface MemberPerformance {
    projectSuccessRate: { value: number; change: number };
    onTimeDelivery: { value: number; change: number };
    stakeholderSatisfaction: { value: number; change: number };
    efficiencyMetrics: {
        issueResolutionTimeDays: number;
        resourceUtilization: number;
        changeRequestEfficiency: number;
        riskMitigationScore: number;
    };
    overallPerformance: {
        score: number;
        rating: string;
    };
    teamSatisfaction: number;
    avgProjectDurationMonths: number;
}

// Settings Page Types
export interface SystemConfiguration {
    organizationName: string;
    notificationEmail: string;
    defaultCurrency: string;
    autoEscalationDays: number;
    fiscalYearStart: string;
    backupFrequency: string;
}

export type DropdownItemStatus = 'Active' | 'Inactive';

export interface ProjectPhase {
    id: string;
    name: string;
    description: string;
    status: DropdownItemStatus;
}

export interface Department {
    id: string;
    name: string;
    description: string;
    status: DropdownItemStatus;
}

export interface Tool {
    id: string;
    name: string;
    status: DropdownItemStatus;
}

export interface RiskLevelSetting {
    id: string;
    level: string;
    description: string;
    color: string;
    status: DropdownItemStatus;
}

export interface Notification {
  id: string;
  recipientId: string;
  message: string;
  link?: string; // e.g. 'project:p1' or 'todo'
  isRead: boolean;
  createdAt: string; // ISO string
}

export enum ToDoFrequency {
    Once = 'Once',
    Daily = 'Daily',
    Weekly = 'Weekly',
    Monthly = 'Monthly',
}

export interface ToDo {
  id: string;
  title: string;
  ownerId: string;
  isComplete: boolean;
  dueDate: string; // 'YYYY-MM-DD'
  dueTime: string; // 'HH:MM'
  frequency: ToDoFrequency;
  createdAt: string; // ISO String
  lastCompletedAt?: string;
}
