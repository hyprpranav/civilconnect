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

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [currentStudent, setCurrentStudent] = useState<StudentProfile | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'dashboard'>('landing');
  const [loginMode, setLoginMode] = useState<'signin' | 'signup'>('signin');
  const [sidebarTab, setSidebarTab] = useState<string>('dashboard');

  // Modals
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [isMandatoryPasswordChange, setIsMandatoryPasswordChange] = useState(false);
  const [integrationModalOpen, setIntegrationModalOpen] = useState(false);
  const [supportTicketModalOpen, setSupportTicketModalOpen] = useState(false);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAppInitialState();
  }, []);

  const loadAppInitialState = async () => {
    setIsLoading(true);
    try {
      const [allStudents, allAnnouncements, allTickets] = await Promise.all([
        storageService.getStudents(),
        storageService.getAnnouncements(),
        storageService.getSupportTickets()
      ]);
      setStudents(allStudents);
      setAnnouncements(allAnnouncements);
      setOpenTicketsCount(allTickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length);

      const activeSession = authService.getCurrentUser();
      if (activeSession) {
        setCurrentUser(activeSession);
        if (activeSession.role === 'STUDENT') {
          const profile = await storageService.getStudentById(activeSession.normalizedRegisterNumber);
          setCurrentStudent(profile);
          if (profile?.profileImage) {
            activeSession.avatarUrl = profile.profileImage;
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
    const [allStudents, allAnnouncements, allTickets] = await Promise.all([
      storageService.getStudents(),
      storageService.getAnnouncements(),
      storageService.getSupportTickets()
    ]);
    setStudents(allStudents);
    setAnnouncements(allAnnouncements);
    setOpenTicketsCount(allTickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length);

    if (currentUser && currentUser.role === 'STUDENT') {
      const profile = await storageService.getStudentById(currentUser.normalizedRegisterNumber);
      setCurrentStudent(profile);
    }
  };

  const handleOpenLogin = (mode: 'signin' | 'signup' = 'signin') => {
    setLoginMode(mode);
    setCurrentView('login');
  };

  const handleLoginSuccess = async (user: UserAccount, requirePasswordChange: boolean) => {
    setCurrentUser(user);
    if (user.role === 'STUDENT') {
      const profile = await storageService.getStudentById(user.normalizedRegisterNumber);
      setCurrentStudent(profile);
    }
    setSidebarTab('dashboard');
    setCurrentView('dashboard');

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

      {currentView === 'dashboard' && currentUser && (
        <div className="flex h-screen overflow-hidden bg-slate-50">
          {/* Left Navigation Sidebar */}
          <AppSidebar
            currentUser={currentUser}
            activeTab={sidebarTab}
            onSelectTab={setSidebarTab}
            onLogout={handleLogout}
            onOpenIntegrationGuide={() => setIntegrationModalOpen(true)}
            onOpenChangePassword={() => {
              setIsMandatoryPasswordChange(false);
              setPasswordModalOpen(true);
            }}
            onOpenSupportTicket={() => setSupportTicketModalOpen(true)}
            openTicketsCount={openTicketsCount}
          />

          {/* Right Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
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
              />
            )}
          </main>
        </div>
      )}

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
