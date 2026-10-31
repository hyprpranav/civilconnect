import { Announcement, OfficerRequest, AuditLogEntry, SystemSettings, UserAccount } from '../types';

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

export const INITIAL_REQUESTS: OfficerRequest[] = [];

export const INITIAL_STAFF_ACCOUNTS: UserAccount[] = [
  {
    uid: 'harish-pranav-admin',
    registerNumber: 'hyprpranav',
    normalizedRegisterNumber: 'hyprpranav',
    email: 'hyprpranav@gmail.com',
    normalizedEmail: 'hyprpranav@gmail.com',
    role: 'SUPER_ADMIN',
    isFirstLogin: false,
    accountStatus: 'active',
    createdAt: new Date().toISOString(),
    name: 'Harish Pranav S (Dev)',
    department: 'Civil Engineering',
    academicYear: '4th Year',
    phone: '+91 7845693765',
    dob: '2004-10-15',
    avatarUrl: undefined
  },
  {
    uid: 'pranav-faculty-officer',
    registerNumber: 'FAC-2590',
    normalizedRegisterNumber: 'fac-2590',
    email: 'harishpranavs259@gmail.com',
    normalizedEmail: 'harishpranavs259@gmail.com',
    role: 'OFFICER',
    isFirstLogin: false,
    accountStatus: 'active',
    createdAt: '2026-01-15T00:00:00.000Z',
    name: 'Pranav',
    department: 'Civil Engineering',
    academicYear: '2nd Year',
    phone: '784-569-3765',
    dob: '2004-05-25',
    avatarUrl: undefined
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-1',
    performedBy: 'harish-pranav-admin',
    performerName: 'Harish Pranav S (Super Admin)',
    role: 'SUPER_ADMIN',
    action: 'SYSTEM_INITIALIZATION',
    affectedCollection: 'systemSettings',
    affectedRecordIds: ['init'],
    timestamp: new Date().toISOString(),
    operationStatus: 'success',
    details: 'Fresh CIVIL CONNECT system initialized with clean database.'
  }
];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  initialOnboardingPassword: 'civil',
  isOnboardingPasswordEnabled: true,
  requirePasswordChangeOnFirstLogin: true,
  administrativePinHash: '654321', // 6-digit administrative PIN
  collegeDomain: 'mkce.ac.in',
  allowStudentProfileEditing: true,
  maxTeamSize: 6,
  firebaseConfigured: true,
  cloudinaryConfigured: true,
  activeAcademicYear: '2026-2027'
};
