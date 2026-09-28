# ECHO — ONE-DAY BUILD SPEC

> **Status: FROZEN MVP**
>
> **Do not create another architecture/spec revision during the build.**
>
> Build the loop first. Everything below the MVP gate is postponed until the loop works.

---

# 0. THE PRODUCT IN ONE SCREEN

## Echo — Organizational Customer Experience Memory

> **Echo doesn't remember what customers said. It remembers what the company learned.**

### Target user

Technical support / customer-success engineer at a B2B SaaS company.

### One problem

A customer repeatedly experiences a large export failure.

The company has previously tried multiple solutions.

Some worked.

Some failed.

The next support engineer should **not repeat the failed solution merely because the new ticket looks similar.**

Echo remembers:

```text
CASE
 ↓
WHAT WE THOUGHT
 ↓
WHAT WE TRIED
 ↓
WHAT HAPPENED
 ↓
WHY IT WORKED / FAILED
 ↓
UNDER WHICH CONDITIONS
 ↓
WHAT SHOULD WE DO NEXT?
```

That is the entire product.

---

# 1. THE THREE CASES ARE THE SPEC

If the team remembers nothing else, remember these three cases.

## CASE 1 — Learn from failure

### Input

```text
Customer:
Our 600 GB nightly export is timing out.

Environment:
• export: 600 GB
• concurrency: high
• workload: nightly batch
• execution: synchronous
```

### Before Echo has learned

Initial recommendation:

```text
Increase timeout
```

Simulator:

```text
FAILED

Reason:
High concurrency causes processing saturation.
Increasing timeout does not remove the bottleneck.
```

Echo records:

```text
EXP-031

ACTION:
increase_timeout

OUTCOME:
FAILURE

CONDITION:
large export + high concurrency + nightly batch

LESSON:
timeout increase is unreliable under this workload.
```

---

# 2. CASE 2 — Use the learned experience

Run the **same case again**.

Echo receives:

```text
600 GB
high concurrency
nightly batch
synchronous
```

### Hindsight

```text
RECALL

EXP-031
Previously failed:
increase timeout

EXP-044
Similar large export:
async chunked export succeeded
```

### Experience Reasoner

Detects:

```text
BOUNDARY

Increase timeout:
✓ smaller exports
✗ large + high concurrency

Async chunking:
✓ large batch workload
```

### Decision panel

```text
WHAT CHANGED MY MIND?

Initial recommendation
Increase timeout

        ↓

Hindsight recalled
2 relevant experiences

        ↓

Historical failure detected
EXP-031

        ↓

Applicability check
Large export + high concurrency

        ↓

Decision changed

ASYNC CHUNKED EXPORT
```

Then:

```text
SIMULATED OUTCOME

SUCCESS
```

Echo retains the successful experience.

---

# 3. CASE 3 — Do NOT blindly transfer memory

Now change the context.

```text
Customer:
Our 20 GB export is timing out.

Environment:
• export: 20 GB
• concurrency: low
• workload: interactive
• execution: synchronous
```

Hindsight still finds:

```text
EXP-031
EXP-044
EXP-067
```

But Echo must **not** blindly apply them.

It says:

```text
MEMORY FOUND ✓

CONTEXT MATCH ✗

Historical experiences involve:
• large exports
• high concurrency
• batch workloads

Current case:
• small export
• low concurrency
• interactive

TRANSFER CONFIDENCE: LOW
```

Then Echo evaluates the current candidates.

That third case is important because it demonstrates:

> **Echo is not simply RAG with a longer memory.**

It understands that a remembered solution has **conditions of applicability**.

---

# 4. THE ONLY MVP LOOP

Everything in the first six hours must serve this:

```text
CUSTOMER CASE
      ↓
CASE CONTEXT
      ↓
HINDSIGHT RECALL
      ↓
EXPERIENCE ANALYSIS
      ↓
CANDIDATE ACTIONS
      ↓
DETERMINISTIC OUTCOME SIMULATOR
      ↓
RECOMMENDATION
      ↓
OUTCOME
      ↓
HINDSIGHT RETAIN
      ↓
SAME / RELATED CASE
      ↓
DIFFERENT DECISION
```

