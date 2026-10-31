import React, { useState } from 'react';
import { StudentProfile, Announcement, UserAccount } from '../../types';
import { 
  User, 
  FileText, 
  Bell, 
  Users, 
  Sparkles, 
  Award, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle,
  Building2,
  Calendar,
  Lock,
  ArrowRight
} from 'lucide-react';
import { MyProfileTab } from './MyProfileTab';
import { ProfessionalProfileForm } from './ProfessionalProfileForm';
import { StudentUpdatesTab } from './StudentUpdatesTab';
import { StudentTeamsTab } from './StudentTeamsTab';

interface StudentDashboardProps {
  user: UserAccount;
  student: StudentProfile;
  announcements: Announcement[];
  onProfileUpdated: (updated: StudentProfile) => void;
  externalTab?: string;
  onTabChange?: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  student,
  announcements,
  onProfileUpdated,
  externalTab,
  onTabChange
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'form' | 'updates' | 'teams'>('profile');

  React.useEffect(() => {
    if (externalTab) {
      if (['profile', 'form', 'updates', 'teams'].includes(externalTab)) {
        setActiveTab(externalTab as any);
      }
    }
  }, [externalTab]);

  const handleTabChange = (tab: 'profile' | 'form' | 'updates' | 'teams') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // Latest important announcement
  const latestNotice = announcements.find(a => a.isActive && a.isImportant) || announcements[0];

  return (
    <div className="space-y-6">
      {/* Student Welcome Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          {/* Identity Info */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-blue-50 border-2 border-blue-200 shrink-0 flex items-center justify-center text-blue-900 shadow-2xs">
              {student.profileImage ? (
                <img
                  src={student.profileImage}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-blue-400" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-bold text-blue-950 font-serif">
                  Hello, {student.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-50 text-blue-900 border border-blue-200">
                  {student.registerNumber}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 pt-0.5">
                <span className="font-medium text-slate-700">{student.department}</span>
                <span>•</span>
                <span className="font-medium text-slate-700">{student.academicYear}</span>
                <span>•</span>
                <span className="text-teal-700 font-semibold">{student.club}</span>
              </div>
            </div>
          </div>

          {/* Profile Completion Bar */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 w-full md:w-72 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                Profile Completion
              </span>
              <span className="font-extrabold text-blue-900 text-sm">
                {student.profileCompletionPercentage}%
              </span>
            </div>

            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  student.profileCompletionPercentage === 100
                    ? 'bg-emerald-600'
                    : student.profileCompletionPercentage >= 60
                    ? 'bg-blue-700'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${student.profileCompletionPercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span>Status: <strong className="text-slate-800 uppercase font-semibold">{student.profileStatus}</strong></span>
              {student.profileCompletionPercentage < 100 && (
                <button
                  onClick={() => handleTabChange('form')}
                  className="text-blue-700 hover:text-blue-900 font-semibold underline"
                >
                  Complete Profile
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Tab Panels */}
      {activeTab === 'profile' && (
        <MyProfileTab
          student={student}
          onProfileUpdated={onProfileUpdated}
        />
      )}

      {activeTab === 'form' && (
        <ProfessionalProfileForm
          student={student}
          onProfileSubmitted={onProfileUpdated}
        />
      )}

      {activeTab === 'updates' && (
        <StudentUpdatesTab
          announcements={announcements}
        />
      )}

      {activeTab === 'teams' && (
        <StudentTeamsTab
          currentStudent={student}
        />
      )}
    </div>
  );
};
