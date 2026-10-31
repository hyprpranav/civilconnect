import React, { useState } from 'react';
import { UserAccount, ALL_DEPARTMENTS, Department } from '../../types';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  ShieldCheck, 
  Lock, 
  Camera, 
  Check, 
  Edit3, 
  Save, 
  X, 
  Sparkles,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cloudinaryService } from '../../services/cloudinaryService';
import { storageService } from '../../services/storageService';

interface OfficerProfileViewProps {
  user: UserAccount;
  onBackToDashboard: () => void;
  onUserUpdated?: (updated: UserAccount) => void;
  onOpenChangePassword?: () => void;
}

export const OfficerProfileView: React.FC<OfficerProfileViewProps> = ({
  user,
  onBackToDashboard,
  onUserUpdated,
  onOpenChangePassword
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit form state
  // Notice: Email and Register Number are fixed and non-editable.
  // Name, Phone, Date of Birth (DOB), and Department are editable.
  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    dob: user.dob || '',
    department: (user.department || 'Civil Engineering') as Department
  });

  const effectiveAvatar = 
    user.avatarUrl || 
    storageService.getSavedAvatar(user.email) || 
    storageService.getSavedAvatar(user.registerNumber) || 
    undefined;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setStatusMessage(null);

    try {
      const res = await cloudinaryService.uploadProfileImage(file, user.registerNumber || user.email);
      if (res.success && res.imageUrl) {
        const updated: UserAccount = {
          ...user,
          avatarUrl: res.imageUrl
        };
        await storageService.saveStaffAccount(updated);
        localStorage.setItem('civil_connect_auth_session', JSON.stringify(updated));
        storageService.saveUserAvatar(user.email, res.imageUrl);
        if (user.registerNumber) storageService.saveUserAvatar(user.registerNumber, res.imageUrl);
        onUserUpdated?.(updated);
        setStatusMessage({ type: 'success', text: 'Profile photo updated successfully!' });
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Photo upload failed.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Upload error occurred.' });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setStatusMessage({ type: 'error', text: 'Faculty Name cannot be empty.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const updated: UserAccount = {
        ...user,
        name: form.name.trim(),
        phone: form.phone.trim(),
        dob: form.dob,
        department: form.department
      };

      await storageService.saveStaffAccount(updated);
      localStorage.setItem('civil_connect_auth_session', JSON.stringify(updated));
      onUserUpdated?.(updated);
      setIsEditModalOpen(false);
      setStatusMessage({ type: 'success', text: 'Faculty profile updated successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl border border-slate-200 transition-colors shadow-2xs"
            title="Return to Student Management"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-serif">
                Faculty Officer Profile
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                Verified Faculty
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Manage personal contact information, date of birth, and faculty credentials.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setForm({
              name: user.name || '',
              phone: user.phone || '',
              dob: user.dob || '',
              department: (user.department || 'Civil Engineering') as Department
            });
            setIsEditModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit Details</span>
        </button>
      </div>

      {/* Status Banner */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Profile Showcase Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar with Camera Trigger */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-blue-50 border-2 border-blue-200 overflow-hidden shadow-xs flex items-center justify-center text-blue-800 text-3xl font-extrabold">
              {effectiveAvatar ? (
                <img src={effectiveAvatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name ? user.name.charAt(0).toUpperCase() : 'F'
              )}
            </div>

            <label className="absolute inset-0 bg-slate-900/50 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold">Change Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
                disabled={isUploadingPhoto}
              />
            </label>

            {isUploadingPhoto && (
              <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center text-blue-600 text-xs font-bold">
                Uploading...
              </div>
            )}
          </div>

          {/* Core Info */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-serif">
                  {user.name}
                </h2>
                <p className="text-xs text-blue-700 font-semibold mt-0.5">
                  Faculty Advisor & Officer Console
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 self-center md:self-auto">
                Account Active
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {user.department || 'Civil Engineering'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-mono text-slate-700 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Grid of Attributes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          {/* Email (Fixed) */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" /> College Email
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                <Lock className="w-3 h-3 text-slate-400" /> Fixed
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-slate-800 truncate" title={user.email}>
              {user.email}
            </p>
          </div>

          {/* Register / Staff ID (Fixed) */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Staff ID / Reg No
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                <Lock className="w-3 h-3 text-slate-400" /> Fixed
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-slate-800">
              {user.registerNumber || 'FAC-2590'}
            </p>
          </div>

          {/* Phone (Editable) */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" /> Contact Phone
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Editable
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-slate-800">
              {user.phone || 'Not provided'}
            </p>
          </div>

          {/* Date of Birth (Editable) */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" /> Date of Birth (DOB)
              </span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                Editable
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-slate-800">
              {user.dob ? new Date(user.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified (click Edit)'}
            </p>
          </div>

          {/* Department (Editable) */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Assigned Department
              </span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                Editable
              </span>
            </div>
            <p className="text-xs font-bold text-slate-800 truncate">
              {user.department || 'Civil Engineering'}
            </p>
          </div>

          {/* Security & Access Key */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-teal-600" /> Password Security
              </span>
              {onOpenChangePassword && (
                <button
                  type="button"
                  onClick={onOpenChangePassword}
                  className="px-2.5 py-1 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Change Password
                </button>
              )}
            </div>
            <p className="text-xs text-slate-600">
              Protected with SHA-256 salted hash
            </p>
          </div>
        </div>
      </div>

      {/* EDIT DETAILS MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif">Edit Faculty Profile</h3>
                  <p className="text-xs text-slate-500">Update personal and contact information</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Dr. Pranav S"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-medium"
                  required
                />
              </div>

              {/* Fixed Email */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Email Address (Fixed)</label>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Cannot be changed
                  </span>
                </div>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  readOnly
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* Fixed Staff ID */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Staff / Register ID (Fixed)</label>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Cannot be changed
                  </span>
                </div>
                <input
                  type="text"
                  value={user.registerNumber || 'FAC-2590'}
                  disabled
                  readOnly
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. 784-569-3765"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>

                {/* Date of Birth (DOB) */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Date of Birth (DOB)</label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={e => setForm({ ...form, dob: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Department</label>
                <select
                  value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value as Department })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-medium cursor-pointer"
                >
                  {ALL_DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
