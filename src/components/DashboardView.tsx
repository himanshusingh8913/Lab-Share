import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { DashboardStats, AuditLog, Booking, Incident } from '../types/index.js';
import {
  Layers,
  CheckCircle,
  Clock,
  AlertTriangle,
  Activity,
  ArrowRight,
  ShieldCheck,
  Cpu,
  BookOpen,
  Calendar,
  Lock,
  Search,
  CheckCheck,
  Building2,
  Users,
  FileText,
  BadgeCheck,
  Microscope,
  Sparkles,
  ChevronRight,
  Wrench,
  Check,
  X,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenAiAssistant: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenAiAssistant }) => {
  const { user, role } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, bookingsRes, incidentsRes] = await Promise.all([
        api.getStats().catch(() => ({ stats: null })),
        api.getBookings().catch(() => ({ bookings: [] })),
        api.getIncidents().catch(() => ({ incidents: [] })),
      ]);
      setStats(statsRes.stats);
      setBookings(bookingsRes.bookings);
      setIncidents(incidentsRes.incidents);

      if (role === 'admin') {
        const auditRes = await api.getAuditLogs().catch(() => ({ auditLogs: [] }));
        setRecentLogs(auditRes.auditLogs.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [role]);

  // Quick manager actions
  const handleQuickApprove = async (id: string) => {
    try {
      await api.approveBooking(id);
      setActionFeedback(`Booking #${id} approved successfully.`);
      fetchDashboardData();
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleQuickReject = async (id: string) => {
    try {
      await api.rejectBooking(id, 'Resource unavailable or scheduled for maintenance');
      setActionFeedback(`Booking #${id} rejected.`);
      fetchDashboardData();
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('catalog');
  };

  // Filtered views
  const myBookings = bookings.filter((b) => b.userId === user?.id);
  const pendingApprovals = bookings.filter((b) => b.status === 'pending_approval');
  const activeSessions = bookings.filter((b) => b.status === 'checked_out' || b.status === 'approved');
  const awaitingReturns = bookings.filter((b) => b.status === 'checked_out');
  const openIncidentsList = incidents.filter((i) => i.status === 'open' || i.status === 'under_investigation');

  return (
    <div className="space-y-8">
      {/* Action Notification Toast */}
      {actionFeedback && (
        <div className="bg-[var(--brand-primary-soft)] border border-[var(--brand-primary)] text-[var(--brand-primary)] px-4 py-2.5 rounded-sm text-xs font-medium flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-[var(--brand-primary)]" />
            {actionFeedback}
          </span>
          <button type="button" onClick={() => setActionFeedback(null)} className="text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* HERO SECTION — Asymmetric 55% / 45% Layout */}
      <section className="bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm p-6 sm:p-10 shadow-[0_2px_8px_rgba(40,51,71,0.04)] overflow-hidden relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: 55% Editorial Text & Search */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border border-[var(--border-default)] rounded-xs text-[11px] font-mono font-semibold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]" />
              INSTITUTIONAL RESOURCE SHARING
            </div>

            <div className="space-y-3">
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[var(--text-primary)] tracking-tight leading-[1.15]">
                Good equipment shouldn't sit unused.
              </h1>
              <p className="text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed max-w-xl font-sans">
                LabShare connects universities, research labs, and makerspaces with verified individuals who need access to specialized tools and facilities.
              </p>
            </div>

            {/* Live Search Bar */}
            <form onSubmit={handleSearchSubmit} className="max-w-xl">
              <div className="flex items-center bg-[#F7F8FC] border border-[var(--border-strong)] focus-within:border-[var(--brand-primary)] focus-within:bg-[var(--surface-primary)] rounded-xs p-1.5 transition-all shadow-xs">
                <Search className="w-4 h-4 text-[var(--text-muted)] ml-2 shrink-0" />
                <input
                  type="text"
                  placeholder="What are you looking for? Try 3D printers, computer labs, cameras..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none px-3 py-1.5 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none font-sans"
                />
                <button
                  type="submit"
                  className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white px-4 py-2 text-xs font-semibold rounded-xs transition-colors shrink-0 cursor-pointer shadow-xs"
                >
                  Search Fleet
                </button>
              </div>
            </form>

            {/* Impact Metric Strip */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-[var(--border-default)]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                  Active Facilities
                </span>
                <span className="font-serif text-xl sm:text-2xl font-bold text-[var(--text-primary)]">14 Labs</span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                  Verified Fleet
                </span>
                <span className="font-serif text-xl sm:text-2xl font-bold text-[var(--brand-primary)]">
                  {stats?.totalResources ?? 8} Units
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                  Fleet Utilization
                </span>
                <span className="font-serif text-xl sm:text-2xl font-bold text-[var(--status-success)]">
                  {stats?.utilizationRate ?? 65}%
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                  Underuse Cut
                </span>
                <span className="font-serif text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                  -42% Idle
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: 45% Visual Card & Laboratory Context */}
          <div className="lg:col-span-5 relative">
            <div className="bg-[var(--background-secondary)] border border-[var(--border-strong)] rounded-sm p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-strong)]">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)]" />
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Core Facility Network
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[var(--status-success)] font-semibold bg-[var(--status-success-soft)] px-2 py-0.5 rounded-xs">
                  Operational
                </span>
              </div>

              {/* Facility Spotlight Card */}
              <div className="space-y-3">
                <div className="h-44 w-full bg-[var(--text-primary)] rounded-xs overflow-hidden relative group">
                  <img
                    src="https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=800&q=80"
                    alt="Advanced Electron Microscopy Lab"
                    className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--text-primary)] via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-yellow)] font-semibold">
                      Featured Instrument
                    </span>
                    <h4 className="font-serif text-base font-bold leading-tight">
                      Thermo Fisher Talos F200X S/TEM
                    </h4>
                    <p className="text-[11px] text-[var(--background-secondary)] font-sans">
                      Materials Characterization Center · Room 104
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-xs space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[var(--text-secondary)]">
                    <span>Current Access Mode:</span>
                    <strong className="text-[var(--text-primary)] font-mono">Assisted or Certified Solo</strong>
                  </div>
                  <div className="flex items-center justify-between text-[var(--text-secondary)]">
                    <span>Safety Clearance:</span>
                    <span className="font-semibold text-[var(--status-success)] bg-[var(--status-success-soft)] px-1.5 py-0.2 rounded-xs text-[11px]">
                      Laser Level 3 Required
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onNavigate('catalog')}
                    className="w-full py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-semibold rounded-xs transition-colors text-center cursor-pointer shadow-xs"
                  >
                    View All {stats?.totalResources ?? 8} Resources
                  </button>
                  <button
                    type="button"
                    onClick={onOpenAiAssistant}
                    className="px-3 py-2 bg-[var(--surface-primary)] hover:bg-[var(--background-main)] border border-[var(--border-strong)] text-[var(--text-primary)] text-xs font-medium rounded-xs transition-colors shrink-0 cursor-pointer"
                    title="Ask AI about SOPs and equipment guidelines"
                  >
                    <BookOpen className="w-4 h-4 text-[var(--brand-primary)]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST SECTION: "Access comes with accountability" */}
      <section className="bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm p-6 sm:p-8">
        <div className="max-w-2xl mb-6">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--brand-primary)] font-bold block">
            Institutional Trust Architecture
          </span>
          <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)] mt-1">
            Access comes with accountability.
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-sans">
            Every booking in LabShare is protected by institutional safeguards to preserve instrument precision and safety.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 bg-[#F7F8FC] border border-[var(--border-default)] rounded-xs space-y-2">
            <div className="w-8 h-8 rounded-xs bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] flex items-center justify-center font-bold">
              <BadgeCheck className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-sm font-bold text-[var(--text-primary)]">Verified Users</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Academic credentials and lab safety certifications are validated against official institutional records.
            </p>
          </div>

          <div className="p-4 bg-[#F7F8FC] border border-[var(--border-default)] rounded-xs space-y-2">
            <div className="w-8 h-8 rounded-xs bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-sm font-bold text-[var(--text-primary)]">Owner-Approved</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Lab managers personally evaluate project experimental protocols before granting booking approval.
            </p>
          </div>

          <div className="p-4 bg-[#F7F8FC] border border-[var(--border-default)] rounded-xs space-y-2">
            <div className="w-8 h-8 rounded-xs bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-sm font-bold text-[var(--text-primary)]">Documented OTP</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Single-use cryptographic OTP release ensures only the authorized researcher unlocks physical access.
            </p>
          </div>

          <div className="p-4 bg-[#F7F8FC] border border-[var(--border-default)] rounded-xs space-y-2">
            <div className="w-8 h-8 rounded-xs bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] flex items-center justify-center font-bold">
              <CheckCheck className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-sm font-bold text-[var(--text-primary)]">Return Inspection</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Mandatory post-session condition inspection and cleanliness check-off protect calibration integrity.
            </p>
          </div>

          <div className="p-4 bg-[#F7F8FC] border border-[var(--border-default)] rounded-xs space-y-2">
            <div className="w-8 h-8 rounded-xs bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-sm font-bold text-[var(--text-primary)]">Transparent Ledger</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Every checkout, maintenance flag, and incident is preserved in an immutable, auditable log.
            </p>
          </div>
        </div>
      </section>

      {/* ROLE-SPECIFIC WORKSPACE SECTION */}

      {/* 1. STUDENT / RESEARCHER DASHBOARD */}
      {role === 'researcher' && (
        <section className="bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border-default)] gap-2">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--brand-primary)] font-bold">
                Student & Researcher Workspace
              </span>
              <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
                Good morning, {user?.name}. What do you need for your next project?
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-semibold rounded-xs transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
            >
              Request Equipment Access <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Upcoming & Active Reservations */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-[var(--text-primary)]">
                  Your Equipment Reservations ({myBookings.length})
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigate('bookings')}
                  className="text-xs font-mono text-[var(--brand-primary)] hover:underline"
                >
                  View All Reservations & OTP &rarr;
                </button>
              </div>

              {myBookings.length === 0 ? (
                <div className="p-8 text-center bg-[#F7F8FC] border border-dashed border-[var(--border-strong)] rounded-xs">
                  <p className="text-xs text-[var(--text-secondary)]">You have no active or pending equipment reservations.</p>
                  <button
                    type="button"
                    onClick={() => onNavigate('catalog')}
                    className="mt-3 px-3.5 py-1.5 bg-[var(--brand-primary)] text-white text-xs font-semibold rounded-xs"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myBookings.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      className="p-4 bg-[#F7F8FC] border border-[var(--border-default)] rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[var(--brand-primary)] transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-sm font-bold text-[var(--text-primary)]">
                            {b.resourceName}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded-xs ${
                              b.status === 'approved'
                                ? 'bg-[var(--status-success-soft)] text-[var(--status-success)]'
                                : b.status === 'checked_out'
                                ? 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]'
                                : b.status === 'pending_approval'
                                ? 'bg-[var(--accent-yellow)]/40 text-[var(--text-primary)] border border-[var(--border-strong)]'
                                : 'bg-[var(--background-secondary)] text-[var(--text-secondary)]'
                            }`}
                          >
                            {b.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] font-sans">
                          {b.projectTitle} · Scheduled for {new Date(b.startTime).toLocaleDateString()} (
                          {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {b.otpCode && (b.status === 'approved' || b.status === 'checked_out') && (
                          <div className="px-3 py-1 bg-[var(--surface-primary)] border border-[var(--brand-primary)] text-[var(--brand-primary)] font-mono text-xs font-bold rounded-xs flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" />
                            OTP: {b.otpCode}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => onNavigate('bookings')}
                          className="px-3 py-1.5 bg-[var(--surface-primary)] border border-[var(--border-strong)] hover:border-[var(--brand-primary)] text-xs font-semibold rounded-xs text-[var(--text-primary)]"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right 4 Cols: Verified Skills & Prerequisites */}
            <div className="lg:col-span-4 bg-[#F7F8FC] p-5 border border-[var(--border-default)] rounded-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-strong)]">
                <h4 className="font-serif text-sm font-bold text-[var(--text-primary)]">
                  Your Certified Skills
                </h4>
                <span className="font-mono text-[10px] text-[var(--status-success)] bg-[var(--status-success-soft)] px-2 py-0.5 font-bold rounded-xs">
                  {user?.certifications.length} Badges
                </span>
              </div>

              <div className="space-y-2">
                {user?.certifications.map((cert, idx) => (
                  <div key={idx} className="flex items-center text-xs text-[var(--text-primary)] gap-2 p-1.5 bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-[var(--status-success)] shrink-0" />
                    <span className="truncate font-medium">{cert}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-xs text-[var(--text-secondary)] font-sans border-t border-[var(--border-strong)]">
                <p>
                  Need access to high-vacuum or cleanroom instruments? Ask your facility coordinator to register completion of safety protocols.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. RESOURCE OWNER / LAB MANAGER DASHBOARD */}
      {role === 'manager' && (
        <section className="bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border-default)] gap-2">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--brand-primary)] font-bold">
                Resource Owner & Manager Control Panel
              </span>
              <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
                Your resources, under control.
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('bookings')}
                className="px-3.5 py-2 bg-[var(--surface-primary)] border border-[var(--border-strong)] hover:border-[var(--brand-primary)] text-xs font-semibold rounded-xs text-[var(--text-primary)] transition-colors"
              >
                Approvals Docket ({pendingApprovals.length})
              </button>
              <button
                type="button"
                onClick={() => onNavigate('audit')}
                className="px-3.5 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-semibold rounded-xs transition-colors shadow-xs"
              >
                Export Usage Reports
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Urgent Review Queue: Pending Booking Requests */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <span>Pending Approval Queue</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[var(--accent-yellow)] text-[var(--text-primary)] rounded-xs">
                    {pendingApprovals.length} Awaiting Action
                  </span>
                </h3>
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="p-8 text-center bg-[#F7F8FC] border border-dashed border-[var(--border-strong)] rounded-xs">
                  <CheckCircle className="w-8 h-8 text-[var(--status-success)] mx-auto mb-2" />
                  <p className="text-xs font-medium text-[var(--text-primary)]">Review docket is clear!</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">No pending reservations require supervisor approval right now.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 bg-[#F7F8FC] border border-[var(--border-default)] rounded-xs space-y-3 hover:border-[var(--brand-primary)] transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif text-base font-bold text-[var(--text-primary)]">
                              {b.resourceName}
                            </span>
                            <span className="text-xs font-mono text-[var(--text-secondary)]">
                              ID: #{b.id.slice(0, 8)}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)]">
                            Requested by <strong className="text-[var(--text-primary)]">{b.userName}</strong> for: "{b.projectTitle}"
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                            Slot: {new Date(b.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} &rarr; {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQuickApprove(b.id)}
                            className="px-3 py-1.5 bg-[var(--status-success)] hover:bg-[#068048] text-white text-xs font-semibold rounded-xs flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickReject(b.id)}
                            className="px-3 py-1.5 bg-[var(--surface-primary)] border border-[var(--accent-coral)] hover:bg-[var(--accent-coral)]/10 text-[var(--accent-coral)] text-xs font-semibold rounded-xs flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>

                      <div className="bg-[var(--surface-primary)] p-2.5 border border-[var(--border-default)] rounded-xs text-[11px] text-[var(--text-secondary)]">
                        <strong className="text-[var(--text-primary)]">Experimental Purpose:</strong> {b.purpose}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Fleet Custody & Active Loans */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#F7F8FC] p-5 border border-[var(--border-default)] rounded-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-strong)]">
                  <h4 className="font-serif text-sm font-bold text-[var(--text-primary)]">
                    Active Instrument Loans
                  </h4>
                  <span className="font-mono text-[10px] text-[var(--brand-primary)] bg-[var(--brand-primary-soft)] px-2 py-0.5 font-bold rounded-xs">
                    {activeSessions.length} In Session
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {activeSessions.length === 0 ? (
                    <p className="text-[var(--text-secondary)]">No instruments currently checked out.</p>
                  ) : (
                    activeSessions.slice(0, 4).map((b) => (
                      <div key={b.id} className="p-2.5 bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[var(--text-primary)]">{b.resourceName}</span>
                          <span className="font-mono text-[10px] text-[var(--brand-primary)] uppercase">{b.status}</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)]">Operator: {b.userName}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-[var(--border-strong)]">
                  <button
                    type="button"
                    onClick={() => onNavigate('bookings')}
                    className="w-full py-2 bg-[var(--surface-primary)] border border-[var(--border-strong)] hover:border-[var(--brand-primary)] text-xs font-semibold text-[var(--text-primary)] rounded-xs text-center block"
                  >
                    Open Physical Check-In Terminal &rarr;
                  </button>
                </div>
              </div>

              {/* Maintenance & Safety Alert Widget */}
              <div className="bg-[#F7F8FC] p-5 border border-[var(--border-default)] rounded-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-strong)]">
                  <h4 className="font-serif text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
                    Facility Maintenance Status
                  </h4>
                  <span className="font-mono text-[10px] text-[var(--accent-coral)] font-bold">
                    {openIncidentsList.length} Open Flags
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {openIncidentsList.length > 0
                    ? `${openIncidentsList.length} incident tickets are actively locking down instruments or awaiting maintenance clearance.`
                    : 'All listed equipment units are calibrated and within safety compliance.'}
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('incidents')}
                  className="text-xs font-mono font-semibold text-[var(--brand-primary)] hover:underline"
                >
                  Inspect Incident Center &rarr;
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. PLATFORM ADMINISTRATOR DASHBOARD */}
      {role === 'admin' && (
        <section className="bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border-default)] gap-2">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--brand-primary)] font-bold">
                Network Overseer & Super-Admin Console
              </span>
              <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
                Platform overview.
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('audit')}
                className="px-3.5 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-semibold rounded-xs transition-colors shadow-xs"
              >
                Inspect Append-Only Audit Trail
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-[#F7F8FC] border border-[var(--border-default)] rounded-xs space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Registered Users</span>
              <p className="font-serif text-2xl font-bold text-[var(--text-primary)]">4 Verified</p>
              <p className="text-[11px] text-[var(--text-secondary)]">RBAC multi-tier active</p>
            </div>
            <div className="p-4 bg-[#F7F8FC] border border-[var(--border-default)] rounded-xs space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Core Facilities</span>
              <p className="font-serif text-2xl font-bold text-[var(--brand-primary)]">14 Labs</p>
              <p className="text-[11px] text-[var(--text-secondary)]">Participating institutions</p>
            </div>
            <div className="p-4 bg-[#F7F8FC] border border-[var(--border-default)] rounded-xs space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Listed Fleet</span>
              <p className="font-serif text-2xl font-bold text-[var(--text-primary)]">{stats?.totalResources ?? 8}</p>
              <p className="text-[11px] text-[var(--text-secondary)]">Zero uncalibrated items</p>
            </div>
            <div className="p-4 bg-[#F7F8FC] border border-[var(--border-default)] rounded-xs space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Total Reservations</span>
              <p className="font-serif text-2xl font-bold text-[var(--status-success)]">{bookings.length}</p>
              <p className="text-[11px] text-[var(--text-secondary)]">Collision engine locked</p>
            </div>
            <div className="p-4 bg-[#F7F8FC] border border-[var(--border-default)] rounded-xs space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Open Incidents</span>
              <p className={`font-serif text-2xl font-bold ${openIncidentsList.length > 0 ? 'text-[var(--accent-coral)]' : 'text-[var(--text-primary)]'}`}>
                {openIncidentsList.length}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">Lockouts in effect</p>
            </div>
          </div>

          {/* Recent Audit Ledger Snippet */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-[var(--text-primary)]">
                Recent High-Priority Audit Events
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('audit')}
                className="text-xs font-mono text-[var(--brand-primary)] hover:underline"
              >
                Full Audit Ledger &rarr;
              </button>
            </div>

            <div className="border border-[var(--border-default)] rounded-xs overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[var(--background-secondary)] text-[var(--text-primary)] font-mono text-[10px] uppercase border-b border-[var(--border-default)]">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Initiated By</th>
                    <th className="py-2.5 px-3">Target Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)] bg-[var(--surface-primary)]">
                  {recentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-[var(--text-secondary)]">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F7F8FC]">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--text-secondary)]">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-[var(--brand-primary)]">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-3 text-[var(--text-primary)]">
                          {log.actorEmail} ({log.actorRole})
                        </td>
                        <td className="py-2.5 px-3 text-[var(--text-secondary)] truncate max-w-xs">
                          {log.details ? JSON.stringify(log.details) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
