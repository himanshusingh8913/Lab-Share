import React, { useState, useEffect } from 'react';
import { Resource, ResourceCategory } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { BookingModal } from './BookingModal.js';
import { verifyUserEligibility } from '../utils/bookingRules.js';
import { getMaintenanceAlert } from '../utils/maintenanceRules.js';
import {
  Search,
  Plus,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Layers,
  CheckCircle2,
  XCircle,
  X,
  Wrench,
  Bell,
  CalendarClock,
  ArrowRight,
  SlidersHorizontal,
  Building2,
  Cpu,
  Lock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

const CATEGORIES: ('All' | ResourceCategory)[] = [
  'All',
  'Microscopy',
  'Spectrometry',
  'Chromatography',
  'Centrifugation',
  'Cleanroom',
  'Thermal & Incubation',
  'General Equipment',
];

export const ResourceCatalog: React.FC = () => {
  const { user, role } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [maintenanceAlertsOnly, setMaintenanceAlertsOnly] = useState(false);

  // Modals
  const [selectedResourceForBooking, setSelectedResourceForBooking] = useState<Resource | null>(null);
  const [selectedResourceForDetails, setSelectedResourceForDetails] = useState<Resource | null>(null);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await api.getResources({
        search: searchTerm,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
      });
      setResources(res.resources);
    } catch (err) {
      console.error('Failed to load resources', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [searchTerm, selectedCategory, selectedStatus]);

  // Maintenance & Calibration alerts calculation
  const equipmentWithAlerts = resources.filter((r) => getMaintenanceAlert(r).hasAlert);

  // Client filter for eligibility and maintenance alerts toggle
  const displayedResources = resources.filter((res) => {
    if (maintenanceAlertsOnly && !getMaintenanceAlert(res).hasAlert) {
      return false;
    }
    if (eligibleOnly) {
      const { eligible } = verifyUserEligibility(user?.certifications || [], res.requiredCertifications);
      if (!eligible) return false;
    }
    return true;
  });

  // Flagship centerpiece
  const flagshipResource = displayedResources.length > 0 ? displayedResources[0] : null;
  const secondaryResources = displayedResources.slice(1);

  const renderStatusTag = (status: Resource['status']) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center text-[11px] font-mono uppercase font-semibold text-[var(--status-success)] bg-[var(--status-success-soft)] px-2 py-0.5 rounded-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)] mr-1.5" />
            Available
          </span>
        );
      case 'in-use':
        return (
          <span className="inline-flex items-center text-[11px] font-mono uppercase font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary-soft)] px-2 py-0.5 rounded-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] mr-1.5" />
            In Session
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center text-[11px] font-mono uppercase font-semibold text-[var(--accent-coral)] bg-[var(--accent-coral)]/15 px-2 py-0.5 rounded-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-coral)] mr-1.5" />
            Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[11px] font-mono uppercase font-semibold text-[var(--text-secondary)] bg-[var(--background-secondary)] px-2 py-0.5 rounded-xs">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Docket */}
      <div className="bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_1px_3px_rgba(40,51,71,0.04)]">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-[var(--brand-primary)] font-bold">
            <Cpu className="w-3.5 h-3.5" />
            <span>Master Equipment Directory</span>
            <span className="text-[var(--border-strong)]">/</span>
            <span>{resources.length} Verified Units</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[var(--text-primary)] tracking-tight mt-1">
            Research Instrumentation Fleet
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-sans">
            Calibrated analytical instruments, high-voltage electron microscopes, and specialized fabrication suites.
          </p>
        </div>

        {(role === 'manager' || role === 'admin') && (
          <button
            type="button"
            onClick={() => setShowAddResourceModal(true)}
            className="inline-flex items-center px-4 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-semibold rounded-xs transition-colors cursor-pointer self-start md:self-auto shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Resource
          </button>
        )}
      </div>

      {/* Maintenance Notification Banner */}
      {equipmentWithAlerts.length > 0 && (
        <div className="bg-[var(--accent-yellow)]/30 border border-[var(--border-strong)] p-4 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xs bg-[var(--text-primary)] text-[var(--accent-yellow)] flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">
                Scheduled Calibration & Maintenance Advisory
              </p>
              <p className="text-[var(--text-secondary)]">
                {equipmentWithAlerts.length} instrument{equipmentWithAlerts.length > 1 ? 's are' : ' is'} approaching or past their scheduled calibration window.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMaintenanceAlertsOnly(!maintenanceAlertsOnly)}
            className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-xs border transition cursor-pointer shrink-0 ${
              maintenanceAlertsOnly
                ? 'bg-[var(--text-primary)] text-white border-[var(--text-primary)]'
                : 'bg-[var(--surface-primary)] text-[var(--text-primary)] border-[var(--border-strong)] hover:border-[var(--text-primary)]'
            }`}
          >
            {maintenanceAlertsOnly ? 'Show All Instruments' : 'Filter Advisory Fleet'}
          </button>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm p-4 space-y-4 shadow-[0_1px_3px_rgba(40,51,71,0.03)]">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Filter by name, model, building, or scientific department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] focus:border-[var(--brand-primary)] focus:bg-[var(--surface-primary)] text-xs text-[var(--text-primary)] rounded-xs font-sans transition-colors placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* Quick toggle chips */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] text-xs font-mono text-[var(--text-primary)] rounded-xs focus:border-[var(--brand-primary)] cursor-pointer"
            >
              <option value="All">Status: All</option>
              <option value="available">Status: Available</option>
              <option value="in-use">Status: In Session</option>
              <option value="maintenance">Status: Maintenance</option>
            </select>

            <button
              type="button"
              onClick={() => setEligibleOnly(!eligibleOnly)}
              className={`px-3 py-2 text-xs font-medium rounded-xs border transition cursor-pointer flex items-center gap-1.5 ${
                eligibleOnly
                  ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                  : 'bg-[#F7F8FC] text-[var(--text-primary)] border-[var(--border-strong)] hover:border-[var(--brand-primary)]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>My Qualified Fleet</span>
            </button>
          </div>
        </div>

        {/* Category Tabs (Segmented bar) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-[var(--border-default)]">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--brand-primary)] text-white font-semibold shadow-xs'
                    : 'bg-[#F7F8FC] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background-secondary)]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* CATALOG CONTENT AREA */}
      {loading ? (
        <div className="py-20 text-center bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm">
          <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-mono text-xs text-[var(--text-secondary)]">Querying instrument catalog registry...</p>
        </div>
      ) : displayedResources.length === 0 ? (
        <div className="p-12 text-center bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm space-y-3">
          <Cpu className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
          <h3 className="font-serif text-lg font-bold text-[var(--text-primary)]">No matching instruments found</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            Try adjusting your search query, clearing category filters, or toggling off the qualification requirement.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
              setSelectedStatus('All');
              setEligibleOnly(false);
              setMaintenanceAlertsOnly(false);
            }}
            className="px-4 py-2 bg-[var(--brand-primary)] text-white text-xs font-semibold rounded-xs hover:bg-[var(--brand-primary-hover)]"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* FEATURED / FLAGSHIP INSTRUMENT (Asymmetric Hero Card) */}
          {flagshipResource && selectedCategory === 'All' && !searchTerm && (
            <div className="bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm overflow-hidden shadow-[0_2px_8px_rgba(40,51,71,0.04)] grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-5 relative h-64 lg:h-auto bg-[var(--text-primary)]">
                <img src={flagshipResource.imageUrl} alt={flagshipResource.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80'; }} />
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span className="px-2.5 py-0.5 bg-[var(--brand-primary)] text-white text-[10px] font-mono uppercase font-bold tracking-wider rounded-xs">
                    FLAGSHIP SYSTEM
                  </span>
                  {renderStatusTag(flagshipResource.status)}
                </div>
              </div>

              <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <span className="font-mono text-[var(--brand-primary)] font-semibold">{flagshipResource.category}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      {flagshipResource.building} · {flagshipResource.room}
                    </span>
                  </div>

                  <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
                    {flagshipResource.name}
                  </h2>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {flagshipResource.description}
                  </p>

                  {/* Required training & Specs */}
                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-[var(--border-default)]">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Required Training</span>
                      <div className="flex items-center gap-1.5 mt-0.5 font-medium text-[var(--text-primary)]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                        <span>{flagshipResource.requiredCertifications.join(', ') || 'General Lab Safety'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Access Terms</span>
                      <span className="font-medium text-[var(--text-primary)] block mt-0.5">
                        ${flagshipResource.hourlyRate}/hr (Max {flagshipResource.maxConsecutiveHours}h)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedResourceForDetails(flagshipResource)}
                    className="text-xs font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] flex items-center gap-1 cursor-pointer font-mono"
                  >
                    View Instrument Specs &rarr;
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedResourceForBooking(flagshipResource)}
                    disabled={flagshipResource.status !== 'available'}
                    className={`px-5 py-2.5 text-xs font-semibold rounded-xs transition-colors shadow-xs ${
                      flagshipResource.status === 'available'
                        ? 'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white cursor-pointer'
                        : 'bg-[var(--background-secondary)] text-[var(--text-muted)] cursor-not-allowed'
                    }`}
                  >
                    {flagshipResource.status === 'available' ? 'Reserve Instrument' : 'Currently Unavailable'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* EDITORIAL INVENTORY GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(selectedCategory === 'All' && !searchTerm ? secondaryResources : displayedResources).map((resource) => {
              const alertInfo = getMaintenanceAlert(resource);
              const eligibility = verifyUserEligibility(user?.certifications || [], resource.requiredCertifications);

              return (
                <div
                  key={resource.id}
                  className="bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-sm overflow-hidden flex flex-col justify-between hover:border-[var(--brand-primary)] hover:shadow-[0_4px_16px_rgba(40,51,71,0.08)] transition-all duration-200"
                >
                  <div>
                    {/* Image Card Header */}
                    <div className="h-44 w-full bg-[var(--text-primary)] relative overflow-hidden group">
                      <img src={resource.imageUrl} alt={resource.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80'; }} />
                      <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                        {renderStatusTag(resource.status)}
                        {alertInfo.hasAlert && (
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono uppercase font-bold rounded-xs flex items-center gap-1 ${
                              alertInfo.alertType === 'overdue'
                                ? 'bg-[var(--accent-coral)] text-white'
                                : 'bg-[var(--accent-yellow)] text-[var(--text-primary)]'
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            {alertInfo.badgeText || (alertInfo.alertType === 'overdue' ? 'Calibration Overdue' : 'Due Soon')}
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-[var(--text-primary)]/80 backdrop-blur-xs text-white text-[10px] font-mono rounded-xs">
                        {resource.category}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-3">
                      <div>
                        <div className="text-[11px] text-[var(--text-secondary)] font-mono flex items-center gap-1 mb-1">
                          <MapPin className="w-3 h-3 text-[var(--text-muted)]" />
                          <span>{resource.building} · {resource.room}</span>
                        </div>
                        <h3 className="font-serif text-lg font-bold text-[var(--text-primary)] leading-snug">
                          {resource.name}
                        </h3>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                          Model: {resource.model}
                        </p>
                      </div>

                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {resource.description}
                      </p>

                      {/* Training & Access Requirements */}
                      <div className="pt-2 border-t border-[var(--border-default)] space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[var(--text-secondary)]">
                          <span>Prerequisites:</span>
                          <span
                            className={`font-semibold flex items-center gap-1 ${
                              eligibility.eligible ? 'text-[var(--status-success)]' : 'text-[var(--accent-coral)]'
                            }`}
                          >
                            {eligibility.eligible ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)]" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
                            )}
                            {eligibility.eligible ? 'Qualified' : 'Cert Required'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[var(--text-secondary)]">
                          <span>Max Session:</span>
                          <span className="font-mono text-[var(--text-primary)] font-medium">
                            {resource.maxConsecutiveHours} hours max
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[var(--text-secondary)]">
                          <span>Hourly Tariff:</span>
                          <span className="font-semibold text-[var(--brand-primary)] font-mono">
                            ${resource.hourlyRate}/hour
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 bg-[#F7F8FC] border-t border-[var(--border-default)] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedResourceForDetails(resource)}
                      className="px-3 py-1.5 bg-[var(--surface-primary)] border border-[var(--border-strong)] hover:border-[var(--brand-primary)] text-[var(--text-primary)] text-xs font-semibold rounded-xs transition-colors cursor-pointer"
                    >
                      View Specs
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedResourceForBooking(resource)}
                      disabled={resource.status !== 'available'}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-xs transition-colors shadow-xs ${
                        resource.status === 'available'
                          ? 'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white cursor-pointer'
                          : 'bg-[var(--background-secondary)] text-[var(--text-muted)] cursor-not-allowed'
                      }`}
                    >
                      {resource.status === 'available' ? 'Reserve' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETAIL MODAL (Asymmetric Technical Specification Sheet) */}
      {selectedResourceForDetails && (
        <div className="fixed inset-0 z-50 bg-[var(--text-primary)]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface-primary)] border border-[var(--border-default)] max-w-3xl w-full rounded-sm shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--border-default)] flex items-center justify-between bg-[#F7F8FC]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--brand-primary)] font-bold">
                  Technical Instrument Specification
                </span>
                <h2 className="font-serif text-xl font-bold text-[var(--text-primary)]">
                  {selectedResourceForDetails.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResourceForDetails(null)}
                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xs cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Asymmetric 2-column layout */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-6 space-y-4">
                  <div className="h-56 bg-[var(--text-primary)] rounded-xs overflow-hidden">
                    <img
                      src={selectedResourceForDetails.imageUrl}
                      alt={selectedResourceForDetails.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3.5 bg-[#F7F8FC] border border-[var(--border-default)] rounded-xs space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Physical Location:</span>
                      <strong className="text-[var(--text-primary)]">{selectedResourceForDetails.building}, {selectedResourceForDetails.room}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Department Custody:</span>
                      <strong className="text-[var(--text-primary)]">{selectedResourceForDetails.department}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Standard Rate:</span>
                      <strong className="text-[var(--brand-primary)] font-mono">${selectedResourceForDetails.hourlyRate}/hour</strong>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-6 space-y-4 text-xs">
                  <div>
                    <h4 className="font-serif text-sm font-bold text-[var(--text-primary)] mb-1">
                      Experimental Scope & Description
                    </h4>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      {selectedResourceForDetails.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-serif text-sm font-bold text-[var(--text-primary)] mb-1">
                      Required Safety Certifications
                    </h4>
                    <div className="space-y-1">
                      {selectedResourceForDetails.requiredCertifications.map((c, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[var(--text-primary)] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)]" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--brand-primary-soft)] border border-[var(--border-default)] rounded-xs space-y-1">
                    <span className="font-mono text-[10px] text-[var(--brand-primary)] uppercase font-bold">
                      Institutional SOP Protocol
                    </span>
                    <p className="text-[11px] text-[var(--text-primary)]">
                      Must complete optical bench alignment check-off sheet before powering down lasers. Log consumable runtime in facility physical logbook.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#F7F8FC] border-t border-[var(--border-default)] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedResourceForDetails(null)}
                className="px-4 py-2 bg-[var(--surface-primary)] border border-[var(--border-strong)] text-[var(--text-primary)] text-xs font-semibold rounded-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = selectedResourceForDetails;
                  setSelectedResourceForDetails(null);
                  setSelectedResourceForBooking(res);
                }}
                disabled={selectedResourceForDetails.status !== 'available'}
                className="px-5 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-semibold rounded-xs disabled:bg-[var(--background-secondary)] disabled:text-[var(--text-muted)]"
              >
                Proceed to Reservation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {selectedResourceForBooking && (
        <BookingModal
          resource={selectedResourceForBooking}
          onClose={() => setSelectedResourceForBooking(null)}
          onSuccess={() => {
            fetchResources();
            setSelectedResourceForBooking(null);
          }}
        />
      )}

      {/* ADD RESOURCE MODAL (MANAGER / ADMIN ONLY) */}
      {showAddResourceModal && (
        <AddResourceModal
          onClose={() => setShowAddResourceModal(false)}
          onSuccess={() => {
            setShowAddResourceModal(false);
            fetchResources();
          }}
        />
      )}
    </div>
  );
};

// Form for Cataloging new resources
const AddResourceModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('Microscopy');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [department, setDepartment] = useState('');
  const [hourlyRate, setHourlyRate] = useState(65);
  const [maxHours, setMaxHours] = useState(4);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80');
  const [certInput, setCertInput] = useState('Laser Safety Level 2');
  const [nextCalibrationDate, setNextCalibrationDate] = useState('');
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const certifications = certInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await api.createResource({
        name,
        model,
        category,
        building,
        room,
        department,
        hourlyRate: Number(hourlyRate),
        maxConsecutiveHours: Number(maxHours),
        description,
        imageUrl,
        requiredCertifications: certifications,
        status: 'available',
        nextCalibrationDate: nextCalibrationDate || undefined,
        nextMaintenanceDate: nextMaintenanceDate || undefined,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to catalog equipment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--text-primary)]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[var(--surface-primary)] border border-[var(--border-default)] max-w-xl w-full rounded-sm shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-[var(--border-default)]">
          <div>
            <span className="font-mono text-[10px] uppercase text-[var(--brand-primary)] font-bold">Facility Registry</span>
            <h2 className="font-serif text-xl font-bold text-[var(--text-primary)]">Catalog New Laboratory Instrument</h2>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-[var(--accent-coral)]/15 border-l-2 border-[var(--accent-coral)] text-xs font-mono text-[var(--text-primary)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1">Equipment Name</label>
            <input
              type="text"
              required
              placeholder="e.g. BD FACSCelesta Flow Cytometer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-xs focus:border-[var(--brand-primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1">Model / Identifier</label>
              <input
                type="text"
                required
                placeholder="e.g. 3-Laser 12-Color System"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-xs focus:border-[var(--brand-primary)]"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ResourceCategory)}
                className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-xs focus:border-[var(--brand-primary)]"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1">Building</label>
              <input
                type="text"
                required
                placeholder="Bio Wing"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-xs focus:border-[var(--brand-primary)]"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1">Room</label>
              <input
                type="text"
                required
                placeholder="Lab 412"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-xs focus:border-[var(--brand-primary)]"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1">Department</label>
              <input
                type="text"
                required
                placeholder="Immunology Core"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-xs focus:border-[var(--brand-primary)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1">Hourly Rate ($)</label>
              <input
                type="number"
                required
                min={0}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-xs focus:border-[var(--brand-primary)]"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1">Max Hours Per Booking</label>
              <input
                type="number"
                required
                min={1}
                max={24}
                value={maxHours}
                onChange={(e) => setMaxHours(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-xs focus:border-[var(--brand-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1">Description</label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-xs focus:border-[var(--brand-primary)]"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1">
              Required Certifications (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Biosafety Level 2, Laser Safety Level 3"
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-xs focus:border-[var(--brand-primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1">
                Next Calibration Date
              </label>
              <input
                type="date"
                value={nextCalibrationDate}
                onChange={(e) => setNextCalibrationDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-xs"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1">
                Next Maintenance Date
              </label>
              <input
                type="date"
                value={nextMaintenanceDate}
                onChange={(e) => setNextMaintenanceDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F8FC] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-xs"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end space-x-2 border-t border-[var(--border-default)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[var(--text-secondary)] hover:bg-[#F7F8FC] font-mono text-xs rounded-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-mono font-semibold text-xs rounded-xs cursor-pointer shadow-xs"
            >
              {submitting ? 'Cataloging...' : 'Catalog Instrument'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
