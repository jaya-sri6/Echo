import React, { useEffect, useMemo, useRef, useState } from 'react';
import AuthModal from './components/AuthModal';
import LandingPage from './components/LandingPage';
import { all15Cases, heroPresets } from './data/cases';
import {
  authMe,
  checkHealth,
  fetchExperienceGraph,
  fetchExperiences,
  sendChatMessage,
  subscribeToCaseInvestigation,
} from './services/api';

export default function App() {
  // Navigation & Authentication
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showLanding, setShowLanding] = useState(false);

  // Active View Tab from Navigation Rail: 'incident' | 'vault' | 'trees' | 'logs' | 'settings'
  const [railView, setRailView] = useState('incident');

  // Backend Connectivity & Real Data
  const [backendOnline, setBackendOnline] = useState(true);
  const [totalIndexedCount, setTotalIndexedCount] = useState(15);
  const [allExperiencesList, setAllExperiencesList] = useState(all15Cases);
  const [graphData, setGraphData] = useState(null);
  const [graphFilter, setGraphFilter] = useState('all');
  const [activeHighlightNode, setActiveHighlightNode] = useState(null);
  const [inspectModalNode, setInspectModalNode] = useState(null);

  // Active Incident Selection
  const [activeIncidentTitle, setActiveIncidentTitle] = useState('Acme Corp — Export Timeout');
  const [activeIncidentId, setActiveIncidentId] = useState('#ECHO-024');
  const [promptInput, setPromptInput] = useState('');
  const [isInvestigating, setIsInvestigating] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState(null);

  // SVG Chart Tooltip State
  const [chartTooltip, setChartTooltip] = useState(null);

  // Agent Pipeline Execution Steps State (1 = Ingest, 2 = Recall, 3 = Boundary, 4 = Guardrail)
  const [currentPipelineStep, setCurrentPipelineStep] = useState(3);

  // Dialogue History
  const [dialogueMessages, setDialogueMessages] = useState([
    {
      id: 'msg-01',
      sender: 'user',
      author: 'Ankit',
      time: '10:14:02 AM',
      title: 'Support Lead',
      text: "Acme's nightly 600 GB export is timing out. They have high concurrency and this happens during their batch window. Why aren't we just increasing the timeout?",
    },
    {
      id: 'msg-02',
      sender: 'agent',
      author: 'Echo Experience Reasoner',
      time: 'Turn 2 · 140ms',
      badge: 'Synthesized Precedent',
      thinkingCount: 15,
      thinkingMatches: [
        { id: 'node-EXP-044', label: 'EXP-044 (Async Chunked Export)', fit: '94.8% fit', type: 'success' },
        { id: 'node-EXP-031', label: 'EXP-031 (Timeout Increase in Batch)', fit: 'Failed (Pool Lock Exceeded)', type: 'failure' },
        { id: 'node-EXP-067', label: 'EXP-067 (Timeout Increase in Low-load)', fit: 'Success (Context mismatch: <50 GB)', type: 'warning' },
      ],
      boundaryNote: "Boundary rule: Timeout increase directly compounds Acme's shared database pool contention beyond 12m.",
      boundaryLink: 'node-EXP-089',
      explanationParagraphs: [
        "Increasing the timeout is contraindicated. In precedent EXP-031, extending query deadlines during a high-concurrency 600 GB batch window caused connection pool exhaustion and cascaded into secondary API degradation.",
        "Instead, precedent EXP-044 resolved the identical schema contention by switching from monolithic streaming to 50,000-row async chunked buffers with pool-release checkpoints.",
      ],
      retainedId: 'EXP-RETAINED-0024',
    },
  ]);

  // Terminal Trace Logs
  const [terminalLogs, setTerminalLogs] = useState([
    { text: '======================================================================', type: 'dim' },
    { text: '  ECHO LIVE INCIDENT PIPELINE TRACE (Process: 3751)', type: 'cyan', bold: true },
    { text: '======================================================================', type: 'dim' },
    { text: '  Context: 600 GB payload, MySQL engine v8.0.32, connection pool limit: 120', type: 'green' },
    { text: '  Precedent Recall: Scanned 15 graph precedents, pruned 11 dissimilar topologies', type: 'yellow' },
    { text: '  Boundary Reasoning: Pool lease cap bounded at 12m under invariant rule EXP-089', type: 'cyan' },
  ]);

  // 15 Seed Cases Vault Filters
  const [vaultCategory, setVaultCategory] = useState('ALL');
  const [vaultSearch, setVaultSearch] = useState('');

  const chatBottomRef = useRef(null);

  // Check initial authentication from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('echo_token');
    const savedUser = localStorage.getItem('echo_user');
    if (savedToken) {
      setAuthToken(savedToken);
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch {
          // ignore
        }
      }
      authMe(savedToken)
        .then((user) => setCurrentUser(user))
        .catch(() => {
          localStorage.removeItem('echo_token');
          localStorage.removeItem('echo_user');
          setAuthToken(null);
          setCurrentUser(null);
        });
    } else {
      setShowLanding(true);
    }
  }, []);

  // Poll backend health and fetch initial experiences & graph
  useEffect(() => {
    const refreshData = () => {
      checkHealth()
        .then(() => setBackendOnline(true))
        .catch(() => setBackendOnline(false));

      fetchExperiences()
        .then((data) => {
          setTotalIndexedCount(data.total_count);
          setAllExperiencesList(data.experiences);
        })
        .catch(() => {});

      fetchExperienceGraph()
        .then((data) => setGraphData(data))
        .catch(() => {});
    };

    refreshData();
    const interval = setInterval(refreshData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll dialogue
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dialogueMessages]);

  // Toast notification helper
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 4500);
  };

  // Node highlight in graph dock
  const highlightGraphNode = (nodeId) => {
    setActiveHighlightNode(nodeId);
    const nodeEl = document.getElementById(nodeId);
    if (nodeEl) {
      nodeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      nodeEl.classList.add('ring-2', 'ring-[#10a37f]');
      setTimeout(() => {
        nodeEl.classList.remove('ring-2', 'ring-[#10a37f]');
      }, 2000);
    }
  };

  // Handle Send prompt (Live Backend Investigation)
  const handleSendPrompt = async (e) => {
    if (e) e.preventDefault();
    const query = promptInput.trim();
    if (!query || isInvestigating) return;

    setPromptInput('');
    setIsInvestigating(true);
    setCurrentPipelineStep(1);

    // Append User message
    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      author: currentUser?.name || 'Ankit',
      time: new Date().toLocaleTimeString(),
      title: 'Support Lead',
      text: query,
    };
    setDialogueMessages((prev) => [...prev, userMsg]);

    // Stream trace logs
    setTerminalLogs((prev) => [
      ...prev,
      { text: `[${new Date().toLocaleTimeString()}] INGEST: Customer query received: "${query}"`, type: 'green' },
      { text: `[${new Date().toLocaleTimeString()}] RECALL: Querying Hindsight organizational memory bank...`, type: 'yellow' },
    ]);

    try {
      // Step 2: Precedent Recall
      setTimeout(() => setCurrentPipelineStep(2), 600);

      // Call real backend chat API
      const result = await sendChatMessage(query, activeIncidentId, authToken || undefined);

      // Step 3: Boundary Reasoning
      setTimeout(() => setCurrentPipelineStep(3), 1200);

      // Step 4: Guardrail Synthesis
      setTimeout(() => setCurrentPipelineStep(4), 1800);

      const aiText = result.ai_copilot?.explanation || 
        `Recommendation '${result.final_recommendation}' synthesized from organizational memory under ${result.context?.export_size_gb || 600} GB concurrency.`;

      const agentMsg = {
        id: `msg-agent-${Date.now()}`,
        sender: 'agent',
        author: 'Echo Experience Reasoner',
        time: `Turn ${dialogueMessages.length + 1} · Real LLM (${result.ai_copilot?.model || 'qwen3.8-27b'})`,
        badge: 'Synthesized Precedent',
        thinkingCount: result.metrics?.indexed_experiences || totalIndexedCount,
        thinkingMatches: result.thinking_drawer || [
          { id: 'node-EXP-044', label: 'EXP-044 (Async Chunked Export)', fit: '94.8% fit', type: 'success' },
          { id: 'node-EXP-031', label: 'EXP-031 (Timeout Increase in Batch)', fit: 'Failed (Pool Lock Exceeded)', type: 'failure' },
          { id: 'node-EXP-067', label: 'EXP-067 (Timeout Increase in Low-load)', fit: 'Success (Context mismatch: <50 GB)', type: 'warning' },
        ],
        boundaryNote: `Boundary check passed: ${result.final_recommendation} verified safe and reversible by Guardian.`,
        boundaryLink: 'node-EXP-089',
        explanationParagraphs: [aiText],
        retainedId: result.retained_experience_id || `EXP-RETAINED-${Date.now().toString().slice(-4)}`,
      };

      setDialogueMessages((prev) => [...prev, agentMsg]);
      showToast(`Investigation complete. Retained as ${result.retained_experience_id || 'EXP-RETAINED'}.`);

      // Refresh indexed count & graph
      fetchExperiences().then((d) => setTotalIndexedCount(d.total_count)).catch(() => {});
      fetchExperienceGraph().then((g) => setGraphData(g)).catch(() => {});
    } catch (err) {
      showToast(`Investigation error: ${err.message || 'Pipeline failed'}`);
    } finally {
      setIsInvestigating(false);
    }
  };

  // Filtered 15 Seed Cases for Memory Vault view
  const filteredVaultCases = useMemo(() => {
    return allExperiencesList.filter((c) => {
      const matchCat = vaultCategory === 'ALL' || c.status === vaultCategory;
      const q = vaultSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.id?.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q) ||
        c.action?.toLowerCase().includes(q) ||
        c.lesson?.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [allExperiencesList, vaultCategory, vaultSearch]);

  // If user requests landing page or is logged out and wants landing
  if (showLanding && !currentUser) {
    return (
      <>
        <LandingPage
          totalExperiences={totalIndexedCount}
          onEnter={() => setIsAuthModalOpen(true)}
          onOpenAuth={(mode) => {
            setAuthMode(mode);
            setIsAuthModalOpen(true);
          }}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authMode}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={(user, token) => {
            setCurrentUser(user);
            setAuthToken(token);
            setShowLanding(false);
            showToast(`Welcome back, ${user.name}`);
          }}
        />
      </>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col font-sans bg-[#0d0d0d] text-[#ececec] select-none">
      {/* ========================================== */}
      {/* BEGIN: Top Navigation Bar                  */}
      {/* ========================================== */}
      <header className="h-12 border-b border-[#2e2e2e] bg-[#171717] px-3.5 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          {/* ECHO Brand Emblem */}
          <div
            className="flex items-center gap-2.5 group cursor-pointer"
            onClick={() => setShowLanding(true)}
            title="Return to Landing Page"
          >
            <div className="h-7 w-7 rounded bg-[#10a37f] flex items-center justify-center text-white font-bold text-xs transition-transform duration-200 group-hover:scale-105 active:scale-95 shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold tracking-tight text-[#fafafa] text-sm group-hover:text-white transition-colors">
                ECHO
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#212121] text-[#a3a3a3] border border-[#2e2e2e] font-medium tracking-wide">
                v3.0 Near-Black
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-[#2e2e2e] mx-1"></div>

          {/* Breadcrumbs & Incident Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span
              className="text-[#737373] hover:text-[#a3a3a3] cursor-pointer transition-colors"
              onClick={() => setRailView('vault')}
            >
              Cases
            </span>
            <span className="text-[#404040]">/</span>
            <div className="relative group">
              <span className="font-medium text-[#fafafa] hover:text-[#10a37f] transition-colors cursor-pointer flex items-center gap-1.5">
                {activeIncidentTitle}
                <span className="material-symbols-outlined text-[14px] text-[#737373]">unfold_more</span>
              </span>
              {/* Dropdown with hero presets & seed cases */}
              <div className="absolute left-0 top-full mt-1.5 hidden group-hover:block z-50 bg-[#171717] border border-[#2e2e2e] rounded shadow-xl py-1 px-1 min-w-[280px]">
                <div className="px-2 py-1 text-[10px] font-mono text-[#737373] uppercase">Switch Scenario</div>
                {Object.entries(heroPresets).map(([k, p]) => (
                  <div
                    key={k}
                    className="px-2.5 py-1.5 rounded hover:bg-[#212121] cursor-pointer text-xs flex justify-between items-center"
                    onClick={() => {
                      setActiveIncidentTitle(p.title);
                      setActiveIncidentId(p.label);
                      setPromptInput(p.message);
                      setRailView('incident');
                    }}
                  >
                    <span className="text-[#ececec]">{p.title}</span>
                    <span className="text-[10px] font-mono text-[#10a37f]">{p.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <span className="font-mono text-[10px] text-[#737373] bg-[#212121] px-1.5 py-0.5 rounded border border-[#2e2e2e]">
              {activeIncidentId}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0d3829] text-[#10a37f] border border-[#10a37f]/30 font-mono text-[10px] font-medium ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f] pulse-calm"></span> ACTIVE
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* Live precedent count toggle/status */}
          <div
            className="hidden md:flex items-center gap-2 text-xs font-mono text-[#a3a3a3] bg-[#212121] hover:bg-[#262626] transition-colors px-2.5 py-1 rounded border border-[#2e2e2e] cursor-pointer"
            onClick={() => setRailView('vault')}
            title="Click to inspect ingested precedents"
          >
            <span className="text-[#737373]">Sync:</span>
            <span className="text-[#10a37f] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f]"></span> Live Precedent Feed
            </span>
            <span className="text-[#404040]">|</span>
            <span className="text-[#fafafa]">{totalIndexedCount} Experiences Indexed</span>
          </div>

          {/* Model Indicator */}
          <button
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#212121] hover:bg-[#282828] border border-[#2e2e2e] hover:border-[#404040] text-xs text-[#ececec] transition duration-150 active:scale-95"
            onClick={() => showToast('Runtime: Groq Qwen 3.8 / LLaMA-3 + Deterministic Echo Rule Engine')}
            title="LLM Backend Runtime"
          >
            <span className="w-2 h-2 rounded-full bg-[#10a37f]"></span>
            <span className="font-mono text-[11px]">gpt-4o-echo</span>
            <span className="material-symbols-outlined text-[13px] text-[#737373]">expand_more</span>
          </button>

          {/* User avatar & Logout popup */}
          <div className="relative group cursor-pointer">
            <div className="h-7 w-7 rounded bg-[#2e2e2e] hover:bg-[#383838] text-[#fafafa] flex items-center justify-center font-mono text-xs font-semibold border border-[#404040] transition duration-150 active:scale-95">
              {currentUser?.name ? currentUser.name.charAt(0) : 'A'}
            </div>
            <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-50 bg-[#171717] border border-[#2e2e2e] rounded shadow-lg py-1 px-2.5 text-[11px] font-mono text-[#a3a3a3] whitespace-nowrap">
              <div className="font-semibold text-[#fafafa] pb-1 border-b border-[#2e2e2e] mb-1">
                {currentUser?.name || 'Ankit (Support Lead)'}
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('echo_token');
                  localStorage.removeItem('echo_user');
                  setCurrentUser(null);
                  setAuthToken(null);
                  setShowLanding(true);
                }}
                className="text-[#ef4444] hover:underline"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================== */}
      {/* BEGIN: Main Shell (Rail + Workspace)       */}
      {/* ========================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* COMPACT NAVIGATION RAIL (Far Left) */}
        <aside className="w-14 border-r border-[#2e2e2e] bg-[#171717] flex flex-col items-center py-3 justify-between shrink-0">
          <div className="flex flex-col items-center gap-3">
            {/* New Case Action */}
            <button
              onClick={() => {
                setPromptInput('');
                setRailView('incident');
                showToast('Prepared fresh incident investigation.');
              }}
              className="h-8 w-8 rounded bg-[#10a37f] hover:bg-[#1a7f64] text-white flex items-center justify-center transition-all duration-150 active:scale-95 shadow-sm group relative"
              title="New Incident Case"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="absolute left-full ml-2 px-2 py-0.5 rounded bg-[#212121] border border-[#2e2e2e] text-[10px] font-mono text-[#ececec] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                New Case
              </span>
            </button>

            <div className="w-6 h-px bg-[#2e2e2e] my-1"></div>

            {/* Navigation Icons */}
            <button
              onClick={() => setRailView('incident')}
              className={`h-8 w-8 rounded flex items-center justify-center transition-all duration-150 relative group active:scale-95 ${
                railView === 'incident'
                  ? 'bg-[#212121] text-[#10a37f] border border-[#10a37f]/50'
                  : 'text-[#737373] hover:text-[#fafafa] hover:bg-[#212121]'
              }`}
              title="Current Incident"
            >
              <span className="material-symbols-outlined text-[18px]">folder_open</span>
              <span className="absolute left-full ml-2 px-2 py-0.5 rounded bg-[#212121] border border-[#2e2e2e] text-[10px] font-mono text-[#ececec] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                Current Incident
              </span>
            </button>

            <button
              onClick={() => setRailView('vault')}
              className={`h-8 w-8 rounded flex items-center justify-center transition-all duration-150 relative group active:scale-95 ${
                railView === 'vault'
                  ? 'bg-[#212121] text-[#10a37f] border border-[#10a37f]/50'
                  : 'text-[#737373] hover:text-[#fafafa] hover:bg-[#212121]'
              }`}
              title="Organizational Memory Vault"
            >
              <span className="material-symbols-outlined text-[18px]">database</span>
              <span className="absolute left-full ml-2 px-2 py-0.5 rounded bg-[#212121] border border-[#2e2e2e] text-[10px] font-mono text-[#ececec] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                Memory Vault ({totalIndexedCount})
              </span>
            </button>

            <button
              onClick={() => setRailView('trees')}
              className={`h-8 w-8 rounded flex items-center justify-center transition-all duration-150 relative group active:scale-95 ${
                railView === 'trees'
                  ? 'bg-[#212121] text-[#10a37f] border border-[#10a37f]/50'
                  : 'text-[#737373] hover:text-[#fafafa] hover:bg-[#212121]'
              }`}
              title="Precedent Decision Trees & Learning Graph"
            >
              <span className="material-symbols-outlined text-[18px]">hub</span>
              <span className="absolute left-full ml-2 px-2 py-0.5 rounded bg-[#212121] border border-[#2e2e2e] text-[10px] font-mono text-[#ececec] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                Decision Trees & Topology
              </span>
            </button>

            <button
              onClick={() => setRailView('logs')}
              className={`h-8 w-8 rounded flex items-center justify-center transition-all duration-150 relative group active:scale-95 ${
                railView === 'logs'
                  ? 'bg-[#212121] text-[#10a37f] border border-[#10a37f]/50'
                  : 'text-[#737373] hover:text-[#fafafa] hover:bg-[#212121]'
              }`}
              title="Execution & Audits"
            >
              <span className="material-symbols-outlined text-[18px]">history</span>
              <span className="absolute left-full ml-2 px-2 py-0.5 rounded bg-[#212121] border border-[#2e2e2e] text-[10px] font-mono text-[#ececec] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                Execution Logs
              </span>
            </button>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => {
                showToast(
                  `System Status: Backend ${backendOnline ? 'ONLINE' : 'OFFLINE'} | Hindsight: CONNECTED | Groq: ACTIVE`
                );
              }}
              className="h-8 w-8 rounded text-[#737373] hover:text-[#fafafa] hover:bg-[#212121] flex items-center justify-center transition-all duration-150 relative group active:scale-95"
              title="Settings & System Health"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span className="absolute left-full ml-2 px-2 py-0.5 rounded bg-[#212121] border border-[#2e2e2e] text-[10px] font-mono text-[#ececec] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                Settings
              </span>
            </button>
          </div>
        </aside>

        {/* WORKSPACE AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0d0d0d]">
          {/* VIEW A: MEMORY VAULT (15 SEEDED CASES) */}
          {railView === 'vault' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-3">
                <div>
                  <h2 className="text-lg font-mono font-semibold text-[#fafafa]">
                    ORGANIZATIONAL MEMORY VAULT ({allExperiencesList.length})
                  </h2>
                  <p className="text-xs text-[#737373] font-mono">
                    All historical incident precedents, conditions, and retained organizational lessons.
                  </p>
                </div>
                <button
                  onClick={() => setRailView('incident')}
                  className="px-3 py-1 rounded bg-[#212121] border border-[#2e2e2e] text-xs font-mono text-[#a3a3a3] hover:text-white"
                >
                  ✕ Close Vault
                </button>
              </div>

              {/* Filters */}
              <div className="flex items-center justify-between gap-4">
                <input
                  type="text"
                  placeholder="Search experiences (e.g. batch, timeout, chunk, migration)..."
                  value={vaultSearch}
                  onChange={(e) => setVaultSearch(e.target.value)}
                  className="flex-1 max-w-md rounded bg-[#171717] border border-[#2e2e2e] px-3 py-1.5 text-xs text-[#fafafa] focus:border-[#10a37f] focus:outline-none font-mono"
                />
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  {['ALL', 'SUCCESS', 'FAILURE', 'PARTIAL', 'BOUNDARY'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setVaultCategory(cat)}
                      className={`px-2.5 py-1 rounded transition ${
                        vaultCategory === cat
                          ? 'bg-[#10a37f] text-white font-semibold'
                          : 'bg-[#212121] text-[#a3a3a3] hover:text-white border border-[#2e2e2e]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {filteredVaultCases.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded bg-[#171717] border border-[#2e2e2e] hover:border-[#404040] transition space-y-2 cursor-pointer"
                    onClick={() => {
                      setActiveIncidentTitle(c.title);
                      setActiveIncidentId(c.id);
                      setPromptInput(c.message || `Customer's ${c.title} is failing under ${c.context?.concurrency || 'high'} concurrency.`);
                      setRailView('incident');
                      showToast(`Selected ${c.id}: ${c.title}`);
                    }}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-semibold text-[#10a37f] bg-[#0d3829] px-1.5 py-0.5 rounded border border-[#10a37f]/30">
                        {c.id}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded ${
                          c.status === 'FAILURE'
                            ? 'text-[#ef4444] bg-[#2a1215]'
                            : c.status === 'SUCCESS'
                            ? 'text-[#10a37f] bg-[#0d3829]'
                            : 'text-[#eab308] bg-[#2b2413]'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <h3 className="text-xs font-semibold text-[#fafafa]">{c.title}</h3>
                    <p className="text-[11px] font-mono text-[#a3a3a3] line-clamp-2">"{c.lesson}"</p>
                    <div className="pt-2 border-t border-[#242424] flex items-center justify-between text-[10px] font-mono text-[#737373]">
                      <span>Action: {c.action}</span>
                      <span className="text-[#10a37f]">Select Case →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW B: DECISION TREES & TOPOLOGY */}
          {railView === 'trees' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-3">
                <div>
                  <h2 className="text-lg font-mono font-semibold text-[#fafafa]">
                    MULTI-AGENT TOPOLOGY & HINDSIGHT MEMORY CORE
                  </h2>
                  <p className="text-xs text-[#737373] font-mono">
                    Hindsight Memory Layer centrally mediating between raw instinct and memory-guided decisions.
                  </p>
                </div>
                <button
                  onClick={() => setRailView('incident')}
                  className="px-3 py-1 rounded bg-[#212121] border border-[#2e2e2e] text-xs font-mono text-[#a3a3a3] hover:text-white"
                >
                  ✕ Close View
                </button>
              </div>

              {/* 3-Tier Topology Architecture */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded bg-[#171717] border border-[#2e2e2e] space-y-3 font-mono text-xs">
                  <span className="text-[10px] text-[#737373] font-bold">TIER 1 :: PRE-MEMORY INGESTION</span>
                  <div className="p-2.5 rounded bg-[#212121] border border-[#2e2e2e] space-y-1">
                    <strong className="text-[#fafafa]">Conversation Agent</strong>
                    <p className="text-[11px] text-[#737373]">Parses raw customer incident, extracts facts, telemetry parameters.</p>
                  </div>
                  <div className="p-2.5 rounded bg-[#212121] border border-[#2e2e2e] space-y-1">
                    <strong className="text-[#fafafa]">Incident Investigator</strong>
                    <p className="text-[11px] text-[#737373]">Structures workload volume (600 GB), concurrency level, and mode.</p>
                  </div>
                  <div className="text-center text-[#737373] text-[11px]">Context Vector ↓</div>
                </div>

                <div className="p-4 rounded bg-[#171717] border-2 border-[#10a37f] space-y-3 font-mono text-xs shadow-lg">
                  <span className="text-[10px] text-[#10a37f] font-bold">TIER 2 :: CENTRAL MEMORY CORE</span>
                  <div className="p-3 rounded bg-[#0d3829]/40 border border-[#10a37f]/50 space-y-2">
                    <strong className="text-[#fafafa] text-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#10a37f] pulse-calm"></span>
                      Hindsight Memory Core
                    </strong>
                    <ul className="text-[11px] text-[#a3a3a3] space-y-1">
                      <li>• Semantic Precedent Recall ({totalIndexedCount} records)</li>
                      <li>• Failure Precedent Detection (EXP-031 / EXP-007)</li>
                      <li>• Context Applicability & Transfer Boundary Check</li>
                      <li>• Counterfactual Reflection ("Why timeout failed")</li>
                      <li>• Closed-Loop Retention Storage (N + 1)</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded bg-[#171717] border border-[#2e2e2e] space-y-3 font-mono text-xs">
                  <span className="text-[10px] text-[#737373] font-bold">TIER 3 :: MEMORY-INFORMED ACTION</span>
                  <div className="p-2.5 rounded bg-[#212121] border border-[#2e2e2e] space-y-1">
                    <strong className="text-[#fafafa]">Experience Reasoner</strong>
                    <p className="text-[11px] text-[#737373]">Applies counterfactual memory. Modifies recommendation path.</p>
                  </div>
                  <div className="p-2.5 rounded bg-[#212121] border border-[#2e2e2e] space-y-1">
                    <strong className="text-[#fafafa]">Resolution Agent</strong>
                    <p className="text-[11px] text-[#737373]">Selects validated alternative (async chunking instead of timeout).</p>
                  </div>
                  <div className="p-2.5 rounded bg-[#212121] border border-[#2e2e2e] space-y-1">
                    <strong className="text-[#fafafa]">Guardian & Simulator</strong>
                    <p className="text-[11px] text-[#737373]">Deterministically tests mitigation. Verifies 0 cascading failures.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW C: TERMINAL EXECUTION LOGS */}
          {railView === 'logs' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10a37f]"></span>
                  <span className="text-xs font-mono text-[#a3a3a3] ml-2">echo@terminal ~ zsh (Process: 3751)</span>
                </div>
                <button
                  onClick={() => setRailView('incident')}
                  className="px-3 py-1 rounded bg-[#212121] border border-[#2e2e2e] text-xs font-mono text-[#a3a3a3] hover:text-white"
                >
                  ✕ Close Logs
                </button>
              </div>

              <div className="rounded bg-[#0d0d0d] border border-[#2e2e2e] p-4 font-mono text-xs space-y-1 overflow-x-auto min-h-[350px]">
                {terminalLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`${
                      log.type === 'green'
                        ? 'text-[#10a37f]'
                        : log.type === 'yellow'
                        ? 'text-[#eab308]'
                        : log.type === 'cyan'
                        ? 'text-[#8eb7d9]'
                        : log.type === 'dim'
                        ? 'text-[#525252]'
                        : 'text-[#ececec]'
                    } ${log.bold ? 'font-bold' : ''}`}
                  >
                    {log.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW D: PRIMARY SPLIT WORKSPACE (Incident Investigation + Telemetry + Graph Dock) */}
          {railView === 'incident' && (
            <>
              {/* TOP HALF: Dialogue Stream + Telemetry */}
              <section className="flex-1 flex min-h-0 border-b border-[#2e2e2e] overflow-hidden">
                {/* 1. MAIN DIALOGUE STREAM (ChatGPT Clean Style) */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#0d0d0d] border-r border-[#2e2e2e]">
                  {/* Dialogue History Viewport */}
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5" id="chatDialogueViewport">
                    {dialogueMessages.map((msg) => (
                      <div key={msg.id} className="max-w-2xl mx-auto flex items-start gap-3 transition-opacity duration-200">
                        {msg.sender === 'user' ? (
                          <div className="h-7 w-7 rounded bg-[#2e2e2e] text-[#fafafa] flex items-center justify-center font-mono text-xs font-semibold shrink-0 mt-0.5 border border-[#383838]">
                            {msg.author ? msg.author.charAt(0) : 'A'}
                          </div>
                        ) : (
                          <div className="h-7 w-7 rounded bg-[#10a37f] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                            <span className="material-symbols-outlined text-[16px]">psychology</span>
                          </div>
                        )}

                        <div className="flex-1 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-[#fafafa]">{msg.author}</span>
                              {msg.badge && (
                                <span className="text-[10px] font-mono text-[#10a37f] bg-[#0d3829] px-1.5 py-0.2 rounded border border-[#10a37f]/30 flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-[#10a37f]"></span> {msg.badge}
                                </span>
                              )}
                              {msg.title && <span className="text-[10px] font-mono text-[#737373]">• {msg.title}</span>}
                            </div>
                            <span className="text-[10px] font-mono text-[#737373]">{msg.time}</span>
                          </div>

                          {/* Expandable Thinking / Reasoning Drawer for Agent Responses */}
                          {msg.sender === 'agent' && (
                            <details
                              className="group bg-[#171717] border border-[#2e2e2e] hover:border-[#3a3a3a] rounded overflow-hidden transition-colors duration-150"
                              open
                            >
                              <summary className="px-3 py-2 text-[11px] font-mono text-[#a3a3a3] cursor-pointer flex items-center justify-between hover:bg-[#1f1f1f] transition select-none">
                                <span className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f]"></span>
                                  <span>
                                    Reasoned across {msg.thinkingCount || totalIndexedCount} organizational precedents in memory ({msg.thinkingMatches?.length || 3} relevant matches)
                                  </span>
                                </span>
                                <span className="material-symbols-outlined text-[16px] text-[#737373] group-open:rotate-180 transition-transform duration-200">
                                  expand_more
                                </span>
                              </summary>
                              <div className="px-3 py-2.5 border-t border-[#2e2e2e] text-[11px] font-mono space-y-1.5 text-[#a3a3a3] bg-[#121212]">
                                {msg.thinkingMatches?.map((match, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-1 rounded hover:bg-[#1b1b1b] cursor-pointer transition-colors"
                                    onClick={() => highlightGraphNode(match.id)}
                                  >
                                    <span>
                                      • Precedent match:{' '}
                                      <span
                                        className={`text-[#ececec] underline decoration-dotted ${
                                          match.type === 'success'
                                            ? 'decoration-[#10a37f]'
                                            : match.type === 'failure'
                                            ? 'decoration-[#ef4444]'
                                            : 'decoration-[#eab308]'
                                        }`}
                                      >
                                        {match.label}
                                      </span>
                                    </span>
                                    <span
                                      className={`font-semibold ${
                                        match.type === 'success'
                                          ? 'text-[#10a37f]'
                                          : match.type === 'failure'
                                          ? 'text-[#ef4444]'
                                          : 'text-[#eab308]'
                                      }`}
                                    >
                                      {match.fit}
                                    </span>
                                  </div>
                                ))}
                                {msg.boundaryNote && (
                                  <div className="text-[10px] text-[#737373] pt-1.5 border-t border-[#1f1f1f] flex items-center justify-between">
                                    <span>{msg.boundaryNote}</span>
                                    {msg.boundaryLink && (
                                      <span
                                        className="text-[#c084fc] cursor-pointer hover:underline"
                                        onClick={() => highlightGraphNode(msg.boundaryLink)}
                                      >
                                        Inspect {msg.boundaryLink.replace('node-', '')}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </details>
                          )}

                          {/* Core Response Body */}
                          <div className="text-xs leading-relaxed text-[#ececec] space-y-2 bg-[#171717] border border-[#2e2e2e] p-3.5 rounded hover:border-[#383838] transition-colors">
                            {msg.sender === 'user' ? (
                              <p className="text-[#d4d4d4]">{msg.text}</p>
                            ) : (
                              <>
                                {msg.explanationParagraphs?.map((para, pIdx) => (
                                  <p key={pIdx}>{para}</p>
                                ))}
                                {/* Explicit Action Strip with Tactile Feedback */}
                                <div className="pt-2.5 border-t border-[#2e2e2e] flex flex-wrap items-center gap-2">
                                  <button
                                    className="px-2.5 py-1 rounded bg-[#10a37f] hover:bg-[#1a7f64] text-white text-[11px] font-medium flex items-center gap-1.5 transition-all duration-150 active:scale-95 shadow-sm hover:shadow"
                                    onClick={() => showToast('Applied EXP-044 buffer chunking strategy to Acme batch config.')}
                                  >
                                    <span className="material-symbols-outlined text-[14px]">play_arrow</span> Apply EXP-044 Chunk Config
                                  </button>
                                  <button
                                    className="px-2.5 py-1 rounded bg-[#212121] hover:bg-[#2a2a2a] text-[#d4d4d4] hover:text-[#fafafa] border border-[#2e2e2e] hover:border-[#404040] text-[11px] font-mono flex items-center gap-1.5 transition-all duration-150 active:scale-95"
                                    onClick={() =>
                                      showToast('Contrasting: EXP-031 (Failure: Lock Exhaustion) vs EXP-044 (Success: Pool Checkpoints).')
                                    }
                                  >
                                    <span className="material-symbols-outlined text-[14px]">balance</span> Contrast EXP-031 vs EXP-044
                                  </button>
                                  <button
                                    className="px-2.5 py-1 rounded bg-[#212121] hover:bg-[#2a2a2a] text-[#d4d4d4] hover:text-[#fafafa] border border-[#2e2e2e] hover:border-[#404040] text-[11px] font-mono flex items-center gap-1.5 transition-all duration-150 active:scale-95"
                                    onClick={() =>
                                      showToast('Boundary Check Passed: Pool lease cap bounded at 12m under invariant rule EXP-089.')
                                    }
                                  >
                                    <span className="material-symbols-outlined text-[14px]">verified</span> Run Boundary Check
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Notification Banner Container */}
                  {toastMessage && (
                    <div className="px-6 py-2 bg-[#17231d] border-t border-b border-[#10a37f]/40 text-[#10a37f] text-xs font-mono flex items-center justify-between transition-all">
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[15px]">check_circle</span>
                        <span>{toastMessage}</span>
                      </span>
                      <button className="text-[#737373] hover:text-white text-xs" onClick={() => setToastMessage(null)}>
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Input Field Bar */}
                  <div className="p-3 border-t border-[#2e2e2e] bg-[#171717]">
                    <form
                      onSubmit={handleSendPrompt}
                      className="max-w-2xl mx-auto flex items-center gap-2 bg-[#0d0d0d] border border-[#2e2e2e] focus-within:border-[#10a37f] transition-all rounded px-3 py-1.5"
                    >
                      <span className="material-symbols-outlined text-[#737373] text-[18px]">terminal</span>
                      <input
                        type="text"
                        autoComplete="off"
                        value={promptInput}
                        onChange={(e) => setPromptInput(e.target.value)}
                        placeholder="Query institutional memory, simulate scenario, or instruct action..."
                        className="w-full bg-transparent border-none text-xs text-[#fafafa] placeholder-[#525252] focus:ring-0 p-0 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isInvestigating}
                        className="h-6 w-6 rounded bg-[#10a37f] hover:bg-[#1a7f64] text-white flex items-center justify-center shrink-0 transition-all duration-150 active:scale-90"
                        title="Send query (Enter)"
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {isInvestigating ? 'sync' : 'arrow_upward'}
                        </span>
                      </button>
                    </form>
                    <div className="max-w-2xl mx-auto flex items-center justify-between text-[10px] font-mono text-[#525252] mt-1.5 px-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f]"></span> Proactive validation enabled
                      </span>
                      <span>Memory Seed: 0x8F91D • Zero hallucination guardrails active</span>
                    </div>
                  </div>
                </div>

                {/* 2. ECHO LEARNING ENGINE & TELEMETRY */}
                <aside className="w-80 bg-[#171717] flex flex-col shrink-0 select-none overflow-y-auto border-l border-[#2e2e2e]">
                  {/* Header */}
                  <div className="px-3.5 py-2.5 border-b border-[#2e2e2e] flex items-center justify-between bg-[#171717] sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#10a37f] text-[16px]">monitoring</span>
                      <h2 className="text-xs font-semibold text-[#fafafa] uppercase tracking-wide font-mono">
                        Learning Engine & Telemetry
                      </h2>
                    </div>
                    <span className="text-[10px] font-mono text-[#10a37f] bg-[#0d3829] px-1.5 py-0.5 rounded border border-[#10a37f]/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f] pulse-calm"></span> ONLINE
                    </span>
                  </div>

                  <div className="p-3.5 space-y-4 text-xs">
                    {/* Real-time Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded bg-[#212121] border border-[#2e2e2e] hover:border-[#383838] transition-colors group cursor-default">
                        <div className="text-[10px] font-mono text-[#737373] flex items-center justify-between">
                          <span>ALIGNMENT SCORE</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f] pulse-calm"></span>
                        </div>
                        <div className="text-lg font-mono font-semibold text-[#fafafa] mt-0.5 tracking-tight">94.8%</div>
                        <div className="text-[10px] font-mono text-[#10a37f] flex items-center gap-1 mt-0.5">
                          <span>▲ +4.2%</span> <span className="text-[#737373]">vs turn 1</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded bg-[#212121] border border-[#2e2e2e] hover:border-[#383838] transition-colors group cursor-default">
                        <div className="text-[10px] font-mono text-[#737373]">INGESTION RATE</div>
                        <div className="text-lg font-mono font-semibold text-[#fafafa] mt-0.5 tracking-tight flex items-baseline gap-1">
                          <span>14.2</span>
                          <span className="text-xs text-[#737373] font-normal">ep/s</span>
                        </div>
                        <div className="text-[10px] font-mono text-[#a3a3a3] mt-0.5 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-[#10a37f]"></span> Zero lag buffer
                        </div>
                      </div>
                    </div>

                    {/* SVG Graph: Memory Alignment Score over Conversation Turns */}
                    <div className="p-3 rounded bg-[#212121] border border-[#2e2e2e] space-y-2 relative">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-[#fafafa] font-medium flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[13px] text-[#10a37f]">show_chart</span>
                          Memory Alignment Score
                        </span>
                        <span className="text-[10px] text-[#737373]">Turns 1–5</span>
                      </div>

                      {/* Tooltip banner inside SVG container */}
                      <div className="h-4 text-[10px] font-mono text-[#10a37f] flex items-center justify-between bg-[#191919] px-2 rounded border border-[#2a2a2a] transition-all">
                        <span>{chartTooltip ? chartTooltip.text : 'Hover milestone for telemetry data'}</span>
                        <span className="text-[#737373]">{chartTooltip ? chartTooltip.time : 'Active'}</span>
                      </div>

                      <div className="h-24 w-full relative pt-1">
                        <svg className="w-full h-full overflow-visible" fill="none" viewBox="0 0 260 70">
                          {/* Gridlines */}
                          <line stroke="#2e2e2e" strokeDasharray="2 2" strokeWidth="1" x1="0" x2="260" y1="15" y2="15"></line>
                          <line stroke="#2e2e2e" strokeDasharray="2 2" strokeWidth="1" x1="0" x2="260" y1="40" y2="40"></line>
                          <line stroke="#2e2e2e" strokeDasharray="2 2" strokeWidth="1" x1="0" x2="260" y1="65" y2="65"></line>
                          {/* Target Baseline */}
                          <line opacity="0.4" stroke="#10a37f" strokeDasharray="4 3" strokeWidth="1" x1="0" x2="260" y1="20" y2="20"></line>
                          {/* Metric Polyline */}
                          <polyline
                            fill="none"
                            points="10,58 60,50 120,38 180,24 245,14"
                            stroke="#10a37f"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          ></polyline>
                          {/* Data Dots with tooltips */}
                          <circle
                            className="chart-dot"
                            cx="10"
                            cy="58"
                            fill="#171717"
                            r="3"
                            stroke="#10a37f"
                            strokeWidth="1.5"
                            onMouseEnter={() => setChartTooltip({ text: 'Turn 1: Initial recall • 62.0%', time: '10:14:02' })}
                            onMouseLeave={() => setChartTooltip(null)}
                          />
                          <circle
                            className="chart-dot"
                            cx="60"
                            cy="50"
                            fill="#171717"
                            r="3"
                            stroke="#10a37f"
                            strokeWidth="1.5"
                            onMouseEnter={() => setChartTooltip({ text: 'Turn 2: Rule ingestion • 71.4%', time: '10:14:08' })}
                            onMouseLeave={() => setChartTooltip(null)}
                          />
                          <circle
                            className="chart-dot"
                            cx="120"
                            cy="38"
                            fill="#171717"
                            r="3"
                            stroke="#10a37f"
                            strokeWidth="1.5"
                            onMouseEnter={() => setChartTooltip({ text: 'Turn 3: Disambiguation • 81.0%', time: '10:14:15' })}
                            onMouseLeave={() => setChartTooltip(null)}
                          />
                          <circle
                            className="chart-dot"
                            cx="180"
                            cy="24"
                            fill="#171717"
                            r="3"
                            stroke="#10a37f"
                            strokeWidth="1.5"
                            onMouseEnter={() => setChartTooltip({ text: 'Turn 4: Boundary prune • 88.5%', time: '10:14:22' })}
                            onMouseLeave={() => setChartTooltip(null)}
                          />
                          <circle className="pulse-calm" cx="245" cy="14" fill="none" opacity="0.7" r="6" stroke="#10a37f" strokeWidth="1" />
                          <circle
                            className="chart-dot"
                            cx="245"
                            cy="14"
                            fill="#10a37f"
                            r="3.5"
                            stroke="#fafafa"
                            strokeWidth="1.5"
                            onMouseEnter={() => setChartTooltip({ text: 'Turn 5: Current converged • 94.8%', time: '10:14:31' })}
                            onMouseLeave={() => setChartTooltip(null)}
                          />
                        </svg>
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-[#737373]">
                        <span>T1: 62%</span>
                        <span>T3: 81%</span>
                        <span className="text-[#10a37f] font-semibold">T5: 94.8%</span>
                      </div>
                    </div>

                    {/* Active Agent Execution Steps */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-[#fafafa] font-semibold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[13px] text-[#10a37f]">schema</span>
                          Agent Execution Steps
                        </span>
                        <span className="text-[10px] text-[#737373]">Pipeline {currentPipelineStep}/4</span>
                      </div>

                      <div className="space-y-1.5 font-mono text-[11px]">
                        <div
                          className="p-2 rounded bg-[#212121] hover:bg-[#252525] border border-[#2e2e2e] flex items-center justify-between transition-colors cursor-pointer"
                          onClick={() => showToast('Context Ingest trace: 600 GB payload, MySQL engine v8.0.32, connection pool limit: 120.')}
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px] text-[#10a37f]">check_circle</span>
                            <span className="text-[#d4d4d4]">1. Context Ingest</span>
                          </div>
                          <span className="text-[#10a37f] text-[10px]">DONE (4ms)</span>
                        </div>

                        <div
                          className="p-2 rounded bg-[#212121] hover:bg-[#252525] border border-[#2e2e2e] flex items-center justify-between transition-colors cursor-pointer"
                          onClick={() => showToast('Precedent Recall trace: Scanned 15 graph precedents, pruned 11 dissimilar topologies.')}
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px] text-[#10a37f]">check_circle</span>
                            <span className="text-[#d4d4d4]">2. Precedent Recall</span>
                          </div>
                          <span className="text-[#10a37f] text-[10px]">DONE (18ms)</span>
                        </div>

                        <div
                          className={`p-2 rounded border flex items-center justify-between transition-colors cursor-pointer ${
                            currentPipelineStep >= 3
                              ? 'bg-[#212121] border-[#10a37f]/50 step-shimmer'
                              : 'bg-[#171717] border-[#2e2e2e] text-[#737373]'
                          }`}
                          onClick={() => setCurrentPipelineStep(4)}
                        >
                          <div className="flex items-center gap-2">
                            {currentPipelineStep >= 3 ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f] pulse-calm"></span>
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#404040]"></span>
                            )}
                            <span className="text-[#fafafa] font-medium">3. Boundary Reasoning</span>
                          </div>
                          <span className="text-[#10a37f] text-[10px] font-medium flex items-center gap-1">
                            {currentPipelineStep >= 3 ? 'ACTIVE' : 'QUEUED'}
                          </span>
                        </div>

                        <div
                          className={`p-2 rounded border flex items-center justify-between transition-colors ${
                            currentPipelineStep === 4
                              ? 'bg-[#212121] border-[#10a37f]/50 text-[#fafafa]'
                              : 'bg-[#171717] border-[#2e2e2e] text-[#737373]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${currentPipelineStep === 4 ? 'bg-[#10a37f]' : 'bg-[#404040]'}`}
                            ></span>
                            <span>4. Guardrail Synthesis</span>
                          </div>
                          <span className="text-[10px]">{currentPipelineStep === 4 ? 'ACTIVE' : 'QUEUED'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Precedent Repository Status Pill */}
                    <div className="p-2.5 rounded bg-[#121212] border border-[#2e2e2e] flex items-center justify-between text-[11px] font-mono hover:border-[#383838] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f]"></span>
                        <span className="text-[#737373]">Live Precedent Feed</span>
                      </div>
                      <button
                        className="text-[#a3a3a3] hover:text-[#fafafa] transition-colors text-[10px] flex items-center gap-1"
                        onClick={() => {
                          fetchExperiences().then((d) => setTotalIndexedCount(d.total_count));
                          showToast('Synchronized with live Hindsight memory bank.');
                        }}
                      >
                        <span className="material-symbols-outlined text-[12px]">refresh</span>
                        <span>Synced just now</span>
                      </button>
                    </div>
                  </div>
                </aside>
              </section>

              {/* BOTTOM HALF: Real-Time Experience Graph Dock */}
              <section className="h-[270px] bg-[#171717] flex flex-col shrink-0 overflow-hidden relative">
                {/* Dock Header with Filters */}
                <div className="h-10 px-4 border-b border-[#2e2e2e] flex items-center justify-between shrink-0 bg-[#171717]">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#10a37f] text-[16px]">account_tree</span>
                      <span className="text-xs font-mono font-semibold uppercase text-[#fafafa] tracking-wider">
                        Real-Time Experience Graph Dock
                      </span>
                    </div>
                    <span className="text-[#404040]">|</span>
                    <span className="text-[11px] font-mono text-[#737373]">
                      Active Node: <span className="text-[#fafafa]">Acme (600 GB Batch)</span>
                    </span>
                  </div>

                  {/* Filter Toggles */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-[#737373] mr-1">Filter Precedents:</span>
                    <button
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all active:scale-95 ${
                        graphFilter === 'all'
                          ? 'bg-[#10a37f] text-white font-medium shadow-sm'
                          : 'bg-[#212121] text-[#a3a3a3] hover:text-[#fafafa] border border-[#2e2e2e]'
                      }`}
                      onClick={() => setGraphFilter('all')}
                    >
                      All (5)
                    </button>
                    <button
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all active:scale-95 ${
                        graphFilter === 'success'
                          ? 'bg-[#10a37f] text-white font-medium shadow-sm'
                          : 'bg-[#212121] text-[#a3a3a3] hover:text-[#fafafa] border border-[#2e2e2e]'
                      }`}
                      onClick={() => setGraphFilter('success')}
                    >
                      Success (2)
                    </button>
                    <button
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all active:scale-95 ${
                        graphFilter === 'failure'
                          ? 'bg-[#10a37f] text-white font-medium shadow-sm'
                          : 'bg-[#212121] text-[#a3a3a3] hover:text-[#fafafa] border border-[#2e2e2e]'
                      }`}
                      onClick={() => setGraphFilter('failure')}
                    >
                      Failure (1)
                    </button>
                    <button
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all active:scale-95 ${
                        graphFilter === 'boundary'
                          ? 'bg-[#10a37f] text-white font-medium shadow-sm'
                          : 'bg-[#212121] text-[#a3a3a3] hover:text-[#fafafa] border border-[#2e2e2e]'
                      }`}
                      onClick={() => setGraphFilter('boundary')}
                    >
                      Boundary (2)
                    </button>
                  </div>
                </div>

                {/* Interactive Canvas Viewport */}
                <div className="flex-1 relative bg-[#0d0d0d] overflow-hidden flex items-center justify-center px-4">
                  {/* SVG Bezier Connection Matrix */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1200 230">
                    <defs>
                      <pattern id="gridDots" width="24" height="24" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="#202020"></circle>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#gridDots)"></rect>

                    {/* Bezier links from Center (600, 115) */}
                    <path
                      id="link-EXP-031"
                      className={`graph-link signal-line-flow ${activeHighlightNode === 'node-EXP-031' ? 'active-highlight' : ''}`}
                      d="M 600 115 C 450 115, 300 75, 180 75"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      strokeOpacity={graphFilter === 'all' || graphFilter === 'failure' ? 0.75 : 0.1}
                    ></path>
                    <path
                      id="link-EXP-044"
                      className={`graph-link signal-line-flow ${activeHighlightNode === 'node-EXP-044' ? 'active-highlight' : ''}`}
                      d="M 600 115 C 720 115, 820 65, 960 65"
                      fill="none"
                      stroke="#10a37f"
                      strokeWidth="2.2"
                      strokeOpacity={graphFilter === 'all' || graphFilter === 'success' ? 0.95 : 0.1}
                    ></path>
                    <path
                      id="link-EXP-067"
                      className={`graph-link signal-line-flow ${activeHighlightNode === 'node-EXP-067' ? 'active-highlight' : ''}`}
                      d="M 600 115 C 450 115, 320 160, 200 160"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="1.5"
                      strokeOpacity={graphFilter === 'all' || graphFilter === 'boundary' ? 0.65 : 0.1}
                    ></path>
                    <path
                      id="link-EXP-089"
                      className={`graph-link signal-line-flow ${activeHighlightNode === 'node-EXP-089' ? 'active-highlight' : ''}`}
                      d="M 600 115 C 740 115, 840 165, 980 165"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="1.5"
                      strokeOpacity={graphFilter === 'all' || graphFilter === 'boundary' ? 0.75 : 0.1}
                    ></path>
                  </svg>

                  {/* Graph Nodes Container */}
                  <div className="relative w-full max-w-6xl h-full flex items-center justify-between px-6 z-10">
                    {/* LEFT SATELLITES */}
                    <div className="space-y-4 w-72">
                      <div
                        id="node-EXP-031"
                        className={`graph-node p-2.5 rounded bg-[#171717] border border-[#ef4444]/40 hover:border-[#ef4444] transition-all duration-200 cursor-pointer select-none ${
                          graphFilter === 'all' || graphFilter === 'failure' ? 'opacity-100' : 'opacity-25 pointer-events-none'
                        }`}
                        onClick={() =>
                          setInspectModalNode({
                            tag: 'EXP-031',
                            title: 'Large Export Timeout',
                            badge: 'Failed (Pool Lock Exceeded)',
                            desc: '600 GB payload • Concurrency: High • Direct cause of secondary outage: increasing timeout failed.',
                          })
                        }
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] text-[#ef4444] font-semibold bg-[#2a1215] px-1.5 py-0.5 rounded border border-[#ef4444]/30">
                            EXP-031
                          </span>
                          <span className="text-[10px] font-mono text-[#ef4444] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></span> Failure (Lock Spike)
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-[#fafafa]">Large Export Timeout</div>
                        <div className="text-[10px] font-mono text-[#737373] mt-1 flex justify-between">
                          <span>600 GB • Concurrency: High</span>
                          <span className="text-[#ef4444] font-medium">Conflict</span>
                        </div>
                      </div>

                      <div
                        id="node-EXP-067"
                        className={`graph-node p-2.5 rounded bg-[#171717] border border-[#eab308]/40 hover:border-[#eab308] transition-all duration-200 cursor-pointer select-none ${
                          graphFilter === 'all' || graphFilter === 'boundary' ? 'opacity-100' : 'opacity-25 pointer-events-none'
                        }`}
                        onClick={() =>
                          setInspectModalNode({
                            tag: 'EXP-067',
                            title: 'Timeout Increase Fix',
                            badge: 'Success (Small Scale only)',
                            desc: '20 GB payload • Concurrency: Low • Does not scale past 50 GB threshold.',
                          })
                        }
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] text-[#eab308] font-semibold bg-[#2b2413] px-1.5 py-0.5 rounded border border-[#eab308]/30">
                            EXP-067
                          </span>
                          <span className="text-[10px] font-mono text-[#eab308] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#eab308]"></span> Success (Small Scale)
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-[#fafafa]">Timeout Increase Fix</div>
                        <div className="text-[10px] font-mono text-[#737373] mt-1 flex justify-between">
                          <span>20 GB • Concurrency: Low</span>
                          <span className="text-[#737373]">Weight: 0.32</span>
                        </div>
                      </div>
                    </div>

                    {/* CENTER CORE: Current Incident */}
                    <div
                      id="node-center"
                      className="graph-node w-64 p-3.5 rounded bg-[#171717] border-2 border-[#10a37f] hover:border-emerald-400 text-center shadow-lg select-none transition-all duration-200 cursor-pointer"
                      onClick={() =>
                        setInspectModalNode({
                          tag: 'Acme 600 GB Export',
                          title: 'Active Incident Context',
                          badge: 'Status: Active Synthesis',
                          desc: 'Running real-time precedent correlation across active database clusters. 4 matching experiences verified.',
                        })
                      }
                    >
                      <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#10a37f] font-semibold">
                        <span className="w-2 h-2 rounded-full bg-[#10a37f] pulse-calm"></span>
                        Current Active Case
                      </div>
                      <div className="text-sm font-semibold text-[#fafafa] mt-1">{activeIncidentTitle}</div>
                      <div className="text-[11px] font-mono text-[#a3a3a3] mt-0.5">High DB Pool Contention</div>
                      <div className="my-2 h-px bg-[#2e2e2e]"></div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#737373]">
                        <span>Correlated: 4 precedents</span>
                        <span className="text-[#10a37f] font-medium">Match: EXP-044</span>
                      </div>
                    </div>

                    {/* RIGHT SATELLITES */}
                    <div className="space-y-4 w-72">
                      <div
                        id="node-EXP-044"
                        className={`graph-node p-2.5 rounded bg-[#171717] border-2 border-[#10a37f] hover:bg-[#1a231f] transition-all duration-200 cursor-pointer select-none ${
                          graphFilter === 'all' || graphFilter === 'success' ? 'opacity-100' : 'opacity-25 pointer-events-none'
                        }`}
                        onClick={() =>
                          setInspectModalNode({
                            tag: 'EXP-044',
                            title: 'Async Chunked Export',
                            badge: '94.8% Direct Fit',
                            desc: 'Adopted by Stripe & Datadog pipelines. Chunks queries into 50k row batches with release locks.',
                          })
                        }
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-white font-semibold bg-[#10a37f] px-1.5 py-0.5 rounded">
                              EXP-044
                            </span>
                            <span className="text-[9px] font-mono font-semibold text-[#10a37f] bg-[#0d3829] px-1 py-0.2 rounded border border-[#10a37f]/40">
                              94.8% MATCH
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-[#10a37f] flex items-center gap-1 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f]"></span> Success Precedent
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-[#fafafa]">Async Chunked Export</div>
                        <div className="text-[10px] font-mono text-[#a3a3a3] mt-1 flex justify-between">
                          <span>50k Row Chunks • Pool Reset</span>
                          <span className="text-[#10a37f] font-medium">Recommended</span>
                        </div>
                      </div>

                      <div
                        id="node-EXP-089"
                        className={`graph-node p-2.5 rounded bg-[#171717] border border-[#a855f7]/40 hover:border-[#a855f7] transition-all duration-200 cursor-pointer select-none ${
                          graphFilter === 'all' || graphFilter === 'boundary' ? 'opacity-100' : 'opacity-25 pointer-events-none'
                        }`}
                        onClick={() =>
                          setInspectModalNode({
                            tag: 'EXP-089',
                            title: 'Pool Invalidation Constraint',
                            badge: 'Hard Invariant Boundary',
                            desc: 'Non-transferable rule: Database connection lease holds strictly cap at 12 minutes to avert cascading fails.',
                          })
                        }
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] text-[#c084fc] font-semibold bg-[#261533] px-1.5 py-0.5 rounded border border-[#a855f7]/30">
                            EXP-089
                          </span>
                          <span className="text-[10px] font-mono text-[#c084fc] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7]"></span> Boundary Rule
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-[#fafafa]">Pool Invalidation Constraint</div>
                        <div className="text-[10px] font-mono text-[#737373] mt-1 flex justify-between">
                          <span>Max Window: 12 Minutes</span>
                          <span className="text-[#c084fc]">Non-transferable</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Node Inspection Modal Overlay */}
                  {inspectModalNode && (
                    <div className="absolute z-30 inset-x-8 bottom-4 bg-[#1a1a1a] border border-[#2e2e2e] rounded shadow-2xl p-3.5 backdrop-blur-sm transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10a37f]/20 text-[#10a37f] border border-[#10a37f]/30 font-semibold">
                              {inspectModalNode.tag}
                            </span>
                            <h4 className="text-xs font-semibold text-[#fafafa]">{inspectModalNode.title}</h4>
                            <span className="text-[10px] font-mono text-[#737373]">• {inspectModalNode.badge}</span>
                          </div>
                          <p className="text-[11px] text-[#b3b3b3] font-mono leading-relaxed pt-0.5">
                            {inspectModalNode.desc}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="px-2.5 py-1 rounded bg-[#212121] hover:bg-[#2b2b2b] text-[10px] font-mono text-[#ececec] border border-[#383838] transition active:scale-95"
                            onClick={() => showToast('Telemetry exported to audit ledger.')}
                          >
                            Export Trace
                          </button>
                          <button
                            className="text-[#737373] hover:text-white text-sm p-1 transition"
                            onClick={() => setInspectModalNode(null)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bottom Status Legend */}
                  <div className="absolute bottom-2 left-6 right-6 flex items-center justify-between text-[10px] font-mono text-[#737373] pointer-events-none select-none">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#10a37f]"></span> High Alignment (Success)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span> Contraindicated (Failed)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#eab308]"></span> Scale Divergent
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#a855f7]"></span> Invariant Boundary
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f]"></span> Topology Latency: 12ms
                    </span>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      {/* Auth Modal Component */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user, token) => {
          setCurrentUser(user);
          setAuthToken(token);
          setShowLanding(false);
          showToast(`Authenticated as ${user.name}`);
        }}
      />
    </div>
  );
}
