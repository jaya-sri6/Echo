# ECHO — Extensions Master Integration Specification

## Purpose

This document is the execution specification for building the **Echo Extensions** layer without disturbing the existing Echo core.

The goal is to let the team:

1. keep the current Echo application running,
2. deploy the working core,
3. build advanced S-tier and A-tier capabilities independently,
4. give every capability its own implementation area and tests,
5. document exactly where and how each capability connects to Echo,
6. later integrate the tested capabilities into the redesigned frontend/backend,
7. prove that every integrated capability actually works.

This document is written so an implementation agent such as Antigravity can execute the work **one feature at a time**.

---

# 0. NON-NEGOTIABLE RULES

## Rule 0.1 — DO NOT BREAK THE CORE

The existing Echo core is the source of truth.

Do not:

- rewrite working core logic merely to make an extension easier,
- move core files unnecessarily,
- replace Hindsight with another memory system,
- introduce a second competing orchestration system,
- introduce a second competing decision engine,
- delete working endpoints,
- delete working agents,
- replace the current simulator,
- replace working UI components,
- change environment variables without documenting compatibility,
- silently change existing behavior.

The extension layer is additive.

---

## Rule 0.2 — THE CURRENT APPLICATION MUST KEEP RUNNING

Before touching the repository:

1. inspect the repository,
2. identify the current frontend entry point,
3. identify the current backend entry point,
4. identify current agent/orchestration code,
5. identify current Hindsight integration,
6. identify current tests,
7. identify current run commands,
8. run the current application,
9. run the current test suite,
10. record the baseline result.

Do not begin extension implementation until the baseline is known.

If the baseline is already failing, document the failure before making extension changes.

Do not claim an extension caused a failure that existed before the extension.

---

## Rule 0.3 — INSPECT FIRST, THEN MODIFY

Never assume file names.

The current repository structure may evolve while this document is being executed.

Antigravity MUST inspect the actual repository and map:

- `<existing-backend-root>`
- `<existing-frontend-root>`
- `<existing-agent-root>`
- `<existing-memory-root>`
- `<existing-evaluation-root>`
- `<existing-test-root>`
- `<existing-config-files>`

The exact paths discovered during inspection must be recorded in:

`echo-extensions/MAIN_INTEGRATION.md`

Do not invent paths.

---

## Rule 0.4 — EXTENSIONS LIVE UNDER THE ROOT EXTENSION DIRECTORY

Create:

```text
echo/
└── echo-extensions/
```

This directory is the extension workspace.

Do not place experimental extension code randomly throughout the core repository.

Core modifications are allowed only when an extension is ready for integration and only through the documented integration contract.

---

## Rule 0.5 — EVERY FEATURE MUST HAVE ITS OWN TESTS

No feature is considered complete because:

- the file exists,
- the UI renders,
- the endpoint returns 200,
- a screenshot looks good,
- the code compiles.

A feature is complete only when:

1. unit tests pass,
2. contract tests pass,
3. integration tests pass,
4. core regression tests pass,
5. manual verification passes where UI behavior is involved,
6. evidence is recorded,
7. rollback is possible.

---

## Rule 0.6 — HINDSIGHT REMAINS ORGANIZATIONAL EXPERIENCE MEMORY

Echo has two different types of persistence.

### Application state

Use the existing application state layer / database for things such as:

- users,
- sessions,
- cases,
- chat messages,
- scenario definitions,
- scenario state,
- UI state,
- execution events,
- benchmark runs.

### Organizational experience

Hindsight remains the source of truth for:

- prior interventions,
- outcomes,
- failures,
- partial outcomes,
- lessons,
- applicability,
- boundaries,
- experience provenance,
- retained organizational learnings.

Do not duplicate Hindsight's organizational-memory responsibility into Redis, a vector database, or a second memory engine.

---

## Rule 0.7 — NO FRAMEWORK ADDITIONS WITHOUT A REAL REQUIREMENT

The extension system does not require LangChain or LangGraph by default.

Existing/direct Python orchestration should remain the default.

Only introduce a framework when:

- a feature genuinely requires it,
- the requirement is documented,
- the dependency is tested,
- the dependency does not replace the existing core unnecessarily.

The extension specification must remain compatible with plain Python orchestration.

---

## Rule 0.8 — PROVENANCE MUST BE HONEST

Every experience, scenario, prediction, and result shown to a user must have an explicit provenance state where applicable.

Recommended labels:

- `SEEDED`
- `GENERATED`
- `OBSERVED`
- `PREDICTED`
- `REPLAYED`
- `REAL`

Never present generated or simulated outcomes as real enterprise customer history.

---

# 1. PRODUCT CONTEXT

## 1.1 Echo

### Core line

> **Echo doesn't remember what customers said. It remembers what the company learned.**

### Product

Echo is an outcome-aware organizational memory system for B2B SaaS technical support.

The employee enters Echo to work on a customer problem.

The employee can:

- describe the problem,
- continue a support conversation,
- see Echo's agents working,
- see organizational experience being recalled,
- inspect why memory was relevant,
- understand why a recommendation changed,
- create hypothetical scenarios,
- test alternative conditions,
- replay decisions with memory OFF and ON,
- correct Echo,
- create new experiences,
- see those experiences become available to future cases.

---

# 2. THE FROZEN CORE LOOP

The extensions must preserve this loop:

```text
CUSTOMER / EMPLOYEE INTERACTION
        ↓
CASE CONTEXT
        ↓
UNDERSTAND
        ↓
HINDSIGHT RECALL
        ↓
EXPERIENCE ANALYSIS
        ↓
APPLICABILITY / BOUNDARY
        ↓
CANDIDATE ACTIONS
        ↓
DECISION
        ↓
GUARDIAN / POLICY CHECK
        ↓
SIMULATOR / EXECUTION
        ↓
OUTCOME
        ↓
HINDSIGHT RETAIN
        ↓
NEW ORGANIZATIONAL EXPERIENCE
        ↓
BETTER NEXT DECISION
```

Extensions expose, test, or improve parts of this loop.

They do not replace it.

---

# 3. THE THREE-CASE PROOF

