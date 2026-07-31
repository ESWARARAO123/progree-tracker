const API_BASE = '/api/v1';

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

// Auth
export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function getMe(token: string) {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function refreshToken(token: string) {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: token }),
  });
  return handleResponse(res);
}

// Users
export async function getUsers(token: string) {
  const res = await fetch(`${API_BASE}/users/`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function createUser(token: string, data: any) {
  const res = await fetch(`${API_BASE}/users/`, {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function toggleUserStatus(token: string, userId: string) {
  const res = await fetch(`${API_BASE}/users/${userId}/toggle-status`, {
    method: 'PATCH', headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function updateUser(token: string, userId: string, data: any) {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteUser(token: string, userId: string) {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'DELETE', headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
}

// Projects
export async function getProjects(token: string) {
  const res = await fetch(`${API_BASE}/projects/`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function createProject(token: string, data: any) {
  const res = await fetch(`${API_BASE}/projects/`, {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function getProject(token: string, projectId: string) {
  const res = await fetch(`${API_BASE}/projects/${projectId}`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function updateProject(token: string, projectId: string, data: any) {
  const res = await fetch(`${API_BASE}/projects/${projectId}`, {
    method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteProject(token: string, projectId: string) {
  const res = await fetch(`${API_BASE}/projects/${projectId}`, {
    method: 'DELETE', headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
}

export async function selectProject(token: string, projectId: string) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/select`, {
    method: 'POST', headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function requestProjectAccess(token: string, projectId: string) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/request`, {
    method: 'POST', headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function getProjectRequests(token: string) {
  const res = await fetch(`${API_BASE}/project-requests/`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function reviewProjectRequest(token: string, requestId: string, data: any) {
  const res = await fetch(`${API_BASE}/project-requests/${requestId}/review`, {
    method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// Tasks
export async function getTasks(token: string, projectId?: string) {
  const params = projectId ? `?project_id=${projectId}` : '';
  const res = await fetch(`${API_BASE}/tasks/${params}`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function createTask(token: string, data: any) {
  const res = await fetch(`${API_BASE}/tasks/`, {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateTaskStatus(token: string, taskId: string, status: string) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/status`, {
    method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}

// Updates
export async function getUpdates(token: string, params?: { report_date?: string; user_id?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.report_date) searchParams.set('report_date', params.report_date);
  if (params?.user_id) searchParams.set('user_id', params.user_id);
  const qs = searchParams.toString();
  const res = await fetch(`${API_BASE}/updates/${qs ? '?' + qs : ''}`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function submitMorningUpdate(token: string, data: any) {
  const res = await fetch(`${API_BASE}/updates/morning`, {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function submitEveningUpdate(token: string, data: any) {
  const res = await fetch(`${API_BASE}/updates/evening`, {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function lockTodayUpdates(token: string) {
  const res = await fetch(`${API_BASE}/updates/lock`, {
    method: 'POST', headers: authHeaders(token),
  });
  return handleResponse(res);
}

// Leave
export async function getLeaveRequests(token: string) {
  const res = await fetch(`${API_BASE}/leave/`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function getLeaveSummary(token: string) {
  const res = await fetch(`${API_BASE}/leave/summary`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function applyLeave(token: string, data: any) {
  const res = await fetch(`${API_BASE}/leave/`, {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function reviewLeaveRequest(token: string, leaveId: string, data: any) {
  const res = await fetch(`${API_BASE}/leave/${leaveId}/review`, {
    method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// Notifications
export async function getNotifications(token: string) {
  const res = await fetch(`${API_BASE}/notifications/`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function markNotificationRead(token: string, notificationId: string) {
  const res = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
    method: 'PATCH', headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function markAllNotificationsRead(token: string) {
  const res = await fetch(`${API_BASE}/notifications/read-all`, {
    method: 'PATCH', headers: authHeaders(token),
  });
  return handleResponse(res);
}

// Audit
export async function getAuditLogs(token: string) {
  const res = await fetch(`${API_BASE}/audit/`, { headers: authHeaders(token) });
  return handleResponse(res);
}

// Dashboard
export async function getDashboardStats(token: string) {
  const res = await fetch(`${API_BASE}/dashboard/stats`, { headers: authHeaders(token) });
  return handleResponse(res);
}

// Meetings
export async function getMeetings(token: string) {
  const res = await fetch(`${API_BASE}/meetings/`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function createMeeting(token: string, data: any) {
  const res = await fetch(`${API_BASE}/meetings/`, {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateMeeting(token: string, meetingId: string, data: any) {
  const res = await fetch(`${API_BASE}/meetings/${meetingId}`, {
    method: 'PUT', headers: authHeaders(token), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteMeeting(token: string, meetingId: string) {
  const res = await fetch(`${API_BASE}/meetings/${meetingId}`, {
    method: 'DELETE', headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
}

// Company Holidays
export async function getCompanyHolidays(token: string) {
  const res = await fetch(`${API_BASE}/company-holidays/`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function createCompanyHoliday(token: string, data: any) {
  const res = await fetch(`${API_BASE}/company-holidays/`, {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteCompanyHoliday(token: string, holidayId: string) {
  const res = await fetch(`${API_BASE}/company-holidays/${holidayId}`, {
    method: 'DELETE', headers: authHeaders(token),
  });
  return handleResponse(res);
}
