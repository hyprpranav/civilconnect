import React, { useState } from 'react';
import { StudentProfile } from '../../types';
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
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
  Award,
  Globe,
  UploadCloud,
  Trash2
} from 'lucide-react';
import { cloudinaryService } from '../../services/cloudinaryService';
import { storageService } from '../../services/storageService';

interface MyProfileTabProps {
  student: StudentProfile;
  onProfileUpdated: (updated: StudentProfile) => void;
}

export const MyProfileTab: React.FC<MyProfileTabProps> = ({
  student,
  onProfileUpdated
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(student.name || '');
  const [dob, setDob] = useState(student.dob || '');
  const [phone, setPhone] = useState(student.phone || '');
  const [shortBio, setShortBio] = useState(student.shortBio || '');
  const [preferredContact, setPreferredContact] = useState(student.preferredContact || 'Email');
  const [interestInput, setInterestInput] = useState('');
  const [personalInterests, setPersonalInterests] = useState<string[]>(
    student.personalInterests || ['Structural Engineering', 'Green Building Technology', 'BIM Modelling']
  );

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setPhotoMessage(null);

    try {
      const res = await cloudinaryService.uploadProfileImage(file, student.registerNumber);
      if (res.success && res.imageUrl) {
        const updated = await storageService.saveStudent({
          ...student,
          profileImage: res.imageUrl,
          cloudinaryPublicId: res.publicId
        });
        onProfileUpdated(updated);
        setPhotoMessage('Profile photo updated successfully!');
      } else {
        setPhotoMessage(res.message || 'Photo upload failed.');
      }
    } catch (err: any) {
      setPhotoMessage(err.message || 'Upload error occurred.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsUploadingPhoto(true);
    setPhotoMessage(null);
    try {
      const updated = await storageService.saveStudent({
        ...student,
        profileImage: undefined,
        cloudinaryPublicId: undefined
      });
      storageService.removeUserAvatar(student.email);
      storageService.removeUserAvatar(student.registerNumber);
      onProfileUpdated(updated);
      setPhotoMessage('Profile photo removed.');
    } catch (err: any) {
      setPhotoMessage('Failed to remove photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleAddInterest = () => {
    if (interestInput.trim() && !personalInterests.includes(interestInput.trim())) {
      setPersonalInterests([...personalInterests, interestInput.trim()]);
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (tag: string) => {
    setPersonalInterests(personalInterests.filter(t => t !== tag));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await storageService.saveStudent({
        ...student,
        name: name.trim() || student.name,
        dob: dob,
        phone: phone.trim(),
        shortBio,
        preferredContact,
        personalInterests
      });
      onProfileUpdated(updated);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save profile', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Photograph with upload trigger */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-sm flex items-center justify-center text-slate-400">
              {student.profileImage ? (
                <img
                  src={student.profileImage}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-14 h-14 text-slate-300" />
              )}
            </div>

            <div className="absolute inset-0 bg-slate-900/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity gap-1 p-2">
              <label className="flex flex-col items-center cursor-pointer text-white hover:text-teal-300">
                <Camera className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold">Change Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  disabled={isUploadingPhoto}
                />
              </label>
              {student.profileImage && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={isUploadingPhoto}
                  className="text-red-300 hover:text-red-100 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer mt-0.5"
                  title="Remove profile photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>

          {/* Student Meta Details */}
          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-serif tracking-tight">
                  {student.name}
                </h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-2">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold font-mono bg-blue-100 text-blue-950 border border-blue-300 shadow-2xs">
                    {student.registerNumber}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs">
                    {student.department}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-950 border border-teal-300 shadow-2xs">
                    {student.academicYear}
                  </span>
                </div>
              </div>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-blue-950 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl transition-all shadow-2xs hover:shadow-xs self-center sm:self-auto"
                >
                  <Edit3 className="w-4 h-4 text-blue-800" /> Edit Personal Bio
                </button>
              ) : (
                <div className="flex items-center gap-2.5 self-center sm:self-auto">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-xl transition-colors shadow-xs"
                  >
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
              )}
            </div>

            {/* Short Bio */}
            <p className="text-sm font-medium text-slate-700 leading-relaxed max-w-2xl pt-2">
              {student.shortBio || 'No introduction added yet. Click "Edit Personal Bio" to share your interests, academic ambitions, and project specialties.'}
            </p>

            {photoMessage && (
              <p className="text-xs text-teal-800 font-bold pt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                {photoMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Official Institutional Records (Protected) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-950 font-serif flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-900" />
                Official Academic & Registration Record
              </h3>
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                <Lock className="w-3.5 h-3.5 text-slate-500" /> Read-Only Verified Data
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50/90 hover:bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all">
                <span className="text-xs uppercase font-extrabold text-blue-950 tracking-wider block mb-1">
                  Full Name
                </span>
                <p className="text-sm font-bold text-slate-900">{student.name}</p>
              </div>

              <div className="bg-slate-50/90 hover:bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all">
                <span className="text-xs uppercase font-extrabold text-blue-950 tracking-wider block mb-1">
                  Official Register Number
                </span>
                <p className="font-mono text-sm font-extrabold text-blue-950">{student.registerNumber}</p>
              </div>

              <div className="bg-slate-50/90 hover:bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all">
                <span className="text-xs uppercase font-extrabold text-blue-950 tracking-wider block mb-1">
                  Official College Email ID
                </span>
                <p className="text-sm font-bold text-slate-900 break-all">{student.email}</p>
              </div>

              <div className="bg-slate-50/90 hover:bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all">
                <span className="text-xs uppercase font-extrabold text-blue-950 tracking-wider block mb-1">
                  Department
                </span>
                <p className="text-sm font-bold text-slate-900">{student.department}</p>
              </div>

              <div className="bg-slate-50/90 hover:bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all">
                <span className="text-xs uppercase font-extrabold text-blue-950 tracking-wider block mb-1">
                  Academic Year
                </span>
                <p className="text-sm font-bold text-slate-900">{student.academicYear}</p>
              </div>

              <div className="bg-slate-50/90 hover:bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all">
                <span className="text-xs uppercase font-extrabold text-blue-950 tracking-wider block mb-1">
                  Assigned Club / Association
                </span>
                <p className="text-sm font-bold text-slate-900">{student.club}</p>
              </div>

              <div className="bg-slate-50/90 hover:bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all">
                <span className="text-xs uppercase font-extrabold text-blue-950 tracking-wider block mb-1">
                  Japanese Language Track
                </span>
                <p className="text-sm font-bold text-slate-900">{student.japaneseStudent}</p>
              </div>

              <div className="bg-slate-50/90 hover:bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all">
                <span className="text-xs uppercase font-extrabold text-blue-950 tracking-wider block mb-1">
                  AWS Cloud Track Interest
                </span>
                <p className="text-sm font-bold text-slate-900">{student.awsInterested}</p>
              </div>

              <div className="bg-slate-50/90 hover:bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all">
                <span className="text-xs uppercase font-extrabold text-blue-950 tracking-wider block mb-1">
                  Date of Birth (DOB)
                </span>
                <p className="font-mono text-sm font-bold text-slate-800">
                  {student.dob ? new Date(student.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified (click Edit)'}
                </p>
              </div>

              <div className="bg-slate-50/90 hover:bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all">
                <span className="text-xs uppercase font-extrabold text-blue-950 tracking-wider block mb-1">
                  Contact Phone Number
                </span>
                <p className="font-mono text-sm font-bold text-slate-800">{student.phone || 'Not provided'}</p>
              </div>

              <div className="bg-slate-50/90 hover:bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all">
                <span className="text-xs uppercase font-extrabold text-blue-950 tracking-wider block mb-1">
                  Confirmation Identifier
                </span>
                <p className="font-mono text-sm font-bold text-slate-800">{student.confirmationId}</p>
              </div>

              <div className="bg-slate-50/90 hover:bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all">
                <span className="text-xs uppercase font-extrabold text-blue-950 tracking-wider block mb-1">
                  Registration Date
                </span>
                <p className="text-sm font-bold text-slate-800">{student.registrationDate}</p>
              </div>
            </div>
          </div>

          {/* Permitted Editable Contact & Bio */}
          {isEditing && (
            <div className="bg-blue-50/70 border-2 border-blue-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                <h3 className="text-base font-extrabold text-blue-950 font-serif">
                  Edit Student Profile Details
                </h3>
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" /> Email & Reg No are fixed
                </span>
              </div>

              <div className="space-y-4 text-xs">
                {/* Full Name (Editable) */}
                <div>
                  <label className="block text-xs uppercase font-extrabold text-blue-950 tracking-wider mb-1.5">
                    Student Full Name (Editable):
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 text-sm font-semibold border-2 border-slate-300 rounded-xl bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs transition-all"
                    required
                  />
                </div>

                {/* Fixed Reg No & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs uppercase font-extrabold text-blue-950 tracking-wider">
                        Register Number (Fixed):
                      </label>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                        <Lock className="w-3 h-3" /> Fixed ID
                      </span>
                    </div>
                    <input
                      type="text"
                      value={student.registerNumber}
                      disabled
                      readOnly
                      className="w-full px-4 py-3 text-sm font-mono font-bold border-2 border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs uppercase font-extrabold text-blue-950 tracking-wider">
                        College Email (Fixed):
                      </label>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                        <Lock className="w-3 h-3" /> Fixed Email
                      </span>
                    </div>
                    <input
                      type="email"
                      value={student.email}
                      disabled
                      readOnly
                      className="w-full px-4 py-3 text-sm font-mono font-bold border-2 border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone / Mobile */}
                  <div>
                    <label className="block text-xs uppercase font-extrabold text-blue-950 tracking-wider mb-1.5">
                      Phone / Mobile Number:
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-4 py-3 text-sm font-semibold border-2 border-slate-300 rounded-xl bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs transition-all font-mono"
                    />
                  </div>

                  {/* Date of Birth (DOB) */}
                  <div>
                    <label className="block text-xs uppercase font-extrabold text-blue-950 tracking-wider mb-1.5">
                      Date of Birth (DOB):
                    </label>
                    <input
                      type="date"
                      value={dob}
                      onChange={e => setDob(e.target.value)}
                      className="w-full px-4 py-3 text-sm font-semibold border-2 border-slate-300 rounded-xl bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs transition-all font-mono cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase font-extrabold text-blue-950 tracking-wider mb-1.5">
                    Short Professional Introduction:
                  </label>
                  <textarea
                    rows={4}
                    value={shortBio}
                    onChange={e => setShortBio(e.target.value)}
                    placeholder="Describe your engineering focus, project passions, or technical proficiencies..."
                    className="w-full px-4 py-3 text-sm font-medium border-2 border-slate-300 rounded-xl bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs transition-all leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-extrabold text-blue-950 tracking-wider mb-1.5">
                    Preferred Contact Channel:
                  </label>
                  <select
                    value={preferredContact}
                    onChange={e => setPreferredContact(e.target.value)}
                    className="w-full px-4 py-3 text-sm font-semibold border-2 border-slate-300 rounded-xl bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs transition-all cursor-pointer"
                  >
                    <option value="College Email">Official College Email</option>
                    <option value="Phone/WhatsApp">Phone / WhatsApp</option>
                    <option value="LinkedIn">LinkedIn</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Personal Interests & Quick Highlights */}
        <div className="space-y-6">
          {/* Personal Interests & Tags */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-950 font-serif flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-700" />
              Focus Areas & Interests
            </h3>

            <div className="flex flex-wrap gap-2">
              {personalInterests.map(interest => (
                <span
                  key={interest}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-100/80 text-teal-950 border border-teal-300 shadow-2xs"
                >
                  {interest}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(interest)}
                      className="text-teal-700 hover:text-teal-950 ml-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={interestInput}
                  onChange={e => setInterestInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddInterest(); }}}
                  placeholder="Add custom interest tag..."
                  className="flex-1 px-4 py-2.5 text-xs font-semibold border-2 border-slate-300 rounded-xl bg-white focus:border-teal-600 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={handleAddInterest}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-xs transition-colors"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Verification Status Card */}
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-emerald-950 font-extrabold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              Profile Verification Status
            </div>
            <p className="text-xs font-medium text-emerald-900 leading-relaxed">
              Status: <span className="font-extrabold uppercase tracking-wider px-2 py-0.5 bg-emerald-200/80 rounded-md text-emerald-950">{student.profileStatus}</span>.
              {student.profileStatus === 'verified'
                ? ' Your profile has been reviewed and verified by the faculty advisory committee.'
                : ' Complete all 4 sections in the Professional Profile Form to submit for team qualification.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