The entire product must remain capable of demonstrating these three cases.

## Case A — First experience

Example:

```text
600 GB
HIGH concurrency
NIGHTLY BATCH
```

Initial decision:

```text
Increase timeout
```

Outcome:

```text
FAILURE
```

The failure becomes an experience.

---

## Case B — Repeated problem

Same context.

Hindsight recalls the previous failure.

Echo identifies the boundary.

Decision changes:

```text
Increase timeout
        ↓
Async chunked export
```

Outcome:

```text
SUCCESS
```

The new successful experience is retained.

---

## Case C — Similar-looking but different

Example:

```text
20 GB
LOW concurrency
INTERACTIVE
```

Echo may retrieve related memories.

But applicability/boundary analysis determines whether they transfer.

Expected behavior:

```text
MEMORY FOUND
        ↓
CONTEXT DOES NOT MATCH
        ↓
TRANSFER REJECTED / LIMITED
```

This proves:

1. memory,
2. learning,
3. boundary reasoning.

---

# 4. TARGET EXTENSION STRUCTURE

Create the following structure under the repository root.

```text
echo/
│
├── echo-extensions/
│   │
│   ├── MAIN_INTEGRATION.md
│   ├── EXTENSION_STATUS.md
│   ├── EXTENSION_TEST_MATRIX.md
│   ├── EXTENSION_ROLLBACK.md
│   ├── CORE_COMPATIBILITY.md
│   ├── DEMO_INTEGRATION.md
│   │
│   ├── _shared/
│   │   ├── README.md
│   │   ├── contracts/
│   │   │   ├── case_context.schema.json
│   │   │   ├── memory_evidence.schema.json
│   │   │   ├── decision_trace.schema.json
│   │   │   ├── candidate_action.schema.json
│   │   │   ├── outcome.schema.json
│   │   │   ├── experience.schema.json
│   │   │   ├── scenario.schema.json
│   │   │   └── event.schema.json
│   │   ├── adapters/
│   │   ├── fixtures/
│   │   └── test_utils/
│   │
│   ├── s1-memory-explorer/
│   │   ├── README.md
│   │   ├── SPEC.md
│   │   ├── INTEGRATION.md
│   │   ├── TEST_PLAN.md
│   │   ├── backend/
│   │   ├── frontend/
│   │   ├── adapters/
│   │   ├── fixtures/
│   │   └── tests/
│   │
│   ├── s2-decision-replay/
│   │   ├── README.md
│   │   ├── SPEC.md
│   │   ├── INTEGRATION.md
│   │   ├── TEST_PLAN.md
│   │   ├── backend/
│   │   ├── frontend/
│   │   ├── adapters/
│   │   ├── fixtures/
│   │   └── tests/
│   │
│   ├── s3-human-correction/
│   │   ├── README.md
│   │   ├── SPEC.md
│   │   ├── INTEGRATION.md
│   │   ├── TEST_PLAN.md
│   │   ├── backend/
│   │   ├── frontend/
│   │   ├── adapters/
│   │   ├── fixtures/
│   │   └── tests/
│   │
│   ├── s4-experience-evolution/
│   │   ├── README.md
│   │   ├── SPEC.md
│   │   ├── INTEGRATION.md
│   │   ├── TEST_PLAN.md
│   │   ├── backend/
│   │   ├── frontend/
│   │   ├── adapters/
│   │   ├── fixtures/
│   │   └── tests/
│   │
│   ├── s5-conflict-boundary/
│   │   ├── README.md
│   │   ├── SPEC.md
│   │   ├── INTEGRATION.md
│   │   ├── TEST_PLAN.md
│   │   ├── backend/
│   │   ├── frontend/
│   │   ├── adapters/
│   │   ├── fixtures/
│   │   └── tests/
│   │
│   ├── a1-confidence-freshness/
│   │   ├── README.md
│   │   ├── SPEC.md
│   │   ├── INTEGRATION.md
│   │   ├── TEST_PLAN.md
│   │   ├── backend/
│   │   ├── frontend/
│   │   ├── adapters/
│   │   ├── fixtures/
│   │   └── tests/
│   │
│   ├── a2-data-grounding/
│   │   ├── README.md
│   │   ├── SPEC.md
│   │   ├── INTEGRATION.md
│   │   ├── TEST_PLAN.md
│   │   ├── backend/
│   │   ├── data/
│   │   ├── adapters/
│   │   ├── fixtures/
│   │   └── tests/
│   │
│   └── a3-outcome-predictor/
│       ├── README.md
│       ├── SPEC.md
│       ├── INTEGRATION.md
│       ├── TEST_PLAN.md
│       ├── backend/
│       ├── models/
│       ├── fixtures/
│       └── tests/
│
├── <existing-core>
└── ...
```

The actual existing core paths must be discovered rather than assumed.

---

# 5. MASTER EXECUTION ORDER

Antigravity must execute extensions in this order unless the team explicitly changes the order.

```text
PHASE 0
Repository inspection
Baseline tests
Core compatibility document

        ↓

PHASE 1
Shared contracts
Extension test harness

        ↓

PHASE 2
S1 — Interactive Memory Explorer

        ↓

PHASE 3
S2 — Decision Replay

        ↓

PHASE 4
S3 — Human Correction → Memory

        ↓

PHASE 5
S5 — Conflict + Boundary Resolution

        ↓

PHASE 6
S4 — Experience Evolution

        ↓

PHASE 7
A1 — Confidence / Freshness

        ↓

PHASE 8
A2 — Data Grounding

        ↓

PHASE 9
A3 — Outcome Predictor

        ↓

PHASE 10
Full regression

        ↓

PHASE 11
Frontend redesign integration

        ↓

PHASE 12
Final demo rehearsal
```

Do not skip the test checkpoint between phases.

---

# 6. PHASE 0 — REPOSITORY BASELINE

## Goal

Understand the actual repository before creating extension code.

## Antigravity must inspect

Find:

- package manager,
- frontend framework,
- backend framework,
- Python environment,
- existing API routes,
- WebSocket implementation,
- agent implementation,
- Hindsight client,
- simulator,
- current memory schema,
- current database,
- current environment variables,
- current tests,
- current run commands,
- current deployment configuration.

