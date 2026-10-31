import {
  UserProfile,
  Resource,
  Booking,
  Incident,
  AuditLog,
  DashboardStats,
} from '../types/index.js';

const TOKEN_KEY = 'labshare_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `HTTP ${response.status}: ${response.statusText}`;
    const err = new Error(errorMsg);
    (err as any).status = response.status;
    (err as any).data = data;
    throw err;
  }

  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ user: UserProfile; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: {
    name: string;
    email: string;
    password: string;
    department: string;
    phone?: string;
    certifications?: string[];
    requestedRole?: 'researcher' | 'manager';
  }) =>
    request<{ user: UserProfile; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request<{ user: UserProfile }>('/api/auth/me'),

  switchRole: (targetRole: 'researcher' | 'manager' | 'admin') =>
    request<{ user: UserProfile; token: string }>('/api/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ targetRole }),
    }),

  // Resources
  getResources: (params?: { search?: string; category?: string; status?: string; department?: string }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.append('search', params.search);
    if (params?.category) qs.append('category', params.category);
    if (params?.status) qs.append('status', params.status);
    if (params?.department) qs.append('department', params.department);
    const query = qs.toString();
    return request<{ resources: Resource[] }>(`/api/resources${query ? `?${query}` : ''}`);
  },

  getResource: (id: string) => request<{ resource: Resource }>(`/api/resources/${id}`),

  createResource: (payload: Partial<Resource>) =>
    request<{ resource: Resource }>('/api/resources', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateResource: (id: string, payload: Partial<Resource>) =>
    request<{ resource: Resource }>(`/api/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteResource: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/resources/${id}`, {
      method: 'DELETE',
    }),

  // Bookings
  getBookings: () => request<{ bookings: Booking[] }>('/api/bookings'),

  createBooking: (payload: {
    resourceId: string;
    projectTitle: string;
    purpose: string;
    startTime: string;
    endTime: string;
  }) =>
    request<{ booking: Booking }>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  approveBooking: (id: string) =>
    request<{ booking: Booking }>(`/api/bookings/${id}/approve`, {
      method: 'POST',
    }),

  rejectBooking: (id: string, reason?: string) =>
    request<{ booking: Booking; promotedWaitlistId?: string }>(`/api/bookings/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  waitlistBooking: (id: string) =>
    request<{ booking: Booking }>(`/api/bookings/${id}/waitlist`, {
      method: 'POST',
    }),

  cancelBooking: (id: string) =>
    request<{ booking: Booking }>(`/api/bookings/${id}/cancel`, {
      method: 'POST',
    }),

  verifyOtp: (id: string, payload: { otpCode: string; condition?: string; notes?: string }) =>
    request<{ success: boolean; message: string; booking: Booking }>(`/api/bookings/${id}/verify-otp`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  returnEquipment: (
    id: string,
    payload: {
      physicalCondition: string;
      cleanliness: string;
      calibrationVerified: boolean;
      notes: string;
      consumablesLevel?: string;
    }
  ) =>
    request<{ success: boolean; message: string; booking: Booking }>(`/api/bookings/${id}/return`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Incidents
  getIncidents: () => request<{ incidents: Incident[] }>('/api/incidents'),

  reportIncident: (payload: {
    resourceId: string;
    bookingId?: string;
    title: string;
    description: string;
    severity: string;
  }) =>
    request<{ incident: Incident }>('/api/incidents', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resolveIncident: (id: string, payload: { resolutionNotes: string; restoreResource?: boolean }) =>
    request<{ incident: Incident }>(`/api/incidents/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Audit Logs & Users
  getAuditLogs: () => request<{ auditLogs: AuditLog[] }>('/api/audit-logs'),

  logReportExport: (payload: { reportType: string; format: string; recordCount: number; filterSummary?: string }) =>
    request<{ success: boolean; message: string }>('/api/reports/log-export', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getUsers: () => request<{ users: UserProfile[] }>('/api/users'),

  updateUserRole: (id: string, payload: { role?: string; certifications?: string[] }) =>
    request<{ user: UserProfile }>(`/api/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Stats
  getStats: () => request<{ stats: DashboardStats }>('/api/stats'),

  // AI Assistant
  askAiAssistant: (query: string, category?: string) =>
    request<{ answer: string; source: string }>('/api/ai/assistant', {
      method: 'POST',
      body: JSON.stringify({ query, category }),
    }),

  // Firebase status
  getFirebaseStatus: () => request<any>('/api/firebase/status'),
};