If this works, **Echo exists**.

If this doesn't work, beautiful UI, ML, voice, datasets and deployment do not matter.

---

# 5. MVP BOUNDARY

## IN MVP

| Component            | MVP decision                        |
| -------------------- | ----------------------------------- |
| Domain               | B2B SaaS technical support          |
| Persona              | Support / customer-success engineer |
| Problem              | Large export failure                |
| Memory               | Hindsight                           |
| Memory operations    | Retain + Recall + limited Reflect   |
| Experience types     | Success / Failure / Partial         |
| Applicability        | Yes                                 |
| Boundary detection   | Yes                                 |
| Candidate actions    | 3                                   |
| Outcome engine       | Deterministic simulator             |
| Learning             | Outcome → Hindsight                 |
| Demo cases           | 3                                   |
| Benchmark            | 8 cases                             |
| Memory OFF           | Yes                                 |
| Memory ON            | Yes                                 |
| What Changed My Mind | Yes                                 |
| Don't Repeat Mistake | Yes                                 |
| Provenance           | Yes                                 |
| Voice                | Fallback only                       |
| Deployment           | Basic                               |
| Fallback mode        | Yes                                 |

---

# 6. EXPLICITLY OUT OF MVP

These are **not missing features**.

They are deliberately postponed.

### Not MVP

* Mendeley dataset processing
* Zenodo dataset processing
* ML outcome predictor
* large generated dataset
* 30/50/100 holdout cases
* multiple support domains
* full voice conversation
* sophisticated memory graph
* human correction workflow
* confidence decay
* automatic experience promotion
* cross-asset transfer
* CRM integration
* ticketing integration
* autonomous actions
* elaborate multi-agent choreography
* complex analytics dashboard
* advanced deployment infrastructure

The hackathon itself says to keep scope tight and demonstrate a clear learning curve, so this is a feature rather than a weakness. 

---

# 7. DATA — NEW MVP DECISION

## Drop Mendeley and Zenodo from the build.

Do **not** spend the hackathon day downloading, cleaning and normalizing two external datasets that don't directly contain the intervention → outcome structure Echo needs.

Instead:

### Seed 15 experiences manually.

They are:

```text
SEEDED
```

not:

```text
REAL CUSTOMER DATA
```

That distinction must be explicit.

The 15 experiences should be based on realistic SaaS support patterns and internally authored for the demo.

### Example

```json
{
  "experience_id": "EXP-031",
  "source": "SEEDED",
  "problem_type": "large_export_timeout",
  "context": {
    "export_size_gb": 600,
    "concurrency": "high",
    "workload": "nightly_batch",
    "execution_mode": "sync"
  },
  "action": "increase_timeout",
  "outcome": "FAILURE",
  "lesson": "Timeout increase does not address saturation under high concurrency.",
  "applicability": {
    "export_size": ">400GB",
    "concurrency": "high",
    "workload": "batch"
  }
}
```

### Important

Do **not** write:

> “Acme Corp actually experienced this.”

unless it is actually sourced.

Write:

> **SEEDED EXPERIENCE — synthetic but domain-grounded**

The external datasets can be referenced in the README as **future grounding sources**, not pretended to be part of the MVP.

---

# 8. THE 15 SEEDED EXPERIENCES

Person 3 creates exactly 15.

Suggested distribution:

| Type             |  Count |
| ---------------- | -----: |
| SUCCESS          |      6 |
| FAILURE          |      4 |
| PARTIAL          |      2 |
| BOUNDARY         |      2 |
| NON-TRANSFERABLE |      1 |
| **Total**        | **15** |

They should revolve around the same support domain.

Example actions:

```text
increase_timeout
reduce_concurrency
async_chunked_export
retry_with_backoff
schedule_off_peak
```

Don't create 15 unrelated support scenarios.

The memory needs to become **deep**, not broad.

---

# 9. DETERMINISTIC SIMULATOR

No ML.

Inputs:

```text
export_size
concurrency
workload
execution_mode
action
```

Output:

```text
outcome
resolution_time
escalation
reason
```

Example:

```python
simulate(
    export_size=600,
    concurrency="high",
    workload="nightly_batch",
    execution_mode="sync",
    action="increase_timeout"
)
```

Returns deterministically:

```json
{
  "status": "FAILURE",
  "resolution_time_minutes": 45,
  "escalated": true,
  "reason": "processing saturation remains unresolved"
}
```

Same input → same result.

That makes the demo reproducible.

---

# 10. ONLY FIVE AGENTS

Do not build 10–15 agents.

## 1. Conversation Agent

Converts customer input into structured case information.

```text
message
→ case context
```

---

## 2. Investigator

Extracts:

```text
problem
environment
workload
severity
constraints
```

---

## 3. Experience Reasoner

This is the important one.

Uses:

```text
Hindsight Recall
Hindsight Reflect
```

to determine:

```text
what happened historically
what worked
what failed
why
under what conditions
whether it transfers
```

---

## 4. Resolution Agent

Produces:

```text
candidate 1
candidate 2
candidate 3
```

and recommends one.

---

## 5. Guardian

Checks:

```text
confidence
applicability
unsafe / irreversible actions
missing context
escalation requirement
```

For MVP, Guardian can be mostly deterministic.

---

# 11. HINDSIGHT IS THE CENTER

The hackathon requires Hindsight and specifically wants memory to be central to the product's value. 

Echo should therefore visibly perform:

```text
RETAIN
 ↓
RECALL
 ↓
REFLECT
 ↓
DECIDE
 ↓
RETAIN
```

But don't call Reflect on every tiny operation.

### Runtime pattern

```text
Customer case
      ↓
structured context
      ↓
Recall
      ↓
if multiple/conflicting experiences:
      Reflect
      ↓
decision
```

That keeps latency and Groq usage under control.

---

# 12. MEMORY BANKS

Keep this simple:

```text
echo
│
├── support-experiences
├── product-knowledge
└── evaluation-learnings
```

For MVP, only:

```text
support-experiences
```

needs to be populated.

The other banks can exist but remain unused until after MVP.

---

# 13. EXPERIENCE MEMORY SCHEMA

Every experience must answer:

```text
WHAT HAPPENED?
WHAT WAS TRIED?
WHAT WAS THE OUTCOME?
WHY?
UNDER WHAT CONDITIONS?
WHAT SHOULD WE DO NEXT TIME?
```

Minimum schema:

```json
{
  "experience_id": "EXP-044",
  "source": "SEEDED",

  "problem": {
    "type": "large_export_timeout"
  },

  "context": {
    "export_size_gb": 600,
    "concurrency": "high",
    "workload": "nightly_batch",
    "execution_mode": "sync"
  },

  "diagnosis": {
    "cause": "processing_saturation"
  },

  "action": {
    "type": "async_chunked_export"
  },

  "outcome": {
    "status": "SUCCESS",
    "resolution_time_minutes": 14,
    "escalated": false
  },

  "lesson": "Use async chunking for large high-concurrency batch exports.",

  "applicability": {
    "export_size": ">400GB",
    "concurrency": "high",
    "workload": "batch"
  }
}
```

---

# 14. THE TWO HERO UI COMPONENTS

You only need **two screens** for the MVP.

## Screen 1 — Live Case

```text
ECHO
ORGANIZATIONAL CUSTOMER EXPERIENCE MEMORY

CURRENT CASE
────────────────────────

600 GB export
HIGH concurrency
NIGHTLY batch
SYNC

────────────────────────

AGENT EXECUTION

✓ Context extracted
✓ Hindsight recalled 4 experiences
✓ Failure history detected
✓ Boundary detected
✓ Candidates generated
✓ Guardian checked

────────────────────────

RECOMMENDATION

ASYNC CHUNKED EXPORT

Why?

Historical failure under:
600 GB + high concurrency + batch

────────────────────────
```

---

# 15. SCREEN 2 — WHAT CHANGED MY MIND?

This is the hero.

```text
WHAT CHANGED MY MIND?

INITIAL RECOMMENDATION

Increase timeout

        ↓

HINDSIGHT RECALL

4 relevant experiences

        ↓

HISTORICAL OUTCOME

2 SUCCESS
1 FAILURE
1 PARTIAL

        ↓

BOUNDARY

Timeout increase
✓ smaller workload
✗ large + high concurrency

        ↓

FINAL DECISION

Async chunked export
```