## Record

Create:

`echo-extensions/CORE_COMPATIBILITY.md`

Include:

```text
Repository commit:
Date:
Python version:
Node version:
Frontend:
Backend:
Memory:
Database:
Realtime:
Tests:
Build command:
Frontend run command:
Backend run command:
Deployment:
```

Also record exact discovered paths.

## Baseline command evidence

Record:

```text
pytest result
frontend test result
backend test result
build result
lint result
```

If a test fails before extensions begin, record it under:

`PRE-EXISTING FAILURES`

---

# 7. SHARED CONTRACTS

All extensions should use common conceptual objects.

## 7.1 CaseContext

```text
case_id
customer_context
problem_type
problem_description
severity
technical_context
conditions
source
provenance
created_at
```

For the hero scenario:

```text
export_size_gb
concurrency
workload
execution_mode
api_version
```

---

## 7.2 MemoryEvidence

```text
experience_id
problem
context
diagnosis
action
outcome
lesson
boundary
applicability
provenance
source
retrieval_reason
temporal_relevance
```

---

## 7.3 DecisionTrace

```text
decision_id
case_id
initial_candidates
recalled_experiences
applicability_results
boundary_results
candidate_actions
selected_action
guardian_result
reason
decision_changed
before_decision
after_decision
```

---

## 7.4 CandidateAction

```text
action_id
action_type
description
source
predicted_outcome
risk
applicability
```

---

## 7.5 Outcome

```text
status
resolution_time
escalated
customer_result
failure_reason
source
provenance
```

---

## 7.6 Experience

```text
experience_id
problem
context
diagnosis
action
outcome
lesson
boundary
applicability
provenance
source
confidence
created_at
```

---

## 7.7 Scenario

```text
scenario_id
parent_case_id
name
context
modified_fields
created_by
source
status
result
```

---

## 7.8 Event

Every real-time UI event must have:

```text
event_id
case_id
scenario_id
event_type
timestamp
status
payload
provenance
```

Expected event types include:

```text
CASE_RECEIVED
CONTEXT_EXTRACTED
AGENTS_STARTED
MEMORY_RECALL_STARTED
MEMORY_RECALLED
EXPERIENCE_SELECTED
APPLICABILITY_CHECKED
BOUNDARY_DETECTED
CANDIDATES_GENERATED
SIMULATION_STARTED
SIMULATION_COMPLETED
DECISION_CHANGED
GUARDIAN_CHECKED
RECOMMENDATION_READY
OUTCOME_RECORDED
EXPERIENCE_RETAINED
SCENARIO_CREATED
SCENARIO_STARTED
SCENARIO_COMPLETED
CORRECTION_RECORDED
EXPERIENCE_CANDIDATE_CREATED
```

Do not create fake events merely for animation.

---

# 8. S1 — INTERACTIVE MEMORY EXPLORER

## 8.1 Purpose

Make Hindsight visible.

The user should be able to see:

- what memory was recalled,
- why it was recalled,
- what happened previously,
- what action was taken,
- whether it succeeded,
- where the experience applies,
- where it does not apply,
- what lesson was retained,
- what provenance it has.

## 8.2 Product contribution

This feature turns:

> “Echo has memory.”

into:

> “I can inspect exactly what Echo remembered and why it matters.”

This directly strengthens the Hindsight demonstration.

---

## 8.3 User experience

During an active case:

```text
MEMORY

3 relevant experiences found

EXP-031
Large Export Timeout
FAILURE

EXP-044
Async Chunked Export
SUCCESS

EXP-067
Timeout Increase
SUCCESS
```

Clicking a memory opens:

```text
EXPERIENCE DETAIL

WHAT HAPPENED
...

WHAT WE TRIED
...

OUTCOME
...

WHY
...

BOUNDARY
...

APPLICABILITY
...

SOURCE
SEEDED / GENERATED / OBSERVED
```

---

## 8.4 "Why was this recalled?"

Provide an inspection action.

Display only evidence available from the actual system.

Example:

```text
WHY RECALLED

Problem type: matched
Export size: matched
Concurrency: matched
Workload: matched

Transfer assessment:
HIGH
```

If the backend does not calculate a field, do not fabricate it.

---

## 8.5 Integration

Read from:

- Hindsight recall result,
- current CaseContext,
- applicability analysis,
- boundary analysis,
- decision trace.

Do not implement a second retrieval system.

---

## 8.6 Files

Create inside:

```text
echo-extensions/s1-memory-explorer/
```

Use:

```text
README.md
SPEC.md
INTEGRATION.md
TEST_PLAN.md
backend/
frontend/
adapters/
fixtures/
tests/
```

---

## 8.7 Tests

Minimum tests:

1. memory cards render,
2. experience details render,
3. provenance renders,
4. recalled memory ID is preserved,
5. applicability is displayed,
6. boundary is displayed,
7. no-memory state renders,
8. irrelevant-memory state renders,
9. Hindsight failure uses the documented fallback,
10. core case flow still works.

### Acceptance test

```text
Given a case with known relevant memories

When Hindsight recalls experiences

Then the Memory Explorer shows those exact experiences

And the displayed evidence matches the backend response

And no invented memory is displayed.
```

---

# 9. S2 — DECISION REPLAY / MEMORY OFF VS ON

## Purpose

Prove causality at the product-demo level.

The same case should be executable in two modes:

```text
MEMORY OFF
MEMORY ON
```

## Contribution

This is one of the strongest pieces of evidence that memory changes behavior.

It demonstrates:

```text
Same case
+
Memory OFF
=
Decision A

Same case
+
Memory ON
=
Decision B
```

---

## UI

```text
DECISION REPLAY

MEMORY OFF
Action:
Increase timeout
Outcome:
FAILURE

MEMORY ON
Recalled:
EXP-031

Boundary:
Large + high concurrency + batch

Action:
Async chunked export
Outcome:
SUCCESS
```

---

## Integration

Do not duplicate the entire decision engine.

Add a controlled execution mode:

```text
memory_mode = OFF | ON
```

When OFF:

- do not use organizational experience memory in the decision path.

When ON:

- use the normal Hindsight flow.

Everything else should remain identical.

---

## Tests

1. same input produces same baseline behavior,
2. Memory OFF does not recall organizational experiences,
3. Memory ON recalls expected experience,
4. decision change is recorded,
5. outcome comparison is correct,
6. replay does not mutate the original case unless explicitly requested,
7. replay can be reset,
8. deterministic simulator remains deterministic.

### Acceptance test

```text
RESET
↓
MEMORY OFF
↓
CASE
↓
DECISION A
↓
OUTCOME A

RESET
↓
MEMORY ON
↓
SAME CASE
↓
DECISION B
↓
OUTCOME B

Compare A and B.
```

---

# 10. S3 — HUMAN CORRECTION → MEMORY

## Purpose

Allow the employee to teach Echo.

## Contribution

This proves that Echo is not merely retrieving a fixed collection of memories.

The employee can say:

> “That recommendation was wrong.”

Then the correction becomes a candidate experience update.

---

## UI

After a recommendation:

```text
Was this recommendation useful?

[ Correct ]
[ Needs correction ]
```

If correction:

```text
WHAT DID ECHO MISS?

Concurrency
Workload
Export size
API version

Additional note:
________________________
```

---

## Backend flow

```text
Human correction
        ↓
Correction validation
        ↓
Experience update / candidate
        ↓
Hindsight retain
        ↓
Future recall
```

Do not immediately overwrite historical evidence destructively.

Preserve provenance.

---

## Tests

1. correction can be submitted,
2. invalid correction is rejected,
3. correction is associated with the correct case,
4. correction retains provenance,
5. correction becomes retrievable where appropriate,
6. future case can recall corrected knowledge,
7. original experience remains auditable,
8. duplicate corrections are handled safely.

### Acceptance test

```text
Case
↓
Recommendation
↓
Human says incorrect
↓
Correction recorded
↓
Hindsight retain
↓
Related case
↓
Correction can influence decision
```

---

# 11. S4 — EXPERIENCE EVOLUTION

## Purpose

Move Echo from individual memories toward reusable organizational experience.

## Contribution

After repeated cases, Echo can identify a pattern.

Example:

```text
12 related cases

9 successful
3 failed

Common boundary:
Large export
+
High concurrency
+
Batch workload
```

Then create:

```text
EXPERIENCE CANDIDATE

Async chunking appears preferable
for large high-concurrency batch exports.

Evidence:
12 related cases

[ Review ]
[ Reject ]
[ Promote ]
```

---

## Critical rule

Do not automatically turn every statistical pattern into organizational truth.

The system should distinguish:

```text
Observed experiences
        ↓
Candidate pattern
        ↓
Review
        ↓
Promoted experience
```

---

## Tests

1. repeated cases are grouped correctly,
2. unrelated cases are not grouped,
3. candidate contains evidence IDs,
4. candidate has provenance,
5. candidate can be rejected,
6. candidate can be promoted,
7. promotion writes to Hindsight,
8. promoted experience can be recalled,
9. original experiences remain intact.

---

# 12. S5 — CONFLICT + BOUNDARY RESOLUTION

## Purpose

Handle contradictory experiences.

Example:

```text
EXP-067
Increase timeout
SUCCESS

EXP-031
Increase timeout
FAILURE
```

The system must not conclude:

```text
timeout = good
```

or:

```text
timeout = bad
```

It should inspect conditions.

---

## Expected behavior

```text
SUCCESS
120 GB
LOW concurrency
INTERACTIVE

vs

FAILURE
600 GB
HIGH concurrency
BATCH
```

Then:

```text
CONFLICT RESOLVED BY CONTEXT

The action has different outcomes
under different operating conditions.
```

---

## Tests

1. conflicting experiences are surfaced,
2. context differences are detected,
3. boundary conditions are generated from actual evidence,
4. current context is compared against boundary,
5. applicable experience is preferred,
6. non-applicable experience is rejected or down-weighted,
7. no universal rule is fabricated.

---

# 13. A1 — EXPERIENCE CONFIDENCE / FRESHNESS

## Purpose

Help Echo reason about the strength and age of experience.

Possible dimensions:

```text
Evidence count
Recency
Outcome consistency
Applicability match
Contradiction count
Provenance
```

Do not invent a single confidence score without a documented calculation.

---

## UI

Example:

```text
EXP-044

Applicability:
HIGH

Evidence:
7 related cases

Recent:
YES

Contradictory evidence:
1 case

Provenance:
OBSERVED
```

If a numerical score is used, the formula must be documented and tested.

---

## Tests

- freshness changes according to timestamps,
- contradictory evidence is detected,
- evidence count is correct,
- score/formula is deterministic,
- stale experiences are not silently deleted,
- UI reflects backend values exactly.

---

# 14. A2 — REAL DATA GROUNDING

## Purpose

Ground Echo's domain vocabulary and scenario diversity in credible public support data.

For the current MVP strategy:

- do not fabricate real customer records,
- use explicitly labeled seeded experiences,
- use public datasets only where their actual fields/content support grounding,
- preserve provenance.

Future grounding sources previously considered include helpdesk/support-ticket datasets, but the current MVP direction may keep those sources out of the critical path.

Therefore:

```text
PUBLIC DATA
    ↓
inspect
    ↓
document usable fields
    ↓
ground taxonomy / terminology / scenario patterns
    ↓
controlled generation if needed
    ↓
label GENERATED
```

Do not represent generated interventions/outcomes as observations from the public dataset unless the source actually contains those observations.

---

## Tests

1. source provenance is stored,
2. raw source is not modified destructively,
3. normalization is deterministic,
4. PII is not introduced,
5. generated records are explicitly labeled,
6. public data is not falsely presented as Echo outcome history,
7. removing the data-grounding extension does not break core Echo.

---

# 15. A3 — OUTCOME PREDICTOR

## Purpose

Provide an optional learned signal about candidate actions.

This is secondary to Hindsight.

The predictor must never replace organizational experience memory.

Architecture:

