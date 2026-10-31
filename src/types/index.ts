// CIVIL CONNECT - Core Type Definitions

export type UserRole = 'STUDENT' | 'OFFICER' | 'ADMIN' | 'SUPER_ADMIN';

export type AcademicYear = '1st Year' | '2nd Year' | '3rd Year' | '4th Year';

export type Department = 
  | 'Civil Engineering'
  | 'Mechanical Engineering'
  | 'Electronics and Communication Engineering (ECE)'
  | 'ECE (VLSI Design Specialization)'
  | 'Electrical and Electronics Engineering (EEE)'
  | 'Computer Science & Engineering (CSE)'
  | 'Computer Science and Business Systems (CSBS)'
  | 'Information Technology (IT)'
  | 'Artificial Intelligence and Data Science (AIDS)'
  | 'Artificial Intelligence and Machine Learning (AIML)'
  | 'Master of Business Administration (MBA)'
  | 'Master of Computer Applications (MCA)'
  | string;

export const ALL_DEPARTMENTS: string[] = [
  'Civil Engineering',
  'Mechanical Engineering',
  'Electronics and Communication Engineering (ECE)',
  'ECE (VLSI Design Specialization)',
  'Electrical and Electronics Engineering (EEE)',
  'Computer Science & Engineering (CSE)',
  'Computer Science and Business Systems (CSBS)',
  'Information Technology (IT)',
  'Artificial Intelligence and Data Science (AIDS)',
  'Artificial Intelligence and Machine Learning (AIML)',
  'Master of Business Administration (MBA)',
  'Master of Computer Applications (MCA)'
];


export interface UserAccount {
  uid: string;
  registerNumber: string;
  normalizedRegisterNumber: string;
  email: string;
  normalizedEmail: string;
  role: UserRole;
  isFirstLogin: boolean;
  accountStatus: 'active' | 'suspended' | 'archived';
  createdAt: string;
  lastLoginAt?: string;
  name: string;
  department: Department;
  academicYear: AcademicYear;
  avatarUrl?: string;
  phone?: string;
  dob?: string;
}

export interface StudentCSVRecord {
  name: string;
  registerNumber: string;
  email: string;
  phone: string;
  dob?: string;
  department: Department;
  academicYear: AcademicYear;
  japaneseStudent: 'Yes' | 'No';
  awsInterested: 'Yes' | 'No';
  club: string;
  status: 'Registered' | 'Pending' | 'Active';
  confirmationId: string;
  registrationDate: string;
}

export interface ProfessionalSkills {
  strongestSkills: string[];
  otherSkill?: string;
}

export interface InterestAndFocusAreas {
  activities: string[];
  organizeCollegeEvents: boolean;
  participateExternalEvents: boolean;
  applyFundingOpportunities: boolean;
  representCollege: boolean;
  organizeTechnicalWorkshops: boolean;
  customInterests?: string;
}

export interface TeamRolesAndStrengths {
  roles: string[];
  logisticsSkills: string[];
  additionalContributions?: string;
}

export interface TeamPreferences {
  preferredRole: string;
  preferredTechnicalDomain: string;
  projectMode: 'Individual' | 'Team' | 'Both';
  preferredTeamSize: string;
  previousProjectExperience: string;
  hackathonExperience: string;
  previousEventParticipation: string;
  availability: 'High (10+ hrs/wk)' | 'Medium (5-10 hrs/wk)' | 'Flexible';
  willingnessToTravel: boolean;
  preferredProjectCategories: string[];
  workedInTeam: boolean;
  participatedInHackathon: boolean;
  developedTechnicalProject: boolean;
  hasProjectPortfolio: boolean;
  willingToLeadTeam: boolean;
  collaborateAcrossDepartments: boolean;
  githubProfile?: string;
  linkedinProfile?: string;
  portfolioWebsite?: string;
  previousProjectLinks?: string;
}

