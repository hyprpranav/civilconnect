import React, { useState, useEffect } from 'react';
import { 
  UserAccount, 
  StudentProfile, 
  OfficerRequest, 
  Announcement, 
  AuditLogEntry, 
  TeamFormation, 
  SystemSettings, 
  Department, 
  AcademicYear,
  ALL_DEPARTMENTS,
  PendingAccountRequest
} from '../../types';
import { storageService } from '../../services/storageService';
import { teamService } from '../../services/teamService';
import { AdminPinModal } from '../common/AdminPinModal';
import { AdminAnalyticsView } from './AdminAnalyticsView';
import { AirProfileCardModal } from './AirProfileCardModal';
import { ExportCenterView } from './ExportCenterView';
import { AdminProfileView } from './AdminProfileView';
import { AdminFeedbackView } from './AdminFeedbackView';
import { AdminStaffView } from './AdminStaffView';
import { StudentEditModal } from '../common/StudentEditModal';
import { PasswordChangeModal } from '../common/PasswordChangeModal';
import { AnnouncementsManagerView } from '../common/AnnouncementsManagerView';
import { InterviewEvaluationModal } from '../common/InterviewEvaluationModal';
import { TeamsManagerView } from '../common/TeamsManagerView';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Upload, 
  Download, 
  Trash2, 
  Edit3, 
  Award,
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Key, 
  Sparkles, 
  AlertTriangle, 
  Building2, 
  Layers, 
  FileText, 
  RefreshCw, 
  Settings, 
  Database, 
  FileSpreadsheet, 
  Bell, 
  Archive, 
  RotateCcw,
  Check,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Calendar,
  Hash
} from 'lucide-react';
import Papa from 'papaparse';

interface AdminDashboardProps {
  user: UserAccount;
  students: StudentProfile[];
  announcements: Announcement[];
  onRefreshData: () => void;
  onOpenIntegrationGuide: () => void;
  externalTab?: string;
  onTabChange?: (tab: string) => void;
  onUserUpdated?: (updated: UserAccount) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  students,
  announcements,
  onRefreshData,
  onOpenIntegrationGuide,
  externalTab,
  onTabChange,
  onUserUpdated
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'analytics' | 'students' | 'addStudent' | 'bulkImport' | 'requests' | 'teams' | 'announcements' | 'audit' | 'archive' | 'settings' | 'export' | 'profile' | 'tickets' | 'staff'
  >('overview');

  useEffect(() => {
    if (externalTab) {
      if (externalTab === 'dashboard') setActiveTab('overview');
      else if (externalTab === 'manage-students') setActiveTab('bulkImport');
      else if (externalTab === 'builder') setActiveTab('teams');
      else if (externalTab === 'tickets') setActiveTab('tickets');
      else if (externalTab === 'staff') setActiveTab('staff');
      else setActiveTab(externalTab as any);
    }
  }, [externalTab]);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const [requests, setRequests] = useState<OfficerRequest[]>([]);
  const [pendingAccountRequests, setPendingAccountRequests] = useState<PendingAccountRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [teams, setTeams] = useState<TeamFormation[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [staffAccounts, setStaffAccounts] = useState<UserAccount[]>([]);

  // Search & Filter state for students
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'reg' | 'completion'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Selected student for viewing / editing
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [evaluatingStudent, setEvaluatingStudent] = useState<StudentProfile | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Bulk student selection for deletion or operations
  const [selectedRegNos, setSelectedRegNos] = useState<string[]>([]);

  // Deletion PIN Modal State
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinModalConfig, setPinModalConfig] = useState<{
    title: string;
    description: string;
    targetIds: string[];
    isBulk: boolean;
    onAuthorized: (isPermanent: boolean) => Promise<void>;
  }>({
    title: '',
    description: '',
    targetIds: [],
    isBulk: false,
    onAuthorized: async () => {}
  });