```text
Historical Experiences
        ↓
Feature Engineering
        ↓
Small Tabular Model
        ↓
Candidate Action Signal
        ↓
Decision Engine
```

Suitable MVP-scale approaches may include:

- Gradient Boosting,
- Random Forest,
- another small scikit-learn model.

No GPU is required.

---

## Predictor output

Example:

```text
Candidate:
Async chunking

Predicted:
resolution likelihood
estimated resolution time
escalation likelihood
```

These must be calculated from the actual trained model.

Never hard-code impressive numbers.

---

## Tests

1. training data is separated from holdout data,
2. feature schema is versioned,
3. model loads successfully,
4. prediction is deterministic for fixed model/input,
5. predictor failure does not break Echo,
6. predictor is clearly labeled PREDICTED,
7. predictor does not overwrite Hindsight evidence,
8. Memory ON/OFF benchmark remains possible without the predictor.

---

# 16. SCENARIO EXPLORER — CROSS-CUTTING CAPABILITY

This capability is important enough to be treated as a shared extension pattern.

## Purpose

The employee can ask:

> “What if?”

Echo creates a controlled scenario.

Examples:

```text
What if export size was 20 GB?

What if concurrency was low?

What if workload was interactive?

What if the API version changed?

What if we used async chunking?
```

---

## Scenario lifecycle

```text
EMPLOYEE QUESTION
        ↓
SCENARIO CREATED
        ↓
CONTEXT MODIFIED
        ↓
HINDSIGHT RECALL
        ↓
APPLICABILITY
        ↓
CANDIDATE ACTIONS
        ↓
SIMULATOR
        ↓
RESULT
        ↓
OPTIONAL RETENTION
```

---

## Important distinction

A scenario is not automatically an organizational fact.

Until observed or explicitly accepted:

```text
SCENARIO
PREDICTED / SIMULATED
```

not:

```text
REAL
```

---

# 17. FRONTEND EXPERIENCE

The extensions should support one unified Echo workspace.

Recommended conceptual layout:

```text
┌───────────────────────────────────────────────────────────────┐
│ ECHO                                                          │
├──────────────┬─────────────────────────────┬──────────────────┤
│              │                             │                  │
│ CASES        │ CHAT / CASE                 │ ECHO INTELLIGENCE│
│              │                             │                  │
│ Active case  │ Employee conversation       │ Memory           │
│              │                             │                  │
│ Scenarios    │ Agent progress              │ Decision trace   │
│              │                             │                  │
│ Recent cases │ Recommendation               │ Boundaries       │
│              │                             │                  │
│              │                             │ Scenario explorer│
└──────────────┴─────────────────────────────┴──────────────────┘
```

The interface should not require the employee to navigate through many pages.

The case remains the center.

The intelligence panel changes according to the current state:

```text
Conversation
→ Memory

Decision
→ What Changed My Mind

Scenario
→ Scenario Explorer

Outcome
→ Experience Created

Pattern
→ Experience Evolution
```

---

# 18. REAL-TIME FRONTEND EVENT MODEL

The frontend must consume real backend events.

Do not fake agent progress.

Example:

```text
CASE_RECEIVED
↓
CONTEXT_EXTRACTED
↓
AGENTS_STARTED
↓
MEMORY_RECALL_STARTED
↓
MEMORY_RECALLED
↓
APPLICABILITY_CHECKED
↓
BOUNDARY_DETECTED
↓
CANDIDATES_GENERATED
↓
SIMULATION_STARTED
↓
SIMULATION_COMPLETED
↓
DECISION_CHANGED
↓
GUARDIAN_CHECKED
↓
RECOMMENDATION_READY
↓
OUTCOME_RECORDED
↓
EXPERIENCE_RETAINED
```

The UI should render these events.

If an event does not exist in the backend, the UI must not pretend that the operation occurred.

---

# 19. AGENT DISPLAY

The UI may show the five Echo agents:

1. Conversation Agent
2. Case Investigator
3. Experience Reasoner
4. Resolution Agent
5. Guardian

But the display must correspond to actual execution state.

Example:

```text
AGENTS

✓ Conversation Agent
  Case understood

✓ Case Investigator
  Context extracted

✓ Experience Reasoner
  3 experiences recalled

→ Resolution Agent
  Evaluating candidates

○ Guardian
  Waiting
```

Avoid fake "AI thinking" animations.

---

# 20. DATABASE RULES

## Store in application database

- users,
- authentication/session state,
- cases,
- messages,
- scenarios,
- execution event records,
- replay runs,
- benchmark records,
- UI-independent audit records.

## Store in Hindsight

- organizational experiences,
- retained lessons,
- failures,
- successful interventions,
- partial outcomes,
- boundaries,
- applicability information,
- corrections that become organizational knowledge.

## Do not add unless required

- Redis,
- separate vector DB,
- Kafka,
- Kubernetes,
- another memory system.

---

# 21. LANGCHAIN / LANGGRAPH RULE

Neither is mandatory.

## Default

Use the existing Python orchestration.

## Introduce LangGraph only if

A later implementation genuinely needs:

- complex branching,
- persistent graph state,
- human-in-the-loop graph execution,
- long-running workflows,
- sophisticated retry/state transitions.

If introduced:

1. document why,
2. isolate it,
3. test it,
4. do not rewrite the whole core.

## Introduce LangChain only if

It materially simplifies a required integration.

Do not add it merely because it is an agent project.

---

# 22. SHARED TEST STRATEGY

Every extension must have four levels.

## Level 1 — Unit tests

Test pure logic.

Examples:

```text
boundary comparison
applicability calculation
scenario mutation
confidence calculation
candidate grouping
replay comparison
```

## Level 2 — Contract tests

Verify that extension inputs/outputs match shared schemas.

## Level 3 — Integration tests

Verify extension + Echo core.

## Level 4 — Regression tests

Verify that existing Echo behavior still works.

---

# 23. BASELINE REGRESSION PROTOCOL

Before every extension:

```text
git status
run core tests
run backend tests
run frontend tests
run build
```

Record result.

After extension:

