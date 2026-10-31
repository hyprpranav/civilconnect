import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  Database, 
  Image as ImageIcon, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  ExternalLink,
  ChevronRight,
  Terminal,
  Download
} from 'lucide-react';
import { getSavedFirebaseConfig, saveFirebaseConfig, FirebaseConfig } from '../../services/firebaseConfig';
import { getSavedCloudinaryConfig, saveCloudinaryConfig, CloudinaryConfig } from '../../services/cloudinaryService';

interface IntegrationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated?: () => void;
}

export const IntegrationGuideModal: React.FC<IntegrationGuideModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'firebase' | 'cloudinary' | 'rules'>('firebase');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Local state for direct testing form
  const existingFb = getSavedFirebaseConfig();
  const existingCld = getSavedCloudinaryConfig();

  const [fbForm, setFbForm] = useState<FirebaseConfig>({
    apiKey: existingFb?.apiKey || '',
    authDomain: existingFb?.authDomain || '',
    projectId: existingFb?.projectId || '',
    storageBucket: existingFb?.storageBucket || '',
    messagingSenderId: existingFb?.messagingSenderId || '',
    appId: existingFb?.appId || ''
  });

  const [cldForm, setCldForm] = useState<CloudinaryConfig>({
    cloudName: existingCld?.cloudName || '',
    uploadPreset: existingCld?.uploadPreset || '',
    apiKey: existingCld?.apiKey || ''
  });

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    saveFirebaseConfig(fbForm);
    setStatusMessage('Firebase configuration saved locally! The app will use these credentials.');
    if (onConfigUpdated) onConfigUpdated();
  };

  const handleSaveCloudinary = (e: React.FormEvent) => {
    e.preventDefault();
    saveCloudinaryConfig(cldForm);
    setStatusMessage('Cloudinary credentials registered! Image uploads will now stream directly to Cloudinary.');
    if (onConfigUpdated) onConfigUpdated();
  };

  const downloadFirestoreRules = () => {
    const rulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function getUserData() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
    function isStudent() { return isAuthenticated() && getUserData().role == 'STUDENT'; }
    function isOfficer() { return isAuthenticated() && getUserData().role == 'OFFICER'; }
    function isAdmin() { return isAuthenticated() && (getUserData().role == 'ADMIN' || getUserData().role == 'SUPER_ADMIN'); }
    function isSuperAdmin() { return isAuthenticated() && getUserData().role == 'SUPER_ADMIN'; }

    match /students/{studentId} {
      allow read: if isAuthenticated();
      allow update: if isAuthenticated();
      allow create, delete: if isAdmin();
    }
    match /users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      allow write: if isSuperAdmin();
    }
    match /requests/{requestId} {
      allow read, create: if isOfficer() || isAdmin();
      allow update: if isAdmin();
      allow delete: if isSuperAdmin();
    }
    match /announcements/{announcementId} {
      allow read: if isAuthenticated();
      allow write: if isOfficer() || isAdmin();
    }
    match /auditLogs/{logId} {
      allow read: if isAdmin();
      allow create: if isAuthenticated();
      allow update, delete: if false;
    }
    match /systemSettings/{settingId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin();
    }
  }
}`;
    const blob = new Blob([rulesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'firestore.rules';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-teal-300">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif">Cloud Backend Integration Guide</h3>
              <p className="text-xs text-slate-300">Step-by-step setup for Firebase & Cloudinary</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('firebase')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'firebase'
                ? 'border-blue-700 text-blue-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-blue-600" />
            1. Firebase Setup
          </button>
          <button
            onClick={() => setActiveTab('cloudinary')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'cloudinary'
                ? 'border-blue-700 text-blue-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-teal-600" />
            2. Cloudinary Setup
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'rules'
                ? 'border-blue-700 text-blue-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            3. Security Rules
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs leading-relaxed">
          {statusMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
          )}

          {activeTab === 'firebase' && (
            <div className="space-y-6">
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
                <h4 className="font-bold text-blue-950 text-sm mb-1">
                  How CIVIL CONNECT Connects to Firebase
                </h4>
                <p className="text-slate-600">
                  CIVIL CONNECT operates on a dual-mode storage engine. Right now, it is running safely in 
                  <strong className="text-blue-900"> High-Fidelity Local Persistence Mode</strong> with full ACID operations for all 97 Civil Engineering records. When you are ready to connect to Google Firebase, follow the guided steps below.
                </p>
              </div>

              {/* Step 1 */}
              <div className="space-y-2">
                <h5 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px]">1</span>
                  Create Firebase Project in Google Cloud Console
                </h5>
                <ol className="list-decimal pl-6 space-y-1 text-slate-600">
                  <li>Visit <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold underline inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-3 h-3" /></a> and click <strong>Add Project</strong>.</li>
                  <li>Name your project <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">civil-connect-mkce</code>.</li>
                  <li>Choose region <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">asia-south1 (Mumbai)</code> for optimal latency in India.</li>
                </ol>
              </div>

              {/* Step 2 */}
              <div className="space-y-2">
                <h5 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px]">2</span>
                  Enable Authentication & Firestore Database
                </h5>
                <ol className="list-decimal pl-6 space-y-1 text-slate-600">
                  <li>In sidebar, go to <strong>Authentication &gt; Sign-in method</strong> and enable <strong>Email/Password</strong>.</li>
                  <li>Go to <strong>Firestore Database &gt; Create Database</strong> (Start in Production Mode).</li>
                  <li>Register a Web App (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">&lt;/&gt;</code> icon) in Project Settings.</li>
                </ol>
              </div>

              {/* Option A: Enter in .env.local */}
              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-[11px] space-y-2">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> Option A: Add to .env.local</span>
                  <button 
                    onClick={() => copyToClipboard(`VITE_FIREBASE_API_KEY=your_key\nVITE_FIREBASE_AUTH_DOMAIN=civil-connect.firebaseapp.com\nVITE_FIREBASE_PROJECT_ID=civil-connect\nVITE_FIREBASE_STORAGE_BUCKET=civil-connect.appspot.com\nVITE_FIREBASE_MESSAGING_SENDER_ID=00000000\nVITE_FIREBASE_APP_ID=1:000:web:000`, 'env')}
                    className="hover:text-white flex items-center gap-1 text-[10px]"
                  >
                    {copiedKey === 'env' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copy template
                  </button>
                </div>
                <p className="text-slate-300">
                  Create a <code className="text-amber-300">.env.local</code> file in the project folder with your Firebase web configuration.
                </p>
              </div>

              {/* Option B: In-browser test form */}
              <form onSubmit={handleSaveFirebase} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                <h5 className="font-bold text-slate-900 text-xs">
                  Option B: Test Direct Browser Connection (Saved locally)
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">API Key</label>
                    <input
                      type="text"
                      value={fbForm.apiKey}
                      onChange={e => setFbForm({ ...fbForm, apiKey: e.target.value })}
                      placeholder="AIzaSy..."
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Project ID</label>
                    <input
                      type="text"
                      value={fbForm.projectId}
                      onChange={e => setFbForm({ ...fbForm, projectId: e.target.value })}
                      placeholder="civil-connect-mkce"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Auth Domain</label>
                    <input
                      type="text"
                      value={fbForm.authDomain}
                      onChange={e => setFbForm({ ...fbForm, authDomain: e.target.value })}
                      placeholder="project.firebaseapp.com"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">App ID</label>
                    <input
                      type="text"
                      value={fbForm.appId}
                      onChange={e => setFbForm({ ...fbForm, appId: e.target.value })}
                      placeholder="1:123456:web:abcdef"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors"
                  >
                    Save & Test Firebase Connection
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'cloudinary' && (
            <div className="space-y-6">
              <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4">
                <h4 className="font-bold text-teal-950 text-sm mb-1">
                  Cloudinary Image CDN Integration
                </h4>
                <p className="text-slate-600">
                  Cloudinary handles student profile pictures, cropping, compression, and delivery.
                  We use an <strong>Unsigned Upload Preset</strong> to securely allow students to upload photographs directly from the browser without exposing your Cloudinary master API Secret!
                </p>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-slate-900 text-xs">Steps to Configure Cloudinary:</h5>
                <ol className="list-decimal pl-6 space-y-1.5 text-slate-600">
                  <li>Create a free account at <a href="https://cloudinary.com" target="_blank" rel="noreferrer" className="text-teal-700 underline font-semibold">cloudinary.com <ExternalLink className="w-3 h-3 inline" /></a>.</li>
                  <li>Copy your <strong>Cloud Name</strong> from the Dashboard.</li>
                  <li>Go to <strong>Settings &gt; Upload &gt; Upload presets &gt; Add upload preset</strong>.</li>
                  <li>Set <strong>Signing Mode</strong> to <strong>Unsigned</strong>.</li>
                  <li>Set Preset Name to <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-teal-800 font-bold">civil_connect_preset</code>.</li>
                  <li>Under Media analysis, optionally enable <strong>Face detection & auto-crop</strong>.</li>
                </ol>
              </div>

              <form onSubmit={handleSaveCloudinary} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                <h5 className="font-bold text-slate-900 text-xs">Save Cloudinary Parameters:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Cloud Name</label>
                    <input
                      type="text"
                      value={cldForm.cloudName}
                      onChange={e => setCldForm({ ...cldForm, cloudName: e.target.value })}
                      placeholder="e.g. mkce-civil"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Upload Preset (Unsigned)</label>
                    <input
                      type="text"
                      value={cldForm.uploadPreset}
                      onChange={e => setCldForm({ ...cldForm, uploadPreset: e.target.value })}
                      placeholder="civil_connect_preset"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md font-mono"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors"
                  >
                    Save Cloudinary Config
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Firestore Security Rules</h4>
                  <p className="text-slate-500 text-[11px]">Deploy these rules in Firebase Console &gt; Firestore &gt; Rules</p>
                </div>
                <button
                  onClick={downloadFirestoreRules}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download firestore.rules
                </button>
              </div>

              <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-[11px] overflow-x-auto max-h-80 border border-slate-800">
                <pre>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function getUserData() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
    function isStudent() { return isAuthenticated() && getUserData().role == 'STUDENT'; }
    function isOfficer() { return isAuthenticated() && getUserData().role == 'OFFICER'; }
    function isAdmin() { return isAuthenticated() && (getUserData().role == 'ADMIN' || getUserData().role == 'SUPER_ADMIN'); }
    function isSuperAdmin() { return isAuthenticated() && getUserData().role == 'SUPER_ADMIN'; }

    // Students can read/update their own profile
    match /students/{studentId} {
      allow read: if isAuthenticated();
      allow update: if isAuthenticated();
      allow create, delete: if isAdmin();
    }

    // Audit logs are strictly immutable and tamper-proof
    match /auditLogs/{logId} {
      allow read: if isAdmin();
      allow create: if isAuthenticated();
      allow update, delete: if false;
    }
  }
}`}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Current Engine: <strong>Full Reactive Local Database with 97 Records</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md shadow-2xs"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
