import React from 'react';
import { UserAccount } from '../../types';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  BarChart3, 
  Download, 
  Megaphone, 
  UserCog, 
  UserCheck, 
  Cloud, 
  User, 
  FileText, 
  LogOut, 
  AlertTriangle, 
  Building2,
  Calendar,
  Sparkles,
  KeyRound,
  LifeBuoy
} from 'lucide-react';

interface AppSidebarProps {
  currentUser: UserAccount;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  onOpenIntegrationGuide?: () => void;
  onOpenChangePassword?: () => void;
  onOpenSupportTicket?: () => void;
  pendingRequestsCount?: number;
  openTicketsCount?: number;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  onLogout,
  onOpenIntegrationGuide,
  onOpenChangePassword,
  onOpenSupportTicket,
  pendingRequestsCount = 0,
  openTicketsCount = 0
}) => {
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isAdmin = currentUser.role === 'ADMIN' || isSuperAdmin;
  const isOfficer = currentUser.role === 'OFFICER';
  const isStudent = currentUser.role === 'STUDENT';

  const roleLabel = isSuperAdmin ? 'Master' : isAdmin ? 'Admin' : isOfficer ? 'Faculty' : 'Student';

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col shrink-0 h-screen sticky top-0 font-sans z-30 select-none shadow-xs">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold tracking-tight text-slate-900 truncate">
              CIVIL CONNECT
            </h1>
          </div>
          <span className="text-[11px] font-semibold text-blue-600 block truncate">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Navigation Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main Section */}
        <div className="space-y-1">
          {isAdmin && (
            <>
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => onSelectTab('students')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'students'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Users className={`w-4 h-4 ${activeTab === 'students' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Students</span>
              </button>

              <button
                onClick={() => onSelectTab('teams')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'teams' || activeTab === 'builder'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Layers className={`w-4 h-4 ${activeTab === 'teams' || activeTab === 'builder' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Teams</span>
              </button>

              <button
                onClick={() => onSelectTab('analytics')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className={`w-4 h-4 ${activeTab === 'analytics' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Analytics & Charts</span>
              </button>

              <button
                onClick={() => onSelectTab('export')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'export'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Download className={`w-4 h-4 ${activeTab === 'export' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Export Center</span>
              </button>

              <button
                onClick={() => onSelectTab('tickets')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'tickets'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <LifeBuoy className={`w-4 h-4 ${activeTab === 'tickets' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>Feedback & Issues</span>
                </span>
                {openTicketsCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-800 rounded-full font-bold">
                    {openTicketsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onSelectTab('profile')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'profile'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>My Profile</span>
              </button>
            </>
          )}

          {isOfficer && (
            <>
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => onSelectTab('students')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'students' || activeTab === 'addStudent'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Users className={`w-4 h-4 ${activeTab === 'students' || activeTab === 'addStudent' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Student Roster</span>
              </button>

              <button
                onClick={() => onSelectTab('analytics')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className={`w-4 h-4 ${activeTab === 'analytics' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Analytics & Charts</span>
              </button>

              <button
                onClick={() => onSelectTab('requests')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'requests'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <UserCheck className={`w-4 h-4 ${activeTab === 'requests' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>Request Center</span>
                </span>
                {pendingRequestsCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-800 rounded-full font-bold">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>
            </>
          )}

          {isStudent && (
            <>
              <button
                onClick={() => onSelectTab('profile')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'profile'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => onSelectTab('form')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'form'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileText className={`w-4 h-4 ${activeTab === 'form' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Skills Assessment</span>
              </button>

              <button
                onClick={() => onSelectTab('teams')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'teams'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Users className={`w-4 h-4 ${activeTab === 'teams' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Team & Cohort</span>
              </button>
            </>
          )}
        </div>

        {/* Admin Specific Operations Submenu */}
        {isAdmin && (
          <div className="pt-4 border-t border-slate-100 space-y-1">
            <span className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-1">
              Admin Control
            </span>

            <button
              onClick={() => onSelectTab('requests')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'requests'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-3">
                <UserCheck className={`w-4 h-4 ${activeTab === 'requests' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Access Requests</span>
              </span>
              {pendingRequestsCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-800 rounded-full font-bold">
                  {pendingRequestsCount}
                </span>
              )}
            </button>

            {onOpenIntegrationGuide && (
              <button
                onClick={onOpenIntegrationGuide}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <Cloud className="w-4 h-4 text-teal-600" />
                <span>Cloud Backend</span>
              </button>
            )}

            {onOpenChangePassword && (
              <button
                onClick={onOpenChangePassword}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <KeyRound className="w-4 h-4 text-slate-400" />
                <span>Security PIN & Key</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* User Footer Card */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2.5">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-300 text-blue-900 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-xs">
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              currentUser.name ? currentUser.name.charAt(0) : 'U'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 truncate">
              {currentUser.name}
            </p>
            <p className="text-xs font-medium text-slate-600 font-mono truncate">
              {currentUser.email}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>

        {!isAdmin && (
          <button
            type="button"
            onClick={onOpenSupportTicket}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100/90 border border-amber-200 transition-colors cursor-pointer"
          >
            <LifeBuoy className="w-3.5 h-3.5 text-amber-600" />
            <span>Facing Issues? Report Here</span>
          </button>
        )}

        <div className="pt-2 text-center space-y-0.5 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-800 block">
            Crafted by Harish Pranav S
          </span>
          <span className="text-[9px] text-slate-500 block font-mono">
            hyprpranav@gmail.com • 784-569-3765
          </span>
        </div>
      </div>
    </aside>
  );
};