```text
run extension tests
run integration tests
run core tests
run frontend tests
run build
```

If the baseline passed and the post-extension suite fails:

1. stop,
2. identify regression,
3. fix or rollback,
4. do not continue to the next extension.

---

# 24. EXTENSION FEATURE FLAGS

Every extension should be capable of being disabled.

Recommended conceptual flags:

```text
ECHO_EXT_S1_MEMORY_EXPLORER
ECHO_EXT_S2_DECISION_REPLAY
ECHO_EXT_S3_HUMAN_CORRECTION
ECHO_EXT_S4_EXPERIENCE_EVOLUTION
ECHO_EXT_S5_CONFLICT_BOUNDARY
ECHO_EXT_A1_CONFIDENCE
ECHO_EXT_A2_DATA_GROUNDING
ECHO_EXT_A3_OUTCOME_PREDICTOR
```

Defaults:

```text
false
```

until the extension passes integration.

Once stable:

```text
true
```

in the appropriate environment.

The exact environment-variable naming convention must follow the existing repository convention.

---

# 25. ROLLBACK STRATEGY

If an extension breaks Echo:

1. disable feature flag,
2. verify core works,
3. identify extension regression,
4. revert only extension changes if necessary,
5. preserve test evidence,
6. fix extension in isolation,
7. rerun baseline,
8. rerun extension,
9. reintegrate.

Do not roll back unrelated core work.

---

# 26. DEMO RESET

The extension system must support a clean reset.

Reset should restore:

- seeded experiences,
- case state,
- scenario state,
- simulator state,
- replay state,
- UI state,
- test/demo session state.

No manual database editing should be required during the demo.

---

# 27. FALLBACKS

The core must continue functioning if an extension fails.

## Hindsight failure

```text
Hindsight unavailable
↓
SEEDED DEMO FALLBACK
```

Clearly display:

```text
MEMORY MODE: SEEDED DEMO FALLBACK
```

Never pretend it was a live Hindsight result.

## Groq failure

Use the existing deterministic/cached reasoning fallback if available.

## WebSocket failure

Use scenario playback or polling fallback if already supported.

## Predictor failure

Continue without predictor.

## Scenario extension failure

Return to the normal case.

## UI extension failure

Core chat/case experience must remain available.

---

# 28. INTEGRATION INTO THE REDESIGNED FRONTEND

When the redesigned frontend arrives:

DO NOT copy extension UI blindly.

Instead:

1. identify the new case page,
2. identify the new memory panel,
3. identify the new decision component,
4. map shared contracts,
5. connect extension data,
6. reuse extension logic,
7. restyle/render through the redesigned UI,
8. run extension tests,
9. run full regression.

The extension's business logic should not be coupled to a specific visual layout.

---

# 29. INTEGRATION INTO THE REDESIGNED BACKEND

When the redesigned backend arrives:

1. inspect new CaseContext,
2. inspect new event schema,
3. inspect new Hindsight client,
4. inspect new decision engine,
5. compare them to shared contracts,
6. write adapters where necessary,
7. do not duplicate Hindsight calls,
8. do not create a second decision engine,
9. rerun all extension contract tests.

---

# 30. EXTENSION STATUS FILE

Maintain:

`echo-extensions/EXTENSION_STATUS.md`

Table:

```text
| Extension | Status | Unit | Contract | Integration | UI | Regression | Enabled |
|-----------|--------|------|----------|-------------|----|------------|---------|
| S1        |        |      |          |             |    |            |         |
| S2        |        |      |          |             |    |            |         |
| S3        |        |      |          |             |    |            |         |
| S4        |        |      |          |             |    |            |         |
| S5        |        |      |          |             |    |            |         |
| A1        |        |      |          |             |    |            |         |
| A2        |        |      |          |             |    |            |         |
| A3        |        |      |          |             |    |            |         |
```

Use:

```text
PLANNED
IN_PROGRESS
ISOLATED
TESTED
INTEGRATED
VERIFIED
DISABLED
ROLLED_BACK
```

---

# 31. EXTENSION TEST MATRIX

Maintain:

`echo-extensions/EXTENSION_TEST_MATRIX.md`

Minimum matrix:

```text
| Feature | Unit | Contract | Integration | Regression | Manual | Demo |
|---------|------|----------|-------------|------------|--------|------|
| S1      |      |          |             |            |        |      |
| S2      |      |          |             |            |        |      |
| S3      |      |          |             |            |        |      |
| S4      |      |          |             |            |        |      |
| S5      |      |          |             |            |        |      |
| A1      |      |          |             |            |        |      |
| A2      |      |          |             |            |        |      |
| A3      |      |          |             |            |        |      |
```

---

# 32. DEMO INTEGRATION

Maintain:

`echo-extensions/DEMO_INTEGRATION.md`

The final demo should show:

## Stage 1

Employee logs in.

## Stage 2

Company memory is visible.

## Stage 3

Employee starts a support case.

## Stage 4

Agents start working.

## Stage 5

Hindsight recalls experiences.

## Stage 6

Employee inspects memory.

## Stage 7

Echo identifies boundary.

## Stage 8

Decision changes.

## Stage 9

Employee creates a scenario.

## Stage 10

Scenario is evaluated.

## Stage 11

Outcome is recorded.

## Stage 12

Experience is retained.

## Stage 13

Same/similar case is run again.

## Stage 14

Decision is different because of experience.

## Stage 15

Memory OFF vs ON replay proves the effect.

---

# 33. REQUIRED DEMO EVIDENCE

The demo must be able to show:

```text
1. A real case object in the application
2. Real agent execution state
3. Real Hindsight recall
4. Real memory evidence
5. Real applicability/boundary analysis
6. Real decision trace
7. Real deterministic/simulated outcome
8. Real retain operation
9. Real subsequent recall
10. Real changed decision
```

If a component is simulated, label it as simulated.

---

# 34. JUDGE QUESTIONS THE EXTENSIONS SHOULD HELP ANSWER

## "Why isn't this just RAG?"

Answer through the product:

```text
RAG:
retrieve information

Echo:
retrieve experience
→ inspect outcome
→ determine applicability
→ detect boundary
→ change decision
→ observe outcome
→ retain new experience
```