Then:

```text
AVOIDED COMPANY MISTAKE

EXP-031
Increase timeout

Result:
FAILURE

Echo prevented the same recommendation
from being repeated.
```

This is what judges should remember.

---

# 16. MEMORY OFF VS MEMORY ON

This stays in MVP.

Not a sophisticated statistical study.

Just a controlled demonstration.

## Memory OFF

```text
Case
 ↓
Generic reasoning
 ↓
Increase timeout
```

## Memory ON

```text
Case
 ↓
Hindsight
 ↓
Historical failure
 ↓
Boundary
 ↓
Async chunking
```

The point is:

> **Does organizational memory actually change the decision?**

That is your core evaluation question.

---

# 17. BENCHMARK — 8 CASES

Not 30.

Not 50.

Not 100.

**Eight.**

Create:

```text
8 fixed evaluation cases
```

Include:

* 3 cases where memory should help
* 2 cases containing historical failures
* 2 cases where memory should NOT transfer
* 1 ambiguous case

Measure:

```text
decision success
failed intervention rate
applicability accuracy
memory-triggered decision change
resolution time
```

That's enough for the MVP.

Do not claim statistical significance.

Do not say:

> “Echo improves support by 37%”

unless the actual benchmark establishes that.

Say:

> “On our controlled 8-case benchmark…”

---

# 18. TEAM STRUCTURE — TWO TRACKS

This is the other major correction.

Six people should **not** operate as six independent departments.

Use two tracks.

---

## TRACK A — MEMORY ENGINE

### Person 1 — Integration Lead

Own:

```text
FastAPI
WebSocket
orchestration
CaseContext
event schema
agent interfaces
Docker
integration
```

### Person 2 — Hindsight Lead

Own:

```text
Hindsight connection
retain
recall
reflect
experience schema
applicability
boundary detection
memory evidence
```

### Person 3 — Domain / Simulator

Own:

```text
15 seeded experiences
scenario definitions
deterministic simulator
3 hero cases
```

---

# TRACK B — DEMO

### Person 4 — Evaluation

Own:

```text
8-case benchmark
Memory OFF
Memory ON
metrics
decision-change measurement
```

### Person 5 — Frontend

Own only:

```text
Live Case
What Changed My Mind
memory evidence
decision panel
```

Not four screens.

Not a dashboard.

Not a design system.

### Person 6 — Red Team / Deployment / Demo

Own:

```text
deployment
fallbacks
failure testing
demo runner
demo script
judge questions
README
final rehearsal
```

And critically:

> Person 6 is allowed to tell everyone to **stop building features**.

---

# 19. 30 REAL TASKS

This replaces T001–T110.

## Person 1 — Integration

| #  | Task                             |
| -- | -------------------------------- |
| 1  | Create repo structure            |
| 2  | Create environment config        |
| 3  | Create FastAPI app               |
| 4  | Define CaseContext               |
| 5  | Define event schema              |
| 6  | Build WebSocket execution stream |
| 7  | Build agent orchestration        |
| 8  | Integrate all components         |
| 9  | Add Docker                       |
| 10 | Create deterministic demo runner |

---

## Person 2 — Hindsight

| #  | Task                                       |
| -- | ------------------------------------------ |
| 11 | Connect Hindsight                          |
| 12 | Create experience bank                     |
| 13 | Implement retain                           |
| 14 | Implement recall                           |
| 15 | Implement reflect                          |
| 16 | Seed experience schema                     |
| 17 | Implement applicability check              |
| 18 | Implement boundary detection               |
| 19 | Return memory evidence to UI               |
| 20 | Verify full retain → recall → reflect loop |

---

## Person 3 — Domain

| #  | Task                              |
| -- | --------------------------------- |
| 21 | Write 15 seeded experiences       |
| 22 | Create three hero cases           |
| 23 | Implement deterministic simulator |
| 24 | Implement three candidate actions |
| 25 | Implement outcome recording       |

---

## Person 4 — Evaluation

