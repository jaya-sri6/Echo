import { useState, useRef } from 'react';

export default function LandingPage({
  onEnter,
  onOpenAuth,
  totalExperiences = 18,
  currentUser = null,
  isLoggedIn = false,
  onSignOut,
  onSelectScenario
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuTimeoutRef = useRef(null);

  const problemCards = [
    {
      icon: 'history_toggle_off',
      badge: 'PROBLEM 01',
      badgeColor: 'text-[#ef4444] border-[#ef4444]/30 bg-[#2a1215]',
      title: 'Institutional Amnesia & Lost Incident Wisdom',
      desc: 'Critical production lessons are trapped in dead postmortems, Slack huddles, and Jira tickets. When 3 AM outages hit, engineers and AI agents repeat identical catastrophic mistakes because institutional memory is not accessible.'
    },
    {
      icon: 'search_off',
      badge: 'PROBLEM 02',
      badgeColor: 'text-[#f59e0b] border-[#f59e0b]/30 bg-[#2b2111]',
      title: 'The Fatal Flaw of Standard RAG',
      desc: 'Vector search retrieves textual documentation, not operational cause-and-effect. A standard copilot will cheerfully recommend increasing query timeout because "timeout" matched the query—blind to the fact that doing so crashed the cluster last month.'
    },
    {
      icon: 'warning',
      badge: 'PROBLEM 03',
      badgeColor: 'text-[#c084fc] border-[#c084fc]/30 bg-[#25152e]',
      title: 'Scale Divergence & Invariant Violations',
      desc: 'Heuristics that succeed at 20 GB catastrophically fail at 600 GB. Without hard applicability boundaries and invariant validation, automated agents cause cascading database pool exhaustion and multi-hour downtime.'
    }
  ];

  const comparisonRows = [
    {
      dim: 'Operational Memory',
      standard: 'Stateless. Forgets incident context on session restart.',
      echo: 'Persistent Hindsight Layer. Retains verified outcomes forever.'
    },
    {
      dim: 'Precedent Matching',
      standard: 'Semantic text similarity only (syntactic keywords).',
      echo: 'State-aware fit (payload size, concurrency, DB lock metrics).'
    },
    {
      dim: 'Negative Knowledge',
      standard: 'Ignores past failures; recommends contraindicated fixes.',
      echo: 'Explicit contraindication guardrails (flags EXP-031 failure).'
    },
    {
      dim: 'Scale Applicability',
      standard: 'Blindly transfers small-scale heuristics to production.',
      echo: 'Enforces invariant boundaries (EXP-089 hard lease limits).'
    },
    {
      dim: 'Continuous Learning',
      standard: 'Requires expensive retraining or fine-tuning cycles.',
      echo: 'Closed loop: every outcome autonomously updates memory bank.'
    }
  ];

  return (
    <div className="h-full w-full overflow-y-auto bg-[#0d0d0d] text-[#ececec] font-sans selection:bg-[#10a37f] selection:text-white">
      {/* Top Header */}
      <header className="h-14 border-b border-[#2e2e2e] bg-[#171717] px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-[#10a37f] flex items-center justify-center text-white font-bold text-xs shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold tracking-tight text-[#fafafa] text-base">ECHO</span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#212121] text-[#a3a3a3] border border-[#2e2e2e]">
              v3.0 Near-Black
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#a3a3a3] bg-[#212121] px-3 py-1 rounded border border-[#2e2e2e]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f] animate-pulse"></span>
            <span>{totalExperiences} Precedents Indexed</span>
          </div>

          {/* User Status / Login Buttons */}
          {isLoggedIn && currentUser ? (
            <div className="flex items-center gap-2.5">
              <button
                onClick={onEnter}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold bg-[#10a37f] hover:bg-[#1a7f64] text-white transition active:scale-95 shadow-sm"
              >
                <span>Workspace</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>

              {/* User Avatar with Stable Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => {
                  if (userMenuTimeoutRef.current) clearTimeout(userMenuTimeoutRef.current);
                  setIsUserMenuOpen(true);
                }}
                onMouseLeave={() => {
                  userMenuTimeoutRef.current = setTimeout(() => setIsUserMenuOpen(false), 350);
                }}
              >
                <button
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded bg-[#212121] hover:bg-[#282828] border border-[#2e2e2e] transition text-xs font-mono text-[#fafafa] cursor-pointer"
                  title="Account Settings"
                >
                  <div className="h-6 w-6 rounded bg-[#10a37f] text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <span className="hidden md:inline font-medium text-[11px] max-w-[120px] truncate">
                    {currentUser.name || 'Ankit'}
                  </span>
                  <span className="material-symbols-outlined text-[13px] text-[#737373]">expand_more</span>
                </button>

                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 top-full pt-1.5 z-50 min-w-[210px] before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3"
                    onMouseEnter={() => {
                      if (userMenuTimeoutRef.current) clearTimeout(userMenuTimeoutRef.current);
                      setIsUserMenuOpen(true);
                    }}
                    onMouseLeave={() => {
                      userMenuTimeoutRef.current = setTimeout(() => setIsUserMenuOpen(false), 350);
                    }}
                  >
                    <div className="bg-[#171717] border border-[#2e2e2e] rounded-md shadow-2xl p-2.5 text-xs font-mono">
                      <div className="pb-2 border-b border-[#2e2e2e] mb-2">
                        <div className="font-semibold text-[#fafafa] truncate">
                          {currentUser.name || 'Ankit (Support Lead)'}
                        </div>
                        <div className="text-[10px] text-[#737373] truncate">
                          {currentUser.email || 'ankit@echo.ai'}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#10a37f]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f]"></span>
                          <span>Active Session Persistent</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onEnter();
                          }}
                          className="w-full text-left py-1.5 px-2 rounded hover:bg-[#212121] text-[#fafafa] flex items-center gap-2 transition"
                        >
                          <span className="material-symbols-outlined text-[15px] text-[#10a37f]">dashboard</span>
                          <span>Open Echo Workspace</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            if (onSignOut) onSignOut();
                          }}
                          className="w-full text-left py-1.5 px-2 rounded hover:bg-[#2a1215] text-[#ef4444] flex items-center gap-2 transition cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px] text-[#ef4444]">logout</span>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 rounded text-xs font-mono bg-[#212121] hover:bg-[#282828] text-[#ececec] border border-[#2e2e2e] transition active:scale-95"
              >
                Sign In
              </button>
              <button
                onClick={onEnter}
                className="px-4 py-1.5 rounded text-xs font-semibold bg-[#10a37f] hover:bg-[#1a7f64] text-white transition active:scale-95 shadow-sm"
              >
                Enter Echo →
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-16 sm:pt-20 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#171717] border border-[#2e2e2e] text-[11px] font-mono text-[#10a37f]">
          <span className="w-2 h-2 rounded-full bg-[#10a37f] animate-pulse"></span>
          ORGANIZATIONAL EXPERIENCE MEMORY ENGINE
        </div>

        <h1 className="text-4xl sm:text-6xl font-normal tracking-tight text-[#fafafa] max-w-3xl mx-auto leading-tight">
          AI can reason from knowledge. <br />
          <span className="text-[#10a37f]">Echo lets it reason from what your company experienced.</span>
        </h1>

        <p className="text-sm sm:text-base text-[#a3a3a3] max-w-2xl mx-auto leading-relaxed">
          Operational incidents repeat because AI models start fresh without institutional context.
          Echo recalls historical failures, checks contextual applicability boundaries, and modifies triage recommendations before costly mistakes cascade.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={onEnter}
            className="px-6 py-2.5 rounded bg-[#10a37f] hover:bg-[#1a7f64] text-white font-medium text-sm transition-all shadow-md active:scale-95 flex items-center gap-2"
          >
            <span>Enter Echo Workspace</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('problem-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-5 py-2.5 rounded bg-[#171717] hover:bg-[#212121] text-[#ececec] border border-[#2e2e2e] text-sm font-mono transition active:scale-95"
          >
            Why We Built Echo ↓
          </button>
        </div>
      </section>

      {/* Real Precedent Graph Preview Card */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="rounded-lg border border-[#2e2e2e] bg-[#171717] p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-[#2e2e2e] text-xs font-mono">
            <span className="text-[#fafafa] font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10a37f]"></span>
              LIVE MEMORY TOPOLOGY PREVIEW
            </span>
            <span className="text-[#737373]">{totalExperiences} Verified Precedents</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-5">
            <div
              onClick={() => onSelectScenario && onSelectScenario({ title: 'Acme Corp — Export Timeout', label: 'ECHO-024', message: 'Contrast EXP-031 vs EXP-044' })}
              className="p-3.5 rounded bg-[#212121] hover:bg-[#262626] border border-[#ef4444]/40 text-xs font-mono space-y-1.5 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[#ef4444] font-semibold text-[10px]">EXP-031 / EXP-007</span>
                <span className="text-[9px] px-1 py-0.5 rounded bg-[#ef4444]/20 text-[#ef4444]">Failure</span>
              </div>
              <div className="text-[#fafafa] font-medium group-hover:text-[#ef4444] transition-colors">Timeout In Batch Sync</div>
              <div className="text-[10px] text-[#737373]">Result: Pool Exhaustion (Failure)</div>
              <div className="text-[9px] text-[#ef4444] pt-1">Contraindicated under 600 GB</div>
            </div>

            <div
              onClick={() => onSelectScenario && onSelectScenario({ title: 'Acme Corp — Export Timeout', label: 'ECHO-024', message: 'Apply EXP-044 Chunk Config' })}
              className="p-3.5 rounded bg-[#212121] hover:bg-[#262626] border border-[#10a37f]/50 text-xs font-mono space-y-1.5 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[#10a37f] font-semibold text-[10px]">EXP-044 / EXP-002</span>
                <span className="text-[9px] px-1 py-0.5 rounded bg-[#10a37f]/20 text-[#10a37f]">Success</span>
              </div>
              <div className="text-[#fafafa] font-medium group-hover:text-[#10a37f] transition-colors">Async Chunked Export</div>
              <div className="text-[10px] text-[#737373]">Result: 110m (Success)</div>
              <div className="text-[9px] text-[#10a37f] pt-1">Recommended 94.8% Match</div>
            </div>

            <div
              onClick={() => onSelectScenario && onSelectScenario({ title: 'Acme Corp — Export Timeout', label: 'ECHO-024', message: 'Run Boundary Check' })}
              className="p-3.5 rounded bg-[#212121] hover:bg-[#262626] border border-[#eab308]/40 text-xs font-mono space-y-1.5 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[#eab308] font-semibold text-[10px]">EXP-067 / EXP-008</span>
                <span className="text-[9px] px-1 py-0.5 rounded bg-[#eab308]/20 text-[#eab308]">Boundary</span>
              </div>
              <div className="text-[#fafafa] font-medium group-hover:text-[#eab308] transition-colors">Timeout in Low Load</div>
              <div className="text-[10px] text-[#737373]">Result: Context Mismatch (&lt;50 GB)</div>
              <div className="text-[9px] text-[#eab308] pt-1">Scale Divergence Guard</div>
            </div>

            <div
              onClick={() => onSelectScenario && onSelectScenario({ title: 'Acme Corp — Export Timeout', label: 'ECHO-024', message: 'Run Boundary Check' })}
              className="p-3.5 rounded bg-[#212121] hover:bg-[#262626] border border-[#a855f7]/40 text-xs font-mono space-y-1.5 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[#c084fc] font-semibold text-[10px]">EXP-089 / EXP-012</span>
                <span className="text-[9px] px-1 py-0.5 rounded bg-[#a855f7]/20 text-[#c084fc]">Invariant</span>
              </div>
              <div className="text-[#fafafa] font-medium group-hover:text-[#c084fc] transition-colors">Pool Lease Boundary</div>
              <div className="text-[10px] text-[#737373]">Result: Hard Invariant</div>
              <div className="text-[9px] text-[#c084fc] pt-1">Non-transferable Cap (12m)</div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* SECTION: THE PROBLEM WE ARE SOLVING                  */}
      {/* ==================================================== */}
      <section id="problem-section" className="max-w-5xl mx-auto px-6 pb-24 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#ef4444] uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px]">error</span>
            <span>The Crisis in Enterprise Operations</span>
          </div>
          <h2 className="text-3xl font-normal text-[#fafafa] tracking-tight">
            Why Engineering Teams Repeat the Same Production Disasters
          </h2>
          <p className="text-xs sm:text-sm text-[#737373] max-w-2xl mx-auto font-mono">
            Every incident resolution produces valuable organizational wisdom. But within weeks, that knowledge evaporates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {problemCards.map((p, idx) => (
            <div
              key={idx}
              className="p-5 rounded-lg bg-[#171717] border border-[#2e2e2e] hover:border-[#404040] transition duration-200 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                  <span className="material-symbols-outlined text-[#737373] text-[20px]">{p.icon}</span>
                </div>
                <h3 className="text-sm font-semibold text-[#fafafa]">{p.title}</h3>
                <p className="text-xs text-[#a3a3a3] leading-relaxed font-sans">{p.desc}</p>
              </div>
              <div className="pt-3 border-t border-[#242424] text-[10px] font-mono text-[#737373] flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-[#ef4444]">cancel</span>
                <span>Unresolved by generic LLMs</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================================================== */}
      {/* SECTION: HOW ECHO WORKS UNIQUELY (COMPARISON TABLE)  */}
      {/* ==================================================== */}
      <section className="max-w-5xl mx-auto px-6 pb-24 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#10a37f] uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px]">psychology</span>
            <span>Architectural Differentiation</span>
          </div>
          <h2 className="text-3xl font-normal text-[#fafafa] tracking-tight">
            How Echo Operates Differently From Any Other AI Tool
          </h2>
          <p className="text-xs sm:text-sm text-[#737373] max-w-2xl mx-auto font-mono">
            RAG retrieves static text. Echo recalls causal experience, enforces invariants, and autonomously updates organizational memory.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="rounded-lg border border-[#2e2e2e] bg-[#171717] overflow-hidden shadow-2xl">
          <div className="grid grid-cols-12 text-xs font-mono border-b border-[#2e2e2e] bg-[#1a1a1a] p-3 text-[#a3a3a3]">
            <div className="col-span-3 font-semibold uppercase text-[#fafafa]">Dimension</div>
            <div className="col-span-4 font-semibold text-[#ef4444] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></span>
              <span>Traditional Copilots / RAG</span>
            </div>
            <div className="col-span-5 font-semibold text-[#10a37f] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f]"></span>
              <span>Echo Experience Memory Engine</span>
            </div>
          </div>

          <div className="divide-y divide-[#242424] text-xs">
            {comparisonRows.map((row, i) => (
              <div key={i} className="grid grid-cols-12 p-3.5 hover:bg-[#1f1f1f] transition-colors items-center font-mono">
                <div className="col-span-3 text-[#fafafa] font-semibold text-[11px]">{row.dim}</div>
                <div className="col-span-4 text-[#737373] text-[11px] pr-3">{row.standard}</div>
                <div className="col-span-5 text-[#10a37f] text-[11px] font-medium pl-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-[#10a37f] shrink-0">check_circle</span>
                  <span>{row.echo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* SECTION: THE 12-EVENT CLOSED LEARNING LOOP           */}
      {/* ==================================================== */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 pb-24 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#10a37f] uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px]">sync</span>
            <span>The Closed Learning Loop</span>
          </div>
          <h2 className="text-3xl font-normal text-[#fafafa] tracking-tight">
            Every Outcome Becomes Context for the Next Decision
          </h2>
          <p className="text-xs sm:text-sm text-[#737373] max-w-2xl mx-auto font-mono">
            A deterministic 12-event lifecycle guarantees zero-hallucination execution and persistent knowledge retention.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs font-mono">
          <div className="p-4 rounded-lg bg-[#171717] border border-[#2e2e2e] space-y-2">
            <span className="text-[#10a37f] font-bold text-[10px]">01 :: INGEST</span>
            <div className="text-[#fafafa] font-medium text-xs">Telemetry Context</div>
            <p className="text-[#737373] text-[11px] font-sans">
              Extracts operational state: payload size (600 GB), concurrency, database lock wait times.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#171717] border border-[#2e2e2e] space-y-2">
            <span className="text-[#10a37f] font-bold text-[10px]">02 :: RECALL</span>
            <div className="text-[#fafafa] font-medium text-xs">Hindsight Query</div>
            <p className="text-[#737373] text-[11px] font-sans">
              Recalls both successes and catastrophic historical failures matching the execution parameters.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#171717] border border-[#2e2e2e] space-y-2">
            <span className="text-[#10a37f] font-bold text-[10px]">03 :: REASON</span>
            <div className="text-[#fafafa] font-medium text-xs">Boundary Check</div>
            <p className="text-[#737373] text-[11px] font-sans">
              Evaluates contraindications. Prevents blind transfer of small-scale fixes to high-load batches.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#171717] border border-[#2e2e2e] space-y-2">
            <span className="text-[#10a37f] font-bold text-[10px]">04 :: SIMULATE</span>
            <div className="text-[#fafafa] font-medium text-xs">Guardian Gate</div>
            <p className="text-[#737373] text-[11px] font-sans">
              Simulates candidate interventions against organizational invariants before triggering execution.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#171717] border border-[#10a37f]/50 bg-[#171717] space-y-2">
            <span className="text-[#10a37f] font-bold text-[10px]">05 :: RETAIN</span>
            <div className="text-[#fafafa] font-medium text-xs">Memory Retained</div>
            <p className="text-[#737373] text-[11px] font-sans">
              Permanently writes the resolution outcome into the Hindsight bank. Next triage is faster.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* FINAL CALL TO ACTION                                 */}
      {/* ==================================================== */}
      <section className="max-w-4xl mx-auto px-6 pb-20 text-center">
        <div className="p-8 sm:p-12 rounded-xl bg-gradient-to-b from-[#1a1a1a] to-[#121212] border border-[#2e2e2e] space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10a37f]/10 border border-[#10a37f]/30 text-xs font-mono text-[#10a37f]">
            <span>READY TO END OPERATIONAL AMNESIA</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-normal text-[#fafafa] tracking-tight">
            Give your engineering agents the power of organizational memory.
          </h2>

          <p className="text-xs sm:text-sm text-[#a3a3a3] max-w-xl mx-auto font-sans leading-relaxed">
            Stop firefighting the same incidents every quarter. Experience zero-hallucination operational triage powered by Groq LLMs and Hindsight.
          </p>

          <div className="pt-2 flex justify-center">
            <button
              onClick={onEnter}
              className="px-8 py-3 rounded bg-[#10a37f] hover:bg-[#1a7f64] text-white font-medium text-sm transition-all shadow-xl active:scale-95 flex items-center gap-2"
            >
              <span>{isLoggedIn ? 'Open Echo Workspace' : 'Enter Echo Workspace'}</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2e2e2e] bg-[#141414] py-6 px-6 text-center text-xs font-mono text-[#737373] flex flex-col sm:flex-row items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-2 sm:mb-0">
          <span className="w-2 h-2 rounded-full bg-[#10a37f]"></span>
          <span className="text-[#fafafa]">ECHO ENGINE</span>
          <span>:: Groq Qwen-3.8 / LLaMA-3 + Hindsight Memory Layer</span>
        </div>
        <div>
          <span>Deterministic Incident Triage &bull; Closed-Loop Experience</span>
        </div>
      </footer>
    </div>
  );
}