## "Does it actually learn?"

Show:

```text
Run 1:
bad decision → failure

Run 2:
memory recalled → different decision → success
```

## "Can it make a mistake?"

Yes.

The system explicitly retains failures.

## "Can memory be wrong?"

Yes.

Applicability and boundary logic exists to avoid blindly transferring experience.

## "Can a human correct it?"

S3.

## "Can employees explore what it knows?"

S1.

## "Can I test what would happen under different conditions?"

Scenario Explorer.

## "Does it know when not to reuse memory?"

S5.

---

# 35. HARD ACCEPTANCE TEST FOR THE WHOLE EXTENSION SYSTEM

The full system is ready only when this works:

```text
RESET
 ↓
START CASE
 ↓
CHAT
 ↓
AGENTS START
 ↓
MEMORY RECALL
 ↓
MEMORY INSPECTION
 ↓
BOUNDARY
 ↓
DECISION
 ↓
SIMULATION
 ↓
OUTCOME
 ↓
RETAIN
 ↓
CREATE SCENARIO
 ↓
SCENARIO RECALL
 ↓
DECISION
 ↓
OUTCOME
 ↓
HUMAN CORRECTION
 ↓
RETAIN
 ↓
NEW RELATED CASE
 ↓
CORRECTION / EXPERIENCE RECALLED
 ↓
DECISION CHANGES
```

Then:

```text
MEMORY OFF
vs
MEMORY ON
```

must work.

---

# 36. NO-FABRICATION POLICY

Never create:

- fake benchmark percentages,
- fake customer outcomes,
- fake real-world tickets,
- fake Hindsight retrieval results,
- fake confidence values,
- fake prediction accuracy,
- fake resolution-time improvements,
- fake business savings.

If an example is generated:

```text
GENERATED
```

If it is simulated:

```text
SIMULATED
```

If it is predicted:

```text
PREDICTED
```

If it is seeded:

```text
SEEDED
```

If observed during a live session:

```text
OBSERVED
```

This is a hard requirement.

---

# 37. PERFORMANCE REQUIREMENTS

Extensions must not turn the laptop into a heavy compute environment.

Do not introduce:

- large local LLMs,
- local GPU training,
- large embedding models,
- unnecessary vector databases,
- unnecessary always-on services.

Preferred architecture:

```text
Laptop
├── Next.js
├── FastAPI
├── application state
├── deterministic simulator
└── tests

Remote
├── Hindsight
└── Groq
```

A3 should use lightweight CPU tabular ML if implemented.

---

# 38. SECURITY / PRIVACY BASICS

Extensions must:

- avoid logging secrets,
- avoid logging API keys,
- avoid storing raw credentials,
- preserve customer-data boundaries,
- preserve provenance,
- avoid exposing one organization's memory to another organization,
- avoid cross-tenant memory leakage.

If tenant isolation is not implemented in the current core, document the limitation rather than pretending it is solved.

---

# 39. OBSERVABILITY

Each extension should emit structured logs/events where useful.

Example:

```text
extension=s1
feature=memory_explorer
case_id=...
experience_id=...
event=memory_viewed
timestamp=...
```

Do not log sensitive message contents unnecessarily.

---

# 40. GIT WORKFLOW

Before implementation:

```bash
git status
git branch
git log -5
```

Create an extension branch according to the team's actual branch policy.

Suggested naming:

```text
ext/s1-memory-explorer
ext/s2-decision-replay
ext/s3-human-correction
ext/s4-experience-evolution
ext/s5-conflict-boundary
ext/a1-confidence-freshness
ext/a2-data-grounding
ext/a3-outcome-predictor
```

Never commit directly to `main` for experimental extension work unless the team has explicitly chosen that workflow.

---

# 41. COMMIT DISCIPLINE

Prefer small commits.

Example:

```text
feat(ext/s1): add memory explorer contract
feat(ext/s1): add memory explorer backend adapter
test(ext/s1): add memory explorer contract tests
feat(ext/s1): add memory explorer UI
test(ext/s1): add integration coverage
docs(ext/s1): document core integration
```

This makes rollback easy.

---

# 42. PULL REQUEST REQUIREMENTS

Every extension PR should include:

```text
Feature:
Why:
Core files touched:
Extension files added:
API changes:
Hindsight changes:
Database changes:
Tests:
Regression result:
Manual verification:
Screenshots/video if UI:
Known limitations:
Rollback:
```

No PR should be merged without the test evidence.

---

# 43. WHAT ANTIGRAVITY MUST NOT DO

Do not:

1. redesign the entire architecture,
2. migrate databases without need,
3. replace Hindsight,
4. add LangGraph just because agents exist,
5. add LangChain just because LLMs exist,
6. add Redis without a demonstrated requirement,
7. add a vector DB,
8. refactor unrelated core files,
9. rewrite the frontend before the existing core is understood,
10. delete existing tests,
11. disable failing tests,
12. hard-code fake results,
13. fake agent events,
14. fabricate customer history,
15. silently change the meaning of existing APIs,
16. merge untested extensions into main.

---

# 44. IMPLEMENTATION CHECKPOINT TEMPLATE

For every extension, fill this out.

```text
EXTENSION:
VERSION:
BRANCH:

BASELINE COMMIT:

CORE PATHS READ:

CORE PATHS MODIFIED:

NEW FILES:

DEPENDENCIES ADDED:

HINDSIGHT CHANGES:

DATABASE CHANGES:

API CHANGES:

FRONTEND CHANGES:

UNIT TESTS:
PASS / FAIL

CONTRACT TESTS:
PASS / FAIL

INTEGRATION TESTS:
PASS / FAIL

CORE REGRESSION:
PASS / FAIL

BUILD:
PASS / FAIL

MANUAL TEST:
PASS / FAIL

DEMO TEST:
PASS / FAIL

ROLLBACK VERIFIED:
YES / NO

KNOWN LIMITATIONS:

FINAL STATUS:
```

---

# 45. FINAL FEATURE PRIORITY

Do not treat all features as equal.

## S-TIER

