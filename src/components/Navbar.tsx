import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme, AppTheme } from '../context/ThemeContext.js';
import {
  FlaskConical,
  Shield,
  Layers,
  CalendarCheck,
  AlertTriangle,
  Bot,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Palette,
  Check,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAiAssistant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAiAssistant }) => {
  const { user, role, switchRole, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: Layers },
    { id: 'catalog', label: 'Explore Resources', icon: FlaskConical },
    { id: 'bookings', label: 'Bookings & OTP', icon: CalendarCheck },
    { id: 'incidents', label: 'Incidents & Maintenance', icon: AlertTriangle },
    { id: 'audit', label: 'Audit & Reports', icon: Shield, managerOrAdmin: true },
  ];

  const themeOptions: { id: AppTheme; label: string; dotColor: string; bgLabel: string }[] = [
    { id: 'ink-wash', label: 'Ink Wash', dotColor: '#6D8196', bgLabel: '#FFFFE3' },
    { id: 'warm-espresso', label: 'Warm Earth', dotColor: '#6E473B', bgLabel: '#F4E6D2' },
    { id: 'royal-blue', label: 'Royal Blue', dotColor: '#0866E8', bgLabel: '#F3F4FF' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[var(--surface-primary)] border-b border-[var(--border-default)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors duration-200">
      {/* Top Institutional Bar: Role Switcher & Palette Selection */}
      <div className="bg-[var(--background-secondary)] border-b border-[var(--border-default)] text-xs py-1.5 px-4 sm:px-6 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Active Clearance Badge */}
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 bg-[var(--brand-primary)] text-white font-semibold rounded-xs">
              VERIFIED CLEARANCE
            </span>
            <span className="text-[var(--text-secondary)] text-xs">
              Active Role: <strong className="text-[var(--text-primary)] uppercase font-mono">{role}</strong>
              <span className="hidden sm:inline"> ({user?.name} · {user?.department})</span>
            </span>
          </div>

          {/* Palette Selector & Quick Role Switch */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Screenshot Color Palette Selector */}
            <div className="flex items-center space-x-1.5 bg-[var(--surface-primary)] px-2 py-0.5 border border-[var(--border-default)] rounded-xs">
              <Palette className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              <span className="text-[11px] font-medium text-[var(--text-secondary)] mr-0.5">Palette:</span>
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTheme(opt.id)}
                  title={`Switch to ${opt.label} palette (${opt.bgLabel})`}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono rounded-xs cursor-pointer transition ${
                    theme === opt.id
                      ? 'bg-[var(--brand-primary)] text-white font-bold shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background-secondary)]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full border border-black/20"
                    style={{ backgroundColor: opt.dotColor }}
                  />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Quick Role Switch */}
            <div className="flex items-center space-x-1">
              <span className="text-[var(--text-secondary)] text-[11px] hidden md:inline font-medium">Role:</span>
              <button
                type="button"
                onClick={() => switchRole('researcher')}
                className={`px-2.5 py-0.5 text-xs font-mono transition cursor-pointer border rounded-xs font-medium ${
                  role === 'researcher'
                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xs'
                    : 'bg-[var(--surface-primary)] text-[var(--text-primary)] border-[var(--border-default)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]'
                }`}
              >
                1. Researcher
              </button>
              <button
                type="button"
                onClick={() => switchRole('manager')}
                className={`px-2.5 py-0.5 text-xs font-mono transition cursor-pointer border rounded-xs font-medium ${
                  role === 'manager'
                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xs'
                    : 'bg-[var(--surface-primary)] text-[var(--text-primary)] border-[var(--border-default)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]'
                }`}
              >
                2. Lab Manager
              </button>
              <button
                type="button"
                onClick={() => switchRole('admin')}
                className={`px-2.5 py-0.5 text-xs font-mono transition cursor-pointer border rounded-xs font-medium ${
                  role === 'admin'
                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xs'
                    : 'bg-[var(--surface-primary)] text-[var(--text-primary)] border-[var(--border-default)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]'
                }`}
              >
                3. Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Masthead Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          {/* Brand Mark with Editorial Serif */}
          <div className="flex items-center space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center space-x-3 text-left focus:outline-hidden cursor-pointer group"
            >
              <div className="w-10 h-10 bg-[var(--brand-primary)] rounded-xs flex items-center justify-center text-white shadow-xs group-hover:bg-[var(--brand-primary-hover)] transition-colors">
                <FlaskConical className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className="font-serif text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    LabShare
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary-soft)] px-1.5 py-0.2 rounded-xs border border-[var(--border-default)]">
                    Network
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] font-sans tracking-normal hidden sm:block">
                  Unlock Idle Resources. Enable Shared Innovation.
                </p>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`relative px-3.5 py-2 text-xs font-medium tracking-wide transition cursor-pointer flex items-center gap-1.5 rounded-xs ${
                      isActive
                        ? 'text-[var(--brand-primary)] font-bold bg-[var(--brand-primary-soft)] border-b-2 border-[var(--brand-primary)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background-secondary)]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--brand-primary)]' : 'text-[var(--text-muted)]'}`} />
                    <span>{item.label}</span>
                    {item.managerOrAdmin && (
                      <span className="text-[9px] uppercase font-mono px-1 py-0.2 bg-[var(--background-secondary)] text-[var(--text-secondary)] border border-[var(--border-default)] rounded-xs">
                        Audit
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onOpenAiAssistant}
              className="inline-flex items-center px-3.5 py-2 border border-[var(--border-default)] bg-[var(--brand-primary-soft)] hover:bg-[var(--brand-primary)] hover:text-white text-[var(--brand-primary)] transition-colors text-xs font-semibold rounded-xs cursor-pointer shadow-xs"
            >
              <Bot className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline">SOP AI Assistant</span>
              <span className="sm:hidden">SOP AI</span>
            </button>

            {/* Profile trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2.5 p-1.5 border border-[var(--border-default)] hover:border-[var(--brand-primary)] bg-[var(--surface-primary)] rounded-xs transition cursor-pointer"
                aria-expanded={profileDropdownOpen}
              >
                <div className="w-8 h-8 bg-[var(--brand-primary)] text-white rounded-xs flex items-center justify-center font-serif font-bold text-sm">
                  {user?.name.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <div className="text-xs font-bold text-[var(--text-primary)] leading-tight truncate max-w-[130px]">
                    {user?.name}
                  </div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-secondary)]">
                    {role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[var(--surface-primary)] border border-[var(--border-default)] shadow-xl rounded-sm p-4 z-50">
                  <div className="border-b border-[var(--border-default)] pb-3 mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--brand-primary)] font-bold block">
                      Authenticated Profile
                    </span>
                    <p className="font-serif text-base font-bold text-[var(--text-primary)] mt-0.5">{user?.name}</p>
                    <p className="text-xs text-[var(--text-secondary)] font-mono">{user?.email}</p>
                    <p className="text-xs text-[var(--text-primary)] mt-1 font-medium">{user?.department}</p>
                  </div>

                  <div className="py-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-primary)] block mb-2 font-bold">
                      Verified Certifications ({user?.certifications.length || 0})
                    </span>
                    <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {user?.certifications.map((c, i) => (
                        <div
                          key={i}
                          className="flex items-center text-xs text-[var(--text-primary)] py-0.5"
                        >
                          <span className="w-1.5 h-1.5 bg-[var(--status-success)] rounded-full mr-2 shrink-0" />
                          <span className="truncate">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[var(--border-default)] pt-3 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left flex items-center justify-between text-xs font-semibold text-[var(--accent-coral)] hover:opacity-80 cursor-pointer"
                    >
                      <span className="flex items-center">
                        <LogOut className="w-3.5 h-3.5 mr-2" />
                        Sign Out Session
                      </span>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">ESC</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--background-secondary)] rounded-xs cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xs border ${
                  isActive
                    ? 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border-[var(--brand-primary)]'
                    : 'text-[var(--text-primary)] border-transparent hover:bg-[var(--background-secondary)]'
                }`}
              >
                <span className="flex items-center">
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </span>
                {item.managerOrAdmin && (
                  <span className="text-[9px] uppercase font-mono text-[var(--text-secondary)]">Auditor</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
