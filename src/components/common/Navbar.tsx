import React from 'react';
import { UserAccount } from '../../types';
import { 
  Building2, 
  LogOut, 
  User, 
  ShieldCheck, 
  Briefcase, 
  GraduationCap, 
  Menu, 
  X, 
  Key,
  ExternalLink
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserAccount | null;
  onLogout: () => void;
  onOpenChangePassword?: () => void;
  onOpenIntegrationGuide?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onOpenChangePassword,
  onOpenIntegrationGuide,
  onToggleSidebar,
  isSidebarOpen
}) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Super Admin
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Admin
          </span>
        );
      case 'OFFICER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
            <Briefcase className="w-3.5 h-3.5 text-teal-600" /> Faculty Officer
          </span>
        );
      case 'STUDENT':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            <GraduationCap className="w-3.5 h-3.5 text-slate-600" /> Student
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile hamburger & Logo */}
          <div className="flex items-center gap-3">
            {currentUser && onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
                aria-label="Toggle Navigation"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-900 via-blue-800 to-teal-700 flex items-center justify-center text-white shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-blue-950 font-serif">
                    CIVIL CONNECT
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 rounded border border-blue-200">
                    MKCE
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 hidden md:block">
                  Connecting Students. Discovering Skills. Building Teams.
                </p>
              </div>
            </div>
          </div>

          {/* Right: User status & Actions */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                <div className="hidden sm:flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">
                      {currentUser.name}
                    </span>
                    {getRoleBadge(currentUser.role)}
                  </div>
                  <span className="text-xs text-slate-500">
                    {currentUser.role === 'STUDENT' ? currentUser.registerNumber : currentUser.email}
                  </span>
                </div>

                {onOpenIntegrationGuide && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && (
                  <button
                    onClick={onOpenIntegrationGuide}
                    className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
                    title="Firebase & Cloudinary Integration Guide"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                    Cloud Integration
                  </button>
                )}

                {onOpenChangePassword && (
                  <button
                    onClick={onOpenChangePassword}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Change Password"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 hidden sm:inline">
                  M.Kumarasamy College of Engineering
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-800 rounded-md border border-blue-200">
                  <User className="w-3.5 h-3.5" /> Portal Guest
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
