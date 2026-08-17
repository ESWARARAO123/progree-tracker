import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as api from '../api';
import type { User, Project, Task, DailyTaskUpdate, AttendanceRecord, LeaveRequest, AppNotification, AuditLog, ProjectRequest, LeaveBalance, Meeting, CompanyHoliday } from '../types';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  projects: Project[];
  tasks: Task[];
  updates: DailyTaskUpdate[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  leaveBalance: LeaveBalance | null;
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  projectRequests: ProjectRequest[];
  meetings: Meeting[];
  holidays: CompanyHoliday[];
  loading: boolean;
  error: string | null;
  updateProject: (projectId: string, data: any) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  selectProject: (projectId: string) => Promise<void>;
  requestProjectAccess: (projectId: string) => Promise<void>;
  requestToJoinProject: () => Promise<void>;
  reviewProjectRequest: (requestId: string, status: 'APPROVED' | 'REJECTED') => Promise<void>;
  createMeeting: (data: { title: string; description?: string; date: string; startTime: string; endTime?: string; meetingLink?: string; assigneeIds: string[] }) => Promise<void>;
  updateMeeting: (meetingId: string, data: { title?: string; description?: string; date?: string; startTime?: string; endTime?: string; meetingLink?: string; assigneeIds?: string[] }) => Promise<void>;
  deleteMeeting: (meetingId: string) => Promise<void>;
  createCompanyHoliday: (data: { name: string; description?: string; date: string }) => Promise<void>;
  deleteCompanyHoliday: (holidayId: string) => Promise<void>;
  submitMorningUpdate: (data: { projectId: string | null; taskId?: string | null; taskTitle?: string; plannedWork: string; estHours: number; blockers?: string }) => Promise<void>;
  submitEveningUpdate: (data: { completedWork: string; remainingWork: string; hoursSpent: number; challenges?: string; nextDayPlan: string }) => Promise<void>;
  createProject: (project: any) => Promise<void>;
  createTask: (task: any) => Promise<void>;
  updateTaskStatus: (taskId: string, status: Task['status'], attachmentUrl?: string, attachmentName?: string) => Promise<void>;
  updateTask: (taskId: string, data: any) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  applyLeave: (data: { requestType?: string; startDate: string; endDate: string; reason: string }) => Promise<void>;
  reviewLeaveRequest: (id: string, status: 'APPROVED' | 'REJECTED', comment?: string) => Promise<void>;
  deleteLeaveRequest: (id: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  updatePreferences: (preferences: Record<string, any>) => Promise<void>;
  trigger10PmScan: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  refreshData: () => Promise<void>;
}

function mapUser(u: any): User {
  return {
    id: u.id,
    fullName: u.full_name || u.fullName,
    email: u.email,
    role: u.role,
    department: u.department || '',
    designation: u.designation || '',
    isActive: u.is_active ?? u.isActive ?? true,
    currentProjectId: u.current_project_id || u.currentProjectId,
    preferences: u.preferences || {},
  };
}

function mapProject(p: any): Project {
  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    startDate: p.start_date || p.startDate,
    endDate: p.end_date || p.endDate,
    priority: p.priority,
    status: p.status,
    progressPercentage: typeof p.progress_percentage === 'number' ? p.progress_percentage : p.progressPercentage ?? 0,
    assignedUsers: (p.assigned_users || p.assignedUsers || []).map(mapUser),
    owner: p.owner ? { id: p.owner.id, fullName: p.owner.full_name, email: p.owner.email } : undefined,
    overdueTasksCount: p.overdue_tasks_count ?? p.overdueTasksCount ?? 0,
    createdAt: p.created_at || p.createdAt || '',
  };
}

function mapProjectRequest(r: any): ProjectRequest {
  return {
    id: r.id,
    userId: r.user_id || r.userId,
    userName: r.user_name || r.userName || '',
    userEmail: r.user_email || r.userEmail || '',
    projectId: r.project_id || r.projectId,
    projectName: r.project_name || r.projectName || '',
    status: r.status,
    reviewerName: r.reviewer_name || '',
    adminComment: r.admin_comment || '',
    createdAt: r.created_at || r.createdAt || '',
  };
}

