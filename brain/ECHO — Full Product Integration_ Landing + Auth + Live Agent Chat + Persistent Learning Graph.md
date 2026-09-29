# ECHO — FULL PRODUCT INTEGRATION
## Landing → JWT Auth → Live Agent Chat → Hindsight Memory → Experience Graph → Existing Dashboard

Repository:

`https://github.com/jaya-sri6/Echo`

You are now implementing the next major Echo product milestone.

This is NOT a frontend-only task.

You must inspect the existing frontend, backend, Hindsight integration, seeded experiences, agent/reasoning code, REST APIs, WebSocket implementation, authentication state, Docker configuration, and deployment structure before making changes.

The goal is to make Echo behave as a coherent, real product from first page to backend learning loop.

---

# 0. ABSOLUTE PRIORITY

The uploaded HTML/design is the visual reference for this work.

The existing design language MUST be preserved.

The provided design already contains:

- near-black background
- dark panels
- Echo green accent
- Inter typography
- JetBrains Mono for technical information
- compact operational UI
- subtle telemetry animations
- experience graph
- live execution concepts
- chat interface
- learning engine/telemetry
- graph nodes and connections
- precedent/memory visualization

Use the existing implementation/design as the foundation.

DO NOT replace it with a completely different visual system.

DO NOT introduce a generic SaaS template.

DO NOT introduce a generic AI chatbot UI.

DO NOT introduce a completely different color palette.

The existing visual language must become the shared design system for the entire application.

The uploaded reference uses, among other values:

```text
Background:       #0d0d0d
Surface:          #171717
Panel:            #212121
Border:           #2e2e2e
Muted:            #737373
Echo Green:       #10a37f
Green Hover:      #1a7f64
Green Subtle:     #0d3829
Primary Text:     #fafafa
Secondary Text:   #a3a3a3
```

Use these as the canonical palette unless an existing implementation already has a compatible token system.

The uploaded reference also establishes Inter + JetBrains Mono and subtle `dashFlow`, calm pulse, shimmer, and graph-link interactions. Preserve that language rather than inventing new visual effects.

---

# 1. FIRST: FULL REPOSITORY AUDIT

Before writing code, inspect the repository completely enough to understand:

## Frontend

- current routing
- current application entry point
- existing dashboard
- existing components
- existing styling
- existing graph
- existing WebSocket client
- existing REST client
- existing state management
- current environment variables
- build system
- Docker setup

## Backend

Inspect:

- FastAPI/application entry point
- authentication capabilities if any
- `/health`
- `/ready`
- `/api/case`
- WebSocket `/ws/case`
- EchoPipeline
- investigation logic
- ExperienceReasoner
- seeded experience bank
- simulator
- Hindsight client
- Hindsight retain
- Hindsight recall
- Hindsight reflect
- outcome retention
- agent/LLM integration
- Groq integration
- fallback behavior
- configuration
- environment variables

## Persistence

Determine exactly where the following currently live:

- users
- authentication sessions/tokens
- cases
- conversations
- messages
- agent executions
- recalled memories
- recommendations
- outcomes
- retained experiences
- graph relationships
- investigation history

Do not assume the answer.

Inspect the actual code.

---

# 2. PRODUCT STRUCTURE

The final application should have this conceptual structure:

```text
                    ECHO
                     │
              Landing Page
                     │
             Login / Sign Up
                     │
                  JWT Auth
                     │
             Authenticated App
                     │
        ┌────────────┴─────────────┐
        │                          │
   Live Echo Chat             Existing Dashboard
        │                          │
        │                    Experience Graph
        │                          │
        └──────────────┬───────────┘
                       │
                  Echo Backend
                       │
              Agent Orchestration
                       │
          ┌────────────┼────────────┐
          │            │            │
      Investigation  Hindsight    LLM
          │            │          Groq
          └────────────┼────────────┘
                       │
                  Decision
                       │
                  Simulation
                       │
                   Outcome
                       │
                    Retain
                       │
               Persistent Memory
                       │
              Future Investigation
```

There must be **one underlying source of truth**.

