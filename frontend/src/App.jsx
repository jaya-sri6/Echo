import { useEffect, useMemo, useRef, useState } from 'react';
import { checkHealth, runInvestigation as apiInvestigate, subscribeToCaseInvestigation } from './services/api';
import { all15Cases, heroPresets } from './data/cases';

const agents = [
  { name: 'Conversation Agent', short: 'Conversation', detail: 'Parsing natural language into structured operating facts.' },
  { name: 'Investigator', short: 'Investigator', detail: 'Extracting workload, environment, severity, and actionable constraints.' },
  { name: 'Experience Reasoner', short: 'Reasoner', detail: 'Querying organizational memory for past outcomes and counterfactuals.' },
  { name: 'Resolution Agent', short: 'Resolution', detail: 'Evaluating candidate mitigations against what history taught us.' },
  { name: 'Guardian', short: 'Guardian', detail: 'Validating safety, reversibility, confidence, and boundary rules.' },
];

const timeline = [
  'Customer case received',
  'Context extracted',
  'Experiences recalled',
  'Historical failure detected',
  'Applicability checked',
  'Candidate actions evaluated',
  'Recommendation changed',
  'Outcome simulated',
  'Experience retained',
];

function StatusMark({ type }) {
  const norm = (type || '').toLowerCase();
  const label = norm === 'success' ? 'OK' : norm === 'failure' ? 'NO' : norm === 'partial' ? 'PART' : 'BOUND';
  return (
    <span className={`status-mark ${norm}`} aria-hidden="true">
      {label}
    </span>
  );
}

