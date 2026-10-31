import React, { useState, useEffect } from 'react';
import { SupportTicket, UserAccount } from '../../types';
import { storageService } from '../../services/storageService';
import { 
  LifeBuoy, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Send, 
  AlertTriangle, 
  ShieldCheck, 
  Trash2, 
  User, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface AdminFeedbackViewProps {
  adminUser: UserAccount;
  onRefreshParent?: () => void;
}

export const AdminFeedbackView: React.FC<AdminFeedbackViewProps> = ({
  adminUser,
  onRefreshParent
}) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'In Progress' | 'Resolved'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  
  // Reply form state
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyFeedback, setReplyFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const all = await storageService.getSupportTickets();
      setTickets(all);
      if (selectedTicket) {
        const found = all.find(t => t.id === selectedTicket.id);
        if (found) setSelectedTicket(found);
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    }
  };

  const PRESET_REPLIES = [
    'This issue has been investigated and rectified. Thank you for reporting!',
    'Your records have been corrected in the master student database.',
    'System configuration updated. Please sign out and sign in again to verify.',
    'We are working on this feature update for the next release deployment.',
    'Please contact Harish Pranav S (Admin) at 784-569-3765 if you need direct assistance.'
  ];

  const handleSendReply = async (markResolved: boolean = true) => {
    if (!selectedTicket || !replyText.trim()) return;

    setIsSubmittingReply(true);
    setReplyFeedback(null);
    try {
      const updated = await storageService.replyToSupportTicket(
        selectedTicket.id,
        replyText.trim(),
        adminUser.name,
        markResolved
      );

      setReplyFeedback(`Reply sent successfully! Status set to ${markResolved ? 'Resolved' : 'In Progress'}.`);
      setReplyText('');
      await loadTickets();
      setSelectedTicket(updated);
      onRefreshParent?.();
    } catch (err: any) {
      setReplyFeedback(err.message || 'Failed to dispatch reply.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!window.confirm('Delete this support ticket record?')) return;
    await storageService.deleteSupportTicket(ticketId);
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(null);
    }
    await loadTickets();
    onRefreshParent?.();
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.senderName.toLowerCase().includes(search.toLowerCase()) ||
      t.senderEmail.toLowerCase().includes(search.toLowerCase()) ||
      t.message.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const openTicketsCount = tickets.filter(t => t.status === 'Open').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Grievance & Issue Desk
            </span>
            <span className="text-xs text-slate-400 font-mono">Real-Time In-App Feedback</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif mt-1">
            Student & Officer Feedback Desk
          </h1>
          <p className="text-xs text-slate-500">
            Review reported issues, submit resolution responses, and monitor system health.
          </p>
        </div>

        <button
          onClick={loadTickets}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Tickets
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Reported</span>
          <p className="text-2xl font-extrabold text-slate-900">{tickets.length}</p>
          <p className="text-[11px] text-slate-500">All student & officer tickets</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Open Tickets</span>
          <p className="text-2xl font-extrabold text-amber-900">{openTicketsCount}</p>
          <p className="text-[11px] text-slate-500">Awaiting admin review</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">In Progress</span>
          <p className="text-2xl font-extrabold text-blue-900">{inProgressCount}</p>
          <p className="text-[11px] text-slate-500">Being addressed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Resolved</span>
          <p className="text-2xl font-extrabold text-emerald-900">{resolvedCount}</p>
          <p className="text-[11px] text-slate-500">Rectified & replied</p>
        </div>
      </div>

      {/* Main Ticket Interface (Split Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tickets List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by student, email, subject..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="All">All Categories</option>
                <option value="Bug Report">Bug Reports</option>
                <option value="Profile Issue">Profile Issues</option>
                <option value="Data Correction">Data Corrections</option>
                <option value="Feature Request">Feature Requests</option>
                <option value="General Inquiry">General Inquiries</option>
              </select>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <LifeBuoy className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">No matching tickets found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Tickets reported by users will appear here.</p>
              </div>
            ) : (
              filteredTickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setReplyFeedback(null);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    selectedTicket?.id === ticket.id
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ticket.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ticket.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {ticket.status}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {ticket.subject}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate">
                      <strong>{ticket.senderName}</strong> ({ticket.senderRole})
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                      {ticket.category}
                    </span>
                  </div>

                  {ticket.adminReply && (
                    <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 pt-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Replied by Admin
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Ticket Detail & Reply Panel */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          {selectedTicket ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      selectedTicket.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedTicket.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedTicket.status}
                    </span>
                    <span className="text-xs text-slate-400">Ticket ID: {selectedTicket.id}</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-950 font-serif mt-1">
                    {selectedTicket.subject}
                  </h2>
                </div>

                <button
                  onClick={() => handleDeleteTicket(selectedTicket.id)}
                  className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  title="Delete Ticket"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Sender Details Card */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Sender</span>
                  <p className="font-semibold text-slate-900">{selectedTicket.senderName}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Role</span>
                  <p className="font-semibold text-blue-900">{selectedTicket.senderRole}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Email</span>
                  <p className="font-mono text-slate-800 truncate">{selectedTicket.senderEmail}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Category</span>
                  <p className="font-medium text-slate-800">{selectedTicket.category}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Reported On</span>
                  <p className="text-slate-700">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Issue Description Reported by User:
                </label>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.message}
                </div>
              </div>

              {/* Existing Admin Reply */}
              {selectedTicket.adminReply && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      Current Admin Response (Sent by {selectedTicket.repliedBy || 'Admin'}):
                    </span>
                    {selectedTicket.repliedAt && (
                      <span className="text-[11px] text-emerald-700">
                        {new Date(selectedTicket.repliedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-900 pl-5 font-medium">
                    "{selectedTicket.adminReply}"
                  </p>
                </div>
              )}

              {/* Reply Form */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Send Reply / Rectification Note
                    </label>
                    <span className="text-[11px] text-slate-400">
                      User will see this response in their support corner
                    </span>
                  </div>

                  {/* Preset Quick Canned Responses */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {PRESET_REPLIES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReplyText(preset)}
                        className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors text-left cursor-pointer"
                      >
                        + {preset.slice(0, 38)}...
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type rectification message, advice, or confirmation note..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                {replyFeedback && (
                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 font-medium">
                    {replyFeedback}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={isSubmittingReply || !replyText.trim()}
                    onClick={() => handleSendReply(false)}
                    className="px-3.5 py-2 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    Reply (In Progress)
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingReply || !replyText.trim()}
                    onClick={() => handleSendReply(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Send Reply & Mark Resolved
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-700">Select a Ticket to View Details</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Click on any reported ticket on the left list to inspect details, send resolution notes, and update its status.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
