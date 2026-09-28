# Echo — Live Demo Runbook & Judge Defense Guide (P6)

## 1. Quick Reference: Demo Execution Commands

Run these exact commands during the demonstration:

```bash
# Step 0: Ensure pristine demo state
python3 demo/demo_runner.py reset

# Step 1: Execute Case A (Demonstrate failure under naive intervention)
python3 demo/demo_runner.py case-a

# Step 2: Execute Case B (Demonstrate memory-informed adaptation)
python3 demo/demo_runner.py case-b

# Step 3: Execute Case C (Demonstrate boundary check & non-transfer)
python3 demo/demo_runner.py case-c

# Step 4: Run side-by-side benchmark for judges
python3 demo/demo_runner.py benchmark

# Step 5: Run complete automated E2E loop (Optional / Fast Review)
python3 demo/demo_runner.py e2e
```

---

## 2. Live Demo Script & Narrative Flow

### Opening Pitch (15 seconds)
> *"Every B2B SaaS platform repeatedly makes the same customer support mistakes because companies don't remember the consequences of previous interventions. Echo is an organizational customer experience memory system: it remembers what the company learned from past actions, checks applicability boundaries, and changes future recommendations."*

---

### Phase 1: Case A — The Unlearned Mistake (First Attempt)
**Presenter Action:**
```bash
python3 demo/demo_runner.py case-a
```
**Spoken Narrative:**
- "A enterprise customer files an urgent ticket: their 600 GB nightly batch export is timing out under high concurrency."
- "Without organizational memory, support engineers default to the intuitive fix: **Increase timeout**."
- "Our deterministic outcome simulator tests this action. Result: **FAILURE**. Why? The database connection pool was saturated; waiting longer merely holds stale locks and exhausts resources."
- "Crucially, Echo **retains this failure into Hindsight memory** with full causal context: problem type, export size, concurrency level, and the negative consequence."

---

### Phase 2: Case B — The Memory-Informed Decision (Second Attempt)
**Presenter Action:**
```bash
python3 demo/demo_runner.py case-b
```
**Spoken Narrative:**
- "Next week, another customer encounters the exact same 600 GB nightly batch export timeout."
- "With **Memory ON**, Echo queries Hindsight. It recalls the previous failure (`EXP-DEMO-001` / `EXP-007`)."
- "The Experience Reasoner matches all 5 context variables (`MATCH`), recognizes that `increase_timeout` previously failed, and rejects it."
- "Instead, it simulates candidate alternatives and selects **Async Chunked Export** (`SUCCESS`)."
- "The Guardian safety agent verifies that the recommendation is backed by real historical evidence and simulator proof, approving the change."
- "**Echo changed its mind because of historical consequence.**"

---

### Phase 3: Case C — The Boundary Check (Preventing Negative Transfer)
**Presenter Action:**
```bash
python3 demo/demo_runner.py case-c
```
**Spoken Narrative:**
- "Now a third customer reports a timeout on a **20 GB interactive export**."
- "A naive RAG system would semantically retrieve 'export timeout' and blindly recommend async chunking."
- "Echo performs a rigorous **Boundary and Applicability Check**. It detects that 20 GB interactive is fundamentally different from a 600 GB batch job. Transfer confidence is LOW."
- "Echo refuses to blindly apply the large-batch fix to an interactive workload, preventing catastrophic over-engineering."

---

## 3. Judge Defense & FAQ

### Q1: "How is this different from standard RAG?"
> **Answer:** *"Standard RAG does semantic text retrieval based on word similarity; it does not understand causal consequences or operating boundaries. Echo recalls structured experiences with verified outcome classes (SUCCESS vs FAILURE). Furthermore, Echo enforces explicit applicability boundaries so that a lesson learned in a large-batch context is not hallucinated into an interactive context."*

### Q2: "What happens if Hindsight Cloud is down or unreachable during the demo?"
> **Answer:** *"Echo was built with production resilience from day one. If Hindsight Cloud is unreachable, Echo immediately switches to an explicit `SEEDED DEMO FALLBACK` using local verified experiences. The UI and logs prominently display `SEEDED FALLBACK` so judges know it's not pretending to be live cloud memory, but the demo never breaks."*

### Q3: "What prevents the LLM from hallucinating an unsafe recommendation?"
> **Answer:** *"Echo does not allow an LLM to directly emit unconstrained actions. All candidate actions are run through our deterministic `ExportSimulator` and validated by the `Guardian` agent. If a proposed action lacks simulator evidence or attempts to transfer a boundary memory, Guardian halts execution and flags the violation."*

### Q4: "Why don't you have a Manager/Router/Critic agent?"
> **Answer:** *"We intentionally froze our architecture to 5 specialized agents (`ConversationAgent`, `Investigator`, `ExperienceReasoner`, `ResolutionAgent`, `Guardian`). Adding meta-manager agents creates non-deterministic routing loops, high latency, and debugging nightmares. Linear, deterministic pipelines with explicit safety boundaries are what enterprises actually deploy."*
