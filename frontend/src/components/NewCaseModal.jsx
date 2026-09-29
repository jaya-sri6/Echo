import React, { useState } from 'react';

const PRESET_SCENARIOS = [
  {
    key: 'case-a',
    tag: 'CASE A • BASELINE TRIAL',
    title: 'Acme 600 GB Export Timeout (Initial Attempt)',
    contextBadge: '600 GB • High Concurrency • Sync Mode',
    message: "Acme's nightly 600 GB export keeps timing out under high concurrency in sync mode. Why aren't we just increasing the timeout?",
    description: 'Simulates textbook human instinct (increase_timeout). Detects pool saturation failure (180 min, escalated) and retains EXP-DEMO-001 into organizational memory.',
    actionLabel: 'increase_timeout',
    expectedBadge: 'Expected: FAILURE',
    expectedColor: 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30',
  },
  {
    key: 'case-b',
    tag: 'CASE B • CLOSED LEARNING LOOP',
    title: 'Acme 600 GB Repeated Export (Memory-Informed)',
    contextBadge: '600 GB • High Concurrency • Sync Mode',
    message: "Customer's 600 GB nightly export keeps timing out again under high concurrency in sync mode. What should we do now?",
    description: 'Recalls retained failure EXP-DEMO-001 and EXP-031. Memory changes mind (True) -> dynamically shifts to async_chunked_export with 50k buffers and pool checkpoints.',
    actionLabel: 'async_chunked_export',
    expectedBadge: 'Expected: SUCCESS',
    expectedColor: 'text-[#10a37f] bg-[#0d3829] border-[#10a37f]/30',
  },
  {
    key: 'case-c',
    tag: 'CASE C • TRANSFER BOUNDARY CHECK',
    title: 'Interactive 20 GB Export (Anti-RAG Boundary)',
    contextBadge: '20 GB • Low Concurrency • Sync Mode',
    message: "Customer's 20 GB interactive export is timing out under low concurrency in sync mode.",
    description: 'Anti-RAG guardrails detect workload and scale boundaries. Refuses to blindly apply 600 GB batch chunking to a small interactive workload.',
    actionLabel: 'non_transferable_boundary',
    expectedBadge: 'Expected: BOUNDARY ENFORCED',
    expectedColor: 'text-[#c084fc] bg-[#261533] border-[#a855f7]/30',
  },
  {
    key: 'custom',
    tag: 'CUSTOM SCENARIO',
    title: 'Custom Incident Telemetry',
    contextBadge: 'Arbitrary Workload & Concurrency',
    message: '',
    description: 'Provide an arbitrary customer export scenario to trigger real-time Hindsight recall, deterministic simulation, and Groq LLM synthesis.',
    actionLabel: 'real_time_triage',
    expectedBadge: 'Dynamic Synthesis',
    expectedColor: 'text-[#a3a3a3] bg-[#212121] border-[#2e2e2e]',
  },
];

