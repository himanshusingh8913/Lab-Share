import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  CheckCheck,
  RotateCcw,
  User,
  MapPin,
  ClipboardCheck,
  Layers,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
  X,
  Lock,
} from 'lucide-react';

export const BookingsHub: React.FC = () => {
  const { user, role } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'approvals' | 'checkin' | 'returns' | 'all'>('my');

  // Modals & form state
  const [rejectingBookingId, setRejectingBookingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [returningBooking, setReturningBooking] = useState<Booking | null>(null);
  const [copiedOtp, setCopiedOtp] = useState<string | null>(null);

  // OTP check-in terminal state
  const [selectedBookingForCheckin, setSelectedBookingForCheckin] = useState<Booking | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [checkinCondition, setCheckinCondition] = useState('excellent');
  const [checkinNotes, setCheckinNotes] = useState('Initial inspection passed, laser aligned.');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);

  // Return condition form state
  const [returnCondition, setReturnCondition] = useState<'excellent' | 'good' | 'fair' | 'damaged'>('good');
  const [returnCleanliness, setReturnCleanliness] = useState<'clean' | 'acceptable' | 'needs_cleaning'>('clean');
  const [returnNotes, setReturnNotes] = useState('Cleaned and powered off according to SOP.');
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.getBookings();
      setBookings(res.bookings);
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [role]);

  // Handle OTP copy to clipboard
  const handleCopyOtp = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedOtp(code);
    setTimeout(() => setCopiedOtp(null), 2000);
  };

  // Manager Approve Booking
  const handleApprove = async (id: string) => {
    try {
      await api.approveBooking(id);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  // Manager Reject Booking
  const handleReject = async () => {
    if (!rejectingBookingId) return;
    try {
      await api.rejectBooking(rejectingBookingId, rejectionReason);
      setRejectingBookingId(null);
      setRejectionReason('');
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  // Waitlist Booking
  const handleWaitlist = async (id: string) => {
    try {
      await api.waitlistBooking(id);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Waitlist operation failed');
    }
  };

  // Researcher Cancel Booking
  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this reservation request?')) return;
    try {
      await api.cancelBooking(id);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Cancellation failed');
    }
  };

  // OTP Verification & Physical Handover Check-In
  const handleVerifyOtpAndCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForCheckin) return;
    setOtpError(null);
    setOtpSuccess(null);

    try {
      await api.verifyOtp(selectedBookingForCheckin.id, {
        otpCode: otpInput.trim(),
        condition: checkinCondition,
        notes: checkinNotes,
      });

      setOtpSuccess(`Check-in complete! OTP verified and instrument #${selectedBookingForCheckin.resourceName} is in session.`);
      setTimeout(() => {
        setSelectedBookingForCheckin(null);
        setOtpInput('');
        setOtpSuccess(null);
        fetchBookings();
      }, 1500);
    } catch (err: any) {
      setOtpError(err.message || 'OTP verification failed');
    }
  };

  // Return & Condition Report
  const handleReturnEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningBooking) return;
    setReturnSubmitting(true);

    try {
      await api.returnEquipment(returningBooking.id, {
        physicalCondition: returnCondition,
        cleanliness: returnCleanliness,
        calibrationVerified: true,
        notes: returnNotes,
      });

      setReturningBooking(null);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Return report submission failed');
    } finally {
      setReturnSubmitting(false);
    }
  };

  // Filtered views based on selected tab
  const myBookings = bookings.filter((b) => b.userId === user?.id);
  const pendingApprovals = bookings.filter((b) => b.status === 'pending_approval');
  const readyForPickup = bookings.filter((b) => b.status === 'approved' && !b.otpUsed);
  const activeCheckouts = bookings.filter((b) => b.status === 'checked_out');

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center text-[11px] font-mono uppercase font-semibold text-[var(--status-success)] bg-[var(--status-success-soft)] px-2 py-0.5 rounded-xs">
            <CheckCircle className="w-3 h-3 mr-1 text-[var(--status-success)]" />
            Approved · OTP Issued
          </span>
        );
      case 'checked_out':
        return (
          <span className="inline-flex items-center text-[11px] font-mono uppercase font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary-soft)] px-2 py-0.5 rounded-xs">
            <span className="w-1.5 h-1.5 bg-[var(--brand-primary)] rounded-full mr-1.5 inline-block" />
            In-Session (Checked Out)
          </span>
        );
      case 'pending_approval':
        return (
          <span className="inline-flex items-center text-[11px] font-mono uppercase font-semibold text-[var(--text-primary)] bg-[var(--accent-yellow)] px-2 py-0.5 rounded-xs">
            <Clock className="w-3 h-3 mr-1 text-[var(--text-primary)]" />
            Pending Authorization
          </span>
        );
      case 'waitlisted':
        return (
          <span className="inline-flex items-center text-[11px] font-mono uppercase font-semibold text-[var(--text-secondary)] bg-[var(--background-secondary)] px-2 py-0.5 rounded-xs">
            Waitlisted
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center text-[11px] font-mono uppercase font-semibold text-[var(--status-success)] bg-[var(--status-success-soft)] px-2 py-0.5 rounded-xs">
            <CheckCheck className="w-3 h-3 mr-1 text-[var(--status-success)]" />
            Returned & Closed
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center text-[11px] font-mono uppercase font-semibold text-[var(--accent-coral)] bg-[var(--accent-coral)]/15 px-2 py-0.5 rounded-xs">
            <XCircle className="w-3 h-3 mr-1 text-[var(--accent-coral)]" />
            Request Rejected
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center text-[11px] font-mono uppercase font-semibold text-[var(--text-muted)] bg-[var(--background-secondary)] px-2 py-0.5 rounded-xs">
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Segmented Controls */}
      <div className="bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm p-6 sm:p-8 space-y-4 shadow-[0_1px_3px_rgba(40,51,71,0.04)]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-wider text-[var(--brand-primary)] font-bold mb-1">
              <span>Facility Access Log</span>
              <span className="text-[var(--border-strong)]">/</span>
              <span>Session Control</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--text-primary)] tracking-tight">
              Bookings & Dispatch Control Hub
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-sans mt-1">
              End-to-end reservation docket: peer approvals queue, physical OTP security vouchers, and post-session condition reports.
            </p>
          </div>

          {/* Tab Switchers (Clean Segmented Toolbar) */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#F7F8FC] border border-[var(--border-strong)] p-1 rounded-xs">
            <button
              type="button"
              onClick={() => setActiveTab('my')}
              className={`px-3 py-1.5 text-xs font-mono transition cursor-pointer rounded-xs ${
                activeTab === 'my'
                  ? 'bg-[var(--brand-primary)] text-white font-semibold shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              My Reservations ({myBookings.length})
            </button>

            {(role === 'manager' || role === 'admin') && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('approvals')}
                  className={`px-3 py-1.5 text-xs font-mono transition cursor-pointer rounded-xs ${
                    activeTab === 'approvals'
                      ? 'bg-[var(--brand-primary)] text-white font-semibold shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Approvals Queue ({pendingApprovals.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('checkin')}
                  className={`px-3 py-1.5 text-xs font-mono transition cursor-pointer rounded-xs ${
                    activeTab === 'checkin'
                      ? 'bg-[var(--brand-primary)] text-white font-semibold shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  OTP Station ({readyForPickup.length})
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('returns')}
              className={`px-3 py-1.5 text-xs font-mono transition cursor-pointer rounded-xs ${
                activeTab === 'returns'
                  ? 'bg-[var(--brand-primary)] text-white font-semibold shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              In-Session ({activeCheckouts.length})
            </button>

            {(role === 'manager' || role === 'admin') && (
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 text-xs font-mono transition cursor-pointer rounded-xs ${
                  activeTab === 'all'
                    ? 'bg-[var(--brand-primary)] text-white font-semibold shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                All Bookings ({bookings.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="text-center py-16 bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm">
          <div className="inline-block animate-spin h-6 w-6 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full" />
          <p className="mt-3 text-xs font-mono text-[var(--text-secondary)]">Querying reservation dockets...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB: MY RESERVATIONS */}
          {activeTab === 'my' && (
            <>
              {myBookings.length === 0 ? (
                <div className="text-center py-16 bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm space-y-2">
                  <Calendar className="w-8 h-8 text-[var(--border-strong)] mx-auto" />
                  <h3 className="font-serif text-base text-[var(--text-primary)] font-bold">No active reservations recorded</h3>
                  <p className="text-xs text-[var(--text-secondary)] font-sans">
                    Schedule an instrument from the Equipment Catalog to generate a reservation docket.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myBookings.map((b) => (
                    <div
                      key={b.id}
                      className="bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm p-6 space-y-4 shadow-[0_1px_3px_rgba(40,51,71,0.03)]"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-[var(--border-default)]">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-serif text-xl font-bold text-[var(--text-primary)]">{b.resourceName}</h3>
                            {getStatusBadge(b.status)}
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] font-sans mt-1">
                            Project: <strong className="font-semibold text-[var(--text-primary)]">{b.projectTitle}</strong>
                          </p>
                        </div>

                        <div className="text-xs font-mono text-[var(--text-secondary)] text-left sm:text-right space-y-0.5">
                          <div>
                            <span className="text-[var(--text-muted)]">Start:</span> {new Date(b.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div>
                            <span className="text-[var(--text-muted)]">End:</span> {new Date(b.endTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      {/* Prominent Cryptographic OTP Voucher */}
                      {b.status === 'approved' && b.otpCode && !b.otpUsed && (
                        <div className="bg-[var(--brand-primary-soft)] border border-[var(--brand-primary)] rounded-xs p-5 relative">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-start space-x-3.5">
                              <div className="w-10 h-10 bg-[var(--brand-primary)] text-white rounded-xs flex items-center justify-center shrink-0">
                                <KeyRound className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[var(--brand-primary)] block">
                                  Cryptographic Physical Release Voucher
                                </span>
                                <div className="flex items-center space-x-3 mt-1">
                                  <span className="font-mono text-3xl font-bold tracking-wider text-[var(--brand-primary)]">
                                    {b.otpCode}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyOtp(b.otpCode!)}
                                    className="p-1.5 bg-[var(--surface-primary)] border border-[var(--border-default)] hover:border-[var(--brand-primary)] text-[var(--brand-primary)] rounded-xs transition cursor-pointer"
                                    title="Copy OTP"
                                  >
                                    {copiedOtp === b.otpCode ? (
                                      <Check className="w-4 h-4 text-[var(--status-success)]" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                                <p className="text-xs text-[var(--text-primary)] font-sans mt-1">
                                  Present this 6-digit one-time code to the Core Manager at check-in. Single-use only.
                                </p>
                              </div>
                            </div>

                            <div className="border-t sm:border-t-0 sm:border-l border-[var(--border-default)] pt-3 sm:pt-0 sm:pl-5 text-xs font-mono text-[var(--text-primary)] shrink-0">
                              <span className="block text-[10px] uppercase text-[var(--text-secondary)]">Voucher Expiry</span>
                              <span className="font-bold text-[var(--brand-primary)] block mt-0.5">
                                {b.otpExpiresAt ? new Date(b.otpExpiresAt).toLocaleTimeString() : 'Session Start'}
                              </span>
                              <span className="text-[10px] text-[var(--status-success)] font-bold block mt-1">Replay Lock: Active</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Active In-Session Action: Submit Return Report */}
                      {b.status === 'checked_out' && (
                        <div className="p-4 bg-[var(--brand-primary-soft)] border border-[var(--brand-primary)] rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="flex items-center space-x-2 text-[var(--text-primary)]">
                            <span className="w-2 h-2 bg-[var(--brand-primary)] rounded-full inline-block shrink-0" />
                            <span>Instrument currently checked out to your investigation. Ready to return?</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReturningBooking(b)}
                            className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-mono text-xs font-semibold rounded-xs cursor-pointer shrink-0 shadow-xs"
                          >
                            Submit Return Condition Report
                          </button>
                        </div>
                      )}

                      {/* Condition report summary if returned */}
                      {b.status === 'returned' && b.returnCondition && (
                        <div className="p-3.5 bg-[#F7F8FC] border border-[var(--border-default)] rounded-xs text-xs font-sans text-[var(--text-primary)] space-y-1">
                          <div className="flex justify-between items-center font-mono text-[11px]">
                            <span className="text-[var(--text-secondary)] uppercase font-bold">Return Inspection Passed:</span>
                            <span className="font-bold uppercase text-[var(--status-success)]">{b.returnCondition.physicalCondition}</span>
                          </div>
                          <p className="text-[var(--text-secondary)] italic">"{b.returnCondition.notes}"</p>
                        </div>
                      )}

                      {/* Rejection notice */}
                      {b.status === 'rejected' && b.rejectionReason && (
                        <div className="p-3 bg-[var(--accent-coral)]/15 border-l-2 border-[var(--accent-coral)] rounded-xs text-xs text-[var(--text-primary)] font-mono">
                          <strong className="text-[var(--accent-coral)]">Rejection Notice:</strong> {b.rejectionReason}
                        </div>
                      )}

                      {/* Cancel button if pending */}
                      {b.status === 'pending_approval' && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => handleCancel(b.id)}
                            className="px-3 py-1.5 text-xs font-mono text-[var(--accent-coral)] hover:bg-[var(--accent-coral)]/10 border border-[var(--accent-coral)] rounded-xs cursor-pointer"
                          >
                            Cancel Reservation Request
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB: APPROVALS QUEUE (MANAGER / ADMIN) */}
          {activeTab === 'approvals' && (
            <div className="space-y-4">
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-16 bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm space-y-2">
                  <CheckCircle className="w-8 h-8 text-[var(--status-success)] mx-auto" />
                  <h3 className="font-serif text-base text-[var(--text-primary)] font-bold">Approval queue is empty</h3>
                  <p className="text-xs text-[var(--text-secondary)]">All reservation requests have been processed.</p>
                </div>
              ) : (
                pendingApprovals.map((b) => (
                  <div
                    key={b.id}
                    className="bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm p-6 space-y-4 shadow-[0_1px_3px_rgba(40,51,71,0.03)]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-[var(--border-default)]">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-lg font-bold text-[var(--text-primary)]">{b.resourceName}</h3>
                          <span className="font-mono text-xs text-[var(--text-secondary)]">Docket #{b.id.slice(0, 8)}</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          Requested by <strong className="text-[var(--text-primary)]">{b.userName}</strong> for "{b.projectTitle}"
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(b.id)}
                          className="px-4 py-2 bg-[var(--status-success)] hover:bg-[#068048] text-white text-xs font-semibold rounded-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve & Issue OTP
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectingBookingId(b.id)}
                          className="px-3.5 py-2 bg-[var(--surface-primary)] border border-[var(--accent-coral)] hover:bg-[var(--accent-coral)]/10 text-[var(--accent-coral)] text-xs font-semibold rounded-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWaitlist(b.id)}
                          className="px-3.5 py-2 bg-[var(--surface-primary)] border border-[var(--border-strong)] hover:bg-[#F7F8FC] text-[var(--text-primary)] text-xs font-semibold rounded-xs cursor-pointer"
                        >
                          Waitlist
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-[#F7F8FC] border border-[var(--border-default)] rounded-xs text-xs space-y-1">
                      <p><strong className="text-[var(--text-primary)]">Experimental Purpose:</strong> {b.purpose}</p>
                      <p className="text-[11px] text-[var(--text-secondary)] font-mono">
                        Time: {new Date(b.startTime).toLocaleString()} &rarr; {new Date(b.endTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: OTP STATION / PHYSICAL CHECK-IN */}
          {activeTab === 'checkin' && (
            <div className="space-y-4">
              <div className="p-4 bg-[var(--brand-primary-soft)] border border-[var(--brand-primary)] rounded-xs flex items-center justify-between text-xs text-[var(--text-primary)]">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[var(--brand-primary)]" />
                  <span>Physical Core Facility Front Desk: Enter or verify researcher's 6-digit OTP code to authorize physical instrument release.</span>
                </div>
              </div>

              {readyForPickup.length === 0 ? (
                <div className="text-center py-16 bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm space-y-2">
                  <ShieldCheck className="w-8 h-8 text-[var(--status-success)] mx-auto" />
                  <h3 className="font-serif text-base text-[var(--text-primary)] font-bold">No vouchers pending check-in</h3>
                  <p className="text-xs text-[var(--text-secondary)]">All approved reservations have already checked in or concluded.</p>
                </div>
              ) : (
                readyForPickup.map((b) => (
                  <div
                    key={b.id}
                    className="bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_1px_3px_rgba(40,51,71,0.03)]"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-lg font-bold text-[var(--text-primary)]">{b.resourceName}</h3>
                        <span className="font-mono text-xs text-[var(--brand-primary)] bg-[var(--brand-primary-soft)] px-2 py-0.5 rounded-xs font-semibold">
                          OTP Issued
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Operator: <strong className="text-[var(--text-primary)]">{b.userName}</strong> ({b.projectTitle})
                      </p>
                      <p className="text-[11px] font-mono text-[var(--text-muted)]">
                        Slot: {new Date(b.startTime).toLocaleTimeString()} - {new Date(b.endTime).toLocaleTimeString()}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBookingForCheckin(b);
                        setOtpInput('');
                        setOtpError(null);
                        setOtpSuccess(null);
                      }}
                      className="px-5 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-semibold rounded-xs shadow-xs cursor-pointer flex items-center gap-2"
                    >
                      <KeyRound className="w-4 h-4" /> Verify OTP & Check In
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: IN-SESSION / RETURNS */}
          {activeTab === 'returns' && (
            <div className="space-y-4">
              {activeCheckouts.length === 0 ? (
                <div className="text-center py-16 bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm space-y-2">
                  <CheckCheck className="w-8 h-8 text-[var(--status-success)] mx-auto" />
                  <h3 className="font-serif text-base text-[var(--text-primary)] font-bold">No equipment currently checked out</h3>
                  <p className="text-xs text-[var(--text-secondary)]">All equipment units are securely stored in facility berths.</p>
                </div>
              ) : (
                activeCheckouts.map((b) => (
                  <div
                    key={b.id}
                    className="bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_1px_3px_rgba(40,51,71,0.03)]"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-lg font-bold text-[var(--text-primary)]">{b.resourceName}</h3>
                        <span className="font-mono text-xs text-[var(--brand-primary)] bg-[var(--brand-primary-soft)] px-2 py-0.5 rounded-xs font-bold">
                          Active In-Session
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Operator: <strong className="text-[var(--text-primary)]">{b.userName}</strong> ({b.projectTitle})
                      </p>
                      <p className="text-[11px] font-mono text-[var(--text-muted)]">
                        Checked in at: {new Date(b.startTime).toLocaleTimeString()}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setReturningBooking(b)}
                      className="px-5 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-semibold rounded-xs shadow-xs cursor-pointer flex items-center gap-2"
                    >
                      <ClipboardCheck className="w-4 h-4" /> Conduct Return Inspection
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: ALL BOOKINGS (ADMIN / AUDIT) */}
          {activeTab === 'all' && (
            <div className="bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm overflow-hidden shadow-[0_1px_3px_rgba(40,51,71,0.03)]">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--background-secondary)] text-[var(--text-primary)] font-mono text-[10px] uppercase border-b border-[var(--border-default)]">
                    <tr>
                      <th className="py-3 px-4">Docket ID</th>
                      <th className="py-3 px-4">Instrument</th>
                      <th className="py-3 px-4">Operator</th>
                      <th className="py-3 px-4">Time Window</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">OTP Record</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-default)]">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-[#F7F8FC]">
                        <td className="py-3 px-4 font-mono text-[11px] text-[var(--text-secondary)]">#{b.id.slice(0, 8)}</td>
                        <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">{b.resourceName}</td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">{b.userName}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[var(--text-secondary)]">
                          {new Date(b.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} ({new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(b.status)}</td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {b.otpCode ? (
                            <span className={b.otpUsed ? 'text-[var(--text-muted)] line-through' : 'text-[var(--brand-primary)] font-bold'}>
                              {b.otpCode} {b.otpUsed ? '(Used)' : '(Active)'}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: OTP CHECK-IN TERMINAL */}
      {selectedBookingForCheckin && (
        <div className="fixed inset-0 z-50 bg-[var(--text-primary)]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface-primary)] border border-[var(--border-default)] max-w-md w-full rounded-sm shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border-default)]">
              <div>
                <span className="font-mono text-[10px] uppercase text-[var(--brand-primary)] font-bold">Physical Security Gate</span>
                <h3 className="font-serif text-lg font-bold text-[var(--text-primary)]">OTP Verification Terminal</h3>
              </div>
              <button type="button" onClick={() => setSelectedBookingForCheckin(null)} className="text-[var(--text-secondary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {otpError && (
              <div className="p-3 bg-[var(--accent-coral)]/15 border-l-2 border-[var(--accent-coral)] text-xs font-mono text-[var(--text-primary)]">
                {otpError}
              </div>
            )}

            {otpSuccess && (
              <div className="p-3 bg-[var(--status-success-soft)] border-l-2 border-[var(--status-success)] text-xs font-mono text-[var(--status-success)]">
                {otpSuccess}
              </div>
            )}

            <form onSubmit={handleVerifyOtpAndCheckin} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Enter 6-Digit Cryptographic OTP
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 849201"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full px-4 py-2.5 text-center font-mono text-2xl font-bold tracking-widest bg-[#F7F8FC] border border-[var(--border-strong)] focus:border-[var(--brand-primary)] rounded-xs text-[var(--brand-primary)]"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Handover Condition Assessment
                </label>
                <select
                  value={checkinCondition}
                  onChange={(e) => setCheckinCondition(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] rounded-xs text-[var(--text-primary)]"
                >
                  <option value="excellent">Excellent - Pristine calibration</option>
                  <option value="good">Good - Standard operating state</option>
                  <option value="fair">Fair - Acceptable for non-critical run</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Supervisor Notes
                </label>
                <input
                  type="text"
                  value={checkinNotes}
                  onChange={(e) => setCheckinNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] rounded-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="pt-3 border-t border-[var(--border-default)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForCheckin(null)}
                  className="px-4 py-2 bg-[var(--surface-primary)] border border-[var(--border-strong)] text-xs font-semibold text-[var(--text-secondary)] rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-semibold rounded-xs shadow-xs"
                >
                  Verify & Release Instrument
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RETURN CONDITION INSPECTION */}
      {returningBooking && (
        <div className="fixed inset-0 z-50 bg-[var(--text-primary)]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface-primary)] border border-[var(--border-default)] max-w-lg w-full rounded-sm shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border-default)]">
              <div>
                <span className="font-mono text-[10px] uppercase text-[var(--brand-primary)] font-bold">Return Quality Certification</span>
                <h3 className="font-serif text-lg font-bold text-[var(--text-primary)]">
                  Return {returningBooking.resourceName}
                </h3>
              </div>
              <button type="button" onClick={() => setReturningBooking(null)} className="text-[var(--text-secondary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnEquipment} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Physical Instrument Condition
                </label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] rounded-xs text-[var(--text-primary)]"
                >
                  <option value="excellent">Excellent - Pristine state, powered down</option>
                  <option value="good">Good - Standard operating state</option>
                  <option value="fair">Fair - Minor wear, needs upcoming check</option>
                  <option value="damaged">Damaged - (Triggers immediate maintenance lockout)</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Bench & Lens Cleanliness
                </label>
                <select
                  value={returnCleanliness}
                  onChange={(e) => setReturnCleanliness(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] rounded-xs text-[var(--text-primary)]"
                >
                  <option value="clean">Clean - Wiped down with isopropanol/ethanol</option>
                  <option value="acceptable">Acceptable</option>
                  <option value="needs_cleaning">Needs Cleaning</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Return Inspection Notes & Consumable Volume
                </label>
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] rounded-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="pt-3 border-t border-[var(--border-default)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturningBooking(null)}
                  className="px-4 py-2 bg-[var(--surface-primary)] border border-[var(--border-strong)] text-xs font-semibold text-[var(--text-secondary)] rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returnSubmitting}
                  className="px-5 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-semibold rounded-xs shadow-xs"
                >
                  {returnSubmitting ? 'Certifying Return...' : 'Sign & Complete Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REJECT REASON */}
      {rejectingBookingId && (
        <div className="fixed inset-0 z-50 bg-[var(--text-primary)]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface-primary)] border border-[var(--border-default)] max-w-md w-full rounded-sm shadow-2xl p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-[var(--text-primary)]">Provide Rejection Reason</h3>
            <textarea
              rows={3}
              placeholder="e.g. Laser module scheduled for calibration; please choose another slot..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] rounded-xs text-xs text-[var(--text-primary)]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingBookingId(null)}
                className="px-4 py-2 bg-[var(--surface-primary)] border border-[var(--border-strong)] text-xs text-[var(--text-secondary)] rounded-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="px-5 py-2 bg-[var(--accent-coral)] hover:bg-[#e05b53] text-white text-xs font-semibold rounded-xs shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
