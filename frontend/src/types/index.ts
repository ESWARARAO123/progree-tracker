export type UserRole = 'ADMIN' | 'EMPLOYEE';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  designation: string;
  avatarUrl?: string;
  isActive: boolean;
  currentProjectId?: string;
}

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LEAVE' | 'WFH' | 'HALF_DAY' | 'LATE_LOGIN';
export type RequestType = 'LEAVE';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveBalance {
  totalAllowed: number;
  used: number;
  available: number;
  month: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime?: string;
  meetingLink?: string;
  createdBy: string;
  createdByName?: string;
  assigneeIds: string[];
  assigneeNames: string[];
  createdAt: string;
}

export interface CompanyHoliday {
  id: string;
  name: string;
  description?: string;
  date: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  priority: Priority;
  status: ProjectStatus;
  progressPercentage: number;
  assignedUsers: User[];
  owner?: { id: string; fullName: string; email: string };
  overdueTasksCount: number;
}

export interface ProjectRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  projectId: string;
  projectName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewerName?: string;
  adminComment?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  assignedTo: string;
  assignedToName: string;
  dueDate: string;
  createdAt?: string;
}

export interface DailyTaskUpdate {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  reportDate: string;
  
  // Morning Update
  morningPlannedWork?: string;
  morningProjectId?: string;
  morningProjectName?: string;
  morningTaskId?: string;
  morningTaskTitle?: string;
  morningStatus?: TaskStatus;
  morningEstHours?: number;
  morningBlockers?: string;
  morningSubmittedAt?: string;
  
  // Evening Update
  eveningCompletedWork?: string;
  eveningRemainingWork?: string;
  eveningHoursSpent?: number;
  eveningChallenges?: string;
  eveningNextDayPlan?: string;
  eveningSubmittedAt?: string;
  
  isLocked: boolean;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  status: AttendanceStatus;
  loginTime?: string;
  logoutTime?: string;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestType: RequestType;
  startDate: string;
  endDate: string;
  reason: string;
  status: RequestStatus;
  reviewedBy?: string;
  adminComment?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: 'REMINDER' | 'LEAVE' | 'PROJECT' | 'TASK';
  link?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  actionType: string;
  ipAddress: string;
  details: string;
  createdAt: string;
}
