import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, KeyRound, Check, X, Lock } from 'lucide-react';
import { authService } from '../../services/authService';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (isPermanent: boolean) => Promise<void>;
  title: string;
  description: string;
  itemCount: number;
  isBulk?: boolean;
  canPermanentDelete?: boolean; // Only for Super Admin
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title,
  description,
  itemCount,
  isBulk = false,
  canPermanentDelete = false
}) => {
  const [pin, setPin] = useState('');
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [isPermanent, setIsPermanent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pin.length !== 6) {
      setError('Please enter a valid 6-digit administrative security PIN.');
      return;
    }

    if (isBulk && confirmationPhrase.trim() !== 'CONFIRM DELETE') {
      setError('Please type exact confirmation phrase "CONFIRM DELETE" to proceed with bulk deletion.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isPinValid = await authService.verifyAdminDeletionPin(pin);
      if (!isPinValid) {
        setError('Incorrect Administrative Security PIN. Deletion request denied.');
        setIsSubmitting(false);
        return;
      }

      await onSuccess(isPermanent);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-red-50/80 border-b border-red-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center border border-red-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-red-950 font-serif">{title}</h3>
              <p className="text-xs text-red-700 font-medium">Administrative Security Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-semibold mb-0.5">{description}</p>
              <p>
                Target: <span className="font-bold underline">{itemCount} record(s)</span> affected. All deletions are audited and logged with performer timestamp.
              </p>
            </div>
          </div>

          {/* Bulk confirmation phrase requirement */}
          {isBulk && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Type <span className="text-red-600 font-mono font-bold select-all">CONFIRM DELETE</span> to authorize:
              </label>
              <input
                type="text"
                value={confirmationPhrase}
                onChange={e => setConfirmationPhrase(e.target.value)}
                placeholder="CONFIRM DELETE"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 uppercase"
                required
              />
            </div>
          )}

          {/* 6-Digit PIN input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Six-Digit Administrative Security PIN:
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {/* Notice for testing: default PIN is 654321 */}
                (Default test PIN: 654321)
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full pl-9 pr-3 py-2.5 text-center text-lg tracking-widest font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Super Admin Permanent Delete Toggle */}
          {canPermanentDelete && (
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={isPermanent}
                  onChange={e => setIsPermanent(e.target.checked)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <span className="font-medium text-red-700">
                  Permanent Deletion (Super Admin only: Skip archive and purge permanently)
                </span>
              </label>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (isBulk && confirmationPhrase !== 'CONFIRM DELETE')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
            >
              {isSubmitting ? (
                <>Verifying PIN...</>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  Authorize Deletion
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