  // CSV Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState<Record<string, string>[]>([]);
  const [importReport, setImportReport] = useState<{
    totalProcessed: number;
    successCount: number;
    failedCount: number;
    duplicates: string[];
    errors: { row: number; error: string }[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annDesc, setAnnDesc] = useState('');
  const [annCategory, setAnnCategory] = useState<'General' | 'Event' | 'Hackathon' | 'Competition' | 'Workshop' | 'Administrative'>('General');
  const [annImportant, setAnnImportant] = useState(false);
  const [annLink, setAnnLink] = useState('');
  const [annLinkText, setAnnLinkText] = useState('');

  // Team Formation State
  const [teamDomainInput, setTeamDomainInput] = useState('Smart Cities & Sustainable Infrastructure');
  const [suggestedTeamDraft, setSuggestedTeamDraft] = useState<{
    teamName: string;
    projectDomain: string;
    members: any[];
  } | null>(null);

  useEffect(() => {
    loadAuxiliaryData();
    loadPendingAccountRequests();
  }, []);

  const loadPendingAccountRequests = async () => {
    try {
      const allReqs = await storageService.getPendingAccountRequests();
      setPendingAccountRequests(allReqs.filter(r => r.status === 'pending'));
    } catch (err) {
      console.error('Failed to load pending account requests', err);
    }
  };

  const handleApproveAccountRequest = async (reqId: string) => {
    const res = await storageService.approveAccountRequest(reqId, user);
    if (res.success) {
      alert(res.message);
      await loadPendingAccountRequests();
      onRefreshData();
    } else {
      alert(res.message);
    }
  };

  const handleRejectAccountRequest = async (reqId: string) => {
    const reason = prompt('Please enter rejection reason (optional):', 'Declined after admin review');
    if (reason === null) return;
    const res = await storageService.rejectAccountRequest(reqId, reason);
    if (res.success) {
      alert(res.message);
      await loadPendingAccountRequests();
    }
  };

  const loadAuxiliaryData = async () => {
    try {
      const [reqs, logs, tms, sets, staff] = await Promise.all([
        storageService.getRequests(),
        storageService.getAuditLogs(),
        storageService.getTeams(),
        storageService.getSettings(),
        storageService.getStaffAccounts()
      ]);
      setRequests(reqs);
      setAuditLogs(logs);
      setTeams(tms);
      setSettings(sets);
      setStaffAccounts(staff);
    } catch (err) {
      console.error('Failed to load auxiliary admin data', err);
    }
  };

  // Filter and Sort Students
  const filteredStudents = students
    .filter(s => {
      const matchSearch = 
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.registerNumber.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === 'All' || s.department === deptFilter;
      const matchYear = yearFilter === 'All' || s.academicYear === yearFilter;
      const matchStatus = statusFilter === 'All' || s.profileStatus === statusFilter;
      return matchSearch && matchDept && matchYear && matchStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'reg') comparison = a.registerNumber.localeCompare(b.registerNumber);
      else if (sortBy === 'completion') comparison = a.profileCompletionPercentage - b.profileCompletionPercentage;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Metric computations
  const totalStudentsCount = students.length;
  const activeStudentsCount = students.filter(s => !s.isArchived).length;
  const completedCount = students.filter(s => s.profileCompletionPercentage === 100).length;
  const pendingCount = students.filter(s => s.profileCompletionPercentage < 100).length;
  const pendingRequestsCount = requests.filter(r => r.status === 'Pending').length + pendingAccountRequests.length;

  // Selection handlers
  const toggleSelectAllPage = () => {
    const pageIds = paginatedStudents.map(s => s.id);
    const allSelected = pageIds.every(id => selectedRegNos.includes(id));
    if (allSelected) {
      setSelectedRegNos(selectedRegNos.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedRegNos(Array.from(new Set([...selectedRegNos, ...pageIds])));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedRegNos(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // --- Secure Deletion Execution ---
  const handleTriggerSingleDelete = (student: StudentProfile) => {
    setPinModalConfig({
      title: 'Authorize Student Record Deletion',
      description: `You are about to delete record for ${student.name} (${student.registerNumber}).`,
      targetIds: [student.id],
      isBulk: false,
      onAuthorized: async (isPermanent) => {
        await storageService.deleteStudent(student.id, !isPermanent);
        await storageService.addAuditLog({
          performedBy: user.uid,
          performerName: user.name,
          role: user.role,
          action: isPermanent ? 'PERMANENT_DELETE' : 'SOFT_DELETE',
          affectedCollection: 'students',
          affectedRecordIds: [student.id],
          operationStatus: 'success',
          details: `${isPermanent ? 'Permanently purged' : 'Archived'} student record ${student.registerNumber}`
        });
        onRefreshData();
      }
    });
    setPinModalOpen(true);
  };

  const handleQuickVerifyStudent = async (student: StudentProfile) => {
    try {
      const updated: StudentProfile = {
        ...student,
        profileStatus: 'verified',
        updatedAt: new Date().toISOString()
      };
      await storageService.saveStudent(updated);
      if (selectedStudent?.id === updated.id) {
        setSelectedStudent(updated);
      }
      await storageService.addAuditLog({
        performedBy: user.uid,
        performerName: user.name,
        role: user.role,
        action: 'STUDENT_VERIFIED',
        affectedCollection: 'students',
        affectedRecordIds: [student.id, student.registerNumber],
        operationStatus: 'success',
        details: `Administrator verified profile for ${student.name} (${student.registerNumber})`
      });
      await onRefreshData();
    } catch (err) {
      console.warn('Failed to verify student', err);
    }
  };

  const handleTriggerBulkDelete = () => {
    if (selectedRegNos.length === 0) return;

    setPinModalConfig({
      title: 'Authorize Bulk Student Deletion',
      description: `You are preparing to delete ${selectedRegNos.length} selected student record(s).`,
      targetIds: selectedRegNos,
      isBulk: true,
      onAuthorized: async (isPermanent) => {
        await storageService.bulkDeleteStudents(selectedRegNos, !isPermanent);
        await storageService.addAuditLog({
          performedBy: user.uid,
          performerName: user.name,
          role: user.role,
          action: isPermanent ? 'BULK_PERMANENT_DELETE' : 'BULK_SOFT_DELETE',
          affectedCollection: 'students',
          affectedRecordIds: selectedRegNos,
          operationStatus: 'success',
          details: `${isPermanent ? 'Permanently purged' : 'Archived'} ${selectedRegNos.length} student records.`
        });
        setSelectedRegNos([]);
        onRefreshData();
      }
    });
    setPinModalOpen(true);
  };

  const handleTriggerPurgeEntireDataset = () => {
    setPinModalConfig({
      title: 'CRITICAL: Purge Entire Student Dataset',
      description: `WARNING: This will archive or purge all ${students.length} student records in CIVIL CONNECT.`,
      targetIds: students.map(s => s.id),
      isBulk: true,
      onAuthorized: async (isPermanent) => {
        const allIds = students.map(s => s.id);
        await storageService.bulkDeleteStudents(allIds, !isPermanent);
        await storageService.addAuditLog({
          performedBy: user.uid,
          performerName: user.name,
          role: user.role,
          action: 'PURGE_ENTIRE_DATASET',
          affectedCollection: 'students',
          affectedRecordIds: allIds,
          operationStatus: 'success',
          details: `Entire student dataset of ${allIds.length} records processed.`
        });
        setSelectedRegNos([]);
        onRefreshData();
      }
    });
    setPinModalOpen(true);
  };

  // --- CSV Bulk Import Handling ---
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setImportReport(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvPreviewRows(results.data.slice(0, 5));
      }
    });
  };

  const handleExecuteCsvImport = async () => {
    if (!csvFile) return;
    setIsImporting(true);
    setImportReport(null);

    Papa.parse<Record<string, string>>(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const report = await storageService.importCSVStudents(results.data);
          setImportReport(report);

          await storageService.addAuditLog({
            performedBy: user.uid,
            performerName: user.name,
            role: user.role,
            action: 'CSV_BULK_IMPORT',
            affectedCollection: 'students',
            affectedRecordIds: [`imported-${report.successCount}`],
            operationStatus: 'success',
            details: `CSV import executed: ${report.successCount} imported, ${report.failedCount} skipped (${report.duplicates.length} duplicates).`
          });

          onRefreshData();
        } catch (err) {
          console.error('Import failed', err);
        } finally {
          setIsImporting(false);
        }
      }
    });
  };

