import React, { useState, useEffect } from 'react';
import { UserAccount, StudentProfile, Announcement } from './types';
import { authService } from './services/authService';
import { storageService } from './services/storageService';
import { AppSidebar } from './components/common/AppSidebar';
import { LandingPage } from './components/landing/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { StudentDashboard } from './components/student/StudentDashboard';
import { OfficerDashboard } from './components/officer/OfficerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PasswordChangeModal } from './components/common/PasswordChangeModal';
import { IntegrationGuideModal } from './components/common/IntegrationGuideModal';
import { SupportTicketModal } from './components/common/SupportTicketModal';
import { Menu, Building2 } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [currentStudent, setCurrentStudent] = useState<StudentProfile | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'dashboard'>('landing');
  const [loginMode, setLoginMode] = useState<'signin' | 'signup'>('signin');
  const [sidebarTab, setSidebarTab] = useState<string>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Modals
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [isMandatoryPasswordChange, setIsMandatoryPasswordChange] = useState(false);
  const [integrationModalOpen, setIntegrationModalOpen] = useState(false);
  const [supportTicketModalOpen, setSupportTicketModalOpen] = useState(false);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [staffCount, setStaffCount] = useState<number>(1);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAppInitialState();
  }, []);

  const loadAppInitialState = async () => {
    setIsLoading(true);
    try {
      const [allStudents, allAnnouncements, allTickets, allPendingAccs, allOfficerReqs, allStaff] = await Promise.all([
        storageService.getStudents(),
        storageService.getAnnouncements(),
        storageService.getSupportTickets(),
        storageService.getPendingAccountRequests(),
        storageService.getRequests(),
        storageService.getStaffAccounts()
      ]);
      setStudents(allStudents);
      setAnnouncements(allAnnouncements);
      setStaffCount(allStaff.length);
      setOpenTicketsCount(allTickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length);
      setPendingRequestsCount(
        allPendingAccs.filter(r => r.status === 'pending').length +
        allOfficerReqs.filter(r => r.status === 'Pending').length
      );

      const activeSession = authService.getCurrentUser();
      if (activeSession) {
        // Restore persistent user avatar (logo/photo)
        const savedAvatar = storageService.getSavedAvatar(activeSession.email) || storageService.getSavedAvatar(activeSession.registerNumber);
        if (savedAvatar) {
          activeSession.avatarUrl = savedAvatar;
        } else if (activeSession.avatarUrl === '/harish_pranav_profile.jpg') {
          activeSession.avatarUrl = undefined;
        }

        if (activeSession.role === 'STUDENT') {
          const profile = await storageService.getStudentById(activeSession.normalizedRegisterNumber);
          setCurrentStudent(profile);
          if (profile?.profileImage && profile.profileImage !== '/harish_pranav_profile.jpg') {
            activeSession.avatarUrl = profile.profileImage;
          }
        } else {
          const matched = allStaff.find(s => s.uid === activeSession.uid || s.normalizedEmail === activeSession.normalizedEmail);
          if (matched?.avatarUrl && matched.avatarUrl !== '/harish_pranav_profile.jpg') {
            activeSession.avatarUrl = matched.avatarUrl;
          }
        }
        setCurrentUser(activeSession);
        setCurrentView('dashboard');
      } else {
        setCurrentView('landing');
      }
    } catch (err) {
      console.error('Initialization error', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    const [allStudents, allAnnouncements, allTickets, allPendingAccs, allOfficerReqs, allStaff] = await Promise.all([
      storageService.getStudents(),
      storageService.getAnnouncements(),
      storageService.getSupportTickets(),
      storageService.getPendingAccountRequests(),
      storageService.getRequests(),
      storageService.getStaffAccounts()
    ]);
    setStudents(allStudents);
    setAnnouncements(allAnnouncements);
    setStaffCount(allStaff.length);
    setOpenTicketsCount(allTickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length);
    setPendingRequestsCount(
      allPendingAccs.filter(r => r.status === 'pending').length +
      allOfficerReqs.filter(r => r.status === 'Pending').length
    );

    if (currentUser) {
      if (currentUser.role === 'STUDENT') {
        const profile = await storageService.getStudentById(currentUser.normalizedRegisterNumber);
        setCurrentStudent(profile);
        if (profile?.profileImage) {
          setCurrentUser(prev => prev ? { ...prev, avatarUrl: profile.profileImage } : null);
        }
      } else {
        const matched = allStaff.find(s => s.uid === currentUser.uid || s.normalizedEmail === currentUser.normalizedEmail);
        if (matched?.avatarUrl) {
          setCurrentUser(prev => prev ? { ...prev, avatarUrl: matched.avatarUrl } : null);
        }
      }
    }
  };

  const handleOpenLogin = (mode: 'signin' | 'signup' = 'signin') => {
    setLoginMode(mode);
    setCurrentView('login');
  };

  const handleLoginSuccess = async (user: UserAccount, requirePasswordChange: boolean) => {
    // Restore persistent user avatar if available
    const savedAvatar = storageService.getSavedAvatar(user.email) || storageService.getSavedAvatar(user.registerNumber);
    if (savedAvatar) {
      user.avatarUrl = savedAvatar;
    } else if (user.avatarUrl === '/harish_pranav_profile.jpg') {
      user.avatarUrl = undefined;
    }

    if (user.role === 'STUDENT') {
      const profile = await storageService.getStudentById(user.normalizedRegisterNumber);
      setCurrentStudent(profile);
      if (profile?.profileImage && profile.profileImage !== '/harish_pranav_profile.jpg') {
        user.avatarUrl = profile.profileImage;
      }
    }
    setCurrentUser(user);
    setSidebarTab('dashboard');
    setCurrentView('dashboard');
    refreshData();

    if (requirePasswordChange) {
      setIsMandatoryPasswordChange(true);
      setPasswordModalOpen(true);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setCurrentStudent(null);
    setCurrentView('landing');
    setIsMobileNavOpen(false);
  };

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'students': return 'Students Roster';
      case 'teams': return 'Team Formations';
      case 'analytics': return 'Visual Analytics & Charts';
      case 'export': return 'Export Center';
      case 'tickets': return 'Feedback & Issues Desk';
      case 'profile': return 'My Profile';
      case 'staff': return 'Staff & Faculty Management';
      case 'requests': return 'Access Requests Center';
      case 'form': return 'Skills Assessment';
      default: return tab;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold text-slate-900">CIVIL CONNECT</h2>
          <p className="text-xs text-slate-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {currentView === 'landing' && (
        <LandingPage
          onOpenLogin={handleOpenLogin}
        />
      )}

      {currentView === 'login' && (
        <LoginPage
          onBackToLanding={() => setCurrentView('landing')}
          onLoginSuccess={handleLoginSuccess}
          initialMode={loginMode}
        />
      )}

      {currentView === 'dashboard' && currentUser && (() => {
        const effectiveAvatar = 
          currentStudent?.profileImage || 
          currentUser.avatarUrl || 
          storageService.getSavedAvatar(currentUser.email) ||
          storageService.getSavedAvatar(currentUser.registerNumber) ||
          undefined;

        return (
          <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-slate-50">
            {/* Left Navigation Sidebar (Desktop rail + Mobile off-canvas drawer) */}
            <AppSidebar
              currentUser={currentUser}
              userProfileImage={effectiveAvatar}
              activeTab={sidebarTab}
              onSelectTab={tab => {
                setSidebarTab(tab);
                setIsMobileNavOpen(false);
              }}
              onLogout={handleLogout}
              onOpenIntegrationGuide={() => setIntegrationModalOpen(true)}
              onOpenChangePassword={() => {
                setIsMandatoryPasswordChange(false);
                setPasswordModalOpen(true);
              }}
              onOpenSupportTicket={() => setSupportTicketModalOpen(true)}
              pendingRequestsCount={pendingRequestsCount}
              openTicketsCount={openTicketsCount}
              staffCount={staffCount}
              isMobileOpen={isMobileNavOpen}
              onCloseMobile={() => setIsMobileNavOpen(false)}
            />

            {/* Right Main Content Column */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
              {/* Sticky Mobile Top Header Bar (< lg) */}
              <header className="lg:hidden shrink-0 bg-white border-b border-slate-200 px-3.5 py-2.5 flex items-center justify-between z-20 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setIsMobileNavOpen(true)}
                    className="relative p-2 -ml-1 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    aria-label="Open Navigation Menu"
                  >
                    <Menu className="w-5 h-5" />
                    {openTicketsCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full border-2 border-white ring-1 ring-amber-400" />
                    )}
                  </button>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 block leading-tight truncate">CIVIL CONNECT</span>
                      <span className="text-[10px] font-semibold text-blue-600 block leading-none truncate">
                        {getTabTitle(sidebarTab)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsMobileNavOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{currentUser.role === 'SUPER_ADMIN' ? 'Master' : currentUser.role === 'ADMIN' ? 'Admin' : currentUser.role === 'OFFICER' ? 'Faculty' : 'Student'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMobileNavOpen(true)}
                    className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center overflow-hidden border border-blue-200 shadow-2xs"
                    aria-label="User profile"
                  >
                    {effectiveAvatar ? (
                      <img src={effectiveAvatar} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.name ? currentUser.name.charAt(0) : 'U'
                    )}
                  </button>
                </div>
              </header>

            {/* Scrollable Main View Area */}
            <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8">
              {currentUser.role === 'STUDENT' && currentStudent && (
                <StudentDashboard
                  user={currentUser}
                  student={currentStudent}
                  announcements={announcements}
                  externalTab={sidebarTab}
                  onTabChange={setSidebarTab}
                  onProfileUpdated={updated => {
                    setCurrentStudent(updated);
                    if (updated.profileImage && currentUser) {
                      const updatedUser = { ...currentUser, avatarUrl: updated.profileImage };
                      setCurrentUser(updatedUser);
                      localStorage.setItem('civil_connect_auth_session', JSON.stringify(updatedUser));
                    }
                    refreshData();
                  }}
                />
              )}

              {currentUser.role === 'OFFICER' && (
                <OfficerDashboard
                  user={currentUser}
                  students={students}
                  externalTab={sidebarTab}
                  onTabChange={setSidebarTab}
                  onRefreshData={refreshData}
                />
              )}

              {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && (
                <AdminDashboard
                  user={currentUser}
                  students={students}
                  announcements={announcements}
                  externalTab={sidebarTab}
                  onTabChange={setSidebarTab}
                  onRefreshData={refreshData}
                  onOpenIntegrationGuide={() => setIntegrationModalOpen(true)}
                  onUserUpdated={updated => {
                    setCurrentUser(updated);
                    refreshData();
                  }}
                />
              )}
            </main>
          </div>
        </div>
        );
      })()}

      {/* Password Change Modal */}
      {currentUser && (
        <PasswordChangeModal
          isOpen={passwordModalOpen}
          onClose={() => {
            if (!isMandatoryPasswordChange) {
              setPasswordModalOpen(false);
            }
          }}
          identifier={
            currentUser.role === 'STUDENT'
              ? currentUser.registerNumber
              : currentUser.email
          }
          isMandatoryFirstLogin={isMandatoryPasswordChange}
          onSuccess={() => {
            setIsMandatoryPasswordChange(false);
            setPasswordModalOpen(false);
            refreshData();
          }}
        />
      )}

      {/* Cloud Integration Setup Guide Modal */}
      <IntegrationGuideModal
        isOpen={integrationModalOpen}
        onClose={() => setIntegrationModalOpen(false)}
        onConfigUpdated={() => {
          refreshData();
        }}
      />

      {/* In-App Support & Issue Reporting Modal */}
      {currentUser && (
        <SupportTicketModal
          isOpen={supportTicketModalOpen}
          onClose={() => {
            setSupportTicketModalOpen(false);
            refreshData();
          }}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default App;