| #  | Task                        |
| -- | --------------------------- |
| 26 | Create 8 benchmark cases    |
| 27 | Implement Memory OFF run    |
| 28 | Implement Memory ON run     |
| 29 | Calculate benchmark metrics |
| 30 | Produce final comparison    |

---

## Person 5 + 6

Their work is **not additional numbered tasks**.

They work against the shared system:

### Person 5

```text
Live Case UI
What Changed My Mind
Memory cards
Decision state
```

### Person 6

```text
deployment
fallbacks
failure tests
demo rehearsal
README
judge defense
```

This is intentional.

The project has **30 coordination points**, not 110.

---

# 20. CHECKPOINTS — ONLY SIX

Forget C0–C10.

## C0 — Skeleton

```text
FastAPI ✓
Frontend ✓
Hindsight reachable ✓
Groq reachable ✓
```

---

## C1 — Memory

```text
retain ✓
recall ✓
reflect ✓
```

One seeded experience can be stored and retrieved.

---

## C2 — Loop

```text
case
→ recall
→ candidate
→ simulator
→ decision
→ outcome
→ retain
```

**This is the most important checkpoint.**

---

## C3 — Learning

Same case twice:

```text
RUN 1
increase timeout
FAIL

RUN 2
Hindsight recalls failure
→ async chunking
SUCCESS
```

If C3 works, **the product is alive.**

---

## C4 — UI

Judge can see:

```text
memory
→ evidence
→ boundary
→ changed decision
```

without someone narrating every implementation detail.

---

## C5 — Demo Ready

```text
3 cases
8 benchmark cases
Memory OFF
Memory ON
fallback
deployed/local demo
```

---

# 21. HARD HOUR-6 GATE

This is the most important new rule.

## At hour 6 ask:

> **Can Echo take Case 1, retain the failure, receive Case 2, recall that failure, change its recommendation, and retain the new outcome?**

### YES

Continue.

### NO

Immediately enter **MVP emergency mode**.

Cut:

```text
❌ benchmark polish
❌ deployment polish
❌ voice
❌ fancy animations
❌ Reflect optimization
❌ extra scenarios
❌ advanced Guardian
❌ ML
❌ external datasets
❌ advanced applicability
```

Keep only:

```text
Hindsight
↓
three cases
↓
decision change
↓
What Changed My Mind
```

---

# 22. THE HINDSIGHT FAILURE PROTOCOL

This directly fixes the problem you identified.

Suppose at hour 4:

> Person 2 has been fighting the Hindsight SDK for 90 minutes.

Do **not** allow the entire project to wait.

### T+0–30 minutes

Person 2 debugs the integration.

Person 1 helps.

Person 6 starts preparing the fallback.

---

### T+30 minutes

If Hindsight is still unstable:

Freeze the Hindsight interface.

Create:

```python
MemoryProvider
```

with:

```text
HindsightMemoryProvider
SeededMemoryProvider
```

Both expose:

```python
retain()
recall()
reflect()
```

The application does not care which implementation is underneath.

---

### Hindsight live mode

```text
Memory Mode:
HINDSIGHT
```

### Fallback mode

```text
Memory Mode:
SEEDED DEMO FALLBACK
```

The UI must **never pretend the fallback is Hindsight**.

---

# 23. OTHER FAILURE CUTOVERS

## Groq fails

Use:

```text
cached reasoning
+
deterministic case extraction
```

The hero cases must have deterministic structured inputs.

---

## WebSocket fails

Use:

```text
scenario playback
```

instead of live streaming.

---

## Voice fails

Use:

```text
TEXT INPUT
```

Immediately.

Voice never blocks the demo.

---

## Deployment fails

Use:

```text
Docker localhost
```

with seeded memory.

---

## Hindsight + Groq both fail

Use:

```text
precomputed three-case execution
```

But clearly label it:

```text
DEMO PLAYBACK
```

Never fake live execution.

---

# 24. VOICE

Voice remains exactly where it belongs.

```text
VOICE
 ↓
STT
 ↓
CaseContext
 ↓
normal Echo pipeline
```

If voice breaks:

```text
TEXT
 ↓
CaseContext
```

No separate voice agent.

