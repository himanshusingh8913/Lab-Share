export type UserRole = 'researcher' | 'manager' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  phone?: string;
  certifications: string[];
  createdAt: string;
}

export type ResourceCategory =
  | 'Microscopy'
  | 'Spectrometry'
  | 'Chromatography'
  | 'Centrifugation'
  | 'Cleanroom'
  | 'Thermal & Incubation'
  | 'General Equipment';

export type ResourceStatus = 'available' | 'maintenance' | 'in-use' | 'decommissioned';

export interface Resource {
  id: string;
  name: string;
  model: string;
  category: ResourceCategory;
  building: string;
  room: string;
  department: string;
  status: ResourceStatus;
  requiresApproval: boolean;
  requiredCertifications: string[];
  hourlyRate: number;
  maxConsecutiveHours: number;
  description?: string;
  maintenanceNotes?: string;
  nextMaintenanceDate?: string;
  nextCalibrationDate?: string;
  lastMaintenanceDate?: string;
  lastCalibrationDate?: string;
  specifications: Record<string, string>;
  imageUrl: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'waitlisted'
  | 'checked_out'
  | 'returned'
  | 'cancelled';

export interface ConditionReport {
  reportedBy: string;
  reportedByName?: string;
  timestamp: string;
  physicalCondition: 'excellent' | 'good' | 'fair' | 'damaged';
  cleanliness: 'clean' | 'acceptable' | 'needs_cleaning';
  calibrationVerified: boolean;
  notes: string;
  consumablesLevel?: string;
  photoUrl?: string;
}

export interface Booking {
  id: string;
  resourceId: string;
  resourceName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userDepartment: string;
  projectTitle: string;
  purpose: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  status: BookingStatus;
  rejectionReason?: string;
  waitlistPosition?: number;
  approvedBy?: string;
  approvedAt?: string;
  otpCode?: string;
  otpExpiresAt?: string; // ISO string
  otpUsed: boolean;
  otpUsedAt?: string;
  checkInCondition?: ConditionReport;
  returnCondition?: ConditionReport;
  createdAt: string;
  updatedAt: string;
}

export interface Incident {
  id: string;
  bookingId?: string;
  resourceId: string;
  resourceName: string;
  reportedBy: string;
  reportedByName: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'under_investigation' | 'resolved';
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  targetId: string;
  targetType: 'resource' | 'booking' | 'user' | 'incident' | 'system';
  details: Record<string, any>;
  ip?: string;
}

export interface DashboardStats {
  totalResources: number;
  availableResources: number;
  activeBookings: number;
  pendingApprovals: number;
  openIncidents: number;
  utilizationRate: number;
  roleBreakdown: {
    researchers: number;
    managers: number;
    admins: number;
  };
}
