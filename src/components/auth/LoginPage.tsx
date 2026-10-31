import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  AlertCircle,
  Mail,
  UserPlus,
  Phone,
  CheckCircle2,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import { authService } from '../../services/authService';
import { storageService } from '../../services/storageService';
import { UserAccount, ALL_DEPARTMENTS, Department, AcademicYear } from '../../types';

interface LoginPageProps {
  onBackToLanding: () => void;
  onLoginSuccess: (user: UserAccount, requirePasswordChange: boolean) => void;
  initialMode?: 'signin' | 'signup';
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onBackToLanding,
  onLoginSuccess,
  initialMode = 'signin'
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  // Sign In State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Sign Up / Request Account State (Defaults to OFFICER as requested!)
  const [signupRole, setSignupRole] = useState<'OFFICER' | 'STUDENT'>('OFFICER');
  const [name, setName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [department, setDepartment] = useState<Department>('Civil Engineering');
  const [year, setYear] = useState<AcademicYear>('2nd Year');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccessMessage, setSignupSuccessMessage] = useState<string | null>(null);
  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!identifier.trim()) {
      setLoginError('Please enter your Register Number or College Email ID.');
      return;
    }
    if (!password) {
      setLoginError('Please enter your password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await authService.login(identifier, password);
      if (!res.success || !res.user) {
        setLoginError(res.message);
        setIsLoggingIn(false);
        return;
      }

      onLoginSuccess(res.user, res.requirePasswordChange || false);
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed. Please check network.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setSignupSuccessMessage(null);

    if (!name.trim()) {
      setSignupError('Please provide your full official name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setSignupError('Please provide a valid official college email.');
      return;
    }
    if (!phone.trim()) {
      setSignupError('Please provide your contact phone number.');
      return;
    }
    if (signupRole === 'STUDENT' && !regNo.trim()) {
      setSignupError('Please enter your college register number.');
      return;
    }
    if (signupPassword.length < 4) {
      setSignupError('Password must contain at least 4 characters.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      setSignupError('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmittingSignup(true);
    try {
      const res = await storageService.submitAccountRequest({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: signupRole,
        department,
        academicYear: signupRole === 'STUDENT' ? year : undefined,
        registerNumber: signupRole === 'STUDENT' ? regNo.trim() : undefined,
        passwordPlainText: signupPassword
      });

      if (!res.success) {
        setSignupError(res.message);
        setIsSubmittingSignup(false);
        return;
      }

      setSignupSuccessMessage(
        signupRole === 'OFFICER'
          ? 'Your faculty staff account request has been successfully submitted to Department Admin (Harish Pranav S). Once approved, you can immediately log in using your email and password. Contact Admin: hyprpranav@gmail.com / 784-569-3765.'
          : 'Your student account request has been recorded! It can be verified and approved by either Faculty Officers or Department Admin. Once approved, you can log in with your Register Number or Email.'
      );

      // Reset fields
      setName('');
      setRegNo('');
      setPhone('');
      setEmail('');
      setSignupPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setSignupError(err.message || 'Failed to submit account request.');
    } finally {
      setIsSubmittingSignup(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) return;

    setIsResetting(true);
    setForgotMessage(null);
    try {
      const res = await authService.requestPasswordReset(forgotIdentifier);
      setForgotMessage(res.message);
    } catch (err: any) {
      setForgotMessage(err.message || 'Failed to dispatch reset link.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <button
          onClick={onBackToLanding}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-4 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Landing Page
        </button>

        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto shadow-md mb-2 overflow-hidden p-1 border border-slate-700/50">
            <img src="/mobile-logo.png" alt="CIVIL CONNECT Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-blue-950 font-serif">
            CIVIL CONNECT
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">
            Universal Engineering Portal & Collaboration Network
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="mt-4 bg-slate-200 p-1 rounded-xl flex">
          <button
            type="button"
            onClick={() => { setMode('signin'); setSignupSuccessMessage(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In to Portal
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setLoginError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'signup'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Request Account / Sign Up</span>
          </button>
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-7 px-6 sm:px-9 shadow-lg rounded-2xl border border-slate-200">
          
          {/* TAB 1: UNIFIED SIGN IN */}
          {mode === 'signin' && (
            <form className="space-y-4" onSubmit={handleSignIn}>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Register Number / Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="Register No / College Email / Mobile Number"
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-800"
                    autoCapitalize="none"
                    autoCorrect="off"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Students can log in using Register Number (any case), College Email, or Mobile Number (Default password: <span className="font-mono font-bold text-blue-900">civil</span>).
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full pl-9 pr-10 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-800"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 focus:ring-2 focus:ring-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLoggingIn ? 'Verifying Credentials...' : 'Sign In to Portal'}
              </button>
            </form>
          )}

          {/* TAB 2: REQUEST ACCOUNT / SIGN UP */}
          {mode === 'signup' && (
            <form className="space-y-3.5" onSubmit={handleSignUp}>
              {signupSuccessMessage ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Request Submitted Successfully!</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {signupSuccessMessage}
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="w-full py-2 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      Return to Sign In
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Role Selection (Defaulted to Officer!) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Account Type Requested:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSignupRole('OFFICER')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          signupRole === 'OFFICER'
                            ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs">
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                          <span>Officer / Faculty</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal block mt-0.5">Recommended</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSignupRole('STUDENT')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          signupRole === 'STUDENT'
                            ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs">
                          <GraduationCap className="w-4 h-4 text-blue-600" />
                          <span>New Student</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal block mt-0.5">Requires Approval</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Official Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Dr. K. Saravanan or Priya S"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                      required
                    />
                  </div>

                  {signupRole === 'STUDENT' && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Register Number
                        </label>
                        <input
                          type="text"
                          value={regNo}
                          onChange={e => setRegNo(e.target.value)}
                          placeholder="e.g. 927623BCE098"
                          className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-300 rounded-xl"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Academic Year
                        </label>
                        <select
                          value={year}
                          onChange={e => setYear(e.target.value as any)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                        >
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Department (Full 12 Departments list!) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department
                    </label>
                    <select
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                    >
                      {ALL_DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Address (Personal or Official)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="e.g. personal @gmail.com or college email"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Password
                      </label>
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupPassword}
                        onChange={e => setSignupPassword(e.target.value)}
                        placeholder="Create password"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showSignupPassword}
                        onChange={e => setShowSignupPassword(e.target.checked)}
                        className="rounded text-blue-800"
                      />
                      <span>Show Password</span>
                    </label>
                  </div>

                  {signupError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{signupError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingSignup}
                    className="w-full py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 focus:ring-2 focus:ring-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingSignup ? 'Submitting Request...' : 'Submit Account Request'}
                  </button>

                  <p className="text-[11px] text-slate-500 text-center">
                    Authorized and reviewed by Admin: <strong className="text-slate-800">Harish Pranav S</strong> (hyprpranav@gmail.com)
                  </p>
                </>
              )}
            </form>
          )}

        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 font-serif">Forgot Password</h3>
              <button onClick={() => setShowForgotPassword(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your official college Register Number or Email. A secure password reset link will be dispatched to your registered college inbox.
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <Mail className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">Spam Folder Advisory:</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Reset links from Firebase often land in your <strong>Spam / Junk</strong> folder. If you do not see it in your Inbox, please check Spam.
                </p>
              </div>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="text"
                value={forgotIdentifier}
                onChange={e => setForgotIdentifier(e.target.value)}
                placeholder="Register Number or Email"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                required
              />

              {forgotMessage && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                  {forgotMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg cursor-pointer"
                >
                  {isResetting ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Attribution */}
      <div className="mt-8 text-center text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-800">
          Crafted by Harish Pranav S • <a href="mailto:hyprpranav@gmail.com" className="text-blue-700 hover:underline">hyprpranav@gmail.com</a> • <span className="font-mono">784-569-3765</span>
        </p>
        <p className="text-[11px] text-slate-400">
          CIVIL CONNECT • Talent Management Platform
        </p>
      </div>
    </div>
  );
};
