import { useEffect, useMemo, useState } from 'react';
import { checkHealth, runInvestigation as apiInvestigate, subscribeToCaseInvestigation } from './services/api';

const defaultExperiences = [
  { id: 'EXP-031', outcome: 'FAILURE', outcomeClass: 'failure', action: 'Increase timeout', conditions: '600 GB / high concurrency / nightly batch', lesson: 'Increasing timeout escalated resource pressure instead of removing the bottleneck.' },
  { id: 'EXP-044', outcome: 'SUCCESS', outcomeClass: 'success', action: 'Async chunked export', conditions: 'Bulk data send / batch workload / chunkable transfer', lesson: 'Chunking reduced saturation and kept the export moving.' },
  { id: 'EXP-067', outcome: 'PARTIAL', outcomeClass: 'partial', action: 'Keep existing mode', conditions: '20 GB / low concurrency / interactive transfer', lesson: 'A smaller interactive workload does not carry the same saturation risk.' },
];

const agents = [
  { name: 'Conversation Agent', short: 'Conversation', detail: 'Understanding the request and structuring the case.' },
  { name: 'Investigator', short: 'Investigator', detail: 'Extracting workload, environment, severity and constraints.' },
  { name: 'Experience Reasoner', short: 'Reasoner', detail: 'Searching organizational memory for outcomes and conditions.' },
  { name: 'Resolution Agent', short: 'Resolution', detail: 'Evaluating candidate actions against what history teaches us.' },
  { name: 'Guardian', short: 'Guardian', detail: 'Checking applicability, confidence and escalation needs.' },
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

const caseProfiles = {
  informed: {
    label: 'CASE 02',
    title: 'Large export timeout',
    message: "Customer's 600 GB nightly export keeps timing out under high concurrency in sync mode.",
    tags: ['600 GB', 'HIGH CONCURRENCY', 'NIGHTLY BATCH', 'SYNCHRONOUS'],
    initial: 'Increase timeout',
    final: 'Async chunked export',
    outcome: 'SUCCESS',
    outcomeText: 'Export completed successfully (110 min)',
    match: 'STRONG CONTEXT MATCH',
    matchText: 'The current case mirrors the conditions of the recalled failure.',
  },
  failure: {
    label: 'CASE 01',
    title: 'First attempt, no memory',
    message: "Customer's 600 GB nightly export keeps timing out under high concurrency in sync mode.",
    tags: ['600 GB', 'HIGH CONCURRENCY', 'NIGHTLY BATCH', 'SYNCHRONOUS'],
    initial: 'Increase timeout',
    final: 'Increase timeout',
    outcome: 'FAILURE',
    outcomeText: 'Export timed out again (180 min, escalated)',
    match: 'MEMORY NOT YET RETAINED',
    matchText: 'The failed outcome becomes the experience Echo remembers next time.',
  },
  boundary: {
    label: 'CASE 03',
    title: 'Interactive transfer',
    message: "Customer's 20 GB interactive export keeps timing out under low concurrency in sync mode.",
    tags: ['20 GB', 'LOW CONCURRENCY', 'INTERACTIVE', 'SYNCHRONOUS'],
    initial: 'Keep existing mode',
    final: 'Keep existing mode',
    outcome: 'SUCCESS',
    outcomeText: 'Transfer completed successfully (8 min)',
    match: 'CONTEXT MATCH: LOW',
    matchText: 'Memory was found, but its conditions do not transfer to this case.',
  },
};

function StatusMark({ type }) {
  return (
    <span className={`status-mark ${type}`} aria-hidden="true">
      {type === 'success' ? 'OK' : type === 'failure' ? 'NO' : 'WAIT'}
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
  const [selectedCase, setSelectedCase] = useState('informed');
  const [customMessage, setCustomMessage] = useState(caseProfiles.informed.message);
  const [runStage, setRunStage] = useState(0);
  const [selectedExperience, setSelectedExperience] = useState('EXP-031');
  const [backendOnline, setBackendOnline] = useState(false);
  const [liveBackendData, setLiveBackendData] = useState(null);
  const [streamEvents, setStreamEvents] = useState([]);
  const [isWsStreaming, setIsWsStreaming] = useState(false);

  const currentCase = caseProfiles[selectedCase];
  const isRunning = runStage > 0 && runStage < 10;
  const hasMemory = runStage >= 4 || selectedCase === 'boundary';
  const hasDecision = runStage >= 7;
  const hasOutcome = runStage >= 8;
  const hasRetained = runStage >= 9;
  const activeAgent = runStage >= 2 && runStage <= 6 ? runStage - 2 : -1;
  const selectedMemory = useMemo(
    () => defaultExperiences.find((exp) => exp.id === selectedExperience) || defaultExperiences[0],
    [selectedExperience]
  );

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

  // Update input text when case preset changes
  const handleCaseSelect = (key) => {
    setSelectedCase(key);
    setCustomMessage(caseProfiles[key].message);
    setRunStage(0);
    setLiveBackendData(null);
    setStreamEvents([]);
    setIsWsStreaming(false);
  };

  // Only use timer fallback if WebSocket is NOT streaming real events
  useEffect(() => {
    if (!isRunning || isWsStreaming) return undefined;
    const timer = window.setTimeout(() => setRunStage((stage) => stage + 1), 650);
    return () => window.clearTimeout(timer);
  }, [isRunning, runStage, isWsStreaming]);

  async function handleRunInvestigation() {
    setRunStage(1);
    setSelectedExperience('EXP-031');
    setLiveBackendData(null);
    setStreamEvents([]);
    setIsWsStreaming(true);

    const messageToRun = customMessage.trim() || currentCase.message;

    // Real-time stage progression mapping from incoming WebSocket events
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

    try {
      let wsResolved = false;
      const socket = subscribeToCaseInvestigation(
        messageToRun,
        (event) => {
          setStreamEvents((prev) => [...prev, event]);
          const targetStage = eventStageMap[event.event];
          if (targetStage !== undefined) {
            setRunStage(targetStage);
          }
          if (event.event === 'pipeline_completed' && event.data) {
            wsResolved = true;
            setLiveBackendData(event.data);
            setRunStage(10);
            setIsWsStreaming(false);
          }
        },
        () => {
          setIsWsStreaming(false);
        },
        async () => {
          // If WebSocket encounters an error, fall back to REST API
          setIsWsStreaming(false);
          if (!wsResolved) {
            try {
              const res = await apiInvestigate(messageToRun);
              if (res) {
                setLiveBackendData(res);
                setRunStage(10);
              }
            } catch {
              // Seamless local fallback
            }
          }
        }
      );

      // Parallel REST backup to guarantee data resolution
      apiInvestigate(messageToRun)
        .then((res) => {
          if (res) setLiveBackendData(res);
        })
        .catch(() => {});
    } catch {
      setIsWsStreaming(false);
    }
  }

  function stageClass(stage) {
    if (runStage > stage) return 'complete';
    if (runStage === stage) return 'active';
    return '';
  }

  // Resolve dynamic vs preset recommendation values
  const displayFinalRecommendation = useMemo(() => {
    if (liveBackendData && liveBackendData.final_recommendation) {
      const formatted = liveBackendData.final_recommendation.replace(/_/g, ' ');
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    return currentCase.final;
  }, [liveBackendData, currentCase]);

  const displayOutcome = useMemo(() => {
    if (liveBackendData && liveBackendData.simulation) {
      return liveBackendData.simulation.outcome;
    }
    return currentCase.outcome;
  }, [liveBackendData, currentCase]);

  const latestEvent = streamEvents.length > 0 ? streamEvents[streamEvents.length - 1] : null;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">E</div>
          <div>
            <p className="eyebrow">ECHO / ORGANIZATIONAL MEMORY</p>
            <p className="brand-name">Echo</p>
          </div>
        </div>
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
          {backendOnline ? 'Backend API: Live & Connected (Port 8000)' : 'Backend: Standalone Demo Mode'}
        </div>
      </header>

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
        <div className="case-switcher" aria-label="Demo cases">
          <div className="switcher-label">CHOOSE A SCENARIO</div>
          <div className="case-tabs">
            {Object.entries(caseProfiles).map(([key, profile]) => (
              <button
                key={key}
                className={selectedCase === key ? 'case-tab selected' : 'case-tab'}
                onClick={() => handleCaseSelect(key)}
              >
                <span>{profile.label}</span>
                <strong>
                  {key === 'informed'
                    ? 'Memory informed (Case 02)'
                    : key === 'failure'
                    ? 'First attempt (Case 01)'
                    : 'Boundary check (Case 03)'}
                </strong>
              </button>
            ))}
          </div>
        </div>
      </section>

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
            {currentCase.problem} <span className="divider">/</span> Editable case message sent to Echo pipeline.
          </p>
        </div>
        <div className="case-actions">
          <button className="run-button" onClick={handleRunInvestigation} disabled={isRunning}>
            <span className="play-icon">{isRunning ? '...' : '>'}</span>
            {isRunning ? 'Investigating...' : 'Run investigation'}
          </button>
          <span className="action-caption">
            {runStage >= 9
              ? liveBackendData?.retained_experience_id
                ? `Retained as ${liveBackendData.retained_experience_id}`
                : 'Experience retained for next time'
              : 'Watch 5 agents reason through memory'}
          </span>
        </div>
        <div className="case-tags">
          {currentCase.tags.map((tag, index) => (
            <div className="case-tag" key={tag}>
              <span className="tag-index">0{index + 1}</span>
              {tag}
            </div>
          ))}
        </div>
      </section>

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

        {/* Real-Time WebSocket Event Stream Badge & Ticker */}
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
              ⚡ <strong>REAL-TIME STREAM:</strong> [{latestEvent.agent}] {latestEvent.event}
            </span>
            <span style={{ color: 'var(--muted)', marginLeft: '12px' }}>
              Step {((latestEvent.step_index ?? 0) + 1)}/12 • {latestEvent.duration_ms}ms • {latestEvent.status}
            </span>
          </div>
        )}

        <div className="workflow-caption">
          <span className="pulse-line" />
          {isRunning
            ? latestEvent?.message || agents[activeAgent]?.detail || 'Preparing the case...'
            : runStage >= 9
            ? 'Echo completed the loop and retained the outcome.'
            : 'Press Run investigation to activate the reasoning path.'}
        </div>
      </section>

      <section className="memory-section panel">
        <SectionHeading
          eyebrow="HINDSIGHT MEMORY"
          title="Echo remembers outcomes, not just words."
          note="Select an experience to inspect the lesson inside it."
        />
        <div className="memory-layout">
          <div className="experience-grid">
            {defaultExperiences.map((experience) => (
              <button
                className={`experience-card ${selectedExperience === experience.id ? 'selected' : ''} ${
                  hasMemory && experience.id === 'EXP-031' ? 'recalled' : ''
                }`}
                key={experience.id}
                onClick={() => setSelectedExperience(experience.id)}
              >
                <div className="experience-header">
                  <span>{experience.id}</span>
                  <StatusMark type={experience.outcomeClass} />
                </div>
                <div className={`outcome-label ${experience.outcomeClass}`}>{experience.outcome}</div>
                <strong>{experience.action}</strong>
                <p>{experience.conditions}</p>
                {hasMemory && experience.id === 'EXP-031' && (
                  <span className="recalled-label">RECALLED FOR THIS CASE</span>
                )}
              </button>
            ))}
          </div>
          <div className="memory-detail">
            <div className="detail-label">
              EXPERIENCE DETAIL <span>{selectedMemory.id}</span>
            </div>
            <h3>{selectedMemory.action}</h3>
            <div className="detail-row">
              <span>Outcome</span>
              <strong className={selectedMemory.outcomeClass}>{selectedMemory.outcome}</strong>
            </div>
            <div className="detail-row">
              <span>Conditions</span>
              <strong>{selectedMemory.conditions}</strong>
            </div>
            <div className="lesson-box">
              <span>LESSON</span>
              <p>{selectedMemory.lesson}</p>
            </div>
          </div>
        </div>
      </section>

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
              <span>EXP-031</span>
              <strong>Increase timeout</strong>
            </div>
            <StatusMark type="failure" />
          </div>
          <p className="failure-why">
            High concurrency caused processing saturation. Increasing timeout did not remove the bottleneck.
          </p>
          <div className="condition-stack">
            <span>FAILED UNDER</span>
            {['Large export', 'High concurrency', 'Nightly batch'].map((item) => (
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
            <div className="match-arrow">{selectedCase === 'boundary' ? '!=' : '='}</div>
            <div>
              <span>CURRENT CASE</span>
              {currentCase.tags.slice(0, 3).map((tag) => (
                <strong key={tag}>{tag}</strong>
              ))}
            </div>
          </div>
          <div className={`match-result ${selectedCase === 'boundary' ? 'low' : ''}`}>
            <span>{selectedCase === 'boundary' ? 'FOUND' : 'OK'}</span>
            <div>
              <strong>
                {selectedCase === 'boundary'
                  ? 'MEMORY FOUND / CONTEXT MATCH: LOW'
                  : currentCase.match}
              </strong>
              <small>
                {selectedCase === 'boundary'
                  ? 'CONTEXT MATCH: NO / TRANSFER CONFIDENCE: LOW'
                  : currentCase.matchText}
              </small>
            </div>
          </div>
        </div>
      </section>

      <section className={`mind-section panel ${hasDecision ? 'revealed' : ''}`}>
        <SectionHeading
          eyebrow="THE DECISION MOMENT"
          title="What changed my mind?"
          note="The recommendation moved because the memory carried a consequence."
        />
        <div className="decision-path">
          <div className="decision-step muted-step">
            <span>WITHOUT ECHO MEMORY</span>
            <strong>{currentCase.initial}</strong>
            <StatusMark type="failure" />
          </div>
          <div className="decision-connector">↓</div>
          <div className="decision-step memory-step">
            <span>HINDSIGHT RECALL</span>
            <strong>Historical failure found</strong>
            <small>EXP-031 / same conditions</small>
          </div>
          <div className="decision-connector">↓</div>
          <div className="decision-step boundary-step">
            <span>APPLICABILITY CHECK</span>
            <strong>
              {selectedCase === 'boundary' ? 'Context does not match' : 'Large export + high concurrency'}
            </strong>
            <small>
              {selectedCase === 'boundary' ? 'Transfer confidence: low' : 'Batch workload / strong match'}
            </small>
          </div>
          <div className="decision-connector">↓</div>
          <div className="decision-step final-step">
            <span>WITH ECHO MEMORY</span>
            <strong>{displayFinalRecommendation}</strong>
            <StatusMark type={selectedCase === 'boundary' ? 'partial' : 'success'} />
          </div>
        </div>
      </section>

      <section className="result-grid">
        <div className="recommendation-card panel">
          <div className="panel-kicker accent-text">RECOMMENDATION</div>
          <div className="recommendation-transition">
            <div>
              <span>INITIAL</span>
              <strong>{currentCase.initial}</strong>
            </div>
            <b>→</b>
            <div className="recommended">
              <span>RECOMMENDED</span>
              <strong>{displayFinalRecommendation}</strong>
            </div>
          </div>
          <p>
            {selectedCase === 'boundary'
              ? 'Echo keeps the existing mode because the historical failure does not apply to this smaller interactive workload.'
              : selectedCase === 'failure'
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
                : currentCase.outcomeText
              : 'Waiting for recommendation'}
          </h2>
          <p>
            {hasOutcome
              ? 'The deterministic simulator evaluated the chosen action in the workload environment.'
              : 'Run the investigation to test the decision.'}
          </p>
        </div>
      </section>

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
          <span className="retention-icon">↺</span>
          <div>
            <strong>{hasRetained ? 'Experience retained' : 'Ready to retain the experience'}</strong>
            <p>
              {hasRetained
                ? `The outcome is now retained in Echo memory (${liveBackendData?.retained_experience_id || 'EXP-RETAINED'}), so the next investigation starts with more context.`
                : 'The final outcome will return to organizational memory.'}
            </p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <span>ECHO</span>
        <span>Organizational customer experience memory</span>
        <span>{runStage >= 9 ? 'LOOP COMPLETE' : 'MVP INVESTIGATION'}</span>
      </footer>
    </main>
  );
}
