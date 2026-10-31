import React, { useState, useEffect } from 'react';
import { Incident, Resource } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import {
  AlertTriangle,
  Plus,
  CheckCircle,
  Clock,
  ShieldAlert,
  FileText,
  Wrench,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';

export const IncidentCenter: React.FC = () => {
  const { user, role } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [resolvingIncident, setResolvingIncident] = useState<Incident | null>(null);

  // Form states
  const [resourceId, setResourceId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Resolution form states
  const [resolutionNotes, setResolutionNotes] = useState('Inspected, replaced damaged seal, re-calibrated successfully.');
  const [restoreResource, setRestoreResource] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [incRes, resRes] = await Promise.all([api.getIncidents(), api.getResources()]);
      setIncidents(incRes.incidents);
      setResources(resRes.resources);
      if (resRes.resources.length > 0 && !resourceId) {
        setResourceId(resRes.resources[0].id);
      }
    } catch (err) {
      console.error('Failed to load incidents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      await api.reportIncident({
        resourceId,
        title,
        description,
        severity,
      });

      setShowReportModal(false);
      setTitle('');
      setDescription('');
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to file incident report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingIncident) return;

    try {
      await api.resolveIncident(resolvingIncident.id, {
        resolutionNotes,
        restoreResource,
      });

      setResolvingIncident(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve incident');
    }
  };

  const renderSeverityTag = (s: Incident['severity']) => {
    switch (s) {
      case 'critical':
        return (
          <span className="inline-flex items-center text-[10px] font-mono uppercase font-bold text-[var(--accent-coral)] bg-[var(--accent-coral)]/15 border border-[var(--accent-coral)]/30 px-2 py-0.5 rounded-xs">
            <span className="w-1.5 h-1.5 bg-[var(--accent-coral)] rounded-full mr-1.5 inline-block" />
            Critical · Safety Lockout
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center text-[10px] font-mono uppercase font-semibold text-[var(--accent-coral)] bg-[var(--accent-coral)]/10 border border-[var(--border-strong)] px-2 py-0.5 rounded-xs">
            High Severity
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center text-[10px] font-mono uppercase font-semibold text-[var(--text-primary)] bg-[var(--accent-yellow)]/40 border border-[var(--border-strong)] px-2 py-0.5 rounded-xs">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center text-[10px] font-mono uppercase font-semibold text-[var(--text-secondary)] bg-[var(--background-secondary)] border border-[var(--border-strong)] px-2 py-0.5 rounded-xs">
            Low / Advisory
          </span>
        );
    }
  };

  const renderStatusTag = (st: Incident['status']) => {
    switch (st) {
      case 'open':
        return (
          <span className="inline-flex items-center text-[11px] font-mono uppercase text-[var(--accent-coral)] font-semibold bg-[var(--accent-coral)]/15 px-2 py-0.5 rounded-xs">
            <Clock className="w-3 h-3 mr-1" /> Open
          </span>
        );
      case 'under_investigation':
        return (
          <span className="inline-flex items-center text-[11px] font-mono uppercase text-[var(--brand-primary)] font-semibold bg-[var(--brand-primary-soft)] px-2 py-0.5 rounded-xs">
            <Wrench className="w-3 h-3 mr-1" /> Investigating
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center text-[11px] font-mono uppercase text-[var(--status-success)] font-semibold bg-[var(--status-success-soft)] px-2 py-0.5 rounded-xs">
            <Check className="w-3 h-3 mr-1" /> Resolved
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Docket */}
      <div className="bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-4 shadow-[0_1px_3px_rgba(40,51,71,0.04)]">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-wider text-[var(--brand-primary)] font-bold mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Safety Protocol Ledger</span>
            <span className="text-[var(--border-strong)]">/</span>
            <span>Anomaly Reporting</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--text-primary)] tracking-tight">
            Incident & Safety Protocol Center
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-sans mt-1 max-w-xl">
            Report instrument malfunctions, rotor imbalances, laser sensor faults, or reagent spills. High severity automatically triggers equipment maintenance shutdown.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          className="inline-flex items-center px-4 py-2.5 bg-[var(--accent-coral)] hover:bg-[#e05b53] text-white text-xs font-semibold rounded-xs shadow-xs transition-colors cursor-pointer self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Report Safety Incident
        </button>
      </div>

      {/* Incidents List */}
      {loading ? (
        <div className="text-center py-16 bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm">
          <div className="inline-block animate-spin h-6 w-6 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full" />
          <p className="mt-3 text-xs font-mono text-[var(--text-secondary)]">Querying safety logbook records...</p>
        </div>
      ) : incidents.length === 0 ? (
        <div className="text-center py-16 bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm space-y-2">
          <CheckCircle className="w-8 h-8 text-[var(--status-success)] mx-auto" />
          <h3 className="font-serif text-base font-bold text-[var(--text-primary)]">Zero active safety incidents recorded</h3>
          <p className="text-xs text-[var(--text-secondary)] font-sans">
            All registered laboratory instruments are operational and within calibrated tolerances.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm p-6 space-y-4 shadow-[0_1px_3px_rgba(40,51,71,0.03)]"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-[var(--border-default)]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif text-xl font-bold text-[var(--text-primary)]">{inc.title}</h3>
                    {renderSeverityTag(inc.severity)}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-sans mt-1">
                    Target Instrument: <strong className="text-[var(--text-primary)]">{inc.resourceName}</strong> · Reported by {inc.reportedByName} on{' '}
                    {new Date(inc.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="self-start sm:self-auto">{renderStatusTag(inc.status)}</div>
              </div>

              <div className="text-xs text-[var(--text-primary)] leading-relaxed bg-[#F7F8FC] p-4 border border-[var(--border-default)] rounded-xs font-sans">
                {inc.description}
              </div>

              {inc.status === 'resolved' && inc.resolutionNotes && (
                <div className="p-4 bg-[var(--status-success-soft)] border-l-2 border-[var(--status-success)] rounded-xs text-xs font-sans text-[var(--text-primary)] space-y-1">
                  <span className="font-mono text-[10px] uppercase font-bold text-[var(--status-success)] block">
                    Resolution & Recalibration Record:
                  </span>
                  <p className="italic">"{inc.resolutionNotes}"</p>
                  <p className="text-[10px] font-mono text-[var(--text-secondary)] pt-1">
                    Resolved on {inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              )}

              {/* Manager/Admin Resolve Action */}
              {(role === 'manager' || role === 'admin') && inc.status !== 'resolved' && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setResolvingIncident(inc)}
                    className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-semibold rounded-xs shadow-xs cursor-pointer"
                  >
                    Investigate & Resolve Incident...
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* File Incident Modal */}
      {showReportModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-[var(--text-primary)]/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[var(--surface-primary)] border border-[var(--border-default)] max-w-lg w-full rounded-sm p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start pb-3 border-b border-[var(--border-default)]">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-[var(--accent-coral)] block">
                  Safety Incident Filing
                </span>
                <h2 className="font-serif text-xl font-bold text-[var(--text-primary)]">
                  Report Equipment Malfunction
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-[var(--accent-coral)]/15 border-l-2 border-[var(--accent-coral)] text-xs font-mono text-[var(--text-primary)]">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateIncident} className="space-y-3 text-xs font-sans">
              <div>
                <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1 font-bold">Affected Instrument</label>
                <select
                  value={resourceId}
                  onChange={(e) => setResourceId(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-strong)] bg-[#F7F8FC] rounded-xs text-[var(--text-primary)]"
                  required
                >
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.building} · {r.room})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1 font-bold">Severity Classification</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[var(--border-strong)] bg-[#F7F8FC] rounded-xs text-[var(--text-primary)]"
                >
                  <option value="low">Low - Minor cosmetic or informational note</option>
                  <option value="medium">Medium - Performance degradation or intermittent reading</option>
                  <option value="high">High - Inoperative or optical calibration error (Auto-lockout)</option>
                  <option value="critical">Critical - Safety risk, rotor imbalance, laser leak (Immediate Lockout)</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1 font-bold">Incident Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vacuum seal pressure error on chamber pump"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-strong)] bg-[#F7F8FC] rounded-xs text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1 font-bold">Detailed Description & Error Codes</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe observed behavior, error codes shown on instrument LCD, sample containment status, and any actions taken..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-strong)] bg-[#F7F8FC] rounded-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="pt-3 border-t border-[var(--border-default)] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-[var(--text-secondary)] hover:bg-[#F7F8FC] text-xs font-semibold rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[var(--accent-coral)] hover:bg-[#e05b53] text-white text-xs font-semibold rounded-xs shadow-xs"
                >
                  {submitting ? 'Filing Incident...' : 'Submit Incident Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Incident Modal */}
      {resolvingIncident && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-[var(--text-primary)]/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[var(--surface-primary)] border border-[var(--border-default)] max-w-lg w-full rounded-sm p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start pb-3 border-b border-[var(--border-default)]">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-[var(--brand-primary)] block">
                  Safety Investigation
                </span>
                <h2 className="font-serif text-xl font-bold text-[var(--text-primary)]">
                  Resolve Incident & Certify Instrument
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setResolvingIncident(null)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveIncident} className="space-y-3 text-xs font-sans">
              <div className="p-3 bg-[#F7F8FC] border border-[var(--border-default)] rounded-xs">
                <span className="font-mono text-[10px] uppercase text-[var(--text-secondary)] block mb-0.5">Target Instrument:</span>
                <p className="font-serif text-base font-bold text-[var(--text-primary)]">{resolvingIncident.title}</p>
                <p className="text-xs text-[var(--text-secondary)] font-mono">{resolvingIncident.resourceName}</p>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Resolution Notes & Corrective Action
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-strong)] bg-[#F7F8FC] rounded-xs text-[var(--text-primary)]"
                />
              </div>

              <label className="flex items-center space-x-2 bg-[#F7F8FC] p-3 border border-[var(--border-strong)] rounded-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={restoreResource}
                  onChange={(e) => setRestoreResource(e.target.checked)}
                  className="w-4 h-4 accent-[var(--brand-primary)]"
                />
                <span className="font-semibold text-[var(--text-primary)]">
                  Restore instrument status to 'Available' (lift maintenance lockout)
                </span>
              </label>

              <div className="pt-3 border-t border-[var(--border-default)] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setResolvingIncident(null)}
                  className="px-4 py-2 text-[var(--text-secondary)] hover:bg-[#F7F8FC] text-xs font-semibold rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-semibold rounded-xs shadow-xs"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
