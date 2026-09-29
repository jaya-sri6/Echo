export default function LandingPage({ onEnter, onOpenAuth, totalExperiences }) {
  return (
    <div className="h-full w-full overflow-y-auto bg-[#0d0d0d] text-[#ececec] font-sans">
      {/* Top Header */}
      <header className="h-14 border-b border-[#2e2e2e] bg-[#171717] px-6 flex items-center justify-between sticky top-0 z-30">
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
            <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f]"></span>
            <span>{totalExperiences} Precedents Indexed</span>
          </div>
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
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#171717] border border-[#2e2e2e] text-[11px] font-mono text-[#10a37f]">
          <span className="w-2 h-2 rounded-full bg-[#10a37f] pulse-calm"></span>
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
              const el = document.getElementById('how-it-works');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-5 py-2.5 rounded bg-[#171717] hover:bg-[#212121] text-[#ececec] border border-[#2e2e2e] text-sm font-mono transition active:scale-95"
          >
            See how it works ↓
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
            <span className="text-[#737373]">{totalExperiences} Verified Experiences</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-5">
            <div className="p-3 rounded bg-[#212121] border border-[#ef4444]/40 text-xs font-mono space-y-1">
              <div className="text-[#ef4444] font-semibold text-[10px]">EXP-031 / EXP-007</div>
              <div className="text-[#fafafa] font-medium">Timeout In Batch Sync</div>
              <div className="text-[10px] text-[#737373]">Result: Pool Exhaustion (Failure)</div>
              <div className="text-[9px] text-[#ef4444] pt-1">Contraindicated under 600 GB</div>
            </div>

            <div className="p-3 rounded bg-[#212121] border border-[#10a37f]/50 text-xs font-mono space-y-1">
              <div className="text-[#10a37f] font-semibold text-[10px]">EXP-044 / EXP-002</div>
              <div className="text-[#fafafa] font-medium">Async Chunked Export</div>
              <div className="text-[10px] text-[#737373]">Result: 110m (Success)</div>
              <div className="text-[9px] text-[#10a37f] pt-1">Recommended 94.8% Match</div>
            </div>

            <div className="p-3 rounded bg-[#212121] border border-[#eab308]/40 text-xs font-mono space-y-1">
              <div className="text-[#eab308] font-semibold text-[10px]">EXP-067 / EXP-008</div>
              <div className="text-[#fafafa] font-medium">Timeout in Low Load</div>
              <div className="text-[10px] text-[#737373]">Result: Context Mismatch (&lt;50 GB)</div>
              <div className="text-[9px] text-[#eab308] pt-1">Scale Divergence Guard</div>
            </div>

            <div className="p-3 rounded bg-[#212121] border border-[#a855f7]/40 text-xs font-mono space-y-1">
              <div className="text-[#c084fc] font-semibold text-[10px]">EXP-089 / EXP-012</div>
              <div className="text-[#fafafa] font-medium">Pool Lease Boundary</div>
              <div className="text-[10px] text-[#737373]">Result: Hard Invariant</div>
              <div className="text-[9px] text-[#c084fc] pt-1">Non-transferable Cap (12m)</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-4xl mx-auto px-6 pb-24 space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs font-mono text-[#10a37f] uppercase tracking-wider">The Closed Learning Loop</p>
          <h2 className="text-2xl font-normal text-[#fafafa]">Every outcome becomes context for the next decision</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded bg-[#171717] border border-[#2e2e2e] space-y-2">
            <span className="text-[#10a37f] font-bold text-[10px]">01 :: INGEST</span>
            <div className="text-[#fafafa] font-medium">Raw Problem</div>
            <p className="text-[#737373] text-[11px]">User reports 600 GB export timeout during nightly batch.</p>
          </div>
          <div className="p-3.5 rounded bg-[#171717] border border-[#2e2e2e] space-y-2">
            <span className="text-[#10a37f] font-bold text-[10px]">02 :: RECALL</span>
            <div className="text-[#fafafa] font-medium">Hindsight Query</div>
            <p className="text-[#737373] text-[11px]">Finds historical failures under identical high concurrency.</p>
          </div>
          <div className="p-3.5 rounded bg-[#171717] border border-[#2e2e2e] space-y-2">
            <span className="text-[#10a37f] font-bold text-[10px]">03 :: REASON</span>
            <div className="text-[#fafafa] font-medium">Applicability</div>
            <p className="text-[#737373] text-[11px]">Validates boundaries. Prevents blind transfer to divergent setups.</p>
          </div>
          <div className="p-3.5 rounded bg-[#171717] border border-[#2e2e2e] space-y-2">
            <span className="text-[#10a37f] font-bold text-[10px]">04 :: ACT</span>
            <div className="text-[#fafafa] font-medium">Decision</div>
            <p className="text-[#737373] text-[11px]">Shifts recommendation to async chunking. Simulates success.</p>
          </div>
          <div className="p-3.5 rounded bg-[#171717] border border-[#10a37f]/50 space-y-2">
            <span className="text-[#10a37f] font-bold text-[10px]">05 :: RETAIN</span>
            <div className="text-[#fafafa] font-medium">Persistent Memory</div>
            <p className="text-[#737373] text-[11px]">Saves new lesson into Hindsight organizational bank.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