Do not create one data model for the chat and another unrelated fake data model for the dashboard.

---

# 3. NEW FIRST PAGE — LANDING PAGE

Create a landing page that appears before authentication.

The landing page should use the SAME visual language as the uploaded Echo interface.

It should communicate the core idea:

> Echo gives AI systems organizational experience memory.

Core conceptual flow:

```text
Problem
AI repeatedly makes the same operational mistake.

Echo
Remembers what happened before.

Recall
Finds relevant organizational experience.

Reason
Determines whether the experience applies.

Act
Uses that experience to make a decision.

Learn
Stores the outcome for future decisions.
```

Use the experience graph as a visual motif.

The graph should not be fake marketing decoration if it can be connected to actual seeded experiences.

Prefer showing a small real graph derived from the actual seeded data where practical.

---

# 4. LANDING PAGE CONTENT

The page should be concise.

Suggested structure:

## Hero

```text
ECHO

Organizational Experience Memory

AI can reason from knowledge.

Echo lets it reason from what your organization
has already experienced.

[ Enter Echo ]
[ See how it works ]
```

Do not use generic marketing claims such as:

- "revolutionary"
- "world's best"
- "10x"
- "human-level"
- unsupported performance claims

Keep it technical and credible.

---

# 5. LOGIN + SIGNUP

Add real authentication.

Required:

```text
/signin
/signup
```

or an equivalent routing structure.

Use JWT authentication.

Do not build fake login forms that simply redirect.

The authentication system must actually work.

---

# 6. AUTHENTICATION BACKEND

Inspect the current backend first.

If authentication does not exist, implement the smallest proper authentication layer.

At minimum:

```text
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
```

Use secure password hashing.

Never store plaintext passwords.

JWT should contain only appropriate claims.

Do not put secrets in source code.

JWT signing secret must come from environment configuration.

Example:

```text
JWT_SECRET_KEY
JWT_ALGORITHM
JWT_ACCESS_TOKEN_EXPIRE_MINUTES
```

Use the project's existing configuration conventions if they already exist.

---

# 7. AUTHENTICATED ROUTING

Unauthenticated user:

```text
/
→ /login
```

Authenticated user:

```text
/echo
```

or equivalent.

Protect application routes.

The browser must not be able to access authenticated application data simply by navigating directly to a URL without a valid token.

---

# 8. NEW PRIMARY EXPERIENCE — LIVE ECHO CHAT

After login, the user should enter a new Echo chat/investigation page.

This is NOT the existing dashboard.

It should be a new page using the exact same visual language.

Think:

```text
ECHO

What happened?

┌───────────────────────────────────────────┐
│ Tell Echo what is going wrong...          │
│                                           │
│ "Our nightly export keeps timing out      │
│ during the batch window."                 │
│                                           │
│                              [Investigate] │
└───────────────────────────────────────────┘
```

Then the real investigation starts.

---

# 9. CHAT MUST USE A REAL LLM AGENT

This is critical.

The chat cannot be hardcoded.

When the user sends an investigation request:

```text
User message
    ↓
Backend
    ↓
Agent
    ↓
Understand case
    ↓
Retrieve relevant experience
    ↓
Evaluate applicability
    ↓
Reason about alternatives
    ↓
Make recommendation
    ↓
Simulate
    ↓
Record outcome
    ↓
Retain experience
```

Use the existing Groq setup where appropriate.

Inspect the current Groq configuration and integration first.

If the current Groq integration is already functioning:

**reuse it.**

Do not replace a working integration just to introduce another provider.

If a different model/provider would materially improve reliability, evaluate it first and document why.

Do not add provider complexity unnecessarily.

---

# 10. AGENT RESPONSIBILITIES

The agent should be responsible for actual decision-making.

At minimum it should be able to:

### Understand

Extract relevant context from the user's case.

### Recall

Request relevant experiences from Hindsight / experience memory.

### Compare

Compare current conditions with historical experiences.

### Assess applicability

Determine whether previous experience is transferable.

### Reason

Explain why an experience applies or does not apply.

### Recommend

