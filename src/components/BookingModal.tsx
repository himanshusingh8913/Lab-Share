import React, { useState } from 'react';
import { Resource } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { verifyUserEligibility, validateBookingDuration } from '../utils/bookingRules.js';
import {
  X,
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileText,
  DollarSign,
  AlertTriangle,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface BookingModalProps {
  resource: Resource;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ resource, onClose, onSuccess }) => {
  const { user } = useAuth();

  // Default to tomorrow 09:00 to 12:00
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  const [date, setDate] = useState(dateStr);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [projectTitle, setProjectTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real-time eligibility evaluation
  const eligibility = verifyUserEligibility(
    user?.certifications || [],
    resource.requiredCertifications
  );

  const startISO = `${date}T${startTime}:00.000Z`;
  const endISO = `${date}T${endTime}:00.000Z`;

  const durationCheck = validateBookingDuration(startISO, endISO, resource.maxConsecutiveHours);

  // Duration in hours
  const startD = new Date(startISO);
  const endD = new Date(endISO);
  const diffHours = Math.max(0, (endD.getTime() - startD.getTime()) / (1000 * 60 * 60));
  const estimatedCost = Math.round(diffHours * resource.hourlyRate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!projectTitle.trim() || !purpose.trim()) {
      setErrorMessage('Please provide project title and experimental purpose.');
      return;
    }

    if (!durationCheck.valid) {
      setErrorMessage(durationCheck.error || 'Invalid booking duration');
      return;
    }

    setSubmitting(true);
    try {
      await api.createBooking({
        resourceId: resource.id,
        projectTitle,
        purpose,
        startTime: startISO,
        endTime: endISO,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit booking reservation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[var(--text-primary)]/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className="bg-[var(--surface-primary)] border border-[var(--border-default)] max-w-4xl w-full rounded-sm shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh]">
        {/* Left Side: 40% Asymmetric Image & Instrument Profile */}
        <div className="md:w-5/12 bg-[#F7F8FC] border-b md:border-b-0 md:border-r border-[var(--border-default)] p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-44 w-full bg-[var(--text-primary)] rounded-xs overflow-hidden relative">
              <img
                src={resource.imageUrl}
                alt={resource.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[var(--brand-primary)] text-white font-mono text-[10px] uppercase font-bold rounded-xs">
                {resource.category}
              </span>
            </div>

            <div>
              <h3 className="font-serif text-xl font-bold text-[var(--text-primary)]">
                {resource.name}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-mono mt-0.5">
                Model: {resource.model}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mt-2">
                <MapPin className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                <span>{resource.building} · {resource.room} ({resource.department})</span>
              </div>
            </div>

            <div className="p-3.5 bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-xs space-y-2 text-xs">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Rate:</span>
                <span className="font-mono font-bold text-[var(--brand-primary)]">${resource.hourlyRate}/hour</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Max Session:</span>
                <span className="font-mono text-[var(--text-primary)]">{resource.maxConsecutiveHours} hours</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Collision Lock:</span>
                <span className="font-mono text-[var(--status-success)] font-semibold">Atomic Guard</span>
              </div>
            </div>

            {/* Eligibility Banner */}
            {eligibility.eligible ? (
              <div className="p-3 bg-[var(--status-success-soft)] border border-[var(--status-success)]/30 rounded-xs flex items-start gap-2 text-xs text-[var(--text-primary)]">
                <ShieldCheck className="w-4 h-4 text-[var(--status-success)] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[var(--status-success)]">Credential Matched</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    You possess all required safety badges for independent operation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[var(--accent-coral)]/15 border border-[var(--accent-coral)]/40 rounded-xs flex items-start gap-2 text-xs text-[var(--text-primary)]">
                <AlertTriangle className="w-4 h-4 text-[var(--accent-coral)] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[var(--accent-coral)]">Missing Prerequisite Badges</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Requires: {eligibility.missing.join(', ')}. Reservation will require manual manager override.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[var(--border-default)] text-[11px] text-[var(--text-muted)] font-mono">
            Booking Engine: Atomic Zero-Collision Lock
          </div>
        </div>

        {/* Right Side: 60% Structured Reservation Form */}
        <div className="md:w-7/12 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--brand-primary)] font-bold">
                  Reservation Docket
                </span>
                <h2 id="booking-modal-title" className="font-serif text-xl font-bold text-[var(--text-primary)]">
                  Request Equipment Access
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xs cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-3 p-3 bg-[var(--accent-coral)]/15 border-l-2 border-[var(--accent-coral)] text-xs font-mono text-[var(--text-primary)] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[var(--accent-coral)] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[var(--accent-coral)]">Reservation Blocked:</strong>
                  {errorMessage}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs font-sans">
              {/* Date & Time Selector */}
              <div className="space-y-2">
                <label className="block font-mono text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                  1. Date & Time Window
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Reservation Date</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] focus:border-[var(--brand-primary)] rounded-xs text-xs text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[var(--text-secondary)] mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] focus:border-[var(--brand-primary)] rounded-xs text-xs text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[var(--text-secondary)] mb-1">End Time</label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] focus:border-[var(--brand-primary)] rounded-xs text-xs text-[var(--text-primary)]"
                    />
                  </div>
                </div>

                {!durationCheck.valid && (
                  <p className="text-[11px] font-mono text-[var(--accent-coral)]">
                    {durationCheck.error}
                  </p>
                )}
              </div>

              {/* Project Title */}
              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">
                  2. Project Title / Grant Reference
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NIH Grant R01 Nanoparticle Sizing Study"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] focus:border-[var(--brand-primary)] rounded-xs text-xs text-[var(--text-primary)]"
                />
              </div>

              {/* Experimental Purpose */}
              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">
                  3. Experimental Purpose & Reagents Used
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail sample preparation, hazard levels, solvents, or lasers to be activated..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] focus:border-[var(--brand-primary)] rounded-xs text-xs text-[var(--text-primary)]"
                />
              </div>

              {/* Estimated Usage Calculation */}
              <div className="p-3 bg-[var(--background-secondary)] border border-[var(--border-strong)] rounded-xs flex items-center justify-between text-xs">
                <div>
                  <span className="text-[var(--text-secondary)] block">Session Estimate:</span>
                  <strong className="text-[var(--text-primary)] font-mono">{diffHours} hours @ ${resource.hourlyRate}/h</strong>
                </div>
                <div className="text-right">
                  <span className="text-[var(--text-secondary)] block">Total Tariff:</span>
                  <strong className="text-base font-bold text-[var(--brand-primary)] font-mono">${estimatedCost}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[var(--surface-primary)] border border-[var(--border-strong)] hover:bg-[#F7F8FC] text-xs font-semibold text-[var(--text-primary)] rounded-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !durationCheck.valid}
                  className="px-5 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-semibold rounded-xs transition-colors cursor-pointer disabled:bg-[var(--background-secondary)] disabled:text-[var(--text-muted)] shadow-xs"
                >
                  {submitting ? 'Submitting Request...' : 'Request Access Docket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