No voice-specific reasoning.

No voice-dependent feature.

If there is spare time, add it.

Otherwise it does not exist in the MVP.

---

# 25. HOUR-BY-HOUR BUILD

## 00:00–00:30 — Freeze

Everyone agrees on:

```text
three cases
15 experiences
experience schema
API contract
MVP boundary
```

No discussion about new features after this.

---

## 00:30–02:00 — Foundation

### Person 1

Backend + contracts.

### Person 2

Hindsight connection.

### Person 3

Seed experiences.

### Person 4

Benchmark structure.

### Person 5

UI shell.

### Person 6

Deployment + failure strategy.

---

# 26. 02:00–04:00 — THE LOOP

Goal:

```text
case
→ Hindsight
→ candidate
→ simulator
→ decision
→ outcome
→ retain
```

Do not style.

Do not polish.

Do not add ML.

Do not research competitors.

---

# 27. 04:00–06:00 — LEARNING

Build:

```text
failure
→ retained
→ recalled
→ applicability
→ boundary
→ changed recommendation
→ success
```

At hour 6:

# STOP AND TEST CASE 1 → CASE 2.

If it works:

Continue.

If it doesn't:

Emergency mode.

---

# 28. 06:00–08:00 — HERO EXPERIENCE

Build:

### What Changed My Mind?

and:

### Don't Repeat the Company's Mistake

The system should visibly show:

```text
BEFORE
Increase timeout

AFTER MEMORY
Async chunked export

WHY
Historical failure + matching boundary
```

---

# 29. 08:00–09:00 — THIRD CASE

Run:

```text
20 GB
low concurrency
interactive
```

Prove:

```text
memory found
but not blindly transferred
```

This is the anti-RAG proof.

---

# 30. 09:00–10:00 — BENCHMARK

Run:

```text
8 cases
Memory OFF
Memory ON
```

Freeze numbers.

No metric manipulation.

No cherry-picking.

---

# 31. 10:00–11:00 — DEPLOY + FAILURE TEST

Test:

```text
Hindsight failure
Groq failure
WebSocket failure
voice failure
internet failure
```

Make sure fallback paths actually work.

---

# 32. 11:00–12:00 — DEMO REHEARSAL

Run the complete demo twice.

**With a stopwatch.**

Target:

```text
3–5 minutes
```

Do not rehearse a 15-minute architecture lecture.

---

# 33. DEMO SCRIPT

## 0:00–0:30 — Problem

> “Support systems remember tickets. They don't necessarily remember what the company learned from those tickets.”

Show:

```text
600 GB export
high concurrency
nightly batch
```

---

## 0:30–1:15 — First attempt

Echo recommends:

```text
Increase timeout
```

Result:

```text
FAILURE
```

Retain.

---

## 1:15–2:15 — Learning

Run the same case.

Hindsight recalls:

```text
EXP-031
```

Echo identifies the historical failure boundary.

Show:

# WHAT CHANGED MY MIND?

```text
Increase timeout
        ↓
Async chunked export
```

---

## 2:15–2:45 — Success

Simulator:

```text
SUCCESS
```

Retain the new experience.

---

## 2:45–3:30 — Anti-RAG case

Run:

```text
20 GB
low concurrency
interactive
```

Memory exists.

But Echo says:

```text
CONTEXT MISMATCH
```

It does not blindly transfer the previous solution.

---

## 3:30–4:00 — Benchmark

Show:

```text
Memory OFF
vs
Memory ON
```

Then:

> “The important result isn't that Echo remembers. It's that the remembered experience changes what it recommends next.”

---

# 34. THE ONE ARCHITECTURE DIAGRAM

Do not create five diagrams.

Use this:

```text
                    CUSTOMER
                       │
                       ▼
              ┌─────────────────┐
              │ Conversation     │
              │ + Investigator   │
              └────────┬────────┘
                       │
                       ▼
                 CASE CONTEXT
                       │
                       ▼
              ┌─────────────────┐
              │    HINDSIGHT    │
              │                 │
              │ Recall          │
              │ Reflect         │
              │ Retain          │
              └────────┬────────┘
                       │
                       ▼
             EXPERIENCE REASONER
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
       Applicability         Boundary
             │                   │
             └─────────┬─────────┘
                       ▼
                RESOLUTION AGENT
                       │
                  3 candidates
                       │
                       ▼
              DETERMINISTIC
                SIMULATOR
                       │
                       ▼
                   GUARDIAN
                       │
                       ▼
                 RECOMMENDATION
                       │
                       ▼
                    OUTCOME
                       │
                       ▼
                  HINDSIGHT
                    RETAIN
```

