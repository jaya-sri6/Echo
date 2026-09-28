# ECHO — Team Track

## SOURCE 

Everyone works from the same frozen MVP:

```text
B2B SaaS Technical Support
        ↓
Large Export Timeout
        ↓
15 SEEDED EXPERIENCES
        ↓
Hindsight
        ↓
Recall / Reflect
        ↓
Success / Failure / Partial
        ↓
Applicability
        ↓
Boundary
        ↓
3 Candidate Actions
        ↓
Deterministic Simulator
        ↓
Recommendation
        ↓
Outcome
        ↓
Hindsight Retain
        ↓
Same / Related Case
        ↓
Different Decision
```

The hackathon itself requires Hindsight and specifically asks teams to make memory central and show improvement over repeated interactions.  

---

# TRACK A — CORE ENGINE

This track builds the actual Echo intelligence.

## PERSON 1 — SYSTEMS / INTEGRATION LEAD

### Primary ownership

**Tasks 1–10**

| Task | Work                        |
| ---- | --------------------------- |
| T01  | Create repository structure |
| T02  | Environment configuration   |
| T03  | FastAPI application         |
| T04  | `CaseContext` schema        |
| T05  | Event schema                |
| T06  | WebSocket execution stream  |
| T07  | Agent orchestration         |
| T08  | Integrate all components    |
| T09  | Docker setup                |
| T10  | Deterministic demo runner   |

### What Person 1 actually builds

```text
Customer Input
      ↓
CaseContext
      ↓
Conversation Agent
      ↓
Investigator
      ↓
Experience Reasoner
      ↓
Resolution Agent
      ↓
Guardian
      ↓
Outcome
      ↓
Retain
```

### Must define the contracts

Person 1 should establish the shared interfaces **before everyone starts integrating**.

At minimum:

```text
CaseContext
AgentEvent
Experience
CandidateAction
Decision
Outcome
```

For example:

```json
{
  "case_id": "CASE-001",
  "problem_type": "large_export_timeout",
  "export_size_gb": 600,
  "concurrency": "high",
  "workload": "nightly_batch",
  "execution_mode": "sync"
}
```

### Person 1 checkpoint

> **Every other person's component can plug into the same pipeline without changing the core architecture.**

---

# PERSON 2 — HINDSIGHT / MEMORY ENGINE LEAD

### Primary ownership

**Tasks 11–20**

| Task | Work                             |
| ---- | -------------------------------- |
| T11  | Connect Hindsight                |
| T12  | Create experience memory bank    |
| T13  | Implement `retain()`             |
| T14  | Implement `recall()`             |
| T15  | Implement `reflect()`            |
| T16  | Implement experience schema      |
| T17  | Implement applicability checking |
| T18  | Implement boundary detection     |
| T19  | Return memory evidence to UI     |
| T20  | Verify complete memory loop      |

### Core responsibility

This person owns the **reason Echo is different from a normal support chatbot**.

The memory lifecycle:

```text
CASE
 ↓
RECALL
 ↓
HISTORICAL EXPERIENCES
 ↓
REFLECT
 ↓
APPLICABILITY
 ↓
BOUNDARY
 ↓
DECISION
 ↓
OUTCOME
 ↓
RETAIN
```

### The critical test

Person 2 must demonstrate:

```text
EXP-031

increase_timeout
        ↓
FAILURE
        ↓
Hindsight RETAIN
        ↓
same case
        ↓
Hindsight RECALL
        ↓
failure recognized
        ↓
recommendation changes
```

### Important scope restriction

Do **not** build:

* memory graph
* advanced memory visualization
* automatic experience promotion
* confidence decay

Those belong after MVP.

### Person 2 checkpoint

> **Hindsight memory changes the subsequent recommendation.**

This is the most important technical checkpoint in the entire project.

---

# PERSON 3 — DOMAIN / EXPERIENCE / SIMULATOR LEAD

### Primary ownership

**Tasks 21–25**

| Task | Work                                  |
| ---- | ------------------------------------- |
| T21  | Create 15 seeded experiences          |
| T22  | Create 3 hero cases                   |
| T23  | Build deterministic outcome simulator |
| T24  | Implement 3 candidate actions         |
| T25  | Implement outcome recording           |

---

## T21 — 15 seeded experiences

Exactly:

```text
6 SUCCESS
4 FAILURE
2 PARTIAL
2 BOUNDARY
1 NON-TRANSFERABLE
```

Every experience is explicitly:

```text
source = SEEDED
```

Do not call these real customer records.

---

## T22 — Three hero cases

### Case 1 — Failure

```text
600 GB
HIGH concurrency
NIGHTLY batch
SYNC

Action:
Increase timeout

Outcome:
FAILURE
```

### Case 2 — Learning

```text
600 GB
HIGH concurrency
NIGHTLY batch
SYNC

Hindsight:
recalls Case 1

Decision:
Async chunked export

Outcome:
SUCCESS
```

### Case 3 — Applicability boundary