function mapTask(t: any): Task {
  return {
    id: t.id,
    projectId: t.project_id || t.projectId,
    projectName: t.project_name || t.projectName || '',
    title: t.title,
    description: t.description || '',
    priority: t.priority,
    status: t.status,
    assignedTo: t.assigned_to || t.assignedTo || '',
    assignedToName: t.assigned_to_name || t.assignedToName || '',
    createdBy: t.created_by || t.createdBy || '',
    createdByName: t.created_by_name || t.createdByName || '',
    dueDate: t.due_date || t.dueDate || '',
    attachmentUrl: t.attachment_url || t.attachmentUrl,
    attachmentName: t.attachment_name || t.attachmentName,
    createdAt: t.created_at || t.createdAt || '',
  };
}

function mapUpdate(u: any): DailyTaskUpdate {
  return {
    id: u.id,
    userId: u.user_id || u.userId,
    userName: u.user_name || u.userName || '',
    userEmail: u.user_email || u.userEmail || '',
    reportDate: u.report_date || u.reportDate,
    morningPlannedWork: u.morning_planned_work || u.morningPlannedWork,
    morningProjectId: u.project_id || u.morning_project_id || u.morningProjectId,
    morningProjectName: u.morning_project_name || u.morningProjectName,
    morningTaskId: u.task_id || u.morning_task_id || u.morningTaskId,
    morningTaskTitle: u.morning_task_title || u.morningTaskTitle,
    morningStatus: u.morning_status || u.morningStatus,
    morningEstHours: u.morning_est_hours ?? u.morningEstHours,
    morningBlockers: u.morning_blockers || u.morningBlockers,
    morningSubmittedAt: u.morning_submitted_at || u.morningSubmittedAt,
    eveningCompletedWork: u.evening_completed_work || u.eveningCompletedWork,
    eveningRemainingWork: u.evening_remaining_work || u.eveningRemainingWork,
    eveningHoursSpent: u.evening_hours_spent ?? u.eveningHoursSpent,
    eveningChallenges: u.evening_challenges || u.eveningChallenges,
    eveningNextDayPlan: u.evening_next_day_plan || u.eveningNextDayPlan,
    eveningSubmittedAt: u.evening_submitted_at || u.eveningSubmittedAt,
    attachmentUrl: u.attachment_url || u.attachmentUrl,
    attachmentName: u.attachment_name || u.attachmentName,
    isLocked: u.is_locked ?? u.isLocked ?? false,
  };
}

function mapLeave(l: any): LeaveRequest {
  return {
    id: l.id,
    userId: l.user_id || l.userId,
    userName: l.user_name || l.userName || '',
    userEmail: l.user_email || l.userEmail || '',
    requestType: l.request_type || l.requestType,
    startDate: l.start_date || l.startDate,
    endDate: l.end_date || l.endDate,
    reason: l.reason,
    status: l.status,
    reviewedBy: l.reviewed_by || l.reviewedBy || l.reviewer_name || '',
    adminComment: l.admin_comment || l.adminComment,
    createdAt: l.created_at || l.createdAt || '',
  };
}

function mapLeaveBalance(b: any): LeaveBalance {
  return {
    totalAllowed: b.total_allowed ?? b.totalAllowed ?? 2,
    used: b.used ?? 0,
    available: b.available ?? 0,
    month: b.month || '',
    usedLeave: b.used_leave ?? b.usedLeave ?? b.used ?? 0,
    usedWfh: b.used_wfh ?? b.usedWfh ?? 0,
    usedWfbo: b.used_wfbo ?? b.usedWfbo ?? 0,
  };
}

function mapMeeting(m: any): Meeting {
  return {
    id: m.id,
    title: m.title,
    description: m.description || '',
    date: m.date,
    startTime: m.start_time || m.startTime,
    endTime: m.end_time || m.endTime,
    meetingLink: m.meeting_link || m.meetingLink,
    createdBy: m.created_by || m.createdBy,
    createdByName: m.created_by_name || m.createdByName || '',
    assigneeIds: m.assignee_ids || m.assigneeIds || [],
    assigneeNames: m.assignee_names || m.assigneeNames || [],
    createdAt: m.created_at || m.createdAt || '',
  };
}

function mapHoliday(h: any): CompanyHoliday {
  return {
    id: h.id,
    name: h.name,
    description: h.description || '',
    date: h.date,
    createdAt: h.created_at || h.createdAt || '',
  };
}