Produce an operational recommendation.

### Simulate

Evaluate the recommendation using the existing simulator where applicable.

### Learn

Retain the resulting experience.

---

# 11. DO NOT EXPOSE PRIVATE CHAIN-OF-THOUGHT

The UI should NOT display hidden chain-of-thought.

Instead show safe, useful agent telemetry such as:

```text
Understanding case
✓

Searching organizational memory
✓ 3 relevant experiences found

Assessing applicability
✓ 1 high-confidence match
✓ 1 conflicting precedent
✓ 1 boundary case

Decision
→ async_chunked_export

Simulation
→ SUCCESS

Learning
→ Experience retained
```

The user should understand WHAT the agent did and WHAT evidence influenced the decision without exposing private reasoning traces.

---

# 12. REAL-TIME EVENT STREAM

The chat must be driven by real backend events.

Do not create fake animations that pretend the agent is working.

Use the existing WebSocket architecture if it can support this.

Extend it only where necessary.

A useful event model may include:

```text
case_started
agent_started
investigation_completed
hindsight_recall_started
hindsight_recall_completed
applicability_assessed
reflection_completed
recommendation_ready
simulation_started
simulation_completed
guardian_validated
execution_started
outcome_recorded
experience_retained
pipeline_completed
```

IMPORTANT:

If the current backend already has a canonical event contract, preserve it.

Do not arbitrarily replace the existing 12-event contract.

If additional events are necessary for the new agent/chat experience, add them in a backwards-compatible way and document the contract.

---

# 13. LIVE UI BEHAVIOR

As the agent works, the frontend should reveal the actual process.

Example:

```text
You

"Our 600GB nightly export is timing out
under high concurrency."


Echo

● Understanding case...


✓ Context identified

600GB
High concurrency
Nightly batch
Synchronous export


● Searching organizational memory...


✓ Hindsight recall completed

15 experiences examined
3 relevant experiences


● Comparing experiences...


✓ Applicability assessed

EXP-009
HIGH relevance

EXP-004
Failure precedent

EXP-012
Boundary condition


● Making decision...


RECOMMENDATION

async_chunked_export


● Simulating...


✓ Simulation completed

SUCCESS
110 minutes
0 escalations


● Learning...


✓ Experience retained

EXP-RETAINED-XXXX


Echo

"I found a previous failure under similar
conditions and changed the recommendation
accordingly. The simulated outcome was successful."
```

All values must come from the actual backend.

---

# 14. PERSISTENCE MUST BE REAL

The user specifically wants to see persistence.

Therefore the system must persist the meaningful state of an investigation.

At minimum, determine whether the following should be persisted:

```text
User
Conversation
Message
Case
Investigation
Agent event
Recall result
Recommendation
Simulation
Outcome
Retained experience
```

Do not add a huge database architecture unnecessarily.

First inspect the existing persistence layer.

If the project already has an appropriate persistent store, use it.

If the current MVP only uses in-memory state and persistence is genuinely missing, introduce the smallest reliable persistent layer appropriate to the current deployment architecture.

Do not add Redis/Kafka/Kubernetes/vector infrastructure merely because it sounds impressive.

---

# 15. PERSISTENCE FEED

The frontend should show a live persistence/learning feed.

For example:

```text
LIVE MEMORY FEED

05:31:02
CASE CREATED
ECHO-024

05:31:03
MEMORY RECALLED
3 precedents

05:31:03
DECISION RECORDED
async_chunked_export

05:31:04
SIMULATION
SUCCESS

05:31:04
EXPERIENCE RETAINED
EXP-RETAINED-XXXX

05:31:05
GRAPH UPDATED
+1 experience relationship
```

This must be generated from actual backend events/data.

No fake counters.

No fake timestamps.

No fake graph updates.

---

# 16. EXPERIENCE GRAPH MUST ACTUALLY LEARN AND GROW

This is a central requirement.

The graph shown in the existing dashboard should not remain a static illustration.

When an experience is recalled:

```text
Current Case
     │
     ├──── recalled ────> Experience A
     │
     ├──── recalled ────> Experience B
     │
     └──── boundary ────> Experience C
```

