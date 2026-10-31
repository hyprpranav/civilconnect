import React from 'react';
import { UserAccount } from '../../types';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  BarChart3, 
  Download, 
  UserCheck, 
  Cloud, 
  User, 
  FileText, 
  LogOut, 
  Building2,
  KeyRound,
  LifeBuoy,
  X
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
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
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
  openTicketsCount = 0,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isAdmin = currentUser.role === 'ADMIN' || isSuperAdmin;
  const isOfficer = currentUser.role === 'OFFICER';
  const isStudent = currentUser.role === 'STUDENT';

  const roleLabel = isSuperAdmin ? 'Master' : isAdmin ? 'Admin' : isOfficer ? 'Faculty' : 'Student';

  const handleTabClick = (tab: string) => {
    onSelectTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderSidebarContent = (isMobileView: boolean) => (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 truncate">
                CIVIL CONNECT
              </h1>
            </div>
            <span className="text-[11px] font-semibold text-blue-600 block truncate">
              {roleLabel} Console
            </span>
          </div>
        </div>

        {isMobileView && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main Section */}
        <div className="space-y-1">
          {isAdmin && (
            <>
              <button
                onClick={() => handleTabClick('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => handleTabClick('students')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'students'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Users className={`w-4 h-4 ${activeTab === 'students' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Students</span>
              </button>

              <button
                onClick={() => handleTabClick('teams')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'teams' || activeTab === 'builder'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Layers className={`w-4 h-4 ${activeTab === 'teams' || activeTab === 'builder' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Teams</span>
              </button>

              <button
                onClick={() => handleTabClick('analytics')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className={`w-4 h-4 ${activeTab === 'analytics' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Analytics & Charts</span>
              </button>

              <button
                onClick={() => handleTabClick('export')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'export'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Download className={`w-4 h-4 ${activeTab === 'export' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Export Center</span>
              </button>

              <button
                onClick={() => handleTabClick('tickets')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
                onClick={() => handleTabClick('profile')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
                onClick={() => handleTabClick('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => handleTabClick('students')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'students' || activeTab === 'addStudent'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Users className={`w-4 h-4 ${activeTab === 'students' || activeTab === 'addStudent' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Student Roster</span>
              </button>

              <button
                onClick={() => handleTabClick('analytics')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className={`w-4 h-4 ${activeTab === 'analytics' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Analytics & Charts</span>
              </button>

              <button
                onClick={() => handleTabClick('requests')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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

              <button
                onClick={() => handleTabClick('profile')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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

          {isStudent && (
            <>
              <button
                onClick={() => handleTabClick('profile')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => handleTabClick('form')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'form'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileText className={`w-4 h-4 ${activeTab === 'form' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Skills Assessment</span>
              </button>

              <button
                onClick={() => handleTabClick('teams')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'teams'
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Layers className={`w-4 h-4 ${activeTab === 'teams' ? 'text-blue-600' : 'text-slate-400'}`} />
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
              onClick={() => handleTabClick('requests')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                  onOpenIntegrationGuide();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <Cloud className="w-4 h-4 text-teal-600" />
                <span>Cloud Backend</span>
              </button>
            )}

            {onOpenChangePassword && (
              <button
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                  onOpenChangePassword();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
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
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            onLogout();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>

        {!isAdmin && (
          <button
            type="button"
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              onOpenSupportTicket?.();
            }}
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
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar: Permanent left rail on large screens (>= lg / 1024px) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200/90 flex-col shrink-0 h-screen sticky top-0 font-sans z-30 select-none shadow-xs">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer: Slide-out panel for phone and tablet screens (< lg) */}
      <div 
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Dark Backdrop with blur */}
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
          onClick={onCloseMobile}
        />
        {/* Sliding Panel */}
        <aside 
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-in-out ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {renderSidebarContent(true)}
        </aside>
      </div>
    </>
  );
};