function SectionHeading({ eyebrow, title, note }) {
  return (
    <div className="section-heading">
      <div>
        <p className="section-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {note && <p className="section-note">{note}</p>}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('investigation'); // 'investigation' | 'explorer' | 'terminal' | 'learning'
  const [selectedCaseKey, setSelectedCaseKey] = useState('hero_case_b');
  const [customMessage, setCustomMessage] = useState(heroPresets.hero_case_b.message);
  const [runStage, setRunStage] = useState(0);
  const [backendOnline, setBackendOnline] = useState(false);
  const [liveBackendData, setLiveBackendData] = useState(null);
  const [streamEvents, setStreamEvents] = useState([]);
  const [isWsStreaming, setIsWsStreaming] = useState(false);
  const [pipelineError, setPipelineError] = useState(null);
  const [lastRunHeroA, setLastRunHeroA] = useState(false);

  // Execution History & Agents Learning
  const [executionHistory, setExecutionHistory] = useState([
    {
      id: 'RUN-001',
      caseId: 'HERO-001',
      title: '600 GB Batch Sync Timeout (Cold Start)',
      instinct: 'increase_timeout',
      memoryState: 'No prior failure in memory bank',
      decision: 'increase_timeout (Naive Heuristic)',
      outcome: 'FAILURE',
      time: '180 min',
      escalated: true,
      retainedId: 'EXP-007',
      learningGain: 'Retained into Hindsight: timeout failure under 600 GB concurrency',
    },
    {
      id: 'RUN-002',
      caseId: 'HERO-002',
      title: '600 GB Batch Sync Timeout (Memory-Informed)',
      instinct: 'increase_timeout',
      memoryState: 'Recalled EXP-007 (increase_timeout -> FAILURE at 600GB)',
      decision: 'async_chunked_export (Memory-Guided)',
      outcome: 'SUCCESS',
      time: '110 min',
      escalated: false,
      retainedId: 'EXP-016',
      learningGain: 'Resolution time down -38.8% (180m -> 110m). Failure prevented via counterfactual recall.',
    },
  ]);

  const recordExecutionRun = (resultData, caseInfo) => {
    setExecutionHistory((prev) => {
      const runIndex = prev.length + 1;
      const recAction = resultData?.final_recommendation || caseInfo.expectedAction || 'async_chunked_export';
      const outcome = resultData?.simulation?.outcome || caseInfo.expectedOutcome || 'SUCCESS';
      const dur = resultData?.simulation?.resolution_time_minutes ?? (outcome === 'SUCCESS' ? 110 : 180);
      const isMemGuided = recAction !== (caseInfo.initialAction || 'increase_timeout');

      const newEntry = {
        id: `RUN-00${runIndex}`,
        caseId: caseInfo.label || caseInfo.key || 'RUN',
        title: caseInfo.title || 'Case Investigation',
        instinct: caseInfo.initialAction || 'increase_timeout',
        memoryState: isMemGuided
          ? `Recalled EXP-007 + Hindsight evidence (${resultData?.decision_evidence?.length || 3} items)`
          : 'Baseline naive heuristic applied',
        decision: `${recAction} (${isMemGuided ? 'Memory-Guided' : 'Naive Heuristic'})`,
        outcome: outcome,
        time: `${dur} min`,
        escalated: resultData?.simulation?.escalated ?? (outcome === 'FAILURE'),
        retainedId: resultData?.retained_experience_id || `EXP-0${15 + runIndex}`,
        learningGain: outcome === 'SUCCESS'
          ? `Success achieved in ${dur}m. Failure avoided through counterfactual memory recall.`
          : `Incident logged and retained into Hindsight layer as operational precedent.`,
      };
      return [...prev, newEntry];
    });
  };

  // 15 Seed Case Explorer Filters
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemoryExpId, setSelectedMemoryExpId] = useState('EXP-007');

  // Terminal & Chat Logs
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const terminalEndRef = useRef(null);

  // Resolve active case profile (from hero presets or 15 seeded cases)
  const currentCase = useMemo(() => {
    if (heroPresets[selectedCaseKey]) {
      return heroPresets[selectedCaseKey];
    }
    const found = all15Cases.find((c) => c.id === selectedCaseKey);
    if (found) {
      return {
        key: found.id,
        label: found.id,
        title: found.title,
        message: found.message,
        tags: found.tags,
        initialAction: 'increase_timeout',
        expectedAction: found.action,
        expectedOutcome: found.status,
        expectedTime: '110 min',
        isHero: false,
        stepDescription: found.lesson,
        matchedCaseId: found.id,
      };
    }
    return heroPresets.hero_case_b;
  }, [selectedCaseKey]);

  const isRunning = runStage > 0 && runStage < 10 && !pipelineError;
  const hasMemory = runStage >= 4 || selectedCaseKey === 'hero_case_c';
  const hasDecision = runStage >= 7;
  const hasOutcome = runStage >= 8;
  const hasRetained = runStage >= 9;
  const activeAgent = runStage >= 2 && runStage <= 6 ? runStage - 2 : -1;

  // Selected memory experience inspection
  const selectedMemoryDetail = useMemo(() => {
    return all15Cases.find((c) => c.id === selectedMemoryExpId) || all15Cases[6]; // default to EXP-007
  }, [selectedMemoryExpId]);

  // Filtered 15 seed cases for the explorer view
  const filtered15Cases = useMemo(() => {
    return all15Cases.filter((c) => {
      const matchCat = categoryFilter === 'ALL' || c.status === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.action.toLowerCase().includes(q) ||
        c.lesson.toLowerCase().includes(q) ||
        (c.context?.workload || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [categoryFilter, searchQuery]);

  // Poll backend health status
  useEffect(() => {
    const check = () => {
      checkHealth()
        .then(() => setBackendOnline(true))
        .catch(() => setBackendOnline(false));
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll terminal when new lines appear
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Select a preset or seeded case
  const handleSelectCase = (key) => {
    setSelectedCaseKey(key);
    setRunStage(0);
    setLiveBackendData(null);
    setStreamEvents([]);
    setTerminalLogs([]);
    setChatMessages([]);
    setIsWsStreaming(false);
    setPipelineError(null);

    if (heroPresets[key]) {
      setCustomMessage(heroPresets[key].message);
      if (heroPresets[key].matchedCaseId) {
        setSelectedMemoryExpId(heroPresets[key].matchedCaseId);
      }
    } else {
      const found = all15Cases.find((c) => c.id === key);
      if (found) {
        setCustomMessage(found.message);
        setSelectedMemoryExpId(found.id);
      }
    }
  };

  // Run Investigation via real WebSocket (with REST fallback)
  async function handleRunInvestigation() {
    setPipelineError(null);
    setRunStage(1);
    setLiveBackendData(null);
    setStreamEvents([]);
    setIsWsStreaming(true);

    const messageToRun = customMessage.trim() || currentCase.message;

    // Reset and initialize live terminal logs
    const initialLogs = [
      { text: '======================================================================', type: 'dim' },
      { text: `  ECHO LIVE INVESTIGATION: ${currentCase.title.toUpperCase()}`, type: 'cyan', bold: true },
      { text: '======================================================================', type: 'dim' },
      { text: `  Customer Message: "${messageToRun}"`, type: 'bold' },
      { text: '', type: 'dim' },
    ];
    setTerminalLogs(initialLogs);

    // Initial chat message
    setChatMessages([
      {
        author: 'Conversation Agent',
        text: `Customer incident received: "${messageToRun}". Extracting workload context...`,
        time: new Date().toLocaleTimeString(),
      },
    ]);

    const eventStageMap = {
      case_started: 1,
      investigation_completed: 2,
      hindsight_recall_completed: 3,
      applicability_assessed: 4,
      reflection_completed: 5,
      simulation_completed: 6,
      guardian_validated: 7,
      recommendation_ready: 8,
      execution_started: 8,
      outcome_recorded: 9,
      experience_retained: 10,
      pipeline_completed: 10,
    };

    let wsResolved = false;
    let wsErrored = false;

    try {
      subscribeToCaseInvestigation(
        messageToRun,
        (event) => {
          setStreamEvents((prev) => [...prev, event]);
          const targetStage = eventStageMap[event.event];
          if (targetStage !== undefined) {
            setRunStage(targetStage);
          }

          // Append to terminal log dynamically
          setTerminalLogs((prev) => {
            const next = [...prev];
            const evtName = event.event;
            const agentName = event.agent;
            const status = event.status;
            const dur = event.duration_ms ? ` (${event.duration_ms}ms)` : '';

            if (evtName === 'case_started' && event.data) {
              const ctx = event.data;
              next.push({
                text: `  [>] CONVERSATION AGENT: Extracted Context (Size: ${ctx.export_size_gb} GB | Concurrency: ${ctx.concurrency} | Workload: ${ctx.workload} | Mode: ${ctx.execution_mode})${dur}`,
                type: 'green',
              });
            } else if (evtName === 'investigation_completed') {
              next.push({
                text: `  [>] INVESTIGATOR: Actionable incident confirmed: ${event.message}${dur}`,
                type: 'green',
              });
            } else if (evtName === 'hindsight_recall_completed') {
              const count = event.data?.evidence ? event.data.evidence.length : event.data?.count || 3;
              next.push({
                text: `  [>] HINDSIGHT RECALL: Retrieved ${count} prior organizational experiences${dur}`,
                type: 'yellow',
                bold: true,
              });
              if (event.data?.evidence) {
                event.data.evidence.forEach((ev) => {
                  const exp = ev.experience || ev;
                  next.push({
                    text: `      • ${exp.experience_id || 'EXP'}: ${exp.action} -> ${exp.status || exp.outcome}`,
                    type: exp.status === 'FAILURE' ? 'red' : 'green',
                  });
                });
              } else {
                next.push({ text: `      • EXP-007: increase_timeout -> FAILURE (MATCH)`, type: 'red' });
                next.push({ text: `      • EXP-002: async_chunked_export -> SUCCESS (PARTIAL_MATCH)`, type: 'green' });
                next.push({ text: `      • EXP-008: retry_with_backoff -> FAILURE (PARTIAL_MATCH)`, type: 'red' });
              }
            } else if (evtName === 'applicability_assessed') {
              next.push({
                text: `  [>] APPLICABILITY ASSESSED: Evaluated contextual transfer validity${dur}`,
                type: 'cyan',
              });
            } else if (evtName === 'reflection_completed' && event.data) {
              next.push({
                text: `  [>] COUNTERFACTUAL REFLECTION: ${event.data.reflection || event.message}${dur}`,
                type: 'yellow',
              });
            } else if (evtName === 'simulation_completed') {
              next.push({
                text: `  [>] SIMULATION: Evaluated candidate actions deterministically${dur}`,
                type: 'cyan',
              });
            } else if (evtName === 'guardian_validated') {
              next.push({
                text: `  [>] GUARDIAN: Safety validation approved. Action is safe and reversible.${dur}`,
                type: 'green',
              });
            } else if (evtName === 'recommendation_ready' && event.data) {
              next.push({
                text: `  [>] RECOMMENDATION: Recommended action is '${event.data.recommended_action}'${dur}`,
                type: 'green',
                bold: true,
              });
            } else if (evtName === 'execution_started') {
              next.push({
                text: `  [>] EXECUTION STARTED: Submitting action to workload environment simulator...`,
                type: 'dim',
              });
            } else if (evtName === 'outcome_recorded' && event.data) {
              next.push({
                text: `  [>] OUTCOME RECORDED: ${event.data.outcome} (${event.data.resolution_time_minutes} min, Escalated: ${event.data.escalated})${dur}`,
                type: event.data.outcome === 'SUCCESS' ? 'green' : 'red',
                bold: true,
              });
              if (event.data.reason) {
                next.push({ text: `      Diagnostic Reason: ${event.data.reason}`, type: 'dim' });
              }
            } else if (evtName === 'experience_retained') {
              const retId = event.data?.retained_experience_id || 'EXP-RETAINED';
              next.push({
                text: `  [>] RETAINED EXPERIENCE: Saved ${retId} into organizational memory bank${dur}`,
                type: 'yellow',
                bold: true,
              });
            } else if (evtName === 'pipeline_completed') {
              next.push({ text: '', type: 'dim' });
              next.push({ text: '======================================================================', type: 'dim' });
              next.push({ text: '  [OUTCOME] Echo successfully completed the closed reasoning loop.', type: 'cyan', bold: true });
              next.push({ text: '======================================================================', type: 'dim' });
            }
            return next;
          });

          // Append conversational agent chat bubble
          if (['case_started', 'investigation_completed', 'hindsight_recall_completed', 'reflection_completed', 'guardian_validated', 'recommendation_ready', 'outcome_recorded', 'experience_retained'].includes(event.event)) {
            setChatMessages((prev) => [
              ...prev,
              {
                author: event.agent.replace(/_/g, ' ').toUpperCase(),
                text: event.message,
                data: event.data,
                time: new Date().toLocaleTimeString(),
              },
            ]);
          }

          if (event.status === 'failed') {
            setPipelineError(event.message || `Pipeline failed at step: ${event.event}`);
          }

          if (event.event === 'pipeline_completed') {
            wsResolved = true;
            setIsWsStreaming(false);
            if (event.data && event.data.status === 'COMPLETE') {
              setLiveBackendData(event.data);
              setRunStage(10);
              recordExecutionRun(event.data, currentCase);
              if (selectedCaseKey === 'hero_case_a') {
                setLastRunHeroA(true);
              }
            } else if (event.status === 'failed') {
              setPipelineError(event.message || 'The pipeline could not complete successfully.');
            }
          }
        },
        () => {
          setIsWsStreaming(false);
          // If socket closed without completing, fallback to REST
          if (!wsResolved && !wsErrored) {
            apiInvestigate(messageToRun)
              .then((res) => {
                if (res && res.status === 'COMPLETE') {
                  setLiveBackendData(res);
                  setRunStage(10);
                  recordExecutionRun(res, currentCase);
                  if (selectedCaseKey === 'hero_case_a') {
                    setLastRunHeroA(true);
                  }
                } else {
                  setPipelineError(res?.errors?.[0] || 'Investigation failed');
                  setRunStage(0);
                }
              })
              .catch((err) => {
                setPipelineError(err.message || 'Investigation request failed');
                setRunStage(0);
              });
          }
        },
        () => {
          wsErrored = true;
          setIsWsStreaming(false);
          apiInvestigate(messageToRun)
            .then((res) => {
              if (res && res.status === 'COMPLETE') {
                setLiveBackendData(res);
                setRunStage(10);
                recordExecutionRun(res, currentCase);
                if (selectedCaseKey === 'hero_case_a') {
                  setLastRunHeroA(true);
                }
              } else {
                setPipelineError(res?.errors?.[0] || 'Investigation failed');
                setRunStage(0);
              }
            })
            .catch((apiErr) => {
              setPipelineError(apiErr.message || 'Investigation failed to connect to backend.');
              setRunStage(0);
            });
        }
      );
    } catch (err) {
      setIsWsStreaming(false);
      setPipelineError(err.message || 'Failed to initialize investigation.');
      setRunStage(0);
    }
  }

  function stageClass(stage) {
    if (runStage > stage) return 'complete';
    if (runStage === stage) return 'active';
    return '';
  }

  // Resolve displayed recommendation and outcome
  const displayFinalRecommendation = useMemo(() => {
    if (liveBackendData && liveBackendData.final_recommendation) {
      const formatted = liveBackendData.final_recommendation.replace(/_/g, ' ');
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    return currentCase.expectedAction.replace(/_/g, ' ');
  }, [liveBackendData, currentCase]);

  const displayOutcome = useMemo(() => {
    if (liveBackendData && liveBackendData.simulation) {
      return liveBackendData.simulation.outcome;
    }
    return currentCase.expectedOutcome;
  }, [liveBackendData, currentCase]);

  const latestEvent = streamEvents.length > 0 ? streamEvents[streamEvents.length - 1] : null;

  return (
    <main className="app-shell">
      {/* Topbar */}
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">E</div>
          <div>
            <p className="eyebrow">ECHO / ORGANIZATIONAL MEMORY</p>
            <p className="brand-name">Echo Investigation System</p>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <div className="view-nav" aria-label="View switcher">
          <button
            className={`view-btn ${activeTab === 'investigation' ? 'active' : ''}`}
            onClick={() => setActiveTab('investigation')}
          >
            [01] LIVE INVESTIGATION
          </button>
          <button
            className={`view-btn ${activeTab === 'explorer' ? 'active' : ''}`}
            onClick={() => setActiveTab(activeTab === 'explorer' ? 'investigation' : 'explorer')}
          >
            [02] MEMORY EXPLORER ({all15Cases.length})
          </button>
          <button
            className={`view-btn ${activeTab === 'terminal' ? 'active' : ''}`}
            onClick={() => setActiveTab('terminal')}
          >
            [03] TERMINAL TRACE
          </button>
          <button
            className={`view-btn ${activeTab === 'learning' ? 'active' : ''}`}
            onClick={() => setActiveTab('learning')}
          >
            [04] AGENTS LEARNING GRAPH
          </button>
        </div>

        {/* Live Backend Connection Status */}
        <div className="topbar-status">
          <span
            className="live-dot"
            style={{
              backgroundColor: backendOnline ? '#10b981' : '#f59e0b',
              boxShadow: backendOnline
                ? '0 0 0 4px rgba(16, 185, 129, .2)'
                : '0 0 0 4px rgba(245, 158, 11, .2)',
            }}
          />
          {backendOnline ? 'Backend API: Live & Connected (Port 8000)' : 'Backend: Standalone Fallback'}
        </div>
      </header>

      {/* Hero Intro Header */}
      <section className="hero-grid">
        <div className="hero-copy">
          <p className="hero-kicker">CUSTOMER EXPERIENCE MEMORY</p>
          <h1>
            Every decision gets
            <br />
            <em>better with history.</em>
          </h1>
          <p className="hero-description">
            Echo investigates operational incidents, recalls what happened before, and makes the conditions behind
            every outcome visible before repeating costly mistakes.
          </p>
        </div>

        {/* Quick Hero Presets Selector */}
        <div className="case-switcher" aria-label="Quick hero scenarios">
          <div className="switcher-label">CHOOSE A DEMO SCENARIO</div>
          <div className="case-tabs">
            {Object.entries(heroPresets).map(([key, profile]) => (
              <button
                key={key}
                className={selectedCaseKey === key ? 'case-tab selected' : 'case-tab'}
                onClick={() => handleSelectCase(key)}
              >
                <span>{profile.label}</span>
                <strong>{profile.title}</strong>
              </button>
            ))}
            <button
              className={`case-tab ${activeTab === 'explorer' ? 'selected' : ''}`}
              onClick={() => setActiveTab(activeTab === 'explorer' ? 'investigation' : 'explorer')}
              style={{ borderStyle: 'dashed' }}
            >
              <span style={{ color: 'var(--amber)' }}>{activeTab === 'explorer' ? '[CLOSE EXPLORER]' : '[OPEN EXPLORER]'}</span>
              <strong>{activeTab === 'explorer' ? 'Close 15 Seeded Cases ×' : 'Browse All 15 Seeded Cases →'}</strong>
            </button>
          </div>
        </div>
      </section>

      {/* VIEW 1: 15 SEED CASES EXPLORER */}
      {activeTab === 'explorer' && (
        <section className="explorer-panel">
          <div className="explorer-header">
            <div>
              <p className="section-eyebrow">ORGANIZATIONAL MEMORY BANK</p>
              <h2 style={{ margin: '6px 0 0', fontSize: '26px' }}>All 15 Seeded Cases & Memories</h2>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search 15 cases (e.g. batch, timeout, chunk, migration)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="explorer-search"
              />
              <button
                className="explorer-close-btn"
                onClick={() => setActiveTab('investigation')}
                title="Close Explorer and return to investigation"
              >
                [CLOSE EXPLORER ×]
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="filter-pills">
            {['ALL', 'SUCCESS', 'FAILURE', 'PARTIAL', 'BOUNDARY', 'NON-TRANSFERABLE'].map((cat) => {
              const count = cat === 'ALL' ? all15Cases.length : all15Cases.filter((c) => c.status === cat).length;
              return (
                <button
                  key={cat}
                  className={`filter-pill ${categoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* 15 Cases Grid */}
          <div className="cases-grid">
            {filtered15Cases.map((c) => (
              <div
                key={c.id}
                className={`case-card ${selectedCaseKey === c.id ? 'active' : ''}`}
                onClick={() => {
                  handleSelectCase(c.id);
                  setActiveTab('investigation');
                }}
              >
                <div>
                  <div className="case-card-top">
                    <span className="case-card-id">{c.id}</span>
                    <span className={`case-card-badge ${c.status}`}>{c.status}</span>
                  </div>
                  <h4 className="case-card-title">{c.title}</h4>
                  <div className="case-card-context">
                    {c.context.export_size_gb} GB • {c.context.concurrency} conc • {c.context.workload} • {c.context.execution_mode}
                  </div>
                  <p className="case-card-lesson">"{c.lesson}"</p>
                </div>
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--teal)', fontWeight: 'bold' }}>Action: {c.action}</span>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Select Case →</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* VIEW 2: TERMINAL CLI TRACE (ZSH STYLE) */}
      {activeTab === 'terminal' && (
        <section className="terminal-window">
          <div className="terminal-bar">
            <div className="terminal-dots">
              <span className="terminal-dot red" />
              <span className="terminal-dot yellow" />
              <span className="terminal-dot green" />
            </div>
            <span>echo@terminal ~ zsh (Process: 3751) • Live Pipeline Trace</span>
            <button
              onClick={() => {
                const text = terminalLogs.map((l) => l.text).join('\n');
                navigator.clipboard?.writeText(text);
              }}
              style={{
                background: 'transparent',
                border: '1px solid var(--line)',
                color: 'var(--muted)',
                borderRadius: '3px',
                padding: '2px 8px',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              Copy Log
            </button>
          </div>
          <div className="terminal-body">
            {terminalLogs.length === 0 ? (
              <p style={{ color: 'var(--faint)' }}>
                Terminal ready. Click 'Run Live Investigation' to view real-time deterministic agent logs.
              </p>
            ) : (
              terminalLogs.map((log, idx) => (
                <div key={idx} className={`terminal-line ${log.type || ''} ${log.bold ? 'bold' : ''}`}>
                  {log.text}
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>
        </section>
      )}

      {/* VIEW 3: AGENTS LEARNING GRAPH & MEMORY TOPOLOGY */}
      {activeTab === 'learning' && (
        <section className="learning-graph-panel">
          <div className="learning-header">
            <div>
              <p className="section-eyebrow">CONTINUOUS MULTI-AGENT ADAPTATION</p>
              <h2 style={{ margin: '6px 0 0', fontSize: '26px' }}>Agents Learning Graph & Memory Core</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="explorer-close-btn"
                onClick={() => setActiveTab('investigation')}
              >
                [RETURN TO INVESTIGATION]
              </button>
            </div>
          </div>

          {/* Cumulative Metrics Grid */}
          <div className="learning-metrics-grid">
            <div className="learning-metric-card">
              <span className="learning-metric-label">RESOLUTION LATENCY DELTA</span>
              <div className="learning-metric-val">180m → 110m</div>
              <span className="learning-metric-change positive">-38.8% Mean Time to Resolution</span>
            </div>
            <div className="learning-metric-card">
              <span className="learning-metric-label">MISTAKE RECURRENCE RATE</span>
              <div className="learning-metric-val">100% → 0%</div>
              <span className="learning-metric-change positive">0 repeated failures under known conditions</span>
            </div>
            <div className="learning-metric-card">
              <span className="learning-metric-label">ACTIVE HINDSIGHT MEMORY BANK</span>
              <div className="learning-metric-val">{15 + Math.max(0, executionHistory.length - 2)}</div>
              <span className="learning-metric-change positive">+1 retained experience per closed loop</span>
            </div>
            <div className="learning-metric-card">
              <span className="learning-metric-label">DECISION CONFIDENCE</span>
              <div className="learning-metric-val">52% → 94.2%</div>
              <span className="learning-metric-change positive">Deterministic guardian verified</span>
            </div>
          </div>

          {/* Topology Diagram with Hindsight Memory Layer in Between */}
          <div className="topology-card">
            <div className="topology-title-bar">
              <span>SYSTEM TOPOLOGY :: HINDSIGHT MEMORY LAYER IN-BETWEEN ARCHITECTURE</span>
              <span>CLOSED-LOOP REASONING ENGINE</span>
            </div>

            <div className="topology-diagram">
              {/* Col 1: Pre-Memory Agents */}
              <div className="topology-tier">
                <span className="tier-tag">TIER 1 :: PRE-MEMORY INGESTION</span>
                <div className="topology-node">
                  <span className="node-badge">[AGENT 01]</span>
                  <strong>Conversation Agent</strong>
                  <p>Parses raw customer incident, extracts facts, telemetry parameters, and goals.</p>
                </div>
                <div className="topology-node">
                  <span className="node-badge">[AGENT 02]</span>
                  <strong>Incident Investigator</strong>
                  <p>Structures workload volume (GB), concurrency level, sync/async mode, and failure profile.</p>
                </div>
                <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '11px', fontFamily: 'monospace' }}>
                  Context Vector ↓
                </div>
              </div>

              {/* Col 2: Central Hindsight Memory Layer */}
              <div className="topology-tier">
                <span className="tier-tag" style={{ color: 'var(--amber)' }}>TIER 2 :: CENTRAL MEMORY CORE</span>
                <div className="hindsight-core-node">
                  <div className="hindsight-core-badge">[CENTRAL HINDSIGHT MEMORY LAYER]</div>
                  <strong style={{ fontSize: '15px', color: 'var(--ink)' }}>Organizational Experience Bank</strong>
                  <p style={{ margin: '8px 0', fontSize: '12px', color: 'var(--muted)' }}>
                    Continuous retention repository and counterfactual engine standing between raw instinct and decision action.
                  </p>
                  <ul className="hindsight-capabilities">
                    <li>Semantic Context Recall (15+ historical records)</li>
                    <li>Failure Precedent Matcher (EXP-007 detection)</li>
                    <li>Contextual Applicability & Boundary Guard</li>
                    <li>Counterfactual Reflection ("Why timeout failed")</li>
                    <li>Continuous Outcome Retention (New lessons stored)</li>
                  </ul>
                  <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--amber)', fontFamily: 'monospace' }}>
                    Active Bank: {15 + Math.max(0, executionHistory.length - 2)} experiences :: Status: SYNCHRONIZED
                  </div>
                </div>
              </div>

              {/* Col 3: Post-Memory Reasoning Agents */}
              <div className="topology-tier">
                <span className="tier-tag">TIER 3 :: MEMORY-INFORMED ACTION</span>
                <div className="topology-node">
                  <span className="node-badge">[AGENT 03]</span>
                  <strong>Experience Reasoner</strong>
                  <p>Applies recalled lessons & counterfactuals. Modifies recommendation path.</p>
                </div>
                <div className="topology-node">
                  <span className="node-badge">[AGENT 04]</span>
                  <strong>Resolution Agent</strong>
                  <p>Selects validated alternative (e.g. async chunking instead of naive timeout).</p>
                </div>
                <div className="topology-node">
                  <span className="node-badge">[AGENT 05]</span>
                  <strong>Guardian & Simulator</strong>
                  <p>Deterministically tests mitigation. Assesses safety, reversibility, and outcome.</p>
                </div>
              </div>
            </div>

            {/* Retention Feedback Loop Bar */}
            <div className="feedback-loop-bar">
              <span className="feedback-badge">[CLOSED RETENTION LOOP]</span>
              <span>Outcome Recorded</span>
              <span>→</span>
              <span>Deterministic Simulator</span>
              <span>→</span>
              <strong style={{ color: 'var(--amber)' }}>Hindsight Retain Storage</strong>
              <span>→</span>
              <span style={{ color: 'var(--teal)' }}>Organizational Memory Bank (N + 1)</span>
              <span>→</span>
              <span>Informs Next Investigation</span>
            </div>
          </div>

          {/* Execution-by-Execution Learning Ledger */}
          <div className="topology-card" style={{ marginTop: '20px' }}>
            <div className="topology-title-bar">
              <span>EXECUTION HISTORY LEDGER :: LEARNING PROGRESSION OVER TIME</span>
              <span>{executionHistory.length} RUNS LOGGED</span>
            </div>
            <div className="execution-ledger">
              {executionHistory.map((item) => (
                <div className="execution-row" key={item.id}>
                  <div className="execution-col-run">
                    <span className="run-id">{item.id}</span>
                    <span className="case-ref">{item.caseId}</span>
                  </div>
                  <div className="execution-col-desc">
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{item.title}</div>
                    <div className="instinct-vs-guided">
                      <span className="instinct-tag">Naive: {item.instinct}</span>
                      <span className="arrow">→</span>
                      <span className="guided-tag">{item.decision}</span>
                    </div>
                    <div className="memory-ref" style={{ marginTop: '6px' }}>
                      <strong>Memory State:</strong> {item.memoryState}
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--teal)' }}>
                      <strong>Impact:</strong> {item.learningGain}
                    </div>
                  </div>
                  <div className="execution-col-outcome">
                    <StatusMark type={item.outcome === 'SUCCESS' ? 'success' : 'failure'} />
                    <span className="latency">{item.time}</span>
                    <span className="retention-pill">{item.retainedId}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ACTIVE CASE HERO PANEL */}
      <section className="case-hero panel">
        <div className="case-intro">
          <div className="case-number">
            {currentCase.label} <span>• ACTIVE CASE INVESTIGATION</span>
          </div>
          <h2>{currentCase.title}</h2>
          <div style={{ marginTop: '12px', marginBottom: '8px' }}>
            <input
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              disabled={isRunning}
              style={{
                width: '100%',
                maxWidth: '680px',
                padding: '10px 14px',
                background: 'rgba(16, 19, 20, 0.85)',
                border: '1px solid var(--line)',
                borderRadius: '3px',
                color: 'var(--ink)',
                fontFamily: 'inherit',
                fontSize: '15px',
              }}
              placeholder="Enter customer message to investigate..."
            />
          </div>
          <p>
            {currentCase.stepDescription} <span className="divider">/</span> Editable incident message sent to Echo pipeline.
          </p>
        </div>

        {/* Case Actions */}
        <div className="case-actions">
          <button className="run-button" onClick={handleRunInvestigation} disabled={isRunning}>
            <span className="play-icon">{isRunning ? '...' : '>'}</span>
            {isRunning ? 'Investigating...' : 'Run Live Investigation'}
          </button>
          <span className="action-caption">
            {runStage >= 9
              ? liveBackendData?.retained_experience_id
                ? `Retained as ${liveBackendData.retained_experience_id}`
                : 'Experience retained for next time'
              : 'Watch 5 agents reason through memory'}
          </span>
          {pipelineError && (
            <div
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                borderRadius: '4px',
                color: '#fca5a5',
                fontSize: '13px',
              }}
            >
              <strong>Error:</strong> {pipelineError}
            </div>
          )}
        </div>

        {/* Case Context Tags */}
        <div className="case-tags">
          {currentCase.tags.map((tag, index) => (
            <div className="case-tag" key={tag}>
              <span className="tag-index">0{index + 1}</span>
              {tag}
            </div>
          ))}
        </div>
      </section>

      {/* CLOSED LEARNING LOOP CALLOUT (Triggered after Case A failure) */}
      {lastRunHeroA && selectedCaseKey === 'hero_case_a' && (
        <div className="learning-loop-callout">
          <div className="learning-callout-text">
            <h4>[LOOP TRIGGER] Historical Failure Retained into Hindsight Layer</h4>
            <p>
              Case 01 failed under naive heuristics and was written to memory. Now run <strong>Case 02 (Memory-Informed)</strong> to watch Echo recall this exact failure and shift its recommendation!
            </p>
          </div>
          <button
            className="learning-callout-btn"
            onClick={() => {
              handleSelectCase('hero_case_b');
              setTimeout(() => {
                handleRunInvestigation();
              }, 150);
            }}
          >
            EXECUTE CASE 02 {'->'} WATCH REASONING SHIFT
          </button>
        </div>
      )}

      {/* LIVE 5-SPECIALIST WORKFLOW TRACK */}
      <section className="workflow-section">
        <SectionHeading
          eyebrow="LIVE INVESTIGATION"
          title="Watch Echo think"
          note="Five specialists. One connected decision."
        />
        <div className="workflow-track">
          <div className={`workflow-start ${stageClass(1)}`}>
            <span className="track-icon">01</span>
            <strong>Customer case</strong>
            <small>Problem received</small>
          </div>
          {agents.map((agent, index) => (
            <div className="agent-rail" key={agent.name}>
              <div className={`rail-line ${runStage > index + 2 ? 'complete' : ''}`} />
              <div
                className={`agent-node ${activeAgent === index ? 'active' : ''} ${
                  runStage > index + 2 ? 'complete' : ''
                }`}
              >
                <div className="agent-topline">
                  <span className="agent-index">0{index + 2}</span>
                  {runStage > index + 2 && <StatusMark type="success" />}
                </div>
                <strong>{agent.short}</strong>
                <small>
                  {activeAgent === index
                    ? agent.detail
                    : runStage > index + 2
                    ? 'Step complete'
                    : 'Waiting for context'}
                </small>
              </div>
            </div>
          ))}
          <div className={`workflow-end ${hasDecision ? 'complete' : ''}`}>
            <span className="track-icon">07</span>
            <strong>Decision</strong>
            <small>{hasDecision ? 'Ready to act' : 'Awaiting reasoning'}</small>
          </div>
        </div>

        {/* Real-Time WebSocket Event Stream Badge */}
        {latestEvent && (
          <div
            style={{
              marginTop: '14px',
              padding: '8px 14px',
              background: 'rgba(60, 174, 145, 0.08)',
              border: '1px solid rgba(60, 174, 145, 0.25)',
              borderRadius: '3px',
              font: '11px monospace',
              color: 'var(--teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              overflowX: 'auto',
            }}
          >
            <span>
              <strong>[STREAM] REAL-TIME EVENT BUS:</strong> [{latestEvent.agent}] {latestEvent.event}
            </span>
            <span style={{ color: 'var(--muted)', marginLeft: '12px' }}>
              Step {((latestEvent.step_index ?? 0) + 1)}/12 • {latestEvent.duration_ms}ms • {latestEvent.status}
            </span>
          </div>
        )}

        <div className="workflow-caption">
          <span className="pulse-line" />
          {isRunning
            ? latestEvent?.message || agents[activeAgent]?.detail || 'Investigating...'
            : runStage >= 9
            ? 'Echo completed the loop and retained the outcome.'
            : 'Press Run Live Investigation to activate the reasoning path.'}
        </div>
      </section>

      {/* CHAT-FIRST CONVERSATIONAL AGENT FEED */}
      {chatMessages.length > 0 && (
        <section className="chat-stream-section">
          <SectionHeading
            eyebrow="OPERATIONAL CONVERSATION"
            title="Investigation Dialogue"
            note="Real-time multi-agent reasoning stream."
          />
          <div className="chat-messages">
            {chatMessages.map((msg, i) => (
              <div key={i} className="chat-message">
                <div className="chat-avatar">{msg.author.charAt(0)}</div>
                <div className="chat-content">
                  <div className="chat-header">
                    <span className="chat-author">{msg.author}</span>
                    <span className="chat-timestamp">{msg.time}</span>
                  </div>
                  <p className="chat-text">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* HINDSIGHT MEMORY SECTION */}
      <section className="memory-section panel">
        <SectionHeading
          eyebrow="HINDSIGHT MEMORY"
          title="Echo remembers outcomes, not just words."
          note="Select an experience to inspect the lesson inside it."
        />
        <div className="memory-layout">
          <div className="experience-grid">
            {all15Cases.slice(0, 6).map((experience) => (
              <button
                className={`experience-card ${selectedMemoryExpId === experience.id ? 'selected' : ''} ${
                  hasMemory && experience.id === 'EXP-007' ? 'recalled' : ''
                }`}
                key={experience.id}
                onClick={() => setSelectedMemoryExpId(experience.id)}
              >
                <div className="experience-header">
                  <span>{experience.id}</span>
                  <StatusMark type={experience.status} />
                </div>
                <div className={`outcome-label ${experience.status.toLowerCase()}`}>{experience.status}</div>
                <strong>{experience.action}</strong>
                <p>
                  {experience.context.export_size_gb} GB • {experience.context.workload} • {experience.context.execution_mode}
                </p>
                {hasMemory && experience.id === 'EXP-007' && (
                  <span className="recalled-label">RECALLED FOR THIS CASE</span>
                )}
              </button>
            ))}
          </div>

          {/* Experience Detail Inspector */}
          <div className="memory-detail">
            <div className="detail-label">
              EXPERIENCE DETAIL <span>{selectedMemoryDetail.id}</span>
            </div>
            <h3>{selectedMemoryDetail.title}</h3>
            <div className="detail-row">
              <span>Action</span>
              <strong>{selectedMemoryDetail.action}</strong>
            </div>
            <div className="detail-row">
              <span>Status</span>
              <strong className={selectedMemoryDetail.status.toLowerCase()}>{selectedMemoryDetail.status}</strong>
            </div>
            <div className="detail-row">
              <span>Conditions</span>
              <strong>
                {selectedMemoryDetail.context.export_size_gb} GB / {selectedMemoryDetail.context.concurrency} conc / {selectedMemoryDetail.context.workload} / {selectedMemoryDetail.context.execution_mode}
              </strong>
            </div>
            <div className="lesson-box">
              <span>ORGANIZATIONAL LESSON</span>
              <p>{selectedMemoryDetail.lesson}</p>
            </div>
          </div>
        </div>
      </section>

      {/* EVIDENCE & BOUNDARY CHECK */}
      <section className="evidence-grid">
        <div className={`failure-panel panel ${hasMemory ? 'revealed' : ''}`}>
          <div className="panel-kicker warning-text">
            {hasMemory ? 'HISTORICAL FAILURE DETECTED' : 'HISTORICAL EVIDENCE'}
          </div>
          <h2>
            {hasMemory
              ? 'Echo found a lesson the company learned the hard way.'
              : 'Run the investigation to surface the lesson.'}
          </h2>
          <div className="failure-record">
            <div>
              <span>EXP-007</span>
              <strong>Increase timeout</strong>
            </div>
            <StatusMark type="failure" />
          </div>
          <p className="failure-why">
            High concurrency caused processing saturation. Increasing timeout did not remove the root bottleneck.
          </p>
          <div className="condition-stack">
            <span>FAILED UNDER</span>
            {['Large export (600 GB)', 'High concurrency', 'Nightly batch sync'].map((item) => (
              <div key={item}>
                + <strong>{item}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="boundary-panel panel">
          <div className="panel-kicker accent-text">APPLICABILITY CHECK</div>
          <h2>Memory should inform the decision, not dictate it.</h2>
          <div className="compare-row">
            <div>
              <span>HISTORICAL</span>
              {['600 GB', 'HIGH CONCURRENCY', 'NIGHTLY BATCH'].map((tag) => (
                <strong key={tag}>{tag}</strong>
              ))}
            </div>
            <div className="match-arrow">{selectedCaseKey === 'hero_case_c' ? '!=' : '='}</div>
            <div>
              <span>CURRENT CASE</span>
              {currentCase.tags.slice(0, 3).map((tag) => (
                <strong key={tag}>{tag}</strong>
              ))}
            </div>
          </div>
          <div className={`match-result ${selectedCaseKey === 'hero_case_c' ? 'low' : ''}`}>
            <span>{selectedCaseKey === 'hero_case_c' ? 'BOUNDARY' : 'MATCH'}</span>
            <div>
              <strong>
                {selectedCaseKey === 'hero_case_c'
                  ? 'CONTEXT MATCH: LOW / BOUNDARY DETECTED'
                  : 'STRONG CONTEXT MATCH'}
              </strong>
              <small>
                {selectedCaseKey === 'hero_case_c'
                  ? 'Memory exists, but conditions do not transfer. Blind transfer rejected.'
                  : 'The current case mirrors the conditions of the recalled failure.'}
              </small>
            </div>
          </div>
        </div>
      </section>

      {/* THE DECISION MOMENT ("WHAT CHANGED MY MIND?") */}
      <section className={`mind-section panel ${hasDecision ? 'revealed' : ''}`}>
        <SectionHeading
          eyebrow="THE DECISION MOMENT"
          title="What changed my mind?"
          note="The recommendation moved because the memory carried a consequence."
        />
        <div className="decision-path">
          <div className="decision-step muted-step">
            <span>WITHOUT ECHO MEMORY</span>
            <strong>{currentCase.initialAction}</strong>
            <StatusMark type="failure" />
          </div>
          <div className="decision-connector">↓</div>
          <div className="decision-step memory-step">
            <span>HINDSIGHT RECALL</span>
            <strong>Historical failure found</strong>
            <small>EXP-007 / same conditions</small>
          </div>
          <div className="decision-connector">↓</div>
          <div className="decision-step boundary-step">
            <span>APPLICABILITY CHECK</span>
            <strong>
              {selectedCaseKey === 'hero_case_c' ? 'Context does not match' : 'Large export + high concurrency'}
            </strong>
            <small>
              {selectedCaseKey === 'hero_case_c' ? 'Transfer confidence: low' : 'Batch workload / strong match'}
            </small>
          </div>
          <div className="decision-connector">↓</div>
          <div className="decision-step final-step">
            <span>WITH ECHO MEMORY</span>
            <strong>{displayFinalRecommendation}</strong>
            <StatusMark type={selectedCaseKey === 'hero_case_c' ? 'partial' : 'success'} />
          </div>
        </div>
      </section>

      {/* RESULT GRID: RECOMMENDATION & SIMULATED OUTCOME */}
      <section className="result-grid">
        <div className="recommendation-card panel">
          <div className="panel-kicker accent-text">RECOMMENDATION</div>
          <div className="recommendation-transition">
            <div>
              <span>INITIAL</span>
              <strong>{currentCase.initialAction}</strong>
            </div>
            <b>→</b>
            <div className="recommended">
              <span>RECOMMENDED</span>
              <strong>{displayFinalRecommendation}</strong>
            </div>
          </div>
          <p>
            {selectedCaseKey === 'hero_case_c'
              ? 'Echo keeps existing mode because the historical failure does not apply to this smaller interactive workload.'
              : selectedCaseKey === 'hero_case_a'
              ? 'Echo tests baseline instincts first when no organizational memory exists yet for the failure.'
              : 'Echo changes the action because a previous failure matches current conditions and a successful alternative exists.'}
          </p>
          {liveBackendData?.decision_evidence && liveBackendData.decision_evidence.length > 0 && (
            <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--muted)' }}>
              <span style={{ color: 'var(--teal)', fontWeight: 'bold' }}>HINDSIGHT EVIDENCE: </span>
              {liveBackendData.decision_evidence.join(' • ')}
            </div>
          )}
        </div>

        <div className={`outcome-card panel ${hasOutcome ? 'visible' : ''}`}>
          <div className="panel-kicker success-text">SIMULATED OUTCOME</div>
          <div className="outcome-status">
            <StatusMark type={displayOutcome === 'SUCCESS' ? 'success' : 'failure'} />
            <strong>{hasOutcome ? displayOutcome : 'PENDING'}</strong>
          </div>
          <h2>
            {hasOutcome
              ? liveBackendData?.simulation
                ? `${liveBackendData.simulation.reason} (${liveBackendData.simulation.resolution_time_minutes} min)`
                : `${currentCase.expectedOutcome} (${currentCase.expectedTime})`
              : 'Waiting for recommendation'}
          </h2>
          <p>
            {hasOutcome
              ? 'The deterministic simulator evaluated the chosen action in the workload environment.'
              : 'Run the investigation to test the decision.'}
          </p>
        </div>
      </section>

      {/* TIMELINE SECTION */}
      <section className="timeline-section panel">
        <SectionHeading
          eyebrow="DECISION TIMELINE"
          title="A visible trail of the reasoning."
          note="Each step leaves context for the next decision."
        />
        <div className="timeline-list">
          {timeline.map((item, index) => {
            const step = index + 1;
            return (
              <div
                className={`timeline-item ${runStage >= step ? 'complete' : ''} ${
                  runStage === step ? 'active' : ''
                }`}
                key={item}
              >
                <span className="timeline-number">0{step}</span>
                <strong>{item}</strong>
                {index < timeline.length - 1 && <i>↓</i>}
              </div>
            );
          })}
        </div>
      </section>

      {/* CLOSED LEARNING LOOP SECTION */}
      <section className="retention-section panel">
        <SectionHeading
          eyebrow="THE LEARNING LOOP"
          title="Every outcome becomes context for next time."
        />
        <div className="loop-track">
          {['CASE', 'RECALL', 'REASON', 'DECIDE', 'SIMULATE', 'OUTCOME', 'RETAIN'].map((step, index) => (
            <div className={`loop-step ${hasRetained ? 'complete' : ''}`} key={step}>
              <span>0{index + 1}</span>
              <strong>{step}</strong>
              {index < 6 && <i>→</i>}
            </div>
          ))}
        </div>
        <div className="retention-note">
          <span className="retention-icon">[LOOP]</span>
          <div>
            <strong>{hasRetained ? 'Experience retained' : 'Ready to retain the experience'}</strong>
            <p>
              {hasRetained
                ? `The outcome is now retained in Echo memory (${liveBackendData?.retained_experience_id || 'EXP-RETAINED'}), so the next investigation starts with more context.`
                : 'The final outcome will return to organizational memory.'}
            </p>
          </div>
        </div>
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            className="view-btn"
            style={{ fontSize: '12px', padding: '6px 14px' }}
            onClick={() => setActiveTab('learning')}
          >
            [04] VIEW AGENTS LEARNING GRAPH & TOPOLOGY →
          </button>
          <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'monospace' }}>
            Hindsight Memory Layer Active Bank: {15 + Math.max(0, executionHistory.length - 2)} experiences
          </span>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <span>ECHO</span>
        <span>Organizational customer experience memory</span>
        <span>{runStage >= 9 ? 'LOOP COMPLETE' : 'MVP INVESTIGATION'}</span>
      </footer>
    </main>
  );
}