When a new experience is retained:

```text
Current Case
     │
     └──── outcome ─────> New Experience
```

The graph should update from real persisted state.

If the data model supports relationships, represent them.

If not, implement the minimum relationship model required.

---

# 17. GRAPH ANIMATION

The graph should visually show real-time activity.

Example:

```text
Case
  ●
  │
  │  recall
  ├──────────────→ ● Failure Experience
  │
  ├──────────────→ ● Success Experience
  │
  └──────────────→ ● Boundary Experience
                         │
                         │ influences
                         ▼
                    Recommendation
                         │
                         ▼
                       Outcome
                         │
                         ▼
                    New Memory
```

Animate the actual active relationship.

Use the existing visual language:

- green = positive/success/alignment
- red = failure/contraindicated
- yellow = partial/context divergence
- purple = boundary/invariant

Preserve the palette already established by the design.

Do not introduce a rainbow graph.

---

# 18. GRAPH MUST GROW BETWEEN INVESTIGATIONS

This is important.

The graph should initially contain the seeded experiences.

After an investigation:

```text
Before

15 experiences

After

15 seeded experiences
+
1 retained experience
```

The UI should update accordingly.

After several investigations:

```text
15 seeded
+
retained #1
+
retained #2
+
retained #3
...
```

The user should be able to visually understand that Echo is accumulating experience.

Do not fake the count.

Read it from persistence.

---

# 19. EXISTING DASHBOARD MUST REMAIN

The uploaded/current dashboard is already a strong interface.

Do NOT throw it away.

Do NOT replace its graph.

Do NOT redesign it into a different product.

Instead:

```text
New Live Chat
      ↓
same backend state
      ↓
Existing Dashboard
      ↓
graph / telemetry / experience history
```

The dashboard should become the deeper inspection surface.

---

# 20. SHARED DESIGN SYSTEM

Extract the visual language from the existing dashboard into reusable frontend tokens/components where practical.

Canonical design tokens should include:

```text
echo-black
echo-surface
echo-panel
echo-border
echo-muted
echo-green
echo-green-hover
echo-green-subtle
echo-text
```

Use the same:

- typography
- spacing philosophy
- border treatment
- status indicators
- pills
- cards
- graph styles
- animations
- hover behavior
- technical monospace labels

across:

- landing
- auth
- live chat
- dashboard
- graph
- telemetry
- memory views

The application should feel like one product.

---

# 21. THREE CORE EXPERIENCE STATES

The new chat should support:

## State A — New Investigation

```text
"What happened?"
```

## State B — Investigation Running

```text
Live agent events
Live memory recall
Live graph activity
```

## State C — Investigation Complete

```text
Decision
Outcome
Retained experience
Updated graph
```

The UI should transition naturally between these states.

---

# 22. CASE SELECTION + FREEFORM CHAT

The user should be able to either:

### Choose a seeded case

or

### Type a real operational scenario

Example:

```text
"Our nightly export is failing at 2 AM
when concurrency spikes."
```

The backend should turn that into an investigation context.

If the system cannot safely map free-form input to the simulator, it should still perform:

```text
understand
→ recall
→ compare
→ recommend
```

and clearly indicate when simulation is unavailable.

Do NOT fabricate a simulation result.

---

# 23. SEEDED CASES

The existing 15 seeded experiences remain important.

They should be used as real organizational memory.

The new chat should make it easy to investigate them.

The system should not replace them with invented frontend examples.

The dashboard graph should use the same data.

---

# 24. AGENT + HINDSIGHT INTEGRATION

The real flow must be:

```text
User
 ↓
Agent
 ↓
Case understanding
 ↓
Hindsight recall
 ↓
Relevant experiences
 ↓
Applicability
 ↓
Recommendation
 ↓
Simulator
 ↓
Outcome
 ↓
Hindsight retain
 ↓
Persistent experience
 ↓
Graph update
```

Where Hindsight `reflect` is already part of the current implementation, preserve and use it appropriately.

