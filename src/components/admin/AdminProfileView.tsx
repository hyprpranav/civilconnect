import React, { useState } from 'react';
import { UserAccount } from '../../types';
import { 
  ArrowLeft, 
  Edit3, 
  Camera, 
  Mail, 
  Phone, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  Upload 
} from 'lucide-react';
import { cloudinaryService } from '../../services/cloudinaryService';

interface AdminProfileViewProps {
  user: UserAccount;
  onBackToDashboard: () => void;
}

export const AdminProfileView: React.FC<AdminProfileViewProps> = ({
  user,
  onBackToDashboard
}) => {
  const [profileImage, setProfileImage] = useState<string>(
    user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatusMessage(null);
    try {
      const res = await cloudinaryService.uploadProfileImage(file, user.registerNumber);
      if (res.success && res.imageUrl) {
        setProfileImage(res.imageUrl);
        user.avatarUrl = res.imageUrl;
        try {
          const rawSession = localStorage.getItem('civil_connect_auth_session');
          if (rawSession) {
            const parsed = JSON.parse(rawSession);
            parsed.avatarUrl = res.imageUrl;
            localStorage.setItem('civil_connect_auth_session', JSON.stringify(parsed));
          }
        } catch {
          // ignore session write error
        }
        setStatusMessage('Profile picture updated successfully via Cloudinary!');
      } else {
        setStatusMessage(res.message || 'Image upload failed');
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150">
      {/* Top Bar (Matching Screenshot 2) */}
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
              Update your details and keep your information current.
            </p>
          </div>
        </div>

        <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors self-stretch sm:self-auto justify-center">
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Profile Card Hero (Matching Screenshot 2) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-8 shadow-xs text-center space-y-4">
        <div className="relative inline-block mx-auto">
          <img
            src={profileImage}
            alt={user.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-sm mx-auto"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white text-xs">
              Uploading...
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {user.name}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {user.department || 'Civil Engineering'} · IV Year · Sec A
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Master
          </span>
        </div>

        <div className="pt-2">
          <button
            onClick={() => alert(`Official administrator account ID: ${user.uid}\nEmail: ${user.email}`)}
            className="px-4 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors cursor-pointer"
          >
            View Public Profile
          </button>
        </div>
      </div>

      {/* Basic Information Card (Matching Screenshot 2) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          BASIC INFORMATION
        </span>

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
            <span className="text-slate-500">Gender</span>
            <span className="font-semibold text-slate-900">Male</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Year</span>
            <span className="font-semibold text-slate-900">IV (Final Year)</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Section</span>
            <span className="font-semibold text-slate-900">A</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Register Number</span>
            <span className="font-semibold text-slate-900 font-mono">{user.registerNumber}</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Roll Number</span>
            <span className="font-semibold text-slate-900 font-mono">001</span>
          </div>
        </div>
      </div>

      {/* Contact Details Card (Matching Screenshot 2) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          CONTACT DETAILS
        </span>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Phone Number</span>
            <span className="font-semibold text-slate-900 font-mono">+91 7845893785</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Institutional Access</span>
            <span className="font-semibold text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Full Master Authorization
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