  // --- Officer Request Decisions ---
  const handleRequestDecision = async (requestId: string, status: 'Approved' | 'Rejected', comments: string) => {
    await storageService.updateRequestStatus(
      requestId,
      status,
      { uid: user.uid, name: user.name, role: user.role },
      comments
    );

    await storageService.addAuditLog({
      performedBy: user.uid,
      performerName: user.name,
      role: user.role,
      action: status === 'Approved' ? 'REQUEST_APPROVED' : 'REQUEST_REJECTED',
      affectedCollection: 'requests',
      affectedRecordIds: [requestId],
      operationStatus: 'success',
      details: `Request ${requestId} marked as ${status} with comment: "${comments}"`
    });

    loadAuxiliaryData();
  };

  // --- Announcements Publishing ---
  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annDesc.trim()) return;

    await storageService.saveAnnouncement({
      id: `ann-${Date.now()}`,
      title: annTitle.trim(),
      description: annDesc.trim(),
      category: annCategory,
      isImportant: annImportant,
      publishedBy: `${user.name} (Admin)`,
      publisherRole: user.role,
      publishedAt: new Date().toISOString(),
      linkText: annLinkText || undefined,
      attachmentUrl: annLink || undefined,
      isActive: true
    });

    setAnnTitle('');
    setAnnDesc('');
    setAnnLink('');
    setAnnLinkText('');
    setAnnImportant(false);

    onRefreshData();
  };

  // --- Team Suggestion Generator ---
  const handleGenerateTeamSuggestion = async () => {
    const draft = await teamService.generateSuggestedTeam(teamDomainInput, 5);
    setSuggestedTeamDraft(draft);
  };

  const handleConfirmTeam = async () => {
    if (!suggestedTeamDraft) return;

    const nextNum = teams.length + 1;
    const nextFormatted = nextNum < 10 ? `00${nextNum}` : nextNum < 100 ? `0${nextNum}` : `${nextNum}`;

    await storageService.saveTeam({
      id: `team-${Date.now()}`,
      teamCode: `TM-${nextFormatted}`,
      teamNumber: `Team ${nextNum < 10 ? '0' + nextNum : nextNum}`,
      teamName: suggestedTeamDraft.teamName,
      projectDomain: suggestedTeamDraft.projectDomain,
      members: suggestedTeamDraft.members,
      createdBy: user.name,
      createdAt: new Date().toISOString(),
      status: 'Active'
    });

    await storageService.addAuditLog({
      performedBy: user.uid,
      performerName: user.name,
      role: user.role,
      action: 'TEAM_CREATED',
      affectedCollection: 'teams',
      affectedRecordIds: suggestedTeamDraft.members.map(m => m.studentId),
      operationStatus: 'success',
      details: `Formed team "${suggestedTeamDraft.teamName}" with ${suggestedTeamDraft.members.length} student members.`
    });

    setSuggestedTeamDraft(null);
    loadAuxiliaryData();
  };

  const handleSaveInterviewEvaluation = async (updatedStudent: StudentProfile) => {
    await storageService.saveStudent(updatedStudent);
    await storageService.addAuditLog({
      performedBy: user.uid,
      performerName: user.name,
      role: user.role,
      action: `Interview Evaluation Saved: ${updatedStudent.name} (${updatedStudent.interviewEvaluation?.totalMarks}/100 - ${updatedStudent.interviewEvaluation?.grade})`,
      affectedCollection: 'students',
      affectedRecordIds: [updatedStudent.id],
      operationStatus: 'success',
      details: `Evaluation published to student: ${updatedStudent.interviewEvaluation?.isPublishedToStudent ? 'YES' : 'NO'}`
    });
    if (selectedStudent?.id === updatedStudent.id) {
      setSelectedStudent(updatedStudent);
    }
    await onRefreshData();
  };

  // Export Table Data to CSV
  const handleExportStudentsCSV = () => {
    const csvContent = Papa.unparse(
      students.map(s => ({
        Name: s.name,
        'Register Number': s.registerNumber,
        Email: s.email,
        Phone: s.phone,
        Department: s.department,
        Year: s.academicYear,
        Club: s.club,
        'Completion %': s.profileCompletionPercentage,
        Status: s.profileStatus,
        'Confirmation ID': s.confirmationId
      }))
    );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `civil_connect_students_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Master Control Center Header (Screenshot 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
              Master Control Center
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Full administrative authorization over users, <span className="text-slate-700 font-semibold">system roles</span>, and <span className="text-emerald-700 font-semibold">configuration</span>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenIntegrationGuide}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-teal-600" /> Cloud Setup Guide
          </button>
        </div>
      </div>

      {/* Top 5 Stat Cards (Screenshot 1) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* Card 1: Students */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-2.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">{students.length}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">Students</p>
          </div>
        </div>

        {/* Card 2: Staff Members */}
        <div 
          onClick={() => handleTabChange('staff')}
          className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-2.5 sm:gap-4 cursor-pointer hover:border-purple-300 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">{staffAccounts.length || 1}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate group-hover:text-purple-600 transition-colors">Staff Members</p>
          </div>
        </div>

        {/* Card 3: Pending Requests */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-2.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">{pendingRequestsCount}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">Pending Requests</p>
          </div>
        </div>

        {/* Card 4: Teams */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-2.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">{teams.length}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">Teams</p>
          </div>
        </div>

        {/* Card 5: Events */}
        <div className="col-span-2 sm:col-span-1 bg-white p-3 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-2.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">{announcements.length}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">Events & Notices</p>
          </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW (Screenshot 1: Master Control Center & Workspace) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Master Operations (Screenshot 1) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Master Operations
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
              <button
                onClick={() => handleTabChange('bulkImport')}
                className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 hover:shadow-sm text-center flex flex-col items-center justify-center gap-2 sm:gap-3 transition-all cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-900">Import Database</span>
              </button>

              <button
                onClick={() => handleTabChange('settings')}
                className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 hover:shadow-sm text-center flex flex-col items-center justify-center gap-2 sm:gap-3 transition-all cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-900">Manage Roles</span>
              </button>

              <button
                onClick={() => handleTabChange('export')}
                className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 hover:shadow-sm text-center flex flex-col items-center justify-center gap-2 sm:gap-3 transition-all cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-900">Export Data</span>
              </button>

              <button
                onClick={() => handleTabChange('settings')}
                className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm text-center flex flex-col items-center justify-center gap-2 sm:gap-3 transition-all cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-900">System Settings</span>
              </button>
            </div>
          </div>

          {/* Mentor Workspace Section (Screenshot 1) */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-sans tracking-tight">
                Mentor Workspace
              </h2>
              <p className="text-xs text-slate-500">
                Manage student groups, teams, events, and access requests.
              </p>
            </div>

            {/* Quick Workspace Switcher Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                onClick={() => handleTabChange('students')}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Student Database</span>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-xs text-slate-500">
                  {students.length} active registered student profiles. Search or view Air Profile Cards.
                </p>
              </div>

              <div 
                onClick={() => handleTabChange('teams')}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-teal-300 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Teams & Squads</span>
                  <Sparkles className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-xs text-slate-500">
                  {teams.length} project squads formed. Launch intelligent team builder engine.
                </p>
              </div>

              <div 
                onClick={() => handleTabChange('analytics')}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Skill Analytics & Charts</span>
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-xs text-slate-500">
                  Dynamic visual bar charts of competencies, roles, and readiness metrics.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Security Controls & Audit Snippet */}
          <div className="space-y-6">
            <div className="bg-red-50/70 border border-red-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-red-950 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-red-700" />
                Administrative Security Gateway
              </div>
              <p className="text-xs text-red-900 leading-relaxed">
                All destructive operations (individual deletions, bulk purges) are gated by a mandatory 6-digit PIN and recorded in immutable audit logs.
              </p>
              <button
                onClick={handleTriggerPurgeEntireDataset}
                className="w-full py-2 px-3 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Purge Entire Student Dataset
              </button>
            </div>

            {/* Audit Log Snippet */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">Recent Audit Actions</h4>
                <button onClick={() => setActiveTab('audit')} className="text-[11px] text-blue-700 font-semibold hover:underline">
                  View logs
                </button>
              </div>
              <div className="space-y-2 text-xs">
                {auditLogs.slice(0, 4).map(log => (
                  <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                    <div className="flex items-center justify-between font-semibold text-slate-800 text-[11px]">
                      <span>{log.action}</span>
                      <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1.5: ANALYTICS & SKILL BAR CHARTS */}
      {activeTab === 'analytics' && (
        <AdminAnalyticsView
          students={students}
          onOpenAirProfileCard={s => setSelectedStudent(s)}
        />
      )}

      {/* TAB 2: STUDENT MANAGEMENT DATABASE */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-6 shadow-xs space-y-4">
          {/* Action and Search Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search students by Name, Register Number or Email..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <select
                value={deptFilter}
                onChange={e => { setDeptFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
              >
                <option value="All">All Departments ({ALL_DEPARTMENTS.length})</option>
                {ALL_DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <select
                value={yearFilter}
                onChange={e => { setYearFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="All">All Years</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="pending_review">Pending Review</option>
                <option value="draft">Draft</option>
              </select>

              {selectedRegNos.length > 0 && (
                <button
                  onClick={handleTriggerBulkDelete}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Selected ({selectedRegNos.length})
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={
                        paginatedStudents.length > 0 &&
                        paginatedStudents.every(s => selectedRegNos.includes(s.id))
                      }
                      onChange={toggleSelectAllPage}
                      className="rounded border-slate-300 text-blue-800"
                    />
                  </th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Register Number</th>
                  <th className="py-3 px-3">Department & Year</th>
                  <th className="py-3 px-3">Official Email</th>
                  <th className="py-3 px-3">Club</th>
                  <th className="py-3 px-3">Completion</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.map(student => {
                  const isChecked = selectedRegNos.includes(student.id);
                  const assignedTeam = teams.find(t =>
                    t.members.some(m => {
                      const mId = (m.studentId || '').toLowerCase().trim();
                      const mReg = (m.registerNumber || '').toLowerCase().trim();
                      const sId = (student.id || '').toLowerCase().trim();
                      const sReg = (student.registerNumber || '').toLowerCase().trim();
                      return mId === sId || mReg === sReg || mId === sReg || mReg === sId;
                    })
                  );

                  return (
                    <tr key={student.id} className={`hover:bg-slate-50/70 transition-colors ${isChecked ? 'bg-blue-50/40' : ''}`}>
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectStudent(student.id)}
                          className="rounded border-slate-300 text-blue-800"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-2xs">
                            {student.profileImage ? (
                              <img src={student.profileImage} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                              student.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs block">{student.name}</span>
                            {assignedTeam && (
                              <span className="text-[10px] text-teal-800 font-semibold truncate block max-w-[140px]" title={assignedTeam.teamName}>
                                {assignedTeam.teamName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-blue-900">
                        <div>{student.registerNumber}</div>
                        {assignedTeam && (
                          <div className="mt-1">
                            <span 
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-50 text-teal-900 border border-teal-300 shadow-2xs"
                              title={`Assigned to ${assignedTeam.teamName}`}
                            >
                              <Hash className="w-2.5 h-2.5 text-teal-700" />
                              {assignedTeam.teamCode || assignedTeam.teamNumber || 'TM-001'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {student.department} • <span className="font-medium text-slate-800">{student.academicYear}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[160px]">
                        {student.email}
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[130px]">
                        {student.club}
                      </td>
                      <td className="py-3 px-3 font-bold text-blue-900">
                        {student.profileCompletionPercentage}%
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          student.profileStatus === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                          student.profileStatus === 'pending_review' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {student.profileStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="p-1 text-slate-600 hover:text-blue-800"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEvaluatingStudent(student)}
                          className="p-1 text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded"
                          title="1-to-1 Interview & Evaluation Sheet (100 Marks)"
                        >
                          <Award className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingStudent(student)}
                          className="p-1 text-slate-600 hover:text-blue-800"
                          title="Edit Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleTriggerSingleDelete(student)}
                          className="p-1 text-red-500 hover:text-red-700"
                          title="Delete with 6-Digit PIN"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>
              Showing {paginatedStudents.length} of {filteredStudents.length} records (Page {currentPage} of {totalPages})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BULK IMPORT (CSV & GOOGLE SHEETS) */}
      {activeTab === 'bulkImport' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 max-w-3xl mx-auto">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-800" />
              Bulk Student CSV & Google Sheets Import
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload the institutional CSV containing the 97 Civil Engineering student records. The system validates uniqueness, maps the 12 fields, and prepares user accounts.
            </p>
          </div>

          {/* Sample Download Pill */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-bold text-xs text-blue-950">Official 97-Student Cohort CSV Ready:</h4>
              <p className="text-[11px] text-slate-600">Sample file: <code className="font-mono font-semibold">civil_connect_students_97.csv</code></p>
            </div>
            <a
              href="/civil_connect_students_97.csv"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-900 bg-white hover:bg-blue-100 border border-blue-300 rounded-lg shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" /> Download 97-Student CSV
            </a>
          </div>

          {/* File Upload Area */}
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3 bg-slate-50/50">
            <Upload className="w-10 h-10 text-slate-400 mx-auto" />
            <div>
              <p className="text-xs font-bold text-slate-700">Select or Drag & Drop Student CSV</p>
              <p className="text-[11px] text-slate-400">Supports .csv exported from Google Sheets or Excel</p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvFileChange}
              className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-900 file:text-white hover:file:bg-blue-950 cursor-pointer"
            />
          </div>

          {/* Preview Table */}
          {csvPreviewRows.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800">CSV Header Mapping Preview (First 5 Rows):</h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Register Number</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Department</th>
                      <th className="py-2 px-3">Year</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {csvPreviewRows.map((row, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-semibold">{row['Name'] || row['name']}</td>
                        <td className="py-2 px-3 font-mono text-blue-900">{row['Register Number'] || row['registerNumber']}</td>
                        <td className="py-2 px-3 text-slate-500">{row['Official college mail id'] || row['email']}</td>
                        <td className="py-2 px-3">{row['Department'] || row['department']}</td>
                        <td className="py-2 px-3">{row['Year'] || row['academicYear']}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleExecuteCsvImport}
                  disabled={isImporting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isImporting ? 'Processing & Validating Records...' : 'Execute Import to Database'}
                </button>
              </div>
            </div>
          )}

          {/* Import Result Report */}
          {importReport && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900">Import Execution Summary:</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Processed</span>
                  <p className="text-lg font-bold text-slate-900">{importReport.totalProcessed}</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                  <span className="text-emerald-700 text-[10px] uppercase font-bold">Successfully Added</span>
                  <p className="text-lg font-bold text-emerald-800">{importReport.successCount}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <span className="text-amber-700 text-[10px] uppercase font-bold">Skipped / Duplicates</span>
                  <p className="text-lg font-bold text-amber-800">{importReport.failedCount}</p>
                </div>
              </div>

              {importReport.duplicates.length > 0 && (
                <div className="space-y-1">
                  <span className="font-semibold text-amber-800">Identified Duplicate Register Numbers:</span>
                  <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                    {importReport.duplicates.map(d => (
                      <span key={d} className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACCOUNT ONBOARDING & OFFICER REQUEST MANAGEMENT */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* SECTION A: PENDING ACCOUNT REQUESTS (OFFICERS & STUDENTS) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-700" />
                  Account Registration & Access Requests ({pendingAccountRequests.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authorize incoming Faculty Officer or Student registration requests. Once approved, logins activate immediately.
                </p>
              </div>
              <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 shrink-0">
                Awaiting Admin Action
              </span>
            </div>

            {pendingAccountRequests.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No pending account onboarding requests.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">New Faculty Officers or Students requesting accounts will appear here for 1-click activation.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingAccountRequests.map(req => (
                  <div key={req.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/20 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{req.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 inline-block ${
                          req.role === 'OFFICER' ? 'bg-purple-100 text-purple-900' : 'bg-blue-100 text-blue-900'
                        }`}>
                          {req.role === 'OFFICER' ? 'Faculty Officer' : 'Student'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(req.requestedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                      <p><strong>Department:</strong> {req.department}</p>
                      <p><strong>Email:</strong> {req.email}</p>
                      <p><strong>Phone:</strong> {req.phone}</p>
                      {req.registerNumber && (
                        <p><strong>Register No:</strong> <span className="font-mono text-blue-950 font-bold">{req.registerNumber}</span></p>
                      )}
                      {req.academicYear && (
                        <p><strong>Year:</strong> {req.academicYear}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleRejectAccountRequest(req.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleApproveAccountRequest(req.id)}
                        className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Activate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION B: FACULTY OFFICER ADMINISTRATIVE REQUESTS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                  Faculty Officer Administrative Requests ({requests.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Review, approve, or reject administrative data modifications and deletion requests submitted by Faculty Officers.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.requestId} className="border border-slate-200 rounded-xl p-4 space-y-3 hover:border-slate-300 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {req.requestId}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{req.category}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                      req.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">{req.description}</p>

                  {req.affectedRecordIds.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                      <span>Target Records:</span>
                      {req.affectedRecordIds.map(id => (
                        <span key={id} className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
                          {id}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                    <span>Submitted by: <strong className="text-slate-700">{req.submittedBy.name}</strong> on {new Date(req.submissionDate).toLocaleDateString()}</span>

                    {req.status === 'Pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRequestDecision(req.requestId, 'Approved', 'Approved by Department Admin')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRequestDecision(req.requestId, 'Rejected', 'Rejected after departmental review')}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SQUAD & TEAMS MANAGEMENT */}
      {activeTab === 'teams' && (
        <TeamsManagerView
          currentUser={user}
          students={students}
          onTeamUpdated={loadAuxiliaryData}
        />
      )}

      {/* TAB 6: ANNOUNCEMENTS MANAGEMENT */}
      {activeTab === 'announcements' && (
        <AnnouncementsManagerView
          currentUser={user}
          announcements={announcements}
          onRefreshData={onRefreshData}
          roleLabel="Admin"
        />
      )}

      {/* TAB 7: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                System Activity & Security Audit Logs ({auditLogs.length})
              </h3>
              <p className="text-xs text-slate-500">
                Immutable chronological record of logins, password updates, bulk imports, and PIN authorizations.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto -mx-3.5 px-3.5 sm:mx-0 sm:px-0 border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Performer</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{log.performerName}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {log.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-900 text-[11px]">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{log.details}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {log.operationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: SYSTEM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 text-xs">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">
              System Configuration & Security Controls
            </h3>
            <p className="text-xs text-slate-500">
              Manage initial onboarding passwords, administrative deletion PINs, and database backups.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 text-xs">Initial Student Onboarding Password</span>
              <p className="text-slate-500 text-[11px]">
                Configured as <code className="bg-white px-2 py-0.5 rounded border border-slate-300 font-mono font-bold text-blue-900">civil</code>. 
                Students must update their password immediately upon their first successful login.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 text-xs">Six-Digit Administrative Deletion PIN</span>
              <p className="text-slate-500 text-[11px]">
                Configured test PIN: <code className="bg-white px-2 py-0.5 rounded border border-slate-300 font-mono font-bold text-red-900">654321</code>.
                Required to authorize any deletion of student or staff records.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Database Backup (JSON)</span>
                <span className="text-[11px] text-slate-500">Export full snapshot of students, logs, and settings</span>
              </div>
              <button
                onClick={async () => {
                  const json = await storageService.exportDatabaseJSON();
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `civil_connect_backup_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                }}
                className="px-4 py-2 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl"
              >
                Download JSON Backup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: EXPORT CENTER (Screenshot 3) */}
      {activeTab === 'export' && (
        <ExportCenterView
          students={students}
          teams={teams}
          announcements={announcements}
        />
      )}

      {/* TAB: STAFF MANAGEMENT */}
      {activeTab === 'staff' && (
        <AdminStaffView
          currentUser={user}
          onRefreshData={onRefreshData}
        />
      )}

      {/* TAB: MY PROFILE (Screenshot 2) */}
      {activeTab === 'profile' && (
        <AdminProfileView
          user={user}
          onBackToDashboard={() => setActiveTab('overview')}
          onUserUpdated={onUserUpdated}
          onOpenChangePassword={() => setShowPasswordModal(true)}
        />
      )}

      {/* TAB: FEEDBACK & ISSUE TICKETS */}
      {activeTab === 'tickets' && (
        <AdminFeedbackView
          adminUser={user}
          onRefreshParent={onRefreshData}
        />
      )}

      {/* Admin 6-Digit PIN Modal */}
      <AdminPinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        title={pinModalConfig.title}
        description={pinModalConfig.description}
        itemCount={pinModalConfig.targetIds.length}
        isBulk={pinModalConfig.isBulk}
        canPermanentDelete={user.role === 'SUPER_ADMIN'}
        onSuccess={pinModalConfig.onAuthorized}
      />

      {/* Student Air Profile Card Modal */}
      <AirProfileCardModal
        student={selectedStudent}
        teams={teams}
        onClose={() => setSelectedStudent(null)}
        onEdit={s => {
          setSelectedStudent(null);
          setEditingStudent(s);
        }}
        onInterview={s => {
          setSelectedStudent(null);
          setEvaluatingStudent(s);
        }}
        onStudentUpdated={async (updated) => {
          setSelectedStudent(updated);
          await onRefreshData();
        }}
        onVerifyStudent={handleQuickVerifyStudent}
      />

      {/* Student Edit Record Modal */}
      <StudentEditModal
        student={editingStudent}
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        onSave={async (updated) => {
          setEditingStudent(null);
          if (selectedStudent?.id === updated.id) {
            setSelectedStudent(updated);
          }
          await onRefreshData();
        }}
        userRole={user.role === 'SUPER_ADMIN' ? 'ADMIN' : 'ADMIN'}
      />

      {/* 1-to-1 Interview & Performance Evaluation Sheet Modal */}
      {evaluatingStudent && (
        <InterviewEvaluationModal
          student={evaluatingStudent}
          currentUser={user}
          isOpen={!!evaluatingStudent}
          onClose={() => setEvaluatingStudent(null)}
          onSave={handleSaveInterviewEvaluation}
        />
      )}

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        identifier={user.email || user.registerNumber}
      />
    </div>
  );
};