Do not bypass Hindsight with a frontend/local array.

---

# 25. MEMORY OFF / MEMORY ON

Preserve the existing ability to demonstrate the difference between:

```text
Memory OFF
```

and:

```text
Memory ON
```

If the current evaluation infrastructure supports this, connect the new chat experience to it.

The user should be able to demonstrate:

```text
Memory OFF
→ decision without historical experience

Memory ON
→ relevant experience recalled
→ recommendation changes
```

This is one of the strongest demonstrations of Echo.

Do not fake the difference.

---

# 26. AGENT CONFIGURATION

Inspect the current Groq setup.

Determine:

- model currently used
- API configuration
- timeout
- retries
- fallback
- token limits
- environment variables

Reuse the existing working setup.

Expected environment configuration should look conceptually like:

```text
GROQ_API_KEY=
GROQ_MODEL=
```

Do NOT place actual keys in source code.

Do NOT commit `.env`.

Do NOT expose the Groq key to frontend JavaScript.

All LLM calls must happen server-side.

---

# 27. BACKEND ARCHITECTURE

Keep responsibilities separated.

Recommended conceptual structure:

```text
backend/
  api/
    auth.py
    chat.py
    cases.py
    websocket.py

  agents/
    echo_agent.py
    investigator.py
    reasoner.py

  memory/
    hindsight.py
    experience_store.py

  persistence/
    models.py
    repository.py

  simulation/
    simulator.py

  services/
    investigation_service.py
    learning_service.py
```

BUT:

Do not blindly create this exact structure.

First inspect the existing repository.

Reuse existing modules where they already perform these responsibilities.

Avoid unnecessary refactoring.

---

# 28. FRONTEND ARCHITECTURE

Similarly, preserve the current frontend architecture.

Create reusable pieces only where needed:

```text
Landing
Auth
LiveChat
AgentTimeline
MemoryFeed
ExperienceGraph
Dashboard
```

Do not duplicate the graph implementation.

The same graph/state model should drive both the new live chat and the existing dashboard where appropriate.

---

# 29. API CONTRACT

Create or extend APIs only when required.

Potential APIs:

```text
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me

POST /api/chat
GET  /api/conversations
GET  /api/conversations/:id

GET  /api/experiences
GET  /api/graph
```

But first inspect what already exists.

Do not create duplicate endpoints.

Authenticated endpoints must validate JWT.

---

# 30. WEBSOCKET CONTRACT

Use the existing:

```text
/ws/case
```

contract if possible.

If chat requires a separate WebSocket:

```text
/ws/chat
```

document why.

Prefer a single coherent event architecture over multiple competing streams.

Every event should have enough information for the frontend to render it.

Example conceptual event:

```json
{
  "type": "hindsight_recall_completed",
  "investigation_id": "...",
  "timestamp": "...",
  "data": {
    "matched_experiences": [...]
  }
}
```

Use the actual repository schema where already established.

---

# 31. REAL-TIME CONSISTENCY

The following must all agree:

```text
REST response
WebSocket events
database/persistence
Hindsight
frontend state
graph state
```

Do not allow:

```text
chat says SUCCESS
database says FAILURE
graph says nothing
```

The same investigation ID should tie the complete lifecycle together.

Use stable IDs for:

- user
- conversation
- case
- investigation
- event
- experience

---

# 32. ERROR HANDLING

Handle:

- invalid JWT
- expired JWT
- bad login
- duplicate signup
- Groq unavailable
- Hindsight unavailable
- WebSocket disconnect
- backend unavailable
- invalid case
- simulation failure
- persistence failure

The UI must distinguish between:

```text
working
completed
failed
unavailable
```

Do not show SUCCESS when an operation failed.

---

# 33. DEPLOYMENT STRUCTURE

This is mandatory.

The frontend and backend must be structured so deployment is straightforward.

The development environment should remain separated cleanly:

```text
Echo/
  frontend/
  backend/
  verification/
  brain/
  handoff/
  docker-compose.yml
```

Use environment-based configuration.

Frontend must NOT hardcode:

```text
localhost
127.0.0.1
private API URLs
Groq keys
Hindsight keys
```

Use configuration such as:

```text
VITE_API_BASE_URL
VITE_WS_BASE_URL
```

Backend:

```text
DATABASE_URL
JWT_SECRET_KEY
GROQ_API_KEY
GROQ_MODEL
HINDSIGHT_API_KEY
HINDSIGHT_BASE_URL
```

Use the actual existing names if already established.

The exact deployment values must come from environment/secret management.

---

# 34. LOCAL DEVELOPMENT

The entire system must be runnable predictably.

Prefer:

```bash
docker compose up --build
```

or the existing repository's established command.

It should start:

```text
Frontend
Backend
Required persistence
```

without manual code modifications.

Do not require developers to edit source files just to change environments.

---

# 35. PRODUCTION DEPLOYMENT COMPATIBILITY

The architecture must support:

```text
local development
↓
Docker
↓
public deployment
```

without changing application logic.

Frontend should communicate with the backend through configurable URLs.

WebSocket must support:

```text
ws://
```

locally and:

```text
wss://
```

behind HTTPS in production.

Do not hardcode protocol assumptions.

---

# 36. NO SECRET LEAKS

Run a security audit for:

```text
GROQ_API_KEY
HINDSIGHT_API_KEY
JWT_SECRET_KEY
```

and any other credentials.

Check:

- source
- frontend bundle
- Git history where practical
- `.env`
- Docker configuration

The frontend bundle must never contain server-side secrets.

---

# 37. DO NOT OVERENGINEER

Do NOT add:

- Kafka
- Redis
- Kubernetes
- vector database
- microservices
- event bus
- complicated auth provider
- unnecessary agent frameworks

unless the existing implementation genuinely requires them.

The goal is:

**reliable, explainable, deployable Echo.**

Not maximum infrastructure.

---

# 38. TEST THE ENTIRE PRODUCT

Do not stop after frontend build.

Run:

## Backend tests

```bash
python3 -m pytest backend/tests -v
```

Do not weaken tests.

## Frontend build

Run the actual production build.

## Auth

Verify:

```text
signup
login
JWT
/me
protected route
invalid token
```

## Agent

Verify a real investigation reaches the LLM/agent.

## Hindsight

Verify:

```text
recall
applicability
reflect where applicable
retain
```

## WebSocket

Verify real event delivery.

## Persistence

Verify that a completed investigation remains available after refresh/reload.

## Graph

Verify the graph reflects the persisted state.

## Learning loop

Verify:

```text
case
→ recall
→ decision
→ simulation
→ outcome
→ retain
→ future recall
```

---

# 39. CRITICAL E2E DEMO

Create one deterministic showcase path that can be demonstrated reliably.

Example:

```text
1. Open Echo
2. Sign in
3. Start a seeded investigation
4. Watch live agent execution
5. Watch Hindsight recall
6. Watch graph connections activate
7. Watch recommendation appear
8. Watch simulation
9. Watch outcome
10. Watch experience retention
11. Refresh
12. Confirm retained experience still exists
13. Run a related case
14. Confirm the previous experience is recalled
15. Confirm the recommendation reflects the remembered experience
```

This entire sequence must use real backend data.

---

# 40. DO NOT FAKE THE GRAPH

The graph is particularly sensitive.

Remove or replace static placeholder values where they conflict with real state.

For example, values such as:

```text
94.8%
14.2 ep/s
EXP-044
EXP-031
EXP-067
EXP-089
```

must NOT remain hardcoded if the graph is claiming they represent live system state.

Use actual data.

If a metric cannot be measured honestly, display:

```text
—
```

or an appropriate state rather than inventing a number.

This rule applies to:

- alignment scores
- ingestion rate
- latency
- match percentages
- experience counts
- timestamps
- pipeline progress
- graph topology
- outcome metrics

---

# 41. PRESERVE THE GOOD STATIC DESIGN

The existing design contains strong UI concepts:

- compact navigation rail
- chat dialogue
- Learning Engine & Telemetry panel
- Agent Execution Steps
- Experience Graph Dock
- graph nodes
- graph connections
- inspection drawer
- status pills
- technical monospace labels

