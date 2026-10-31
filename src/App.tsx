/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { Navbar } from './components/Navbar.js';
import { DashboardView } from './components/DashboardView.js';
import { ResourceCatalog } from './components/ResourceCatalog.js';
import { BookingsHub } from './components/BookingsHub.js';
import { IncidentCenter } from './components/IncidentCenter.js';
import { AuditLogViewer } from './components/AuditLogViewer.js';
import { AiAssistantModal } from './components/AiAssistantModal.js';
import { JudgeTestingPanel } from './components/JudgeTestingPanel.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [aiAssistantOpen, setAiAssistantOpen] = useState<boolean>(false);

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-[var(--background-main)] text-[var(--text-primary)] font-sans antialiased flex flex-col selection:bg-[var(--brand-primary)] selection:text-white transition-colors duration-200">
          {/* Navigation Header */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenAiAssistant={() => setAiAssistantOpen(true)}
          />

          {/* Main View Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {activeTab === 'dashboard' && (
              <DashboardView
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenAiAssistant={() => setAiAssistantOpen(true)}
              />
            )}

            {activeTab === 'catalog' && <ResourceCatalog />}

            {activeTab === 'bookings' && <BookingsHub />}

            {activeTab === 'incidents' && <IncidentCenter />}

            {activeTab === 'audit' && <AuditLogViewer />}
          </main>

          {/* Institutional Editorial Footer */}
          <footer className="bg-[var(--surface-primary)] border-t border-[var(--border-default)] py-8 text-xs text-[var(--text-secondary)] transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[var(--border-default)]">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold text-xs">
                      L
                    </span>
                    <span className="font-serif text-base font-semibold text-[var(--text-primary)] tracking-tight">
                      LabShare
                    </span>
                    <span className="text-[11px] font-mono text-[var(--brand-primary)] bg-[var(--brand-primary-soft)] px-2 py-0.5 border border-[var(--border-default)]">
                      v2.5 Ink Wash
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-normal">
                    Unlock Idle Resources. Enable Shared Innovation.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                  <span className="flex items-center gap-1.5 text-[var(--text-primary)]">
                    <span className="w-2 h-2 rounded-full bg-[var(--status-success)]" />
                    Zero-Collision Lock Engaged
                  </span>
                  <span className="text-[var(--border-default)]">|</span>
                  <span className="text-[var(--text-secondary)]">Single-Use Cryptographic OTP</span>
                  <span className="text-[var(--border-default)]">|</span>
                  <span className="text-[var(--text-secondary)]">Immutable RBAC Ledger</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                <p>
                  &copy; {new Date().getFullYear()} LabShare Inter-Institutional Research Network. All rights reserved.
                </p>
                <p className="font-mono">
                  Ink Wash Color Spec: #4A4A4A · #CBCBCB · #FFFFE3 · #6D8196
                </p>
              </div>
            </div>
          </footer>

          {/* AI Assistant Modal */}
          {aiAssistantOpen && <AiAssistantModal onClose={() => setAiAssistantOpen(false)} />}

          {/* Floating QA Auditor & Judge Testing Suite */}
          <JudgeTestingPanel />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
