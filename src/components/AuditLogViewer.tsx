import React, { useState, useEffect } from 'react';
import { AuditLog, UserProfile, UserRole, Booking, Incident, Resource } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import {
  Shield,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  Clock,
  UserCheck,
  Edit,
  Terminal,
  FileSpreadsheet,
  FileText,
  Download,
  Printer,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  generateUsageCsv,
  generateIncidentsCsv,
  generateUsagePdfHtml,
  generateIncidentsPdfHtml,
  downloadFile,
  printHtmlDocument,
  calculateUsageHours,
} from '../utils/exportReports.js';

export const AuditLogViewer: React.FC = () => {
  const { user, role } = useAuth();

  // Primary data states
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);

  const [loading, setLoading] = useState(true);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Tabs: 'reports' is default for managers, 'reports' or 'audit' for admins
  const [activeTab, setActiveTab] = useState<'reports' | 'audit' | 'users'>(
    role === 'manager' ? 'reports' : 'reports'
  );

  // Reports sub-tab: 'usage' | 'incidents'
  const [reportSubTab, setReportSubTab] = useState<'usage' | 'incidents'>('usage');

  // Filters for Equipment Usage Report
  const [usageDateRange, setUsageDateRange] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [usageResourceFilter, setUsageResourceFilter] = useState('ALL');
  const [usageStatusFilter, setUsageStatusFilter] = useState('ALL');

  // Filters for Incident Report
  const [incidentSeverityFilter, setIncidentSeverityFilter] = useState('ALL');
  const [incidentStatusFilter, setIncidentStatusFilter] = useState('ALL');
  const [incidentResourceFilter, setIncidentResourceFilter] = useState('ALL');

  // Audit tab filters
  const [filterAction, setFilterAction] = useState('ALL');

  // User role modification modal (Admin only)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('researcher');
  const [certInput, setCertInput] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      // Both manager and admin can load bookings, incidents, and resources
      const [bookingsRes, incidentsRes, resourcesRes] = await Promise.all([
        api.getBookings().catch(() => ({ bookings: [] })),
        api.getIncidents().catch(() => ({ incidents: [] })),
        api.getResources().catch(() => ({ resources: [] })),
      ]);

      setBookings(bookingsRes.bookings);
      setIncidents(incidentsRes.incidents);
      setResources(resourcesRes.resources);

      // Admin additionally loads audit logs and user registry
      if (role === 'admin') {
        const [logsRes, usersRes] = await Promise.all([
          api.getAuditLogs().catch(() => ({ auditLogs: [] })),
          api.getUsers().catch(() => ({ users: [] })),
        ]);
        setLogs(logsRes.auditLogs);
        setUsersList(usersRes.users);
      }
    } catch (err: any) {
      console.error('Failed to load reporting or audit data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  // If role is researcher: enforce strict 403 Access Restriction (Task 13 Verification)
  if (role !== 'admin' && role !== 'manager') {
    return (
      <div className="border border-[var(--border-default)] bg-[#F7F8FC] p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4 my-10 shadow-sm">
        <div className="w-12 h-12 bg-[var(--surface-primary)] border border-[var(--border-default)] text-[#A64B3B] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6 stroke-[1.75]" />
        </div>
        <h2 className="font-serif text-2xl font-normal text-[var(--text-primary)]">Access Restricted (HTTP 403 Forbidden)</h2>
        <p className="text-xs text-[var(--text-primary)]/80 font-sans leading-relaxed">
          The Facility Audit, Reporting, and Compliance Console is restricted to Lab Managers and System Administrators. Ordinary researchers cannot inspect facility audit logs or export institutional usage records.
        </p>
        <div className="pt-2">
          <p className="text-[11px] font-mono text-[var(--text-primary)] bg-[var(--surface-primary)] p-3 border border-[var(--border-default)]">
            Current Session Role: <strong className="uppercase text-[var(--text-primary)]">{role}</strong>
            <br />
            Required Clearance: <strong className="uppercase text-[var(--brand-primary)]">manager or admin</strong>
          </p>
        </div>
        <div className="text-[11px] font-mono text-[var(--brand-primary)]">
          Tip: You can switch to Lab Manager or Administrator role using the top auditor switcher bar.
        </div>
      </div>
    );
  }

  // --- Filtering Equipment Usage ---
  const filteredBookings = bookings.filter((b) => {
    if (usageResourceFilter !== 'ALL' && b.resourceId !== usageResourceFilter) {
      return false;
    }
    if (usageStatusFilter !== 'ALL' && b.status !== usageStatusFilter) {
      return false;
    }
    if (usageDateRange !== 'all') {
      const now = Date.now();
      const bTime = new Date(b.startTime).getTime();
      const days = usageDateRange === '7d' ? 7 : usageDateRange === '30d' ? 30 : 90;
      if (now - bTime > days * 24 * 60 * 60 * 1000) {
        return false;
      }
    }
    return true;
  });

  // Calculate usage stats
  const totalUsageHours = filteredBookings.reduce(
    (sum, b) => sum + calculateUsageHours(b.startTime, b.endTime),
    0
  );
  const resourceMap = new Map<string, Resource>();
  resources.forEach((r) => resourceMap.set(r.id, r));

  const totalUsageCost = filteredBookings.reduce((sum, b) => {
    const res = resourceMap.get(b.resourceId);
    const rate = res?.hourlyRate ?? 50;
    return sum + calculateUsageHours(b.startTime, b.endTime) * rate;
  }, 0);

  const completedReturnsCount = filteredBookings.filter(
    (b) => b.status === 'returned' || b.status === 'checked_out'
  ).length;

  // --- Filtering Incidents ---
  const filteredIncidents = incidents.filter((inc) => {
    if (incidentSeverityFilter !== 'ALL' && inc.severity !== incidentSeverityFilter) {
      return false;
    }
    if (incidentStatusFilter !== 'ALL' && inc.status !== incidentStatusFilter) {
      return false;
    }
    if (incidentResourceFilter !== 'ALL' && inc.resourceId !== incidentResourceFilter) {
      return false;
    }
    return true;
  });

  const criticalIncidentsCount = filteredIncidents.filter(
    (i) => i.severity === 'critical' || i.severity === 'high'
  ).length;
  const openIncidentsCount = filteredIncidents.filter((i) => i.status !== 'resolved').length;
  const resolvedIncidentsCount = filteredIncidents.filter((i) => i.status === 'resolved').length;

  // Audit Logs Filter
  const filteredLogs = logs.filter((log) => {
    if (filterAction === 'ALL') return true;
    return log.action === filterAction;
  });

  // --- Export Handlers ---
  const triggerUsageCsvExport = async () => {
    const csvData = generateUsageCsv(filteredBookings, resources);
    const filename = `equipment-usage-report-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadFile(csvData, filename, 'text/csv;charset=utf-8;');

    setExportFeedback(`Exported ${filteredBookings.length} equipment usage records as CSV.`);
    setTimeout(() => setExportFeedback(null), 4000);

    // Record immutable audit event
    await api.logReportExport({
      reportType: 'equipment_usage',
      format: 'csv',
      recordCount: filteredBookings.length,
      filterSummary: `Range: ${usageDateRange}, Resource: ${usageResourceFilter}, Status: ${usageStatusFilter}`,
    }).catch(console.error);
  };

  const triggerUsagePdfExport = async () => {
    const html = generateUsagePdfHtml(filteredBookings, resources, {
      generatedBy: user?.name || 'Lab Manager',
      role,
      filterDate: usageDateRange,
    });
    printHtmlDocument(html, 'LabShare - Equipment Usage Report');

    setExportFeedback(`Generated printable PDF document for ${filteredBookings.length} usage records.`);
    setTimeout(() => setExportFeedback(null), 4000);

    await api.logReportExport({
      reportType: 'equipment_usage',
      format: 'pdf',
      recordCount: filteredBookings.length,
      filterSummary: `Range: ${usageDateRange}, Resource: ${usageResourceFilter}`,
    }).catch(console.error);
  };

  const triggerIncidentsCsvExport = async () => {
    const csvData = generateIncidentsCsv(filteredIncidents, resources);
    const filename = `facility-incidents-report-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadFile(csvData, filename, 'text/csv;charset=utf-8;');

    setExportFeedback(`Exported ${filteredIncidents.length} incident records as CSV.`);
    setTimeout(() => setExportFeedback(null), 4000);

    await api.logReportExport({
      reportType: 'incidents',
      format: 'csv',
      recordCount: filteredIncidents.length,
      filterSummary: `Severity: ${incidentSeverityFilter}, Status: ${incidentStatusFilter}`,
    }).catch(console.error);
  };

  const triggerIncidentsPdfExport = async () => {
    const html = generateIncidentsPdfHtml(filteredIncidents, resources, {
      generatedBy: user?.name || 'Lab Manager',
      role,
    });
    printHtmlDocument(html, 'LabShare - Incident & Maintenance Report');

    setExportFeedback(`Generated printable PDF document for ${filteredIncidents.length} incident records.`);
    setTimeout(() => setExportFeedback(null), 4000);

    await api.logReportExport({
      reportType: 'incidents',
      format: 'pdf',
      recordCount: filteredIncidents.length,
      filterSummary: `Severity: ${incidentSeverityFilter}, Status: ${incidentStatusFilter}`,
    }).catch(console.error);
  };

  const handleUpdateUserRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const certifications = certInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await api.updateUserRole(selectedUser.id, {
        role: newRole,
        certifications,
      });

      setSelectedUser(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  return (
    <div className="space-y-8">
      {/* Masthead Header */}
      <div className="border border-[var(--border-default)] bg-[#F7F8FC] p-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-widest text-[var(--brand-primary)] mb-1">
            <span>Facility Compliance</span>
            <span>/</span>
            <span>Ledger & Exports</span>
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-serif font-normal text-[var(--text-primary)] tracking-tight">
              Audit Logs & Operational Reports
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-[var(--brand-primary)] text-white">
              {role === 'admin' ? 'Admin Full Access' : 'Lab Manager Clearance'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-primary)]/70 font-sans mt-1">
            Export verified equipment utilization and incident resolution logs in standardized CSV or PDF format for institutional review.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border border-[var(--border-default)] bg-[var(--surface-primary)] p-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-[var(--brand-primary)] text-white font-semibold'
                : 'text-[var(--text-primary)] hover:bg-[#F7F8FC]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Reports & Exports</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-[var(--brand-primary)] text-white font-semibold'
                : 'text-[var(--text-primary)] hover:bg-[#F7F8FC]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Audit Trail {role === 'admin' ? `(${logs.length})` : '(Admin)'}</span>
          </button>

          {role === 'admin' && (
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'users'
                  ? 'bg-[var(--brand-primary)] text-white font-semibold'
                  : 'text-[var(--text-primary)] hover:bg-[#F7F8FC]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>User Roles ({usersList.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Export Notification Toast */}
      {exportFeedback && (
        <div className="border border-[#4A4A4A] bg-[var(--surface-primary)] p-3 text-xs font-mono text-[var(--text-primary)] flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-[var(--brand-primary)]" />
            <span>{exportFeedback}</span>
          </div>
          <span className="text-[10px] text-[var(--brand-primary)] uppercase">Ledger Updated</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. REPORTS & EXPORTS TAB (Manager & Admin)               */}
      {/* ======================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Sub-navigation between Usage and Incidents */}
          <div className="flex border-b border-[var(--border-default)] pb-2 items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setReportSubTab('usage')}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition cursor-pointer border ${
                  reportSubTab === 'usage'
                    ? 'bg-[var(--brand-primary)] text-white border-[#4A4A4A] font-bold'
                    : 'bg-[var(--surface-primary)] text-[var(--text-primary)] border-[var(--border-default)] hover:border-[#4A4A4A]'
                }`}
              >
                1. Equipment Usage & Utilization Ledger
              </button>
              <button
                type="button"
                onClick={() => setReportSubTab('incidents')}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition cursor-pointer border ${
                  reportSubTab === 'incidents'
                    ? 'bg-[var(--brand-primary)] text-white border-[#4A4A4A] font-bold'
                    : 'bg-[var(--surface-primary)] text-[var(--text-primary)] border-[var(--border-default)] hover:border-[#4A4A4A]'
                }`}
              >
                2. Incident & Corrective Maintenance Ledger
              </button>
            </div>

            <button
              type="button"
              onClick={loadData}
              className="px-2.5 py-1.5 text-xs font-mono border border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--text-primary)] hover:border-[#4A4A4A] flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Records</span>
            </button>
          </div>

          {/* 1.A. EQUIPMENT USAGE REPORT SECTION */}
          {reportSubTab === 'usage' && (
            <div className="space-y-6">
              {/* Metric Overview Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border border-[var(--border-default)] bg-[#F7F8FC] p-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--brand-primary)]">
                    Filtered Booking Runs
                  </div>
                  <div className="text-2xl font-serif font-normal text-[var(--text-primary)] mt-1">
                    {filteredBookings.length}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-primary)]/60 mt-0.5">
                    Total in system: {bookings.length}
                  </div>
                </div>

                <div className="border border-[var(--border-default)] bg-[#F7F8FC] p-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--brand-primary)]">
                    Total Instrument Hours
                  </div>
                  <div className="text-2xl font-serif font-normal text-[var(--text-primary)] mt-1">
                    {totalUsageHours.toFixed(1)} <span className="text-xs font-sans font-normal">hrs</span>
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-primary)]/60 mt-0.5">
                    Across filtered timeframe
                  </div>
                </div>

                <div className="border border-[var(--border-default)] bg-[#F7F8FC] p-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--brand-primary)]">
                    Calculated Billing
                  </div>
                  <div className="text-2xl font-serif font-normal text-[var(--text-primary)] mt-1">
                    ${totalUsageCost.toFixed(2)}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-primary)]/60 mt-0.5">
                    Core recharge rate total
                  </div>
                </div>

                <div className="border border-[var(--border-default)] bg-[#F7F8FC] p-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--brand-primary)]">
                    Completed & Returned
                  </div>
                  <div className="text-2xl font-serif font-normal text-[var(--text-primary)] mt-1">
                    {completedReturnsCount}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-primary)]/60 mt-0.5">
                    With verified condition reports
                  </div>
                </div>
              </div>

              {/* Filters & Export Actions Bar */}
              <div className="border border-[var(--border-default)] bg-[#F7F8FC] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[var(--brand-primary)]">Date Range:</span>
                    <select
                      value={usageDateRange}
                      onChange={(e) => setUsageDateRange(e.target.value as any)}
                      className="border border-[var(--border-default)] bg-[var(--surface-primary)] px-2.5 py-1 text-xs text-[var(--text-primary)]"
                    >
                      <option value="all">All Time History</option>
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                      <option value="90d">Last 90 Days</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-[var(--brand-primary)]">Equipment:</span>
                    <select
                      value={usageResourceFilter}
                      onChange={(e) => setUsageResourceFilter(e.target.value)}
                      className="border border-[var(--border-default)] bg-[var(--surface-primary)] px-2.5 py-1 text-xs text-[var(--text-primary)] max-w-[200px] truncate"
                    >
                      <option value="ALL">All Instruments</option>
                      {resources.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-[var(--brand-primary)]">Status:</span>
                    <select
                      value={usageStatusFilter}
                      onChange={(e) => setUsageStatusFilter(e.target.value)}
                      className="border border-[var(--border-default)] bg-[var(--surface-primary)] px-2.5 py-1 text-xs text-[var(--text-primary)]"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="returned">Returned / Finished</option>
                      <option value="checked_out">In Use (Checked Out)</option>
                      <option value="approved">Approved</option>
                      <option value="pending_approval">Pending Approval</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Primary Export Buttons */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={triggerUsageCsvExport}
                    disabled={filteredBookings.length === 0}
                    className="px-3.5 py-2 border border-[#4A4A4A] bg-[var(--brand-primary)] text-white hover:bg-[#383838] transition text-xs font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export Usage CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={triggerUsagePdfExport}
                    disabled={filteredBookings.length === 0}
                    className="px-3.5 py-2 border border-[#6D8196] bg-[var(--surface-primary)] text-[var(--text-primary)] hover:bg-[#6D8196] hover:text-white transition text-xs font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Export Usage PDF</span>
                  </button>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="border border-[var(--border-default)] bg-[#F7F8FC]">
                <div className="p-3 bg-[var(--surface-primary)] border-b border-[var(--border-default)] flex justify-between items-center">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--brand-primary)] font-semibold">
                    Live Data Preview ({filteredBookings.length} records ready for export)
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-primary)]/60">
                    Includes billing calculations & return condition reports
                  </span>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin h-6 w-6 border-2 border-[#4A4A4A] border-t-transparent" />
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <p className="text-xs font-mono text-[var(--text-primary)]/60 py-8 text-center">
                    No usage records found matching the active filter criteria.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[var(--surface-primary)] text-[var(--brand-primary)] font-mono uppercase tracking-wider text-[10px] border-b border-[var(--border-default)]">
                        <tr>
                          <th className="px-4 py-3">Booking ID</th>
                          <th className="px-4 py-3">Equipment</th>
                          <th className="px-4 py-3">Investigator</th>
                          <th className="px-4 py-3">Period & Duration</th>
                          <th className="px-4 py-3 text-right">Est. Cost</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Return Condition</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#CBCBCB] font-mono text-[11px]">
                        {filteredBookings.map((b) => {
                          const res = resourceMap.get(b.resourceId);
                          const hours = calculateUsageHours(b.startTime, b.endTime);
                          const rate = res?.hourlyRate ?? 50;
                          const cost = hours * rate;

                          return (
                            <tr key={b.id} className="hover:bg-[var(--surface-primary)]">
                              <td className="px-4 py-2.5 font-bold text-[var(--text-primary)] whitespace-nowrap">
                                {b.id}
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="font-sans font-medium text-[var(--text-primary)]">{b.resourceName}</div>
                                <div className="text-[10px] text-[var(--brand-primary)]">
                                  {res?.building || 'Core Facilities'} Rm {res?.room || 'Main'}
                                </div>
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="text-[var(--text-primary)]">{b.userName}</div>
                                <div className="text-[10px] text-[var(--brand-primary)]">{b.userDepartment || 'Research'}</div>
                              </td>
                              <td className="px-4 py-2.5 whitespace-nowrap text-[var(--text-primary)]">
                                <div>{new Date(b.startTime).toLocaleDateString()}</div>
                                <div className="text-[10px] text-[var(--brand-primary)]">
                                  {hours.toFixed(1)} hrs (${rate}/hr)
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold text-[var(--text-primary)]">
                                ${cost.toFixed(2)}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="px-2 py-0.5 border border-[#4A4A4A] text-[10px] uppercase bg-[var(--surface-primary)] text-[var(--text-primary)]">
                                  {b.status}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-[10px]">
                                {b.returnCondition ? (
                                  <span className="text-[var(--brand-primary)]">
                                    {b.returnCondition.physicalCondition} ({b.returnCondition.cleanliness})
                                  </span>
                                ) : (
                                  <span className="text-[var(--text-primary)]/40">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 1.B. INCIDENT REPORTS SECTION */}
          {reportSubTab === 'incidents' && (
            <div className="space-y-6">
              {/* Incidents KPI Tiles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border border-[var(--border-default)] bg-[#F7F8FC] p-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--brand-primary)]">
                    Total Logged Incidents
                  </div>
                  <div className="text-2xl font-serif font-normal text-[var(--text-primary)] mt-1">
                    {filteredIncidents.length}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-primary)]/60 mt-0.5">
                    In current filter
                  </div>
                </div>

                <div className="border border-[var(--border-default)] bg-[#F7F8FC] p-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#A64B3B]">
                    High & Critical Severity
                  </div>
                  <div className="text-2xl font-serif font-normal text-[#A64B3B] mt-1">
                    {criticalIncidentsCount}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-primary)]/60 mt-0.5">
                    Triggered safety lockout
                  </div>
                </div>

                <div className="border border-[var(--border-default)] bg-[#F7F8FC] p-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-primary)]">
                    Open / Under Investigation
                  </div>
                  <div className="text-2xl font-serif font-normal text-[var(--text-primary)] mt-1">
                    {openIncidentsCount}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-primary)]/60 mt-0.5">
                    Awaiting resolution
                  </div>
                </div>

                <div className="border border-[var(--border-default)] bg-[#F7F8FC] p-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--brand-primary)]">
                    Resolved & Operational
                  </div>
                  <div className="text-2xl font-serif font-normal text-[var(--brand-primary)] mt-1">
                    {resolvedIncidentsCount}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-primary)]/60 mt-0.5">
                    Returned to service
                  </div>
                </div>
              </div>

              {/* Filters & Export Actions Bar */}
              <div className="border border-[var(--border-default)] bg-[#F7F8FC] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[var(--brand-primary)]">Severity:</span>
                    <select
                      value={incidentSeverityFilter}
                      onChange={(e) => setIncidentSeverityFilter(e.target.value)}
                      className="border border-[var(--border-default)] bg-[var(--surface-primary)] px-2.5 py-1 text-xs text-[var(--text-primary)]"
                    >
                      <option value="ALL">All Severities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-[var(--brand-primary)]">Status:</span>
                    <select
                      value={incidentStatusFilter}
                      onChange={(e) => setIncidentStatusFilter(e.target.value)}
                      className="border border-[var(--border-default)] bg-[var(--surface-primary)] px-2.5 py-1 text-xs text-[var(--text-primary)]"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="open">Open</option>
                      <option value="under_investigation">Under Investigation</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-[var(--brand-primary)]">Equipment:</span>
                    <select
                      value={incidentResourceFilter}
                      onChange={(e) => setIncidentResourceFilter(e.target.value)}
                      className="border border-[var(--border-default)] bg-[var(--surface-primary)] px-2.5 py-1 text-xs text-[var(--text-primary)] max-w-[200px] truncate"
                    >
                      <option value="ALL">All Equipment</option>
                      {resources.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={triggerIncidentsCsvExport}
                    disabled={filteredIncidents.length === 0}
                    className="px-3.5 py-2 border border-[#4A4A4A] bg-[var(--brand-primary)] text-white hover:bg-[#383838] transition text-xs font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export Incidents CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={triggerIncidentsPdfExport}
                    disabled={filteredIncidents.length === 0}
                    className="px-3.5 py-2 border border-[#6D8196] bg-[var(--surface-primary)] text-[var(--text-primary)] hover:bg-[#6D8196] hover:text-white transition text-xs font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Export Incidents PDF</span>
                  </button>
                </div>
              </div>

              {/* Incidents Data Preview Table */}
              <div className="border border-[var(--border-default)] bg-[#F7F8FC]">
                <div className="p-3 bg-[var(--surface-primary)] border-b border-[var(--border-default)] flex justify-between items-center">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--brand-primary)] font-semibold">
                    Incident Audit Preview ({filteredIncidents.length} records ready for export)
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-primary)]/60">
                    Includes failure descriptions & recorded resolution notes
                  </span>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin h-6 w-6 border-2 border-[#4A4A4A] border-t-transparent" />
                  </div>
                ) : filteredIncidents.length === 0 ? (
                  <p className="text-xs font-mono text-[var(--text-primary)]/60 py-8 text-center">
                    No incident records match the selected filter criteria.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[var(--surface-primary)] text-[var(--brand-primary)] font-mono uppercase tracking-wider text-[10px] border-b border-[var(--border-default)]">
                        <tr>
                          <th className="px-4 py-3">Incident ID</th>
                          <th className="px-4 py-3">Equipment</th>
                          <th className="px-4 py-3">Title & Narrative</th>
                          <th className="px-4 py-3">Severity</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Reported By & Date</th>
                          <th className="px-4 py-3">Resolution Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#CBCBCB] font-mono text-[11px]">
                        {filteredIncidents.map((inc) => (
                          <tr key={inc.id} className="hover:bg-[var(--surface-primary)]">
                            <td className="px-4 py-2.5 font-bold text-[var(--text-primary)] whitespace-nowrap">
                              {inc.id}
                            </td>
                            <td className="px-4 py-2.5 font-sans font-medium text-[var(--text-primary)]">
                              {inc.resourceName}
                            </td>
                            <td className="px-4 py-2.5 max-w-sm">
                              <div className="font-semibold text-[var(--text-primary)]">{inc.title}</div>
                              <div className="text-[10px] text-[var(--text-primary)]/70 line-clamp-2 mt-0.5">
                                {inc.description}
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`px-2 py-0.5 border text-[10px] uppercase font-mono ${
                                  inc.severity === 'critical' || inc.severity === 'high'
                                    ? 'bg-[var(--surface-primary)] text-[#A64B3B] border-[#A64B3B]'
                                    : 'bg-[var(--surface-primary)] text-[var(--text-primary)] border-[var(--border-default)]'
                                }`}
                              >
                                {inc.severity}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`px-2 py-0.5 border text-[10px] uppercase font-mono ${
                                  inc.status === 'resolved'
                                    ? 'bg-[var(--surface-primary)] text-[var(--brand-primary)] border-[#6D8196]'
                                    : 'bg-[var(--surface-primary)] text-[var(--text-primary)] border-[#4A4A4A]'
                                }`}
                              >
                                {inc.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-[var(--text-primary)]">
                              <div>{new Date(inc.createdAt).toLocaleDateString()}</div>
                              <div className="text-[10px] text-[var(--brand-primary)]">by {inc.reportedByName}</div>
                            </td>
                            <td className="px-4 py-2.5 text-[10px] max-w-xs truncate text-[var(--text-primary)]/80">
                              {inc.resolutionNotes || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. AUDIT TRAIL TAB (Admin view; Manager advisory)        */}
      {/* ======================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {role !== 'admin' ? (
            <div className="border border-[var(--border-default)] bg-[#F7F8FC] p-8 text-center space-y-3">
              <div className="w-10 h-10 bg-[var(--surface-primary)] border border-[var(--border-default)] text-[var(--brand-primary)] flex items-center justify-center mx-auto">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-[var(--text-primary)]">Raw Security Ledger Reserved for System Administrators</h3>
              <p className="text-xs text-[var(--text-primary)]/80 max-w-lg mx-auto leading-relaxed">
                As a Lab Manager, you can export all Equipment Usage and Incident Reports from the <strong>Reports & Exports</strong> tab. Direct mutation audits, authentication events, and role change ledgers require full Administrator clearance.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('reports')}
                  className="px-4 py-1.5 bg-[var(--brand-primary)] text-white font-mono text-xs hover:bg-[#383838]"
                >
                  Return to Reports & Exports
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-[var(--border-default)] bg-[#F7F8FC] p-6 space-y-4">
              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-default)]">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-[var(--brand-primary)]" />
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Append-Only Event Ledger
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="text-[var(--brand-primary)]">Filter Action:</span>
                  <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="border border-[var(--border-default)] bg-[var(--surface-primary)] px-2.5 py-1 text-xs text-[var(--text-primary)]"
                  >
                    <option value="ALL">All Actions</option>
                    <option value="USER_LOGIN">USER_LOGIN</option>
                    <option value="BOOKING_REQUESTED">BOOKING_REQUESTED</option>
                    <option value="BOOKING_APPROVED">BOOKING_APPROVED</option>
                    <option value="OTP_VERIFIED_CHECK_IN">OTP_VERIFIED_CHECK_IN</option>
                    <option value="EQUIPMENT_RETURNED">EQUIPMENT_RETURNED</option>
                    <option value="INCIDENT_REPORTED">INCIDENT_REPORTED</option>
                    <option value="REPORT_EXPORTED">REPORT_EXPORTED</option>
                    <option value="USER_ROLE_UPDATED">USER_ROLE_UPDATED</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin h-6 w-6 border-2 border-[#4A4A4A] border-t-transparent" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <p className="text-xs font-mono text-[var(--text-primary)]/60 py-6 text-center">
                  No logs match the chosen filter.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[var(--surface-primary)] text-[var(--brand-primary)] font-mono uppercase tracking-wider text-[10px] border-b border-[var(--border-default)]">
                      <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Action Event</th>
                        <th className="px-4 py-3">Actor Identity</th>
                        <th className="px-4 py-3">Target Reference</th>
                        <th className="px-4 py-3">Payload Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#CBCBCB] font-mono text-[11px]">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[var(--surface-primary)]">
                          <td className="px-4 py-2.5 text-[var(--text-primary)]/80 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 font-bold">
                            <span
                              className={`px-2 py-0.5 border text-[10px] ${
                                log.action.includes('OTP')
                                  ? 'bg-[var(--surface-primary)] text-[var(--text-primary)] border-[#4A4A4A]'
                                  : log.action.includes('APPROVED')
                                  ? 'bg-[var(--surface-primary)] text-[var(--brand-primary)] border-[#6D8196]'
                                  : log.action.includes('INCIDENT')
                                  ? 'bg-[var(--surface-primary)] text-[#A64B3B] border-[#A64B3B]'
                                  : log.action.includes('EXPORT')
                                  ? 'bg-[var(--surface-primary)] text-[var(--brand-primary)] border-[#6D8196]'
                                  : 'bg-[var(--surface-primary)] text-[var(--text-primary)] border-[var(--border-default)]'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[var(--text-primary)] whitespace-nowrap">
                            {log.actorEmail} ({log.actorRole})
                          </td>
                          <td className="px-4 py-2.5 text-[var(--brand-primary)]">
                            {log.targetType}:{log.targetId}
                          </td>
                          <td className="px-4 py-2.5 text-[var(--text-primary)]/80 max-w-xs truncate">
                            {JSON.stringify(log.details)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. USER ROLES & CERTIFICATIONS TAB (Admin Only)          */}
      {/* ======================================================== */}
      {activeTab === 'users' && role === 'admin' && (
        <div className="border border-[var(--border-default)] bg-[#F7F8FC] p-6 space-y-4">
          <div className="pb-3 border-b border-[var(--border-default)]">
            <h3 className="font-mono text-xs uppercase font-bold tracking-wider text-[var(--text-primary)]">
              Authorized Facility Users & Access Credentials
            </h3>
            <p className="text-xs text-[var(--text-primary)]/70 font-sans mt-0.5">
              Inspect and elevate user roles or append verified laboratory certifications.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--surface-primary)] text-[var(--brand-primary)] font-mono uppercase tracking-wider text-[10px] border-b border-[var(--border-default)]">
                <tr>
                  <th className="px-4 py-3">Investigator</th>
                  <th className="px-4 py-3">Email & Department</th>
                  <th className="px-4 py-3">Access Tier</th>
                  <th className="px-4 py-3">Safety Certifications</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CBCBCB]">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--surface-primary)]">
                    <td className="px-4 py-3 font-serif text-sm font-medium text-[var(--text-primary)]">{u.name}</td>
                    <td className="px-4 py-3 text-[var(--text-primary)]/80">
                      <div>{u.email}</div>
                      <div className="text-[11px] font-mono text-[var(--brand-primary)]">{u.department}</div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className="text-[10px] font-bold px-2 py-0.5 border border-[#4A4A4A] uppercase text-[var(--text-primary)]">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {u.certifications.map((c, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-1.5 py-0.5 bg-[var(--surface-primary)] border border-[var(--border-default)] text-[var(--text-primary)]"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(u);
                          setNewRole(u.role);
                          setCertInput(u.certifications.join(', '));
                        }}
                        className="text-[var(--brand-primary)] font-mono text-xs font-semibold hover:underline inline-flex items-center cursor-pointer"
                      >
                        <Edit className="w-3 h-3 mr-1" /> Edit Role & Certs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-[var(--brand-primary)]/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[var(--surface-primary)] border border-[var(--border-default)] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif text-xl font-normal text-[var(--text-primary)]">
              Update Role & Credentials for {selectedUser.name}
            </h3>

            <form onSubmit={handleUpdateUserRole} className="space-y-3 text-xs font-sans">
              <div>
                <label className="block font-mono text-[10px] uppercase text-[var(--brand-primary)] mb-1">
                  Assigned Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-[var(--border-default)] bg-[#F7F8FC] text-[var(--text-primary)]"
                >
                  <option value="researcher">Researcher / Student</option>
                  <option value="manager">Lab Manager</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[var(--brand-primary)] mb-1">
                  Active Certifications (comma separated)
                </label>
                <textarea
                  rows={3}
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-default)] bg-[#F7F8FC] text-[var(--text-primary)]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-3 py-1.5 text-xs font-mono text-[var(--text-primary)] hover:bg-[#F7F8FC] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[var(--brand-primary)] hover:bg-[#383838] text-white font-mono font-semibold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