Keep these concepts.

The task is to make them **real**, not replace them.

---

# 42. SHARED COLOR SYSTEM

Use the existing palette everywhere.

Semantic mapping:

```text
Echo Green
#10a37f
→ active
→ connected
→ success
→ learning
→ recommended

Red
→ failure
→ contraindicated

Yellow
→ partial
→ contextual mismatch
→ caution

Purple
→ boundary
→ invariant
→ non-transferable constraint

Near Black
→ background

Dark Gray
→ panels

Light Gray
→ primary information
```

Do not create unrelated colors.

---

# 43. ANIMATION RULE

Animation should communicate actual state.

Good:

```text
real event arrives
→ node activates
→ connection flows
→ event appears
→ graph updates
```

Bad:

```text
timer runs
→ pretend event happens
```

Never use animation to conceal backend latency or lack of implementation.

Respect:

```text
prefers-reduced-motion
```

as the current design already does.

---

# 44. AGENT CHAT QUALITY

The agent's responses should be concise and operational.

Example:

```text
Echo

I found 3 relevant experiences.

One prior failure matches the current
high-concurrency condition.

A successful precedent used asynchronous
chunked export instead.

I'll test that recommendation against the
current case.
```

Then the UI shows the structured event stream.

Do not make the agent produce giant essays.

---

# 45. CHAT HISTORY

Persist conversation/investigation history appropriately.

When the user reloads:

```text
previous investigations
```

should remain accessible if persistence is implemented.

Do not store sensitive information unnecessarily.

Use authenticated user ownership.

User A must not be able to retrieve User B's conversations.

---

# 46. MULTI-USER DATA ISOLATION

Every persisted user-owned object must have appropriate ownership.

Verify:

```text
User A
→ only User A conversations/investigations

User B
→ only User B conversations/investigations
```

Shared organizational experiences can remain shared only if the application's intended data model explicitly supports that.

Document the distinction between:

```text
user-owned
organization-owned
system-seeded
```

---

# 47. BACKEND CHANGES

You are explicitly authorized to make backend changes where necessary.

But every backend change must satisfy:

1. smallest necessary change
2. preserve existing Track A/B behavior
3. preserve existing API contracts unless extension is required
4. add tests
5. document the reason
6. verify end-to-end

Do not modify backend merely because frontend implementation is inconvenient.

---

# 48. DATABASE / PERSISTENCE DECISION

Before adding a database:

Inspect what already exists.

If persistence is already sufficient:

**reuse it.**

If persistence is missing and required for:

- JWT users
- conversations
- investigations
- retained experiences
- graph state

then implement an appropriate persistent store.

For a simple deployment-friendly implementation, a relational database is acceptable.

Keep the schema small.

Do not introduce distributed infrastructure.

---

# 49. FINAL PRODUCT EXPERIENCE

The final product should feel like:

```text
Landing
   ↓
"I understand what Echo does."
   ↓
Login
   ↓
"I can enter the system."
   ↓
Chat
   ↓
"I can describe a problem."
   ↓
Agent
   ↓
"I can see Echo investigating."
   ↓
Hindsight
   ↓
"I can see what it remembered."
   ↓
Decision
   ↓
"I can see why the recommendation changed."
   ↓
Simulation
   ↓
"I can see what happened."
   ↓
Retention
   ↓
"I can see that Echo learned."
   ↓
Graph
   ↓
"I can see the organization's experience growing."
   ↓
Dashboard
   ↓
"I can inspect the system deeply."
```

That is the product.

---

# 50. DOCUMENTATION REQUIREMENTS

You MUST update:

```text
brain/context.md
```

with:

- complete current architecture
- frontend routes
- authentication architecture
- JWT flow
- agent architecture
- Groq configuration
- Hindsight integration
- persistence model
- WebSocket contract
- graph state model
- event lifecycle
- deployment configuration
- environment variables
- security decisions
- files changed
- tests
- known issues
- things not to change

Also update/create:

```text
handoff/*.md
```

with:

- work completed
- frontend changes
- backend changes
- auth changes
- agent changes
- persistence changes
- Hindsight changes
- WebSocket changes
- graph changes
- tests
- E2E results
- deployment notes
- remaining work

---

# 51. GIT SAFETY

Before work:

```bash
git status
git log --oneline -10
git tag --list
```

Preserve:

```text
echo-stable-01
```

Do not rewrite history.

Do not force-push.

Do not delete the stable tag.

Create a new checkpoint only after all verification passes.

Suggested:

```text
echo-stable-03
```

if this milestone is successfully verified.

---

# 52. FINAL VERIFICATION CHECKLIST

Do not report PASS until all applicable items are verified.

### Product

- [ ] landing page works
- [ ] signup works
- [ ] login works
- [ ] JWT works
- [ ] logout works
- [ ] protected routes work
- [ ] existing dashboard remains functional
- [ ] new chat works

### Agent

- [ ] real LLM call
- [ ] Groq integration verified
- [ ] agent receives actual user case
- [ ] agent recalls real experience
- [ ] agent makes real recommendation
- [ ] simulator receives real recommendation
- [ ] outcome is real
- [ ] experience is retained

### Hindsight

- [ ] recall verified
- [ ] applicability verified
- [ ] reflection verified where applicable
- [ ] retain verified
- [ ] future recall can retrieve retained experience

### Realtime

- [ ] WebSocket connected
- [ ] events are real
- [ ] event order correct
- [ ] frontend updates live
- [ ] graph updates live
- [ ] persistence feed updates live
- [ ] reconnect/error handling works

### Persistence

- [ ] investigation survives refresh
- [ ] retained experience persists
- [ ] graph state persists
- [ ] conversations persist where intended
- [ ] user isolation verified

### Frontend

- [ ] existing design preserved
- [ ] existing dashboard preserved
- [ ] new page uses same palette
- [ ] no fake metrics
- [ ] no fake events
- [ ] no fake graph state
- [ ] responsive behavior verified
- [ ] reduced-motion behavior preserved

### Deployment

- [ ] local Docker build works
- [ ] frontend configuration is environment-driven
- [ ] backend configuration is environment-driven
- [ ] WebSocket production protocol can use WSS
- [ ] no secrets in frontend
- [ ] no secrets in Git
- [ ] deployment configuration documented

---

# 53. FINAL REPORT FORMAT

At the end, report:

## ECHO FULL PRODUCT INTEGRATION

```text
PASS / FAIL
```

### Starting checkpoint

```text
commit:
tag:
```

### Ending checkpoint

```text
commit:
tag:
```

### Routes

List all frontend routes.

### Authentication

```text
signup:
login:
JWT:
protected routes:
logout:
```

### Agent

```text
LLM provider:
model:
real call verified:
```

### Hindsight

```text
recall:
applicability:
reflection:
retain:
future recall:
```

### Persistence

List what is persisted and where.

### WebSocket

Report exact event lifecycle and verification result.

### Graph

Report:

- initial graph state
- live updates
- retained experience updates
- persistence verification

### Existing dashboard

Confirm whether it remains functional.

### Tests

Give exact commands and exact results.

### Security

Report secret scan and authentication checks.

### Docker

Report exact build/start result.

### Remaining issues

Only list genuine remaining issues.

Do not hide failures.

Do not claim production readiness unless actual deployment has been performed and verified.

Do not claim the agent works merely because the code exists.

Do not claim persistence works merely because a database model exists.

Do not claim real-time behavior merely because a WebSocket endpoint exists.

**Implementation + integration + runtime verification are all required.**

The final system must be demonstrably real from:

```text
USER
 ↓
AUTH
 ↓
CHAT
 ↓
AGENT
 ↓
GROQ
 ↓
HINDSIGHT
 ↓
DECISION
 ↓
SIMULATION
 ↓
OUTCOME
 ↓
PERSISTENCE
 ↓
GRAPH
 ↓
FUTURE RECALL
```

and the existing dashboard must reflect the same underlying state.