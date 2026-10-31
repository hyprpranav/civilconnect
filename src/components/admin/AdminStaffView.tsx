import React, { useState, useEffect } from 'react';
import { UserAccount, ALL_DEPARTMENTS, Department } from '../../types';
import { storageService } from '../../services/storageService';
import { 
  ShieldCheck, 
  Key, 
  Trash2, 
  Eye, 
  Plus, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  UserCheck, 
  UserX, 
  Copy, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Lock, 
  EyeOff,
  User,
  X,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

interface AdminStaffViewProps {
  currentUser: UserAccount;
  onRefreshData?: () => void;
}

export const AdminStaffView: React.FC<AdminStaffViewProps> = ({
  currentUser,
  onRefreshData
}) => {
  const [staffList, setStaffList] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SUPER_ADMIN' | 'ADMIN' | 'OFFICER'>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Modals state
  const [selectedStaff, setSelectedStaff] = useState<UserAccount | null>(null);
  const [resetPasswordStaff, setResetPasswordStaff] = useState<UserAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState<UserAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Civil Engineering' as Department,
    role: 'OFFICER' as 'OFFICER' | 'ADMIN',
    password: 'civil'
  });

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const data = await storageService.getStaffAccounts();
      setStaffList(data);
    } catch (err) {
      console.error('Error fetching staff list', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Filtered staff
  const filteredStaff = staffList.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone && s.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.registerNumber && s.registerNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.department && s.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
    const matchesDept = deptFilter === 'ALL' || s.department === deptFilter;

    return matchesSearch && matchesRole && matchesDept;
  });

  // Reset Password Handler
  const handleExecutePasswordReset = async () => {
    if (!resetPasswordStaff || !newPassword.trim()) return;
    setIsResetting(true);
    setStatusMessage(null);

    try {
      const cleanPass = newPassword.trim();
      const encoder = new TextEncoder();
      const salt = '_civil_connect_salt_2026';
      
      // Salted hash
      const dataWithSalt = encoder.encode(cleanPass + salt);
      const hashBufferWithSalt = await crypto.subtle.digest('SHA-256', dataWithSalt);
      const passHash = Array.from(new Uint8Array(hashBufferWithSalt)).map(b => b.toString(16).padStart(2, '0')).join('');

      // Unsalted hash
      const dataRaw = encoder.encode(cleanPass);
      const hashBufferRaw = await crypto.subtle.digest('SHA-256', dataRaw);
      const passHashRaw = Array.from(new Uint8Array(hashBufferRaw)).map(b => b.toString(16).padStart(2, '0')).join('');

      // 1. Save to civil_connect_account_credentials
      const mainCredsData = localStorage.getItem('civil_connect_account_credentials');
      const mainCreds = mainCredsData ? JSON.parse(mainCredsData) : {};
      mainCreds[resetPasswordStaff.normalizedEmail] = {
        identifier: resetPasswordStaff.normalizedEmail,
        hash: passHash,
        isFirstLogin: false
      };
      if (resetPasswordStaff.normalizedRegisterNumber) {
        mainCreds[resetPasswordStaff.normalizedRegisterNumber] = {
          identifier: resetPasswordStaff.normalizedRegisterNumber,
          hash: passHash,
          isFirstLogin: false
        };
      }
      localStorage.setItem('civil_connect_account_credentials', JSON.stringify(mainCreds));

      // 2. Save to civil_connect_passwords
      const legacyCredsData = localStorage.getItem('civil_connect_passwords');
      const legacyCreds = legacyCredsData ? JSON.parse(legacyCredsData) : {};
      legacyCreds[resetPasswordStaff.normalizedEmail] = {
        identifier: resetPasswordStaff.normalizedEmail,
        hash: passHash,
        isFirstLogin: false
      };
      localStorage.setItem('civil_connect_passwords', JSON.stringify(legacyCreds));

      // 3. Update pendingAccountRequests if any
      const accReqs = await storageService.getPendingAccountRequests();
      const reqIdx = accReqs.findIndex(r => r.email.toLowerCase() === resetPasswordStaff.normalizedEmail);
      if (reqIdx >= 0) {
        accReqs[reqIdx].passwordPlainText = cleanPass;
        await storageService.savePendingAccountRequests(accReqs);
      }

      await storageService.addAuditLog({
        performedBy: currentUser.uid,
        performerName: currentUser.name,
        role: currentUser.role,
        action: 'PASSWORD_RESET',
        affectedCollection: 'staffAccounts',
        affectedRecordIds: [resetPasswordStaff.uid],
        operationStatus: 'success',
        details: `Reset password for staff member ${resetPasswordStaff.name} (${resetPasswordStaff.email})`
      });

      setStatusMessage({
        type: 'success',
        text: `Password for ${resetPasswordStaff.name} has been successfully updated to "${cleanPass}"! They can log in immediately.`
      });
      setResetPasswordStaff(null);
      setNewPassword('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to reset password.' });
    } finally {
      setIsResetting(false);
    }
  };

  // Delete Staff Handler
  const handleExecuteDeleteStaff = async () => {
    if (!deleteConfirmStaff) return;
    if (deleteConfirmStaff.uid === currentUser.uid) {
      alert('Security Protection: You cannot delete your own active administrator account!');
      setDeleteConfirmStaff(null);
      return;
    }

    setIsDeleting(true);
    setStatusMessage(null);

    try {
      await storageService.deleteStaffAccount(deleteConfirmStaff.uid);

      // Clean credentials
      const mainCredsData = localStorage.getItem('civil_connect_account_credentials');
      if (mainCredsData) {
        const mainCreds = JSON.parse(mainCredsData);
        delete mainCreds[deleteConfirmStaff.normalizedEmail];
        if (deleteConfirmStaff.normalizedRegisterNumber) {
          delete mainCreds[deleteConfirmStaff.normalizedRegisterNumber];
        }
        localStorage.setItem('civil_connect_account_credentials', JSON.stringify(mainCreds));
      }

      const legacyCredsData = localStorage.getItem('civil_connect_passwords');
      if (legacyCredsData) {
        const legacyCreds = JSON.parse(legacyCredsData);
        delete legacyCreds[deleteConfirmStaff.normalizedEmail];
        localStorage.setItem('civil_connect_passwords', JSON.stringify(legacyCreds));
      }

      await storageService.addAuditLog({
        performedBy: currentUser.uid,
        performerName: currentUser.name,
        role: currentUser.role,
        action: 'STAFF_DELETED',
        affectedCollection: 'staffAccounts',
        affectedRecordIds: [deleteConfirmStaff.uid],
        operationStatus: 'success',
        details: `Permanently deleted staff member ${deleteConfirmStaff.name} (${deleteConfirmStaff.email})`
      });

      setStatusMessage({
        type: 'success',
        text: `Staff member ${deleteConfirmStaff.name} has been permanently deleted from the system.`
      });
      setDeleteConfirmStaff(null);
      await loadStaff();
      onRefreshData?.();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete staff member.' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle Account Status (Active / Suspended)
  const handleToggleStatus = async (staff: UserAccount) => {
    if (staff.uid === currentUser.uid) {
      alert('Cannot suspend your own active administrator account.');
      return;
    }

    const newStatus = staff.accountStatus === 'active' ? 'suspended' : 'active';
    const updated: UserAccount = { ...staff, accountStatus: newStatus };
    await storageService.saveStaffAccount(updated);
    await loadStaff();
    setStatusMessage({
      type: 'success',
      text: `${staff.name}'s account status changed to ${newStatus.toUpperCase()}.`
    });
  };

  // Add New Staff Handler
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.name.trim() || !newStaffForm.email.trim() || !newStaffForm.password.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsAdding(true);
    setStatusMessage(null);

    try {
      const cleanEmail = newStaffForm.email.toLowerCase().trim();
      const cleanPass = newStaffForm.password.trim();

      // Check duplicates
      if (staffList.some(s => s.normalizedEmail === cleanEmail)) {
        throw new Error('A staff account with this email address already exists.');
      }

      const newAccount: UserAccount = {
        uid: `staff-${Date.now()}`,
        registerNumber: newStaffForm.phone || `STAFF-${Math.floor(1000 + Math.random() * 9000)}`,
        normalizedRegisterNumber: (newStaffForm.phone || `staff-${Math.floor(1000 + Math.random() * 9000)}`).toLowerCase().trim(),
        email: newStaffForm.email.trim(),
        normalizedEmail: cleanEmail,
        role: newStaffForm.role,
        isFirstLogin: false,
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        name: newStaffForm.name.trim(),
        department: newStaffForm.department,
        academicYear: '2nd Year',
        avatarUrl: undefined
      };

      await storageService.saveStaffAccount(newAccount);

      // Save credentials with salt
      const encoder = new TextEncoder();
      const salt = '_civil_connect_salt_2026';
      const dataWithSalt = encoder.encode(cleanPass + salt);
      const hashBufferWithSalt = await crypto.subtle.digest('SHA-256', dataWithSalt);
      const passHash = Array.from(new Uint8Array(hashBufferWithSalt)).map(b => b.toString(16).padStart(2, '0')).join('');

      const mainCredsData = localStorage.getItem('civil_connect_account_credentials');
      const mainCreds = mainCredsData ? JSON.parse(mainCredsData) : {};
      mainCreds[cleanEmail] = { identifier: cleanEmail, hash: passHash, isFirstLogin: false };
      if (newAccount.normalizedRegisterNumber) {
        mainCreds[newAccount.normalizedRegisterNumber] = { identifier: newAccount.normalizedRegisterNumber, hash: passHash, isFirstLogin: false };
      }
      localStorage.setItem('civil_connect_account_credentials', JSON.stringify(mainCreds));

      const legacyCredsData = localStorage.getItem('civil_connect_passwords');
      const legacyCreds = legacyCredsData ? JSON.parse(legacyCredsData) : {};
      legacyCreds[cleanEmail] = { identifier: cleanEmail, hash: passHash, isFirstLogin: false };
      localStorage.setItem('civil_connect_passwords', JSON.stringify(legacyCreds));

      await storageService.addAuditLog({
        performedBy: currentUser.uid,
        performerName: currentUser.name,
        role: currentUser.role,
        action: 'STAFF_CREATED',
        affectedCollection: 'staffAccounts',
        affectedRecordIds: [newAccount.uid],
        operationStatus: 'success',
        details: `Created new staff member ${newAccount.name} (${newAccount.email}) with role ${newAccount.role}`
      });

      setStatusMessage({
        type: 'success',
        text: `Staff member ${newAccount.name} created successfully! They can log in using password: ${cleanPass}`
      });
      setIsAddModalOpen(false);
      setNewStaffForm({
        name: '',
        email: '',
        phone: '',
        department: 'Civil Engineering',
        role: 'OFFICER',
        password: 'civil'
      });
      await loadStaff();
      onRefreshData?.();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to create staff member.' });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Staff & Faculty Management
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
              {staffList.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Directory of Faculty Officers, System Administrators, and Master Control credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadStaff}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Status Notification */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="truncate">{statusMessage.text}</span>
          </div>
          <button 
            onClick={() => setStatusMessage(null)} 
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search staff by Name, Email, Department, Phone, or Staff ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Roles ({staffList.length})</option>
              <option value="SUPER_ADMIN">Master Admin</option>
              <option value="ADMIN">System Admin</option>
              <option value="OFFICER">Faculty Officer</option>
            </select>

            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 max-w-[180px]"
            >
              <option value="ALL">All Departments</option>
              {ALL_DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
              <UserX className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No staff members found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search criteria or add a new faculty officer or administrator above.
            </p>
          </div>
        ) : (
          filteredStaff.map(staff => {
            const isSelf = staff.uid === currentUser.uid;
            const effectiveAvatar = staff.avatarUrl || 
              ((staff.email.includes('hyprpranav') || staff.name.toLowerCase().includes('harish pranav')) ? '/harish_pranav_profile.jpg' : undefined);

            return (
              <div
                key={staff.uid}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Top Section */}
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-blue-100 border-2 border-blue-200 text-blue-900 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-2xs">
                        {effectiveAvatar ? (
                          <img src={effectiveAvatar} alt={staff.name} className="w-full h-full object-cover" />
                        ) : (
                          staff.name ? staff.name.charAt(0).toUpperCase() : 'S'
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {staff.name}
                          </h4>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 rounded">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{staff.department || 'General Administration'}</span>
                        </p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      staff.role === 'SUPER_ADMIN'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : staff.role === 'ADMIN'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                      {staff.role === 'SUPER_ADMIN' ? 'Master' : staff.role === 'ADMIN' ? 'Admin' : 'Faculty Officer'}
                    </span>
                  </div>

                  {/* Contact Info Chips */}
                  <div className="bg-slate-50/70 p-2.5 rounded-xl space-y-1.5 text-[11px] text-slate-600 border border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-mono truncate">{staff.email}</span>
                      </span>
                      <button
                        onClick={() => handleCopy(staff.email)}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        title="Copy Email"
                      >
                        {copiedText === staff.email ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {staff.phone && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 truncate">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-mono">{staff.phone}</span>
                        </span>
                        <button
                          onClick={() => handleCopy(staff.phone || '')}
                          className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                          title="Copy Phone"
                        >
                          {copiedText === staff.phone ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => setSelectedStaff(staff)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50/60 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>

                  <button
                    onClick={() => {
                      setResetPasswordStaff(staff);
                      setNewPassword('civil@2026');
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50/60 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                    title="Reset Staff Password"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Reset Pass</span>
                  </button>

                  {!isSelf && (
                    <button
                      onClick={() => setDeleteConfirmStaff(staff)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Permanently Delete Staff"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: VIEW STAFF DETAILS */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Staff Credentials & Profile</h3>
              </div>
              <button
                onClick={() => setSelectedStaff(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-2 py-2">
              <div className="w-20 h-20 rounded-full bg-blue-100 border-3 border-blue-200 text-blue-900 flex items-center justify-center font-bold text-xl mx-auto overflow-hidden shadow-xs">
                {selectedStaff.avatarUrl || ((selectedStaff.email.includes('hyprpranav') || selectedStaff.name.toLowerCase().includes('harish pranav')) ? '/harish_pranav_profile.jpg' : null) ? (
                  <img 
                    src={selectedStaff.avatarUrl || '/harish_pranav_profile.jpg'} 
                    alt={selectedStaff.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  selectedStaff.name ? selectedStaff.name.charAt(0).toUpperCase() : 'S'
                )}
              </div>
              <h4 className="text-base font-bold text-slate-900">{selectedStaff.name}</h4>
              <p className="text-xs text-slate-500">{selectedStaff.department || 'General Administration'}</p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedStaff.role === 'SUPER_ADMIN' ? 'Master Control Admin' : selectedStaff.role === 'ADMIN' ? 'Administrator' : 'Faculty Officer'}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Access
                </span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 divide-y divide-slate-200/60 text-xs space-y-2">
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Official / Personal Email</span>
                <span className="font-semibold text-slate-900 font-mono">{selectedStaff.email}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Phone / Identifier</span>
                <span className="font-semibold text-slate-900 font-mono">{selectedStaff.phone || selectedStaff.registerNumber || '—'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">System UID</span>
                <span className="font-semibold text-slate-900 font-mono">{selectedStaff.uid}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Account Created</span>
                <span className="font-semibold text-slate-900">{new Date(selectedStaff.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Last Active</span>
                <span className="font-semibold text-slate-900">{selectedStaff.lastLoginAt ? new Date(selectedStaff.lastLoginAt).toLocaleString() : 'Never logged in'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setResetPasswordStaff(selectedStaff);
                  setSelectedStaff(null);
                  setNewPassword('civil@2026');
                }}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Reset Password
              </button>
              <button
                onClick={() => setSelectedStaff(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET PASSWORD */}
      {resetPasswordStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset Staff Password</h3>
                <p className="text-xs text-slate-500">
                  Assign a new password for <strong className="text-slate-700">{resetPasswordStaff.name}</strong>
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-800 space-y-1">
              <p className="font-semibold">Security Update Notice</p>
              <p className="text-[11px] text-amber-700">
                The new password will be hashed with cryptographic salt and immediately updated across the credentials database.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password (e.g. civil@2026)"
                  className="w-full px-3 py-2 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNewPassword('civil@2026')}
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                Use default: civil@2026
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => setNewPassword('civil')}
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                Use simple: civil
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                onClick={() => setResetPasswordStaff(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                disabled={isResetting}
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePasswordReset}
                disabled={isResetting || !newPassword.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isResetting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                <span>Save New Password</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {deleteConfirmStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Staff Permanently</h3>
                <p className="text-xs text-slate-500">
                  Revoke all administrative access
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900">{deleteConfirmStaff.name}</strong> (<span className="font-mono text-slate-800">{deleteConfirmStaff.email}</span>)?
              This will erase all login credentials and privileges immediately.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmStaff(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDeleteStaff}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD STAFF MEMBER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Add New Staff Member</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. K. Ramanathan"
                  value={newStaffForm.name}
                  onChange={e => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address (Personal or Official) *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. officer@mkce.ac.in or personal@gmail.com"
                  value={newStaffForm.email}
                  onChange={e => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number / Staff ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={newStaffForm.phone}
                    onChange={e => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role *</label>
                  <select
                    value={newStaffForm.role}
                    onChange={e => setNewStaffForm({ ...newStaffForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                  >
                    <option value="OFFICER">Faculty Officer</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Department *</label>
                <select
                  value={newStaffForm.department}
                  onChange={e => setNewStaffForm({ ...newStaffForm, department: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                >
                  {ALL_DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Login Password *</label>
                <input
                  type="text"
                  required
                  value={newStaffForm.password}
                  onChange={e => setNewStaffForm({ ...newStaffForm, password: e.target.value })}
                  placeholder="e.g. civil or custom password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  disabled={isAdding}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isAdding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