```text
20 GB
LOW concurrency
INTERACTIVE

Hindsight:
similar experiences found

Context:
does not match

Decision:
do not blindly transfer memory
```

---

## T23 — Deterministic simulator

Inputs:

```text
export_size
concurrency
workload
execution_mode
action
```

Outputs:

```text
status
resolution_time
escalation
reason
```

No ML.

No probabilistic black box.

Same input must produce the same result.

### Person 3 checkpoint

> **The three hero cases can execute deterministically from start to finish.**

---

# TRACK B — PROOF + DEMO

This track proves the system works and makes the proof understandable.

---

# PERSON 4 — EVALUATION / BENCHMARK LEAD

### Primary ownership

**Tasks 26–30**

| Task | Work                           |
| ---- | ------------------------------ |
| T26  | Create 8 benchmark cases       |
| T27  | Implement Memory OFF execution |
| T28  | Implement Memory ON execution  |
| T29  | Calculate benchmark metrics    |
| T30  | Produce final comparison       |

### Benchmark size

**Exactly 8 cases for MVP.**

Do not inflate this to 30 or 100.

### Required benchmark categories

```text
3 memory-helpful cases
2 historical-failure cases
2 non-transferable/context-mismatch cases
1 ambiguous case
```

### Metrics

```text
Decision success
Failed intervention rate
Applicability accuracy
Memory-triggered decision change
Resolution time
```

### Core comparison

```text
MEMORY OFF
     ↓
recommendation

        VS

MEMORY ON
     ↓
Hindsight recall
     ↓
experience analysis
     ↓
different recommendation
```

### Person 4 checkpoint

> **Memory OFF vs Memory ON can be reproduced automatically on the 8-case benchmark.**

Do not claim statistical significance.

Do not invent business savings.

---

# PERSON 5 — FRONTEND / UX LEAD

This person has **no numbered tasks** because their work cuts across the output of Persons 1–4.

But the scope is now explicitly frozen.

## Only TWO MVP UI surfaces

### UI-01 — Live Case

Must display:

```text
CASE
 ↓
CONTEXT
 ↓
AGENT EXECUTION
 ↓
HINDSIGHT RECALL
 ↓
EXPERIENCE ANALYSIS
 ↓
CANDIDATES
 ↓
RECOMMENDATION
 ↓
OUTCOME
```

Example:

```text
ECHO

600 GB export
HIGH concurrency
NIGHTLY batch

✓ Context extracted
✓ Hindsight recalled 4 experiences
✓ Historical failure detected
✓ Boundary detected
✓ Candidates evaluated

RECOMMENDATION

ASYNC CHUNKED EXPORT
```

---

## UI-02 — What Changed My Mind?

This is the **hero component**.

```text
WHAT CHANGED MY MIND?

INITIAL RECOMMENDATION
Increase timeout

        ↓

HINDSIGHT RECALL
Historical failure found

        ↓

BOUNDARY DETECTED
Large export + high concurrency

        ↓

FINAL RECOMMENDATION
Async chunked export
```

Also show:

```text
DON'T REPEAT THE COMPANY'S MISTAKE

EXP-031
Increase timeout

Historical outcome:
FAILURE
```

### Person 5 may also show

* memory source
* experience ID
* success/failure/partial
* applicability
* boundary
* agent execution timeline
* outcome

### Person 5 must NOT build

```text
❌ Dashboard
❌ Memory graph
❌ Analytics suite
❌ Extra screens
❌ Full voice interface
❌ Complex animation system
```

### Person 5 checkpoint

> **A judge can understand why the recommendation changed simply by looking at the UI.**

---

# PERSON 6 — RED TEAM / DEPLOYMENT / DEMO RELIABILITY

This person's job is **not to build another product subsystem**.

Their job is to ensure the product survives reality.

## Responsibility 1 — Deployment

Prepare:

```text
Docker
 ↓
FastAPI
 ↓
Frontend
 ↓
Hindsight
```

---

## Responsibility 2 — Failure testing

Explicitly test:

### Hindsight failure

```text
Hindsight unavailable
        ↓
Seeded Memory Provider
```

UI:

```text
MEMORY MODE:
SEEDED DEMO FALLBACK
```

Never pretend this is live Hindsight.

---

### Groq failure

```text
Groq unavailable
        ↓
cached/deterministic reasoning
```

---

### WebSocket failure

```text
WebSocket unavailable
        ↓
scenario playback
```

---

### Voice failure

```text
Voice unavailable
        ↓
text input
```

---

### Internet failure

```text
Internet unavailable
        ↓
Docker + seeded memory
+ deterministic simulator
```

---

# PERSON 6 — HOUR-6 EMERGENCY OWNER

This is the refinement I would definitely add.

At **hour 6**, Person 6 runs the hard gate:

> Can Case 1 fail, be retained, and cause Case 2 to receive a different recommendation?

### If YES

Continue normally.

### If NO

Person 6 immediately declares:

# MVP EMERGENCY MODE

Cut:

```text
❌ benchmark polish
❌ deployment polish
❌ voice
❌ extra cases
❌ external datasets
❌ ML
❌ advanced Guardian
❌ advanced UI
❌ memory graph
```

Keep only:

```text
Hindsight
+
3 cases
+
decision change
+
What Changed My Mind
```

This prevents the team from spending the final six hours polishing a system whose core learning loop does not work.

---

# PERSON 6 — DEMO OWNERSHIP

They own the final rehearsal:

```text
Reset
 ↓
Case 1
 ↓
Failure
 ↓
Retain
 ↓
Case 2
 ↓
Recall
 ↓
Decision changes
 ↓
Success
 ↓
Case 3
 ↓
Context mismatch
 ↓
Memory rejected
```

Target:

**3–5 minute live demo.**

Then run it twice with a stopwatch.

---

# FINAL DEPENDENCY GRAPH

This is how the six people actually work in parallel:

```text
                    ┌─────────────────────┐
                    │ PERSON 1            │
                    │ SYSTEM CONTRACTS    │
                    │ FASTAPI / EVENTS    │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌────────────┐   ┌────────────┐   ┌────────────┐
       │ PERSON 2   │   │ PERSON 3   │   │ PERSON 4   │
       │ HINDSIGHT  │   │ DOMAIN     │   │ EVALUATION │
       │ MEMORY     │   │ SIMULATOR  │   │ BENCHMARK  │
       └─────┬──────┘   └─────┬──────┘   └─────┬──────┘
             │                │                │
             └────────────────┼────────────────┘
                              ▼
                       ┌────────────┐
                       │ PERSON 5   │
                       │ FRONTEND   │
                       └─────┬──────┘
                             │
                             ▼
                       ┌────────────┐
                       │ PERSON 6   │
                       │ QA / DEMO  │
                       │ DEPLOYMENT │
                       └────────────┘
```

But importantly, **Persons 5 and 6 do not have to wait for Persons 2–4 to finish**.

Person 5 can use mocked events.

Person 6 can prepare Docker, fallback providers, demo scripts and failure tests immediately.

---

# FINAL 30 TASKS

For absolute clarity, this remains unchanged:

### Person 1

```text
T01 Repository
T02 Environment
T03 FastAPI
T04 CaseContext
T05 Event schema
T06 WebSocket
T07 Orchestration
T08 Integration
T09 Docker
T10 Demo runner
```

### Person 2

```text
T11 Hindsight connection
T12 Memory bank
T13 Retain
T14 Recall
T15 Reflect
T16 Experience schema
T17 Applicability
T18 Boundary
T19 Memory evidence
T20 Full memory loop
```

### Person 3

```text
T21 15 seeded experiences
T22 3 hero cases
T23 Deterministic simulator
T24 3 candidate actions
T25 Outcome recording
```

### Person 4

```text
T26 8 benchmark cases
T27 Memory OFF
T28 Memory ON
T29 Metrics
T30 Comparison
```

### Person 5

```text
UI-01 Live Case
UI-02 What Changed My Mind
```

### Person 6

```text
OPS-01 Deployment
OPS-02 Fallbacks
OPS-03 Failure testing
OPS-04 Hour-6 emergency gate
OPS-05 Demo rehearsal
OPS-06 README / judge defense
```

---

# WHAT IS STILL AFTER MVP

Do **not** let these leak back into today's task allocation.

## Phase 2 — Real Data Grounding

Mendeley + Zenodo.

The hackathon permits realistic/synthetic data, and its own guidance emphasizes realistic data, but for this one-day build the intervention/outcome loop is more important than spending the day preprocessing external datasets. 

---

## Phase 3 — Learned Outcome Predictor

```text
Experience data
 ↓
Train/test split
 ↓
Gradient Boosting / Random Forest
 ↓
Predicted outcome
```

Only after the deterministic simulator is proven.

---

## Phase 4 — Experience Evolution

Only three additions:

```text
Experience candidates
Confidence decay
Human correction → new memory
```

That is the complete post-MVP roadmap.

---

# FINAL HONEST CHECK

### What I would **not** change

The current MVP is correctly frozen around:

* one business problem
* one persona
* three cases
* 15 seeded experiences
* Hindsight as the central mechanism
* deterministic simulator
* 8-case evaluation
* Memory OFF vs ON
* applicability/boundary
* two UI surfaces
* voice as fallback
* six-person ownership
* hour-6 cutoff

That is consistent with the hackathon's requirement to make Hindsight central and demonstrate actual improvement over repeated interactions.

### What I **did refine**

Only two things:

1. **Person 5 and Person 6 now have explicit, bounded responsibilities**, rather than vague ownership.
2. **Person 6 formally owns the hour-6 emergency cutover**, so an SDK/infrastructure failure cannot consume the whole team's remaining time.

### What I would **not** add

I would **not** add another task, another agent, another dataset, another benchmark size, or another roadmap item to this MVP.

The plan has now crossed the line from **planning** to **execution**.

**The next action should be implementation—starting with Person 2's first Hindsight `retain()` and Person 1's shared contract.**
