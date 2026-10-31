import React, { useState } from 'react';
import { api } from '../services/api.js';
import {
  Bot,
  Sparkles,
  Send,
  X,
  BookOpen,
  CheckCircle,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

interface AiAssistantModalProps {
  onClose: () => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; text: string; source?: string }[]
  >([
    {
      role: 'assistant',
      text: 'Greetings. I am the LabShare Core Facility SOP & Protocol Assistant. I provide calibrated operational procedures, rotor balancing tolerances, laser alignment sequences, and decontamination standards. What instrument are you preparing to run today?',
      source: 'offline-lab-sop',
    },
  ]);
  const [loading, setLoading] = useState(false);

  const QUICK_QUESTIONS = [
    'How do I properly balance an ultracentrifuge rotor?',
    'What are the confocal laser cleaning protocols?',
    'What should I check if mass spec spray pressure drops?',
    'What is the Class 1000 cleanroom gowning sequence?',
  ];

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || query;
    if (!q.trim() || loading) return;

    const userMsg = { role: 'user' as const, text: q };
    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.askAiAssistant(q);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: res.answer, source: res.source },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Unable to query AI endpoint. Core SOP Fallback: Ensure personal protective equipment (PPE) is worn, verify optical interlocks, and notify the Lab Manager immediately.',
          source: 'offline-lab-sop',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[var(--text-primary)]/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[var(--surface-primary)] border border-[var(--border-default)] max-w-xl w-full h-[600px] flex flex-col shadow-2xl rounded-sm overflow-hidden">
        {/* Header */}
        <div className="bg-[#F7F8FC] border-b border-[var(--border-default)] p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[var(--brand-primary)] text-white rounded-xs flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-serif text-lg font-bold text-[var(--text-primary)]">
                  LabShare Scientific SOP Assistant
                </h2>
                <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.2 bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] rounded-xs">
                  Dual-Engine
                </span>
              </div>
              <p className="text-[11px] font-sans text-[var(--text-secondary)]">
                Gemini model integration with offline core facility safety SOP fallback
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs bg-[var(--background-main)]/50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-sm shadow-xs ${
                  m.role === 'user'
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'bg-[var(--surface-primary)] border border-[var(--border-default)] text-[var(--text-primary)]'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                {m.source && (
                  <span className="block text-[9px] font-mono uppercase tracking-wider text-[var(--brand-primary)] mt-1.5 font-bold">
                    Source: {m.source === 'gemini-live' ? 'Live Gemini AI' : 'Offline SOP Knowledgebase'}
                  </span>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-xs font-mono text-[var(--brand-primary)] p-2 bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-xs w-fit">
              <div className="w-3.5 h-3.5 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
              <span>Analyzing laboratory protocol repository...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 bg-[var(--surface-primary)] border-t border-[var(--border-default)] flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-[var(--text-muted)] text-[10px] uppercase font-mono pl-1 shrink-0">Sample Prompts:</span>
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 bg-[var(--brand-primary-soft)] hover:bg-[var(--brand-primary)] text-[var(--brand-primary)] hover:text-white rounded-xs whitespace-nowrap transition-colors cursor-pointer shrink-0 font-medium"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Query Input */}
        <div className="p-3 bg-[#F7F8FC] border-t border-[var(--border-default)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ask about laser alignment, rotor safety, or decontamination procedures..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-3 py-2 bg-[var(--surface-primary)] border border-[var(--border-strong)] focus:border-[var(--brand-primary)] rounded-xs text-xs text-[var(--text-primary)] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-semibold rounded-xs transition-colors cursor-pointer disabled:bg-[var(--background-secondary)] disabled:text-[var(--text-muted)] shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask SOP</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