function mapNotification(n: any): AppNotification {
  return {
    id: n.id,
    userId: n.user_id || n.userId,
    title: n.title,
    message: n.message,
    isRead: n.is_read ?? n.isRead ?? false,
    type: n.type || 'REMINDER',
    link: n.link || undefined,
    createdAt: n.created_at || n.createdAt || '',
  };
}

function mapAuditLog(a: any): AuditLog {
  return {
    id: a.id,
    userId: a.user_id || a.userId,
    userName: a.user_name || a.userName || '',
    actionType: a.action_type || a.actionType,
    ipAddress: a.ip_address || a.ipAddress,
    details: typeof a.details === 'object' ? JSON.stringify(a.details) : (a.details || ''),
    createdAt: a.created_at || a.createdAt,
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user: authUser } = useAuth();

  const [currentUser, setCurrentUser] = useState<User>(() => authUser ? mapUser(authUser) : { id: '', fullName: '', email: '', role: 'ADMIN', department: '', designation: '', isActive: true });
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [updates, setUpdates] = useState<DailyTaskUpdate[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [projectRequests, setProjectRequests] = useState<ProjectRequest[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [holidays, setHolidays] = useState<CompanyHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authUser) {
      setCurrentUser(mapUser(authUser));
    }
  }, [authUser]);

  const refreshData = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const [uRes, pRes, tRes, upRes, lRes, nRes] = await Promise.all([
        api.getUsers(token).catch(() => []),
        api.getProjects(token).catch(() => []),
        api.getTasks(token).catch(() => []),
        api.getUpdates(token).catch(() => []),
        api.getLeaveRequests(token).catch(() => []),
        api.getNotifications(token).catch(() => []),
      ]);
      setUsers((uRes || []).map(mapUser));
      setProjects((pRes || []).map(mapProject));
      setTasks((tRes || []).map(mapTask));
      setUpdates((upRes || []).map(mapUpdate));
      setLeaveRequests((lRes || []).map(mapLeave));
      setNotifications((nRes || []).map(mapNotification));
      // Leave balance for current month
      try {
        const bRes = await api.getLeaveSummary(token);
        setLeaveBalance(mapLeaveBalance(bRes));
      } catch { setLeaveBalance(null); }
      // Audit logs & Project requests only for admin
      if (authUser?.role === 'ADMIN') {
        try {
          const aRes = await api.getAuditLogs(token);
          setAuditLogs((aRes || []).map(mapAuditLog));
        } catch { setAuditLogs([]); }
        try {
          const prRes = await api.getProjectRequests(token);
          setProjectRequests((prRes || []).map(mapProjectRequest));
        } catch { setProjectRequests([]); }
      } else {
        setAuditLogs([]);
        setProjectRequests([]);
      }
      // Meetings (all users)
      try {
        const mRes = await api.getMeetings(token);
        setMeetings((mRes || []).map(mapMeeting));
      } catch { setMeetings([]); }
      // Company holidays (all users)
      try {
        const hRes = await api.getCompanyHolidays(token);
        setHolidays((hRes || []).map(mapHoliday));
      } catch { setHolidays([]); }
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token, authUser]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    const id = setInterval(() => refreshData(true), 30000);
    return () => clearInterval(id);
  }, [refreshData]);

  const submitMorningUpdate = useCallback(async (data: { projectId: string | null; taskId?: string | null; taskTitle?: string; plannedWork: string; estHours: number; blockers?: string }) => {
    if (!token) return;
    const result = await api.submitMorningUpdate(token, {
      project_id: data.projectId || null,
      task_id: data.taskId || null,
      morning_task_title: data.taskTitle || null,
      planned_work: data.plannedWork,
      est_hours: data.estHours,
      blockers: data.blockers,
    });
    const mapped = mapUpdate(result);
    setUpdates(prev => {
      const idx = prev.findIndex(u => u.id === mapped.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = mapped;
        return next;
      }
      return [mapped, ...prev];
    });
  }, [token]);

  const submitEveningUpdate = useCallback(async (data: { completedWork: string; remainingWork: string; hoursSpent: number; challenges?: string; nextDayPlan: string }) => {
    if (!token) return;
    const result = await api.submitEveningUpdate(token, {
      completed_work: data.completedWork,
      remaining_work: data.remainingWork,
      hours_spent: data.hoursSpent,
      challenges: data.challenges,
      next_day_plan: data.nextDayPlan,
    });
    const mapped = mapUpdate(result);
    setUpdates(prev => {
      const idx = prev.findIndex(u => u.id === mapped.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = mapped;
        return next;
      }
      return [mapped, ...prev];
    });
  }, [token]);

  const updateProject = useCallback(async (projectId: string, data: any) => {
    if (!token) return;
    const result = await api.updateProject(token, projectId, {
      name: data.name,
      description: data.description,
      start_date: data.startDate,
      end_date: data.endDate,
      priority: data.priority,
      status: data.status,
      progress_percentage: data.progressPercentage,
      owner_id: data.ownerId,
      assigned_user_ids: data.assignedUserIds,
    });
    setProjects(prev => prev.map(p => p.id === projectId ? mapProject(result) : p));
  }, [token]);

  const deleteProject = useCallback(async (projectId: string) => {
    if (!token) return;
    await api.deleteProject(token, projectId);
    setProjects(prev => prev.filter(p => p.id !== projectId));
  }, [token]);

  const selectProject = useCallback(async (projectId: string) => {
    if (!token) return;
    await api.selectProject(token, projectId);
    setCurrentUser(prev => ({ ...prev, currentProjectId: projectId }));
  }, [token]);

  const requestProjectAccess = useCallback(async (projectId: string) => {
    if (!token) return;
    await api.requestProjectAccess(token, projectId);
    alert('Access request sent. You will be notified once an admin reviews it.');
  }, [token]);

  const requestToJoinProject = useCallback(async () => {
    if (!token) return;
    await api.requestProjectAdd(token);
  }, [token]);

  const reviewProjectRequest = useCallback(async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!token) return;
    const result = await api.reviewProjectRequest(token, requestId, { status });
    setProjectRequests(prev => prev.map(r => r.id === requestId ? mapProjectRequest(result) : r));
    await refreshData();
  }, [token, refreshData]);

  const createMeeting = useCallback(async (data: { title: string; description?: string; date: string; startTime: string; endTime?: string; meetingLink?: string; assigneeIds: string[] }) => {
    if (!token) return;
    const result = await api.createMeeting(token, {
      title: data.title,
      description: data.description,
      date: data.date,
      start_time: data.startTime,
      end_time: data.endTime,
      meeting_link: data.meetingLink,
      assignee_ids: data.assigneeIds,
    });
    setMeetings(prev => [mapMeeting(result), ...prev]);
    await refreshData();
  }, [token, refreshData]);

  const updateMeeting = useCallback(async (meetingId: string, data: { title?: string; description?: string; date?: string; startTime?: string; endTime?: string; meetingLink?: string; assigneeIds?: string[] }) => {
    if (!token) return;
    const result = await api.updateMeeting(token, meetingId, {
      title: data.title,
      description: data.description,
      date: data.date,
      start_time: data.startTime,
      end_time: data.endTime,
      meeting_link: data.meetingLink,
      assignee_ids: data.assigneeIds,
    });
    setMeetings(prev => prev.map(m => m.id === meetingId ? mapMeeting(result) : m));
  }, [token]);

  const deleteMeeting = useCallback(async (meetingId: string) => {
    if (!token) return;
    await api.deleteMeeting(token, meetingId);
    setMeetings(prev => prev.filter(m => m.id !== meetingId));
  }, [token]);

  const createCompanyHoliday = useCallback(async (data: { name: string; description?: string; date: string }) => {
    if (!token) return;
    const result = await api.createCompanyHoliday(token, {
      name: data.name,
      description: data.description,
      date: data.date,
    });
    setHolidays(prev => [mapHoliday(result), ...prev]);
    await refreshData();
  }, [token, refreshData]);

  const deleteCompanyHoliday = useCallback(async (holidayId: string) => {
    if (!token) return;
    await api.deleteCompanyHoliday(token, holidayId);
    setHolidays(prev => prev.filter(h => h.id !== holidayId));
  }, [token]);

  const createProject = useCallback(async (projectData: any) => {
    if (!token) return;
    const result = await api.createProject(token, {
      name: projectData.name,
      description: projectData.description,
      start_date: projectData.startDate,
      end_date: projectData.endDate,
      priority: projectData.priority,
      status: projectData.status,
      owner_id: projectData.ownerId,
      assigned_user_ids: projectData.assignedUserIds || [],
    });
    setProjects(prev => [mapProject(result), ...prev]);
  }, [token]);

  const createTask = useCallback(async (taskData: any) => {
    if (!token) return;
    await api.createTask(token, {
      project_id: taskData.projectId,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      assigned_to: taskData.assignedTo,
      assigned_to_ids: taskData.assignedToIds || [],
      due_date: taskData.dueDate,
    });
    await refreshData();
  }, [token, refreshData]);

  const updateTaskStatus = useCallback(async (taskId: string, status: Task['status'], attachmentUrl?: string, attachmentName?: string) => {
    if (!token) return;
    const result = await api.updateTaskStatus(token, taskId, status, attachmentUrl, attachmentName);
    const mapped = mapTask(result);
    setTasks(prev => prev.map(t => t.id === mapped.id ? mapped : t));
  }, [token]);

  const updateTask = useCallback(async (taskId: string, data: any) => {
    if (!token) return;
    const result = await api.updateTask(token, taskId, data);
    const mapped = mapTask(result);
    setTasks(prev => prev.map(t => t.id === mapped.id ? mapped : t));
  }, [token]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!token) return;
    await api.deleteTask(token, taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, [token]);

  const applyLeave = useCallback(async (data: { requestType?: string; startDate: string; endDate: string; reason: string }) => {
    if (!token) return;
    const result = await api.applyLeave(token, {
      request_type: data.requestType || 'LEAVE',
      start_date: data.startDate,
      end_date: data.endDate,
      reason: data.reason,
    });
    setLeaveRequests(prev => [mapLeave(result), ...prev]);
    try {
      const bRes = await api.getLeaveSummary(token);
      setLeaveBalance(mapLeaveBalance(bRes));
    } catch { /* ignore */ }
  }, [token]);

  const reviewLeaveRequest = useCallback(async (id: string, status: 'APPROVED' | 'REJECTED', comment?: string) => {
    if (!token) return;
    const result = await api.reviewLeaveRequest(token, id, { status, admin_comment: comment });
    const mapped = mapLeave(result);
    setLeaveRequests(prev => prev.map(r => r.id === mapped.id ? mapped : r));
    try {
      const bRes = await api.getLeaveSummary(token);
      setLeaveBalance(mapLeaveBalance(bRes));
    } catch { /* ignore */ }
  }, [token]);

  const deleteLeaveRequest = useCallback(async (id: string) => {
    if (!token) return;
    await api.deleteLeaveRequest(token, id);
    setLeaveRequests(prev => prev.filter(r => r.id !== id));
    try {
      const bRes = await api.getLeaveSummary(token);
      setLeaveBalance(mapLeaveBalance(bRes));
    } catch { /* ignore */ }
  }, [token]);

  const changePassword = useCallback(async (newPassword: string) => {
    if (!token) return;
    await api.changePassword(token, {
      new_password: newPassword,
    });
  }, [token]);

  const updatePreferences = useCallback(async (preferences: Record<string, any>) => {
    if (!token) return;
    const res = await api.updateMyPreferences(token, preferences);
    setCurrentUser(prev => ({ ...prev, ...mapUser(res) }));
  }, [token]);

  const markNotificationRead = useCallback(async (id: string) => {
    if (!token) return;
    await api.markNotificationRead(token, id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, [token]);

  const markAllNotificationsRead = useCallback(async () => {
    if (!token) return;
    await api.markAllNotificationsRead(token);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, [token]);

  const trigger10PmScan = useCallback(async () => {
    if (!token) return;
    await api.lockTodayUpdates(token);
    alert('10 PM Scan triggered. All today\'s updates have been locked.');
    await refreshData();
  }, [token, refreshData]);

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      users,
      projects,
      tasks,
      updates,
      attendance: [],
      leaveRequests,
      leaveBalance,
      notifications,
      auditLogs,
      projectRequests,
      meetings,
      holidays,
      loading,
      error,
      submitMorningUpdate,
      submitEveningUpdate,
      updateProject,
      deleteProject,
      selectProject,
      requestProjectAccess,
      requestToJoinProject,
      reviewProjectRequest,
      createMeeting,
      updateMeeting,
      deleteMeeting,
      createCompanyHoliday,
      deleteCompanyHoliday,
      createProject,
      createTask,
      updateTaskStatus,
      updateTask,
      deleteTask,
      applyLeave,
      reviewLeaveRequest,
      deleteLeaveRequest,
      changePassword,
      updatePreferences,
      trigger10PmScan,
      markNotificationRead,
      markAllNotificationsRead,
      refreshData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
