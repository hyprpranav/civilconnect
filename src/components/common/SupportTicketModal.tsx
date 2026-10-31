import React, { useState, useEffect } from 'react';
import { UserAccount, SupportTicket } from '../../types';
import { storageService } from '../../services/storageService';
import { 
  AlertTriangle, 
  X, 
  Send, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  LifeBuoy, 
  ShieldCheck, 
  HelpCircle,
  FileText
} from 'lucide-react';

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
}

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [category, setCategory] = useState<SupportTicket['category']>('Bug Report');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMyTickets();
      setFeedback(null);
    }
  }, [isOpen, currentUser]);

  const loadMyTickets = async () => {
    try {
      const all = await storageService.getSupportTickets();
      const my = all.filter(t => t.senderUid === currentUser.uid || t.senderEmail.toLowerCase() === currentUser.email.toLowerCase());
      setTickets(my);
      // If user has unresolved replies or existing tickets, make it easy to view
      if (my.some(t => t.adminReply && t.status === 'Resolved') && activeTab === 'create' && !subject) {
        // keep create default, but show badge
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await storageService.submitSupportTicket({
        senderUid: currentUser.uid,
        senderName: currentUser.name,
        senderEmail: currentUser.email,
        senderRole: currentUser.role,
        category,
        subject: subject.trim(),
        message: message.trim()
      });

      setFeedback({
        success: true,
        message: 'Your report has been logged successfully and dispatched to Department Admin (Harish Pranav S). You will receive updates directly here!'
      });
      setSubject('');
      setMessage('');
      await loadMyTickets();
    } catch (err: any) {
      setFeedback({
        success: false,
        message: err.message || 'Failed to submit issue report.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const repliedTicketsCount = tickets.filter(t => t.adminReply).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950 font-serif">
                Support & Issue Center
              </h3>
              <p className="text-xs text-slate-500">
                Direct feedback & grievance desk monitored by Department Admin
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 border-b border-slate-100 pb-2 shrink-0">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'create'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Submit New Ticket
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>My Reported Issues</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-200 text-slate-800 font-bold">
              {tickets.length}
            </span>
            {repliedTicketsCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-800 font-bold">
                {repliedTicketsCount} Replied
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === 'create' && (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {feedback && (
                <div className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2 ${
                  feedback.success 
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                    : 'bg-red-50 text-red-900 border-red-200'
                }`}>
                  {feedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-600 uppercase">Logged in User:</span>
                <p className="text-xs font-semibold text-slate-900">{currentUser.name} ({currentUser.role}) • {currentUser.email}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Issue Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-medium"
                >
                  <option value="Bug Report">System Bug / Error Encountered</option>
                  <option value="Profile Issue">Student Profile / Photo Update Issue</option>
                  <option value="Data Correction">Register Number / Department Correction</option>
                  <option value="Feature Request">New Feature / Improvement Request</option>
                  <option value="General Inquiry">General Grievance / Inquiries</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Subject / Summary
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Unable to update skills assessment section 2"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Detailed Explanation
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Please describe the issue, what happened, and any steps to reproduce..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Admin Contact: <strong className="text-slate-700">hyprpranav@gmail.com</strong>
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Logging Ticket...' : 'Submit Feedback Ticket'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No issues reported yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Use the "Submit New Ticket" tab if you face any problem.</p>
                </div>
              ) : (
                tickets.map(ticket => (
                  <div key={ticket.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ticket.status === 'Resolved' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : ticket.status === 'In Progress' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ticket.status}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(ticket.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">
                          {ticket.subject}
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {ticket.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {ticket.message}
                    </p>

                    {/* Admin Reply Display */}
                    {ticket.adminReply ? (
                      <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                          <ShieldCheck className="w-4 h-4 text-emerald-700" />
                          <span>Admin Resolution Note ({ticket.repliedBy || 'Harish Pranav S'}):</span>
                        </div>
                        <p className="text-xs text-emerald-950 font-medium pl-5">
                          "{ticket.adminReply}"
                        </p>
                        {ticket.repliedAt && (
                          <p className="text-[10px] text-emerald-700 pl-5">
                            Replied: {new Date(ticket.repliedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-700">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Awaiting Admin review and rectification</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>CIVIL CONNECT Helpdesk</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