export interface StudentProfile {
  id: string; // normalized register number
  registerNumber: string;
  normalizedRegisterNumber: string;
  name: string;
  email: string;
  normalizedEmail: string;
  phone: string;
  dob?: string;
  department: Department;
  academicYear: AcademicYear;
  club: string;
  japaneseStudent: 'Yes' | 'No';
  awsInterested: 'Yes' | 'No';
  registrationStatus: string;
  confirmationId: string;
  registrationDate: string;
  
  // Profile additions
  profileImage?: string;
  cloudinaryPublicId?: string;
  shortBio?: string;
  personalInterests?: string[];
  preferredContact?: string;
  
  // Professional 4-step profile form
  skills?: ProfessionalSkills;
  interests?: InterestAndFocusAreas;
  teamStrengths?: TeamRolesAndStrengths;
  teamPreferences?: TeamPreferences;
  
  // Status and Meta
  profileCompletionPercentage: number;
  profileStatus: 'draft' | 'pending_review' | 'verified' | 'needs_update';
  submittedAt?: string;
  updatedAt: string;
  createdAt: string;
  isArchived?: boolean;
  archivedAt?: string;
}

export type RequestCategory =
  | 'Student Data Modification'
  | 'Student Account Deletion'
  | 'Staff Account Deletion'
  | 'Bulk Student Deletion'
  | 'Bulk Data Modification'
  | 'New Student Addition'
  | 'Account Access Request'
  | 'Other Administrative Requests';

export type RequestStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Completed';

export interface OfficerRequest {
  requestId: string;
  submittedBy: {
    uid: string;
    name: string;
    email: string;
    role: UserRole;
  };
  category: RequestCategory;
  description: string;
  affectedRecordIds: string[];
  submissionDate: string;
  status: RequestStatus;
  reviewedBy?: {
    uid: string;
    name: string;
    role: UserRole;
  };
  reviewComments?: string;
  resolvedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  category: 'General' | 'Event' | 'Hackathon' | 'Competition' | 'Workshop' | 'Administrative' | 'Quiz' | 'Congratulations' | 'Circular' | string;
  publishedBy: string;
  publisherRole: UserRole;
  publishedAt: string;
  isImportant: boolean;
  attachmentUrl?: string;
  linkText?: string;
  isActive: boolean;
}

export interface AuditLogEntry {
  id: string;
  performedBy: string;
  performerName: string;
  role: UserRole;
  action: string;
  affectedCollection: string;
  affectedRecordIds: string[];
  timestamp: string;
  operationStatus: 'success' | 'failed' | 'warning';
  details?: string;
}

export interface TeamMember {
  studentId: string;
  registerNumber: string;
  name: string;
  department: Department;
  assignedRole: string;
  isLeader: boolean;
}

export interface TeamFormation {
  id: string;
  teamName: string;
  projectDomain: string;
  members: TeamMember[];
  targetCompetition?: string;
  createdBy: string;
  createdAt: string;
  status: 'Forming' | 'Confirmed' | 'Active' | 'Disbanded';
}

export interface SystemSettings {
  initialOnboardingPassword: string;
  isOnboardingPasswordEnabled: boolean;
  requirePasswordChangeOnFirstLogin: boolean;
  administrativePinHash: string; // 6-digit PIN securely hashed/stored
  collegeDomain: string;
  allowStudentProfileEditing: boolean;
  maxTeamSize: number;
  firebaseConfigured: boolean;
  cloudinaryConfigured: boolean;
  activeAcademicYear: string;
}

export interface SupportTicket {
  id: string;
  senderUid: string;
  senderName: string;
  senderEmail: string;
  senderRole: UserRole;
  category: 'Bug Report' | 'Profile Issue' | 'Data Correction' | 'Feature Request' | 'General Inquiry';
  subject: string;
  message: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  adminReply?: string;
  repliedAt?: string;
  repliedBy?: string;
  createdAt: string;
}

export interface PendingAccountRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'OFFICER' | 'STUDENT';
  department: Department;
  academicYear?: AcademicYear;
  registerNumber?: string;
  passwordPlainText: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

