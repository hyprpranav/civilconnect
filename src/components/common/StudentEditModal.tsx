import React, { useState, useEffect, useRef } from 'react';
import { StudentProfile, ALL_DEPARTMENTS, AcademicYear, Department } from '../../types';
import { storageService } from '../../services/storageService';
import { cloudinaryService } from '../../services/cloudinaryService';
import { 
  X, 
  Save, 
  Camera, 
  Trash2, 
  Lock, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Building2, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';

interface StudentEditModalProps {
  student: StudentProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedStudent: StudentProfile) => void | Promise<void>;
  userRole?: 'ADMIN' | 'OFFICER';
}

export const StudentEditModal: React.FC<StudentEditModalProps> = ({
  student,
  isOpen,
  onClose,
  onSave,
  userRole = 'ADMIN'
}) => {
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    dob: string;
    department: Department;
    academicYear: AcademicYear;
    club: string;
    japaneseStudent: 'Yes' | 'No';
    awsInterested: 'Yes' | 'No';
    profileStatus: 'draft' | 'pending_review' | 'verified' | 'needs_update';
    shortBio: string;
  }>({
    name: '',
    phone: '',
    dob: '',
    department: 'Civil Engineering',
    academicYear: '1st Year',
    club: '',
    japaneseStudent: 'No',
    awsInterested: 'No',
    profileStatus: 'draft',
    shortBio: ''
  });

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        phone: student.phone || '',
        dob: student.dob || '',
        department: student.department || 'Civil Engineering',
        academicYear: student.academicYear || '1st Year',
        club: student.club || '',
        japaneseStudent: student.japaneseStudent || 'No',
        awsInterested: student.awsInterested || 'No',
        profileStatus: student.profileStatus || 'draft',
        shortBio: student.shortBio || ''
      });
      setAvatarUrl(student.profileImage);
      setStatusMessage(null);
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setStatusMessage(null);

    try {
      const res = await cloudinaryService.uploadProfileImage(file, student.registerNumber || student.email);
      if (res.success && res.imageUrl) {
        setAvatarUrl(res.imageUrl);
        setStatusMessage({ type: 'success', text: 'New photo uploaded and staged for saving!' });
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Photo upload failed. Please try again.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error uploading student photo.' });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl(undefined);
    setStatusMessage({ type: 'success', text: 'Photo removed. Remember to click "Save Changes".' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setStatusMessage({ type: 'error', text: 'Student full name is required.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const updatedStudent: StudentProfile = {
        ...student,
        name: formData.name.trim().toUpperCase(),
        phone: formData.phone.trim(),
        dob: formData.dob || undefined,
        department: formData.department,
        academicYear: formData.academicYear,
        club: formData.club.trim() || 'General Student Body',
        japaneseStudent: formData.japaneseStudent,
        awsInterested: formData.awsInterested,
        profileStatus: formData.profileStatus,
        shortBio: formData.shortBio.trim(),
        profileImage: avatarUrl || undefined,
        updatedAt: new Date().toISOString()
      };

      // Save to persistent storage
      await storageService.saveStudent(updatedStudent);

      // Audit Log
      await storageService.addAuditLog({
        performedBy: userRole.toLowerCase(),
        performerName: `${userRole} Portal`,
        role: userRole,
        action: 'STUDENT_MODIFIED',
        affectedCollection: 'students',
        affectedRecordIds: [student.id, student.registerNumber],
        operationStatus: 'success',
        details: `${userRole} modified record and profile picture for ${updatedStudent.name} (${updatedStudent.registerNumber}).`
      });

      setStatusMessage({ type: 'success', text: 'Student details updated successfully!' });
      await onSave(updatedStudent);
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save student record.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-teal-300 border border-teal-400/30">
                Student Record Editor
              </span>
              <span className="text-xs text-blue-200 font-mono">
                {student.registerNumber}
              </span>
            </div>
            <h2 className="text-lg font-bold font-serif text-white mt-1">
              Edit Student: {student.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message */}
        {statusMessage && (
          <div className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' 
              : 'bg-red-50 text-red-800 border-b border-red-200'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          
          {/* Avatar Management Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 border-slate-300 shadow-xs shrink-0 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt={formData.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-100 text-blue-900 flex items-center justify-center font-extrabold text-2xl">
                  {formData.name.charAt(0) || <User className="w-8 h-8" />}
                </div>
              )}
              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="font-bold text-slate-900 text-sm">Student Profile Picture</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                  Admin & Staff Access
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Upload official portrait (JPG, PNG, WebP up to 10MB) or remove existing image.
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="student-edit-photo-input"
                />
                <label
                  htmlFor="student-edit-photo-input"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-white hover:bg-blue-50 border border-blue-300 rounded-xl cursor-pointer shadow-2xs transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-700" />
                  <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                </label>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Institutional Immutable Identity Card */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-800" />
              <span className="font-bold text-amber-950 text-xs uppercase tracking-wider">
                Permanent Institutional Credentials (Locked)
              </span>
            </div>
            <p className="text-[11px] text-amber-800">
              For security and audit integrity, Register Number and Official College Email are fixed and cannot be modified.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Register Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={student.registerNumber}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-mono font-bold text-slate-700 text-xs cursor-not-allowed"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Official Institutional Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={student.email}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-mono text-slate-700 text-xs cursor-not-allowed"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-xs font-serif uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-800" /> Editable Personal & Academic Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. SINDHUJA K L"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-800 focus:outline-hidden text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone / WhatsApp Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-800 focus:outline-hidden text-xs"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={e => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-800 focus:outline-hidden text-xs bg-white"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Academic Year</label>
                <select
                  value={formData.academicYear}
                  onChange={e => setFormData({ ...formData, academicYear: e.target.value as AcademicYear })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-800 focus:outline-hidden text-xs"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Department</label>
                <select
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-800 focus:outline-hidden text-xs"
                >
                  {ALL_DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Club / Association</label>
                <input
                  type="text"
                  value={formData.club}
                  onChange={e => setFormData({ ...formData, club: e.target.value })}
                  placeholder="e.g. Sustainable Engineers"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-800 focus:outline-hidden text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Verification Status</label>
                <select
                  value={formData.profileStatus}
                  onChange={e => setFormData({ ...formData, profileStatus: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-800 focus:outline-hidden text-xs font-semibold"
                >
                  <option value="draft">Draft</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="verified">Verified</option>
                  <option value="needs_update">Needs Update</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Japanese Track Student</label>
                <select
                  value={formData.japaneseStudent}
                  onChange={e => setFormData({ ...formData, japaneseStudent: e.target.value as 'Yes' | 'No' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-800 focus:outline-hidden text-xs"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">AWS Track Interested</label>
                <select
                  value={formData.awsInterested}
                  onChange={e => setFormData({ ...formData, awsInterested: e.target.value as 'Yes' | 'No' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-800 focus:outline-hidden text-xs"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Short Profile Bio</label>
                <textarea
                  rows={2}
                  value={formData.shortBio}
                  onChange={e => setFormData({ ...formData, shortBio: e.target.value })}
                  placeholder="Document skills and team formation strengths..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-800 focus:outline-hidden text-xs"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Student Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
