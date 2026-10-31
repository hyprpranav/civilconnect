import React, { useState } from 'react';
import { UserAccount, ALL_DEPARTMENTS, Department } from '../../types';
import { 
  ArrowLeft, 
  Edit3, 
  Camera, 
  Mail, 
  Phone, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  Upload,
  Cloud,
  Check,
  X,
  User,
  ExternalLink,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { cloudinaryService } from '../../services/cloudinaryService';
import { storageService } from '../../services/storageService';
import { initializeFirebase } from '../../services/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

interface AdminProfileViewProps {
  user: UserAccount;
  onBackToDashboard: () => void;
  onUserUpdated?: (updated: UserAccount) => void;
}

export const AdminProfileView: React.FC<AdminProfileViewProps> = ({
  user,
  onBackToDashboard,
  onUserUpdated
}) => {
  const getInitialAvatar = () => {
    if (user.avatarUrl && !user.avatarUrl.includes('unsplash')) {
      return user.avatarUrl;
    }
    if (user.email.includes('hyprpranav') || user.name.toLowerCase().includes('harish pranav') || user.email.includes('92762bec066')) {
      return '/harish_pranav_profile.jpg';
    }
    return '';
  };

  const [profileImage, setProfileImage] = useState<string>(getInitialAvatar());
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Edit details modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.name || 'Harish Pranav S (Dev)',
    phone: user.phone || '+91 7845693765',
    dob: user.dob || '2004-10-15',
    department: (user.department || 'Civil Engineering') as Department,
    academicYear: user.academicYear || 'IV Year',
    section: 'A'
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatusMessage(null);
    try {
      const res = await cloudinaryService.uploadProfileImage(file, user.registerNumber || user.email);
      if (res.success && res.imageUrl) {
        const newAvatarUrl = res.imageUrl;
        setProfileImage(newAvatarUrl);

        // 1. Update UserAccount object
        const updatedUser: UserAccount = {
          ...user,
          avatarUrl: newAvatarUrl
        };

        // 2. Save in Staff Accounts storage
        await storageService.saveStaffAccount(updatedUser);

        // 3. Save in active auth session
        localStorage.setItem('civil_connect_auth_session', JSON.stringify(updatedUser));

        // 4. Update student profile if matching Harish Pranav
        try {
          const students = await storageService.getStudents();
          const matchedStudent = students.find(s => 
            s.email.toLowerCase() === updatedUser.normalizedEmail || 
            s.name.toLowerCase().includes('harish pranav') ||
            s.registerNumber.includes('92762')
          );
          if (matchedStudent) {
            matchedStudent.profileImage = newAvatarUrl;
            await storageService.saveStudent(matchedStudent);
          }
        } catch (studentErr) {
          console.warn('Failed to mirror avatar to student record', studentErr);
        }

        // 5. Cloud Firestore synchronization (if configured)
        try {
          const { db } = initializeFirebase();
          if (db) {
            await setDoc(doc(db, 'staff_accounts', updatedUser.uid), {
              ...updatedUser,
              avatarUrl: newAvatarUrl,
              lastSyncedAt: new Date().toISOString()
            }, { merge: true });
          }
        } catch (cloudErr) {
          console.warn('Cloud Firestore sync note:', cloudErr);
        }

        // 6. Notify parent component to update reactive state everywhere (Sidebar, Navbar, etc.)
        onUserUpdated?.(updatedUser);

        setStatusMessage('Profile photo updated & synchronized with Cloud storage successfully!');
      } else {
        setStatusMessage(res.message || 'Image upload failed. Please try again.');
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Error uploading image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDetails(true);
    setStatusMessage(null);

    try {
      const updatedUser: UserAccount = {
        ...user,
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        dob: editForm.dob,
        department: editForm.department,
        academicYear: editForm.academicYear as any
      };

      // Save to staff accounts
      await storageService.saveStaffAccount(updatedUser);

      // Save to auth session
      localStorage.setItem('civil_connect_auth_session', JSON.stringify(updatedUser));

      // Mirror to student record if matching
      try {
        const students = await storageService.getStudents();
        const matched = students.find(s => 
          s.email.toLowerCase() === user.normalizedEmail || 
          s.name.toLowerCase().includes('harish pranav')
        );
        if (matched) {
          matched.name = editForm.name.trim();
          matched.department = editForm.department;
          matched.phone = editForm.phone.trim();
          await storageService.saveStudent(matched);
        }
      } catch (err) {
        console.warn('Mirror error', err);
      }

      onUserUpdated?.(updatedUser);
      setIsEditModalOpen(false);
      setStatusMessage('Developer profile details updated and saved successfully!');
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to save profile details.');
    } finally {
      setIsSavingDetails(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              My Profile
            </h2>
            <p className="text-xs text-slate-500">
              Update your details and keep your developer credentials current.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Details</span>
          </button>

          <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors">
            <Camera className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Uploading...' : 'Edit Photo'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Profile Card Hero */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-8 shadow-xs text-center space-y-4">
        <div className="relative inline-block mx-auto group">
          <div className="w-24 h-24 rounded-full bg-blue-100 border-4 border-slate-100 shadow-md flex items-center justify-center text-blue-900 font-bold text-2xl overflow-hidden mx-auto">
            {profileImage ? (
              <img
                src={profileImage}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{user.name ? user.name.charAt(0).toUpperCase() : 'D'}</span>
            )}
          </div>
          
          <label className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Camera className="w-5 h-5 mb-0.5" />
            <span>Change</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={isUploading}
            />
          </label>

          {isUploading && (
            <div className="absolute inset-0 bg-blue-900/60 rounded-full flex flex-col items-center justify-center text-white text-xs font-semibold backdrop-blur-xs">
              <RefreshCw className="w-5 h-5 animate-spin mb-1" />
              <span>Saving...</span>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {user.name}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {user.department || 'Civil Engineering'} · {user.academicYear || 'IV Year'} · Sec A
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span>Master Developer</span>
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <Cloud className="w-3 h-3 text-emerald-600" />
            <span>Cloud Active</span>
          </span>
        </div>

        <div className="pt-2">
          <button
            onClick={() => alert(`Official Master Administrator Account:\nID: ${user.uid}\nEmail: ${user.email}\nRole: Master Control Developer`)}
            className="px-4 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors cursor-pointer"
          >
            View Developer Credentials
          </button>
        </div>
      </div>

      {/* Basic Information Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            BASIC INFORMATION
          </span>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3 h-3" /> Edit
          </button>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Name</span>
            <span className="font-semibold text-slate-900">{user.name}</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Official Email</span>
            <span className="font-semibold text-slate-900 font-mono">{user.email}</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Department</span>
            <span className="font-semibold text-slate-900">{user.department || 'Civil Engineering'}</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Date of Birth (DOB)</span>
            <span className="font-semibold text-slate-900 font-mono">
              {user.dob ? new Date(user.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'October 15, 2004'}
            </span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Gender</span>
            <span className="font-semibold text-slate-900">Male</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Year</span>
            <span className="font-semibold text-slate-900">{user.academicYear || 'IV (Final Year)'}</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Section</span>
            <span className="font-semibold text-slate-900">A</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Register Number / ID</span>
            <span className="font-semibold text-slate-900 font-mono">{user.registerNumber || 'hyprpranav'}</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Roll Number</span>
            <span className="font-semibold text-slate-900 font-mono">001</span>
          </div>
        </div>
      </div>

      {/* Contact Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          CONTACT DETAILS & SECURITY
        </span>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Phone Number</span>
            <span className="font-semibold text-slate-900 font-mono">{user.phone || '+91 7845693765'}</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Institutional Access</span>
            <span className="font-semibold text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Full Master Authorization & Developer Access
            </span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Cloud Storage Sync</span>
            <span className="font-semibold text-blue-700 flex items-center gap-1 font-mono">
              <Cloud className="w-3.5 h-3.5 text-blue-600" />
              Cloudinary CDN & Local Storage Active
            </span>
          </div>
        </div>
      </div>

      {/* EDIT DETAILS MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Edit Developer Profile Details</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDetails} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Developer Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Email Address (Fixed)</label>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3 h-3 text-slate-400" /> Cannot be changed
                  </span>
                </div>
                <input
                  type="email"
                  disabled
                  readOnly
                  value={user.email}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Register Number (Fixed)</label>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3 h-3 text-slate-400" /> Fixed ID
                  </span>
                </div>
                <input
                  type="text"
                  disabled
                  readOnly
                  value={user.registerNumber || 'hyprpranav'}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Birth (DOB)</label>
                  <input
                    type="date"
                    value={editForm.dob}
                    onChange={e => setEditForm({ ...editForm, dob: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  value={editForm.academicYear}
                  onChange={e => setEditForm({ ...editForm, academicYear: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Department</label>
                <select
                  value={editForm.department}
                  onChange={e => setEditForm({ ...editForm, department: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                >
                  {ALL_DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  disabled={isSavingDetails}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDetails}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingDetails ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