### S1 — Interactive Memory Explorer

Primary contribution:

**Makes Hindsight visible.**

### S2 — Decision Replay

Primary contribution:

**Proves memory changes decisions.**

### S3 — Human Correction

Primary contribution:

**Allows humans to teach organizational memory.**

### S4 — Experience Evolution

Primary contribution:

**Turns repeated cases into reusable organizational patterns.**

### S5 — Conflict + Boundary Resolution

Primary contribution:

**Prevents naive memory transfer and demonstrates contextual reasoning.**

---

## A-TIER

### A1 — Confidence / Freshness

Primary contribution:

**Makes experience reliability inspectable.**

### A2 — Data Grounding

Primary contribution:

**Improves credibility and scenario/domain grounding while preserving provenance.**

### A3 — Outcome Predictor

Primary contribution:

**Adds a learned predictive signal without replacing Hindsight.**

---

# 46. RECOMMENDED IMPLEMENTATION PRIORITY

If time becomes limited:

```text
S1
↓
S2
↓
S3
↓
S5
↓
S4
↓
A1
↓
A2
↓
A3
```

If time becomes extremely limited:

```text
S1
+
S2
+
S5
```

must be preferred over unfinished A-tier functionality.

---

# 47. DEFINITION OF DONE

Echo Extensions are complete only when:

```text
[ ] Existing core still runs
[ ] Existing core tests still pass
[ ] Extension directory exists
[ ] Shared contracts documented
[ ] S1 implemented and tested
[ ] S2 implemented and tested
[ ] S3 implemented and tested
[ ] S4 implemented and tested
[ ] S5 implemented and tested
[ ] A1 implemented and tested
[ ] A2 implemented and tested
[ ] A3 implemented and tested
[ ] Scenario explorer works
[ ] Provenance labels work
[ ] Memory OFF/ON works
[ ] Human correction works
[ ] Experience retention works
[ ] Boundary rejection works
[ ] Replay works
[ ] Reset works
[ ] Fallbacks work
[ ] Deployment still works
[ ] No fake evidence is shown
[ ] Final frontend redesign can consume the shared contracts
[ ] Final demo can reproduce the learning loop
```

---

# 48. FINAL PRODUCT EXPERIENCE

The finished Echo experience should feel like this:

```text
EMPLOYEE LOGS IN
        ↓
SEES ORGANIZATIONAL EXPERIENCE
        ↓
STARTS CUSTOMER CASE
        ↓
CHAT BEGINS
        ↓
AGENTS BEGIN WORKING
        ↓
MEMORY RECALL APPEARS
        ↓
EMPLOYEE ASKS "WHY?"
        ↓
EVIDENCE APPEARS
        ↓
ECHO IDENTIFIES BOUNDARY
        ↓
DECISION CHANGES
        ↓
EMPLOYEE CREATES "WHAT IF?" SCENARIO
        ↓
SCENARIO RUNS
        ↓
OUTCOME IS OBSERVED / SIMULATED
        ↓
EXPERIENCE IS RETAINED
        ↓
EMPLOYEE CORRECTS ECHO IF NEEDED
        ↓
CORRECTION BECOMES EXPERIENCE
        ↓
NEXT RELATED CASE
        ↓
MEMORY IS RECALLED
        ↓
BETTER / DIFFERENT DECISION
```

The employee is not merely chatting with an AI.

They are **working with an organizational intelligence system that exposes its memory, reasoning, boundaries, scenarios, decisions, outcomes, and learning.**

---

# 49. FINAL IMPLEMENTATION COMMAND TO ANTIGRAVITY

Execute this specification incrementally.

Start with:

```text
STEP 0
Inspect repository.
Do not modify core.
Record baseline.
Create CORE_COMPATIBILITY.md.
```

Then:

```text
STEP 1
Create echo-extensions/.
Create shared contracts.
Create extension test harness.
Do not integrate features yet.
Run regression.
```

Then execute:

```text
STEP 2
S1 — Interactive Memory Explorer
```

Stop.

Test.

Verify.

Document.

Only then:

```text
STEP 3
S2 — Decision Replay
```

Stop.

Test.

Verify.

Document.

Continue in the exact order:

```text
S3
S5
S4
A1
A2
A3
```

After each feature:

```text
BUILD
→ UNIT TEST
→ CONTRACT TEST
→ INTEGRATION TEST
→ CORE REGRESSION
→ MANUAL VERIFY
→ DOCUMENT
→ UPDATE STATUS
```

If anything fails:

```text
STOP
→ FIX
→ RE-RUN
→ ONLY THEN CONTINUE
```

Never sacrifice the working Echo core to accelerate an extension.

---

# 50. FINAL ARCHITECTURAL PRINCIPLE

The core remains:

```text
CASE
 ↓
HINDSIGHT
 ↓
EXPERIENCE
 ↓
DECISION
 ↓
OUTCOME
 ↓
RETAIN
```

The extensions make that loop:

```text
VISIBLE
INTERACTIVE
TESTABLE
TEACHABLE
REPLAYABLE
SCENARIO-DRIVEN
CONTEXT-AWARE
EVALUABLE
```

The architecture should therefore evolve like this:

```text
                 ECHO CORE
                     │
          ┌──────────┴──────────┐
          │                     │
     Application State       Hindsight
          │                     │
          └──────────┬──────────┘
                     │
               Decision Loop
                     │
              ┌──────┴──────┐
              │             │
          Simulator       Outcome
              │             │
              └──────┬──────┘
                     │
                  Retain
                     │
                     ▼
             ORGANIZATIONAL
                EXPERIENCE


              EXTENSION LAYER
                     │
     ┌───────────────┼────────────────┐
     │               │                │
 Memory Explorer   Replay        Human Correction
     │               │                │
 Experience      Conflict/          Experience
 Evolution       Boundary            Evolution
     │               │                │
     └───────────────┼────────────────┘
                     │
              Scenario Explorer
                     │
              Confidence/Freshness
                     │
              Data Grounding
                     │
              Outcome Predictor
```

**The core stays stable. The extension layer grows.**

That is the intended architecture for Echo Extensions.