export default function NewCaseModal({ isOpen, onClose, onLaunchCase }) {
  const [selectedPresetKey, setSelectedPresetKey] = useState('case-a');
  const [customTitle, setCustomTitle] = useState('Production Pipeline Latency');
  const [customMessage, setCustomMessage] = useState(
    "Customer's 450 GB transactional export is failing with deadlock timeouts during peak 18-concurrency batch execution."
  );

  if (!isOpen) return null;

  const currentPreset = PRESET_SCENARIOS.find((p) => p.key === selectedPresetKey) || PRESET_SCENARIOS[0];

  const handleLaunch = () => {
    if (selectedPresetKey === 'custom') {
      if (!customMessage.trim()) return;
      onLaunchCase({
        caseKey: 'custom',
        title: customTitle.trim() || 'Custom Incident Case',
        message: customMessage.trim(),
        label: '#ECHO-CUSTOM',
      });
    } else {
      onLaunchCase({
        caseKey: currentPreset.key,
        title: currentPreset.title,
        message: currentPreset.message,
        label: currentPreset.key === 'case-a' ? '#ECHO-DEMO-01' : currentPreset.key === 'case-b' ? '#ECHO-DEMO-02' : '#ECHO-DEMO-03',
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-sans select-none animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#171717] border border-[#2e2e2e] rounded-lg shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#737373] hover:text-[#fafafa] text-sm p-1.5 transition rounded hover:bg-[#212121]"
          title="Close"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="h-7 w-7 rounded bg-[#10a37f] flex items-center justify-center text-white font-bold text-xs shadow-sm">
            <span className="material-symbols-outlined text-[16px]">add_box</span>
          </div>
          <div>
            <h2 className="text-sm font-mono font-semibold text-[#fafafa] tracking-wide">
              START REAL-TIME INCIDENT INVESTIGATION
            </h2>
          </div>
        </div>
        <p className="text-[11px] font-mono text-[#737373] mb-4">
          Select a benchmark precedent scenario to observe Echo's closed learning loop, or provide custom incident context.
        </p>

        {/* Preset Selector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-4">
          {PRESET_SCENARIOS.map((preset) => {
            const isSelected = selectedPresetKey === preset.key;
            return (
              <div
                key={preset.key}
                onClick={() => setSelectedPresetKey(preset.key)}
                className={`p-3 rounded border text-left cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'bg-[#212121] border-[#10a37f] shadow-md ring-1 ring-[#10a37f]/50'
                    : 'bg-[#141414] border-[#2e2e2e] hover:border-[#404040] hover:bg-[#1a1a1a]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-mono font-semibold text-[#a3a3a3] uppercase tracking-wider">
                    {preset.tag}
                  </span>
                  <span className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border ${preset.expectedColor}`}>
                    {preset.expectedBadge}
                  </span>
                </div>
                <div className="text-xs font-semibold text-[#fafafa] mb-1">{preset.title}</div>
                <p className="text-[10px] text-[#737373] line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Active Scenario Details / Custom Inputs */}
        <div className="p-3.5 rounded bg-[#121212] border border-[#2e2e2e] mb-5 space-y-3 font-mono text-xs">
          {selectedPresetKey === 'custom' ? (
            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] uppercase text-[#737373] block mb-1">Incident Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-[#171717] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-[#fafafa] focus:outline-none focus:border-[#10a37f]"
                  placeholder="e.g. Acme High Concurrency Timeout"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-[#737373] block mb-1">Customer Telemetry / Message</label>
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full bg-[#171717] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-[#fafafa] focus:outline-none focus:border-[#10a37f]"
                  placeholder="Describe the incident: workload size, concurrency, sync/async mode, and failure symptoms..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#737373]">Input Message:</span>
                <span className="text-[10px] text-[#10a37f] bg-[#0d3829] px-2 py-0.5 rounded border border-[#10a37f]/30">
                  {currentPreset.contextBadge}
                </span>
              </div>
              <div className="p-2.5 rounded bg-[#171717] border border-[#282828] text-[#ececec] text-xs leading-relaxed italic">
                "{currentPreset.message}"
              </div>
              <div className="text-[10px] text-[#737373] flex items-center justify-between pt-1">
                <span>Action to Evaluate: <strong className="text-[#fafafa]">{currentPreset.actionLabel}</strong></span>
                <span>Real-Time Stream: <span className="text-[#10a37f]">12-event lifecycle</span></span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#2e2e2e]">
          <div className="text-[10px] font-mono text-[#525252] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f] pulse-calm"></span>
            Real-time pipeline &amp; Groq copilot active
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs font-mono text-[#a3a3a3] hover:text-[#fafafa] bg-[#212121] hover:bg-[#282828] border border-[#2e2e2e] transition"
            >
              Cancel
            </button>
            <button
              onClick={handleLaunch}
              className="px-4 py-1.5 rounded text-xs font-mono font-medium text-white bg-[#10a37f] hover:bg-[#1a7f64] transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[15px]">play_arrow</span>
              Launch Investigation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