That's enough.

---

# 35. WHAT MAKES ECHO DIFFERENT

Don't pitch:

> “It's an AI customer support chatbot with memory.”

That is weak.

Pitch:

> **“Echo learns from the outcomes of previous support interventions and uses those outcomes to determine when a previous solution should — and should not — be reused.”**

Then demonstrate:

```text
MEMORY
+
OUTCOME
+
APPLICABILITY
+
BOUNDARY
+
DECISION CHANGE
```

The hackathon brief itself warns against obvious chatbot territory and specifically emphasizes showing the agent improving over repeated interactions. 

---

# 36. AFTER MVP — DO NOT BUILD EVERYTHING

Once C5 passes, **then** unlock the second phase.

And only three additions are allowed.

# VALUE ADDITION 1 — REAL DATA GROUNDING

Now bring in:

* Mendeley Help Desk Tickets
* Zenodo IT Support Tickets

Use them to improve:

```text
support vocabulary
issue taxonomy
case realism
domain grounding
```

But don't force these datasets into the intervention/outcome layer if their structure doesn't support it.

They become **grounding**, not fake outcome evidence.

---

# 37. VALUE ADDITION 2 — LEARNED OUTCOME PREDICTOR

Only after the deterministic simulator works.

Then add:

```text
experience dataset
       ↓
train/test split
       ↓
Gradient Boosting / Random Forest
       ↓
predicted outcome
```

Compare:

```text
deterministic baseline
vs
learned predictor
```

Report actual metrics.

No invented improvement.

---

# 38. VALUE ADDITION 3 — EXPERIENCE EVOLUTION

This is where the strongest NEXUS ideas can return.

Build:

### Experience Candidate

```text
Echo observed:

7 similar cases

5 successful
2 failed

Common boundary:
large export + high concurrency

Create reusable experience?
```

Then:

### Confidence decay

Old experiences gradually become less trusted.

### Human correction

Support engineer can say:

```text
"This recommendation was wrong."
```

That correction becomes new organizational experience.

This preserves the strongest NEXUS concept: experience should evolve based on outcomes rather than becoming a static knowledge base. 

---

# 39. POST-MVP ROADMAP

Only this:

```text
MVP
│
├── 1. Real data grounding
│
├── 2. Learned outcome predictor
│
└── 3. Experience evolution
```

That's it.

Not eleven stretch features.

Not another 70-task backlog.

---

# 40. FINAL ACCEPTANCE TEST

Echo is MVP-complete only if this exact sequence works:

```text
┌──────────────────────────────┐
│ CASE 1                       │
│ 600 GB / high / batch        │
└──────────────┬───────────────┘
               ↓
       Increase timeout
               ↓
             FAIL
               ↓
        HINDSIGHT RETAIN
               ↓
┌──────────────────────────────┐
│ CASE 2                       │
│ same conditions              │
└──────────────┬───────────────┘
               ↓
       HINDSIGHT RECALL
               ↓
        FAILURE FOUND
               ↓
      BOUNDARY DETECTED
               ↓
     CHANGE RECOMMENDATION
               ↓
       Async chunking
               ↓
            SUCCESS
               ↓
        HINDSIGHT RETAIN
               ↓
┌──────────────────────────────┐
│ CASE 3                       │
│ 20 GB / low / interactive    │
└──────────────┬───────────────┘
               ↓
       Similar memory found
               ↓
       CONTEXT MISMATCH
               ↓
       DO NOT TRANSFER
```

Then:

```text
Memory OFF
     vs
Memory ON
```

Then:

```text
8-case benchmark
```

If those work:

# SHIP.

---

# 41. WHAT THE TEAM MUST NOT DO

