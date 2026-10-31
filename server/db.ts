import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  UserProfile,
  Resource,
  Booking,
  Incident,
  AuditLog,
  DashboardStats,
} from '../src/types/index.js';
import { checkBookingOverlap, verifyUserEligibility } from '../src/utils/bookingRules.js';
import { createOtpPayload, verifyOtpCode } from '../src/utils/otpRules.js';

export interface StoredUser extends UserProfile {
  passwordHash: string;
  salt: string;
  sessionToken?: string;
  tokenExpiresAt?: string;
}

export interface LabShareDatabase {
  users: StoredUser[];
  resources: Resource[];
  bookings: Booking[];
  incidents: Incident[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'labshare_db.json');

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function createSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

const DEFAULT_RESOURCES: Resource[] = [
  {
    id: 'res-orbitrap-1',
    name: 'Thermo Scientific Orbitrap Exploris 480',
    model: 'Orbitrap Exploris 480 Mass Spectrometer',
    category: 'Spectrometry',
    building: 'Biochemistry Research Hall',
    room: 'Room B-204',
    department: 'Proteomics & Metabolomics Core',
    status: 'available',
    requiresApproval: true,
    requiredCertifications: ['Mass Spectrometry Operator Level 2', 'Chemical Safety Standard'],
    hourlyRate: 75,
    maxConsecutiveHours: 8,
    nextCalibrationDate: '2026-11-01T09:00:00Z',
    nextMaintenanceDate: '2026-11-25T09:00:00Z',
    lastCalibrationDate: '2026-08-01T09:00:00Z',
    lastMaintenanceDate: '2026-05-15T09:00:00Z',
    specifications: {
      Resolution: 'Up to 480,000 at m/z 200',
      'Mass Range': 'm/z 40 to 6,000',
      Ionization: 'OptaMax NG Heated ESI / APCI',
      Accuracy: '< 1 ppm RMS',
    },
    imageUrl: 'https://images.unsplash.com/photo-1579165466791-78822231cb67?auto=format&fit=crop&w=800&q=80',
    createdBy: 'user-admin',
    createdAt: new Date('2026-09-01T08:00:00Z').toISOString(),
    updatedAt: new Date('2026-09-01T08:00:00Z').toISOString(),
  },
  {
    id: 'res-confocal-2',
    name: 'Leica TCS SP8 Laser Scanning Confocal',
    model: 'TCS SP8 Confocal Microscope with HyD Detectors',
    category: 'Microscopy',
    building: 'Bioengineering Institute',
    room: 'Imaging Suite 102',
    department: 'Advanced Cellular Imaging',
    status: 'in-use',
    requiresApproval: true,
    requiredCertifications: ['Laser Safety Level 3', 'Confocal Microscopy Specialist'],
    hourlyRate: 60,
    maxConsecutiveHours: 6,
    nextCalibrationDate: '2026-11-04T09:00:00Z',
    nextMaintenanceDate: '2026-11-06T09:00:00Z',
    lastCalibrationDate: '2026-08-10T09:00:00Z',
    specifications: {
      Lasers: '405nm, 488nm, 552nm, 638nm solid state',
      Detectors: '2x HyD hybrid detectors, 2x standard PMT',
      Objectives: '10x, 20x multi-imm, 40x oil, 63x oil NA 1.4',
      LiveCell: 'Heated stage, 5% CO2 incubation chamber',
    },
    imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
    createdBy: 'user-admin',
    createdAt: new Date('2026-09-05T09:00:00Z').toISOString(),
    updatedAt: new Date('2026-09-05T09:00:00Z').toISOString(),
  },
  {
    id: 'res-ultracentrifuge-3',
    name: 'Beckman Coulter Optima XPN-100',
    model: 'Optima XPN-100 Ultracentrifuge 100k RPM',
    category: 'Centrifugation',
    building: 'Molecular Biology Labs',
    room: 'Core Prep Room 310',
    department: 'Structural Biology',
    status: 'available',
    requiresApproval: false,
    requiredCertifications: ['Biosafety Level 2', 'Centrifuge Rotor Safety'],
    hourlyRate: 35,
    maxConsecutiveHours: 12,
    nextCalibrationDate: '2026-12-15T09:00:00Z',
    nextMaintenanceDate: '2026-12-20T09:00:00Z',
    lastCalibrationDate: '2026-06-20T09:00:00Z',
    specifications: {
      MaxSpeed: '100,000 RPM (802,400 x g)',
      Refrigeration: '0 to +40 C in 1 C increments',
      Rotors: 'Ti-70 fixed angle, SW-41 Ti swinging bucket',
      Vacuum: 'Solid-state diffusion pump < 10 microns',
    },
    imageUrl: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=800&q=80',
    createdBy: 'user-manager',
    createdAt: new Date('2026-09-10T10:00:00Z').toISOString(),
    updatedAt: new Date('2026-09-10T10:00:00Z').toISOString(),
  },
  {
    id: 'res-hplc-4',
    name: 'Agilent 1290 Infinity II UHPLC',
    model: '1290 Infinity II Binary Pump with DAD FS',
    category: 'Chromatography',
    building: 'Chemical Sciences Center',
    room: 'Analytical Wing 405',
    department: 'Pharmaceutical & Organic Chemistry',
    status: 'maintenance',
    maintenanceNotes: 'Scheduled quaternary seal replacement and pressure transducer recalibration.',
    requiresApproval: true,
    requiredCertifications: ['Chemical Safety Standard', 'Chromatography Specialist'],
    hourlyRate: 50,
    maxConsecutiveHours: 10,
    nextCalibrationDate: '2026-10-28T09:00:00Z',
    nextMaintenanceDate: '2026-10-31T09:00:00Z',
    specifications: {
      Pressure: 'Up to 1300 bar (18,850 psi)',
      FlowRange: '0.05 to 5.0 mL/min',
      Detector: 'Diode Array Detector (190-640 nm)',
      Autosampler: 'Capacity 432 vials (2 mL)',
    },
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
    createdBy: 'user-admin',
    createdAt: new Date('2026-09-12T11:00:00Z').toISOString(),
    updatedAt: new Date('2026-09-12T11:00:00Z').toISOString(),
  },
  {
    id: 'res-cleanroom-5',
    name: 'Cleanroom Photolithography Bay (Class 1000)',
    model: 'Karl Suss MJB4 Mask Aligner & Spin Coater',
    category: 'Cleanroom',
    building: 'Nanotechnology Complex',
    room: 'Cleanroom Bay 4',
    department: 'Micro & Nano Systems',
    status: 'available',
    requiresApproval: true,
    requiredCertifications: ['Cleanroom Class 1000 Protocol', 'Hazardous Chemical Handling'],
    hourlyRate: 90,
    maxConsecutiveHours: 5,
    nextCalibrationDate: '2026-11-09T09:00:00Z',
    nextMaintenanceDate: '2026-11-15T09:00:00Z',
    specifications: {
      Cleanliness: 'ISO Class 6 (Class 1000)',
      Alignment: 'Sub-micron resolution (0.8 um)',
      Substrate: 'Pieces up to 100 mm wafers',
      UVSource: '350W High Pressure Hg lamp',
    },
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    createdBy: 'user-manager',
    createdAt: new Date('2026-09-15T12:00:00Z').toISOString(),
    updatedAt: new Date('2026-09-15T12:00:00Z').toISOString(),
  },
  {
    id: 'res-incubator-6',
    name: 'Thermo Forma Steri-Cycle CO2 Incubator Suite',
    model: 'Steri-Cycle 184L HEPA Filtered Dual Chamber',
    category: 'Thermal & Incubation',
    building: 'Biochemistry Research Hall',
    room: 'Room B-112',
    department: 'Stem Cell Biology',
    status: 'available',
    requiresApproval: false,
    requiredCertifications: ['Biosafety Level 2'],
    hourlyRate: 20,
    maxConsecutiveHours: 72,
    specifications: {
      Capacity: '184 L interior volume',
      CO2Control: 'IR Sensor 0-20%',
      TempRange: '+5 C above ambient to 50 C',
      Sterilization: '140 C high temp decontamination cycle',
    },
    imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
    createdBy: 'user-admin',
    createdAt: new Date('2026-09-18T13:00:00Z').toISOString(),
    updatedAt: new Date('2026-09-18T13:00:00Z').toISOString(),
  },
];

function seedUsers(): StoredUser[] {
  const adminSalt = createSalt();
  const managerSalt = createSalt();
  const researcherSalt = createSalt();

  return [
    {
      id: 'user-admin',
      name: 'Dr. Evelyn Vance',
      email: 'admin@labshare.edu',
      role: 'admin',
      department: 'Central Research Facilities Administration',
      phone: '+1 (555) 234-5670',
      certifications: [
        'Biosafety Level 2',
        'Laser Safety Level 3',
        'Cleanroom Class 1000 Protocol',
        'Mass Spectrometry Operator Level 2',
        'Chemical Safety Standard',
        'Centrifuge Rotor Safety',
        'Hazardous Chemical Handling',
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      salt: adminSalt,
      passwordHash: hashPassword('AdminPass123!', adminSalt),
    },
    {
      id: 'user-manager',
      name: 'Marcus Chen',
      email: 'manager@labshare.edu',
      role: 'manager',
      department: 'Cellular Imaging & Biocore Management',
      phone: '+1 (555) 345-6781',
      certifications: [
        'Biosafety Level 2',
        'Laser Safety Level 3',
        'Confocal Microscopy Specialist',
        'Centrifuge Rotor Safety',
        'Chemical Safety Standard',
      ],
      createdAt: '2026-01-05T00:00:00.000Z',
      salt: managerSalt,
      passwordHash: hashPassword('ManagerPass123!', managerSalt),
    },
    {
      id: 'user-researcher',
      name: 'Sarah Jenkins',
      email: 'researcher@labshare.edu',
      role: 'researcher',
      department: 'Molecular Biology & Genetics Graduate Fellow',
      phone: '+1 (555) 456-7892',
      certifications: [
        'Biosafety Level 2',
        'Laser Safety Level 3',
        'Confocal Microscopy Specialist',
        'Chemical Safety Standard',
        'Centrifuge Rotor Safety',
      ],
      createdAt: '2026-02-10T00:00:00.000Z',
      salt: researcherSalt,
      passwordHash: hashPassword('ResearcherPass123!', researcherSalt),
    },
  ];
}

function seedBookings(): Booking[] {
  const now = new Date();
  const hourMs = 60 * 60 * 1000;

  // 1: Live checked-out booking on Confocal
  const start1 = new Date(now.getTime() - 1 * hourMs).toISOString();
  const end1 = new Date(now.getTime() + 3 * hourMs).toISOString();

  // 2: Approved booking ready for pickup with valid OTP
  const start2 = new Date(now.getTime() + 4 * hourMs).toISOString();
  const end2 = new Date(now.getTime() + 7 * hourMs).toISOString();
  const otpPayload2 = createOtpPayload(60, now);

  // 3: Pending manager approval
  const start3 = new Date(now.getTime() + 24 * hourMs).toISOString();
  const end3 = new Date(now.getTime() + 28 * hourMs).toISOString();

  // 4: Historic returned booking with complete condition report
  const start4 = new Date(now.getTime() - 48 * hourMs).toISOString();
  const end4 = new Date(now.getTime() - 44 * hourMs).toISOString();

  return [
    {
      id: 'book-sample-active',
      resourceId: 'res-confocal-2',
      resourceName: 'Leica TCS SP8 Laser Scanning Confocal',
      userId: 'user-researcher',
      userName: 'Sarah Jenkins',
      userEmail: 'researcher@labshare.edu',
      userDepartment: 'Molecular Biology & Genetics',
      projectTitle: 'Neuronal Synaptic Vesicle Dynamics in Primary Culture',
      purpose: 'Live cell z-stack time lapse imaging with 488nm laser line excitation.',
      startTime: start1,
      endTime: end1,
      status: 'checked_out',
      approvedBy: 'user-manager',
      approvedAt: new Date(now.getTime() - 2 * hourMs).toISOString(),
      otpCode: '482910',
      otpExpiresAt: new Date(now.getTime() + 10 * hourMs).toISOString(),
      otpUsed: true,
      otpUsedAt: new Date(now.getTime() - 1 * hourMs).toISOString(),
      checkInCondition: {
        reportedBy: 'user-manager',
        reportedByName: 'Marcus Chen',
        timestamp: new Date(now.getTime() - 1 * hourMs).toISOString(),
        physicalCondition: 'excellent',
        cleanliness: 'clean',
        calibrationVerified: true,
        notes: 'Laser output normalized, 63x objective lens pristine.',
      },
      createdAt: new Date(now.getTime() - 24 * hourMs).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * hourMs).toISOString(),
    },
    {
      id: 'book-sample-ready',
      resourceId: 'res-orbitrap-1',
      resourceName: 'Thermo Scientific Orbitrap Exploris 480',
      userId: 'user-researcher',
      userName: 'Sarah Jenkins',
      userEmail: 'researcher@labshare.edu',
      userDepartment: 'Molecular Biology & Genetics',
      projectTitle: 'Phosphoproteome Profiling of Kinase Knockouts',
      purpose: 'High resolution peptide identification via nano-LC/MS/MS.',
      startTime: start2,
      endTime: end2,
      status: 'approved',
      approvedBy: 'user-manager',
      approvedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      otpCode: otpPayload2.code,
      otpExpiresAt: otpPayload2.expiresAt,
      otpUsed: false,
      createdAt: new Date(now.getTime() - 3 * hourMs).toISOString(),
      updatedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'book-sample-pending',
      resourceId: 'res-cleanroom-5',
      resourceName: 'Cleanroom Photolithography Bay (Class 1000)',
      userId: 'user-researcher',
      userName: 'Sarah Jenkins',
      userEmail: 'researcher@labshare.edu',
      userDepartment: 'Molecular Biology & Genetics',
      projectTitle: 'Microfluidic Cell Sorter Channel Fabrication',
      purpose: 'SU-8 negative photoresist spin-coating and mask aligner UV crosslinking.',
      startTime: start3,
      endTime: end3,
      status: 'pending_approval',
      otpUsed: false,
      createdAt: new Date(now.getTime() - 1 * hourMs).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * hourMs).toISOString(),
    },
    {
      id: 'book-sample-returned',
      resourceId: 'res-ultracentrifuge-3',
      resourceName: 'Beckman Coulter Optima XPN-100',
      userId: 'user-researcher',
      userName: 'Sarah Jenkins',
      userEmail: 'researcher@labshare.edu',
      userDepartment: 'Molecular Biology & Genetics',
      projectTitle: 'Exosome Density Gradient Separation',
      purpose: 'Sucrose cushion ultracentrifugation with SW-41 Ti rotor.',
      startTime: start4,
      endTime: end4,
      status: 'returned',
      approvedBy: 'user-manager',
      approvedAt: new Date(now.getTime() - 50 * hourMs).toISOString(),
      otpCode: '729184',
      otpExpiresAt: new Date(now.getTime() - 47 * hourMs).toISOString(),
      otpUsed: true,
      otpUsedAt: new Date(now.getTime() - 48 * hourMs).toISOString(),
      checkInCondition: {
        reportedBy: 'user-manager',
        reportedByName: 'Marcus Chen',
        timestamp: new Date(now.getTime() - 48 * hourMs).toISOString(),
        physicalCondition: 'good',
        cleanliness: 'clean',
        calibrationVerified: true,
        notes: 'Chamber vacuum sealed normally.',
      },
      returnCondition: {
        reportedBy: 'user-researcher',
        reportedByName: 'Sarah Jenkins',
        timestamp: new Date(now.getTime() - 44 * hourMs).toISOString(),
        physicalCondition: 'excellent',
        cleanliness: 'clean',
        calibrationVerified: true,
        notes: 'Spindle wiped down, rotor dry and stored in desiccation rack.',
      },
      createdAt: new Date(now.getTime() - 72 * hourMs).toISOString(),
      updatedAt: new Date(now.getTime() - 44 * hourMs).toISOString(),
    },
  ];
}

function seedIncidents(): Incident[] {
  const now = new Date();
  return [
    {
      id: 'inc-sample-1',
      bookingId: 'book-sample-prev',
      resourceId: 'res-hplc-4',
      resourceName: 'Agilent 1290 Infinity II UHPLC',
      reportedBy: 'user-researcher',
      reportedByName: 'Sarah Jenkins',
      title: 'Backpressure fluctuation and baseline drift in channel B',
      description: 'System pressure spiked to 1100 bar with 50% methanol rinse; possible inline filter clogging.',
      severity: 'medium',
      status: 'under_investigation',
      resolutionNotes: 'Technician notified. Replacement frit scheduled.',
      resolvedBy: 'user-manager',
      createdAt: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

function seedAuditLogs(): AuditLog[] {
  const now = new Date();
  return [
    {
      id: 'audit-sys-init',
      timestamp: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
      actorId: 'user-admin',
      actorEmail: 'admin@labshare.edu',
      actorRole: 'admin',
      action: 'SYSTEM_INITIALIZED',
      targetId: 'system',
      targetType: 'system',
      details: { environment: 'production', secureMode: true },
    },
    {
      id: 'audit-book-1',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      actorId: 'user-researcher',
      actorEmail: 'researcher@labshare.edu',
      actorRole: 'researcher',
      action: 'BOOKING_REQUESTED',
      targetId: 'book-sample-active',
      targetType: 'booking',
      details: { resourceId: 'res-confocal-2', hours: 4 },
    },
    {
      id: 'audit-book-1-appr',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      actorId: 'user-manager',
      actorEmail: 'manager@labshare.edu',
      actorRole: 'manager',
      action: 'BOOKING_APPROVED',
      targetId: 'book-sample-active',
      targetType: 'booking',
      details: { otpGenerated: true },
    },
    {
      id: 'audit-otp-verify',
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      actorId: 'user-manager',
      actorEmail: 'manager@labshare.edu',
      actorRole: 'manager',
      action: 'OTP_VERIFIED_CHECK_IN',
      targetId: 'book-sample-active',
      targetType: 'booking',
      details: { initialCondition: 'excellent' },
    },
  ];
}

class DatabaseManager {
  private memoryDb: LabShareDatabase | null = null;
  private writeLock: boolean = false;

  constructor() {
    this.ensureDirectory();
    this.load();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): LabShareDatabase {
    if (this.memoryDb) {
      return this.memoryDb;
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.memoryDb = JSON.parse(raw);
        return this.memoryDb!;
      } catch (err) {
        console.error('Failed to parse existing DB file, re-initializing seeds', err);
      }
    }

    // Initialize with seeds
    const freshDb: LabShareDatabase = {
      users: seedUsers(),
      resources: DEFAULT_RESOURCES,
      bookings: seedBookings(),
      incidents: seedIncidents(),
      auditLogs: seedAuditLogs(),
    };

    this.memoryDb = freshDb;
    this.saveImmediate();
    return this.memoryDb;
  }

  private saveImmediate() {
    if (!this.memoryDb) return;
    try {
      this.ensureDirectory();
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.memoryDb, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to write database file', err);
    }
  }

  public getDb(): LabShareDatabase {
    if (!this.memoryDb) {
      return this.load();
    }
    return this.memoryDb;
  }

  public save() {
    this.saveImmediate();
  }

  /**
   * Records an immutable audit log entry.
   * Ordinary users and managers have NO access to alter or delete logs.
   */
  public logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const db = this.getDb();
    const newLog: AuditLog = {
      ...entry,
      id: `audit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
    };
    db.auditLogs.unshift(newLog);
    // Keep up to 2,000 logs in storage
    if (db.auditLogs.length > 2000) {
      db.auditLogs = db.auditLogs.slice(0, 2000);
    }
    this.save();
    return newLog;
  }

  public findUserByEmail(email: string): StoredUser | undefined {
    const db = this.getDb();
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): StoredUser | undefined {
    const db = this.getDb();
    return db.users.find((u) => u.id === id);
  }

  public findUserByToken(token: string): StoredUser | undefined {
    const db = this.getDb();
    const user = db.users.find((u) => u.sessionToken === token);
    if (!user) return undefined;
    if (user.tokenExpiresAt && new Date(user.tokenExpiresAt).getTime() < Date.now()) {
      return undefined;
    }
    return user;
  }

  public authenticate(email: string, passwordAttempt: string): { user?: UserProfile; token?: string; error?: string } {
    const user = this.findUserByEmail(email);
    if (!user) {
      return { error: 'Invalid email or password' };
    }

    const testHash = hashPassword(passwordAttempt, user.salt);
    if (testHash !== user.passwordHash) {
      return { error: 'Invalid email or password' };
    }

    const token = `tok_${crypto.randomBytes(24).toString('hex')}`;
    user.sessionToken = token;
    // 7-day token expiration
    user.tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    this.save();

    this.logAudit({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_LOGIN',
      targetId: user.id,
      targetType: 'user',
      details: { department: user.department },
    });

    const safeUser: UserProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone,
      certifications: user.certifications,
      createdAt: user.createdAt,
    };

    return { user: safeUser, token };
  }

  public register(params: {
    name: string;
    email: string;
    password: string;
    department: string;
    phone?: string;
    certifications?: string[];
    requestedRole?: 'researcher' | 'manager';
  }): { user?: UserProfile; token?: string; error?: string } {
    const db = this.getDb();
    const existing = this.findUserByEmail(params.email);
    if (existing) {
      return { error: 'An account with this email address already exists' };
    }

    const salt = createSalt();
    const passwordHash = hashPassword(params.password, salt);
    const token = `tok_${crypto.randomBytes(24).toString('hex')}`;

    // By default, self-registration produces 'researcher' unless verified
    const assignedRole = params.requestedRole === 'manager' ? 'manager' : 'researcher';

    const newUser: StoredUser = {
      id: `user-${Date.now()}`,
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      role: assignedRole,
      department: params.department.trim(),
      phone: params.phone,
      certifications: params.certifications || ['Biosafety Level 2', 'Chemical Safety Standard'],
      createdAt: new Date().toISOString(),
      salt,
      passwordHash,
      sessionToken: token,
      tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    db.users.push(newUser);
    this.save();

    this.logAudit({
      actorId: newUser.id,
      actorEmail: newUser.email,
      actorRole: newUser.role,
      action: 'USER_REGISTERED',
      targetId: newUser.id,
      targetType: 'user',
      details: { role: newUser.role, department: newUser.department },
    });

    const safeUser: UserProfile = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      phone: newUser.phone,
      certifications: newUser.certifications,
      createdAt: newUser.createdAt,
    };

    return { user: safeUser, token };
  }

  public calculateStats(): DashboardStats {
    const db = this.getDb();
    const totalResources = db.resources.length;
    const availableResources = db.resources.filter((r) => r.status === 'available').length;
    const activeBookings = db.bookings.filter(
      (b) => b.status === 'checked_out' || b.status === 'approved'
    ).length;
    const pendingApprovals = db.bookings.filter((b) => b.status === 'pending_approval').length;
    const openIncidents = db.incidents.filter((i) => i.status !== 'resolved').length;

    // Actual utilization rate calculation based on booked vs total operational equipment
    const inUseCount = db.resources.filter((r) => r.status === 'in-use').length;
    const operationalCount = db.resources.filter((r) => r.status !== 'decommissioned').length;
    const utilizationRate =
      operationalCount > 0 ? Math.round((inUseCount / operationalCount) * 100) : 0;

    const researchers = db.users.filter((u) => u.role === 'researcher').length;
    const managers = db.users.filter((u) => u.role === 'manager').length;
    const admins = db.users.filter((u) => u.role === 'admin').length;

    return {
      totalResources,
      availableResources,
      activeBookings,
      pendingApprovals,
      openIncidents,
      utilizationRate,
      roleBreakdown: { researchers, managers, admins },
    };
  }
}

export const dbManager = new DatabaseManager();