During the MVP, anyone proposing one of these gets the same answer:

> **“After MVP.”**

```text
“Let's add another agent.”
→ After MVP.

“Let's process the Mendeley dataset.”
→ After MVP.

“Let's train the predictor.”
→ After MVP.

“Let's add a memory graph.”
→ After MVP.

“Let's build voice.”
→ After MVP.

“Let's make the dashboard.”
→ After MVP.

“Let's add another scenario.”
→ After MVP.

“Let's redesign the UI.”
→ After MVP.

“Let's research five more competitors.”
→ After MVP.

“Let's improve the architecture.”
→ After MVP.
```

Unless the current MVP is blocked.

---

# 42. THE ACTUAL PRIORITY ORDER

There should now be zero ambiguity:

```text
                         PRIORITY
                            │
                            ▼
                  Hindsight retain works
                            │
                            ▼
                   Hindsight recall works
                            │
                            ▼
                    First decision works
                            │
                            ▼
                    Outcome is recorded
                            │
                            ▼
                  Second case recalls it
                            │
                            ▼
                Recommendation changes
                            │
                            ▼
                  Third case rejects
                 inappropriate transfer
                            │
                            ▼
                       UI shows it
                            │
                            ▼
                    8-case benchmark
                            │
                            ▼
                     failure testing
                            │
                            ▼
                         demo
                            │
                            ▼
                      everything else
```

---

# 43. THE REAL DEFINITION OF “DONE”

Not:

> “The frontend is beautiful.”

Not:

> “We have five agents.”

Not:

> “We trained a model.”

Not:

> “We processed 10,000 tickets.”

Not:

> “We have a huge dataset.”

Not:

> “We deployed 12 microservices.”

Done means:

> **Echo encountered a problem, tried something, observed that it failed, remembered that failure through Hindsight, encountered the problem again, recognized that the historical failure applies, changed its recommendation, achieved a different outcome, and stored the new experience.**

That is the product.

---

# 44. FINAL FROZEN MVP CARD

Put **this** on the wall.

```text
╔══════════════════════════════════════════════╗
║                 ECHO MVP                     ║
╠══════════════════════════════════════════════╣
║                                              ║
║ B2B SaaS Technical Support                  ║
║                                              ║
║ ONE PROBLEM:                                 ║
║ Large export timeout                        ║
║                                              ║
║ THREE CASES:                                 ║
║                                              ║
║ 1. Failure                                   ║
║    Timeout increase → FAIL                  ║
║                                              ║
║ 2. Learning                                  ║
║    Hindsight recalls failure                ║
║    → async chunking → SUCCESS               ║
║                                              ║
║ 3. Boundary                                  ║
║    Similar memory → context mismatch        ║
║    → don't blindly transfer                 ║
║                                              ║
║ CORE MEMORY:                                 ║
║ Retain → Recall → Reflect → Retain          ║
║                                              ║
║ DATA:                                        ║
║ 15 SEEDED experiences                       ║
║                                              ║
║ EVALUATION:                                  ║
║ 8 cases / Memory OFF vs ON                  ║
║                                              ║
║ UI:                                          ║
║ Live Case + What Changed My Mind             ║
║                                              ║
║ VOICE:                                       ║
║ Fallback only                                ║
║                                              ║
║ ML:                                          ║
║ After MVP                                    ║
║                                              ║
║ EXTERNAL DATASETS:                           ║
║ After MVP                                    ║
║                                              ║
║ HOUR 6 GATE:                                 ║
║ If learning loop doesn't work,              ║
║ CUT EVERYTHING ELSE.                        ║
║                                              ║
║ DEFINITION OF DONE:                          ║
║ Memory changes the next decision.            ║
║                                              ║
╚══════════════════════════════════════════════╝
```

## The three things I would have the team do **right now**

1. **Person 2:** get the first `retain()` call working against Hindsight.
2. **Person 3:** write the 15 seeded experiences and deterministic simulator.
3. **Person 1:** establish the `CaseContext → Hindsight → Decision → Outcome → Retain` contract.

Person 5 can build the UI against mocked events while that happens. Person 4 builds the 8-case benchmark structure. Person 6 starts the fallback/deployment harness.
