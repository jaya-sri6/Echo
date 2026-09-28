# Track B Frontend & Integration Audit

**Date:** 2026-09-29  
**Engineer / Auditor:** Senior Integration / Reliability Engineer (Track B)  
**Repository:** [https://github.com/jaya-sri6/Echo](https://github.com/jaya-sri6/Echo)  
**Branch:** `main` (Starting Commit: `57ce66b`)

---

## 1. Executive Summary

This audit assesses the current state of the Echo frontend application (`frontend/`), its communication layer, API/WebSocket contracts, state model, and readiness for full production deployment without disrupting Track C design work.

---

## 2. Component & Architecture Inventory

### 1. API Client (`frontend/src/services/api.ts`)
- **Status:** **OPERATIONAL & CONFIGURABLE**
- **Base URL Resolution:** Automatically detects `import.meta.env.VITE_API_BASE_URL` with dynamic browser `window.location.origin` fallback.
- **REST Endpoints Exposed:**
  - `checkHealth()`: Calls `GET /health`
  - `runInvestigation(message)`: Calls `POST /api/case` with JSON body `{"message": message}`
- **Response Handling:** Properly unwraps JSON and handles HTTP errors from FastAPI.

### 2. WebSocket Client (`frontend/src/services/api.ts`)
- **Status:** **OPERATIONAL & CONFIGURABLE**
- **URL Resolution:** Automatically detects `import.meta.env.VITE_WS_BASE_URL` with dynamic `ws://` / `wss://` protocol resolution based on `window.location.protocol`.
- **Contract:** Connects to `/ws/case`, immediately transmits `{"message": message}` upon `onopen`, parses JSON `AgentEvent` payloads, and forwards them to `onEvent`, `onComplete`, and `onError` callbacks.

### 3. Environment Variable Handling
- Supported variables:
  - `VITE_API_BASE_URL`: Defaults to `http://localhost:8000` (or `window.location.origin` in production/proxied mode)
  - `VITE_WS_BASE_URL`: Defaults to `ws://localhost:8000/ws/case` (or `ws[s]://${window.location.host}/ws/case`)
- **Security Check:** Zero private backend secrets (`HINDSIGHT_API_KEY`, `GROQ_API_KEY`) are accessed or referenced in frontend code.

### 4. Data Contracts (`frontend/src/types/index.ts`)
- Defines domain types: `CaseContext`, `CandidateResult`, `SimulationResult`, `InvestigationResult`, `Experience`, `ApplicabilityCheck`, `ExperienceReasoningResult`, `ResolutionRecommendation`, `GuardianResult`, `PipelineResult`, and `AgentEvent`.
- **Identified Delta:**
  - `PipelineResult` interface is missing optional fields `simulation?: SimulationResult` and `retained_experience_id?: string | null` returned by the verified Track A backend. Adding these fields ensures 100% type-safety across endpoints.

### 5. UI State Model (`frontend/src/App.jsx`)
- State variables:
  - `runStage`: Numeric milestone index (0 = Idle, 1 = Case started, ... 10 = Pipeline completed).
  - `streamEvents`: Sequential array of all received `AgentEvent` objects.
  - `liveBackendData`: Full `PipelineResult` payload received on `pipeline_completed` or REST response.
  - `isWsStreaming`: Boolean flag indicating active WebSocket connection.
  - `backendOnline`: Heartbeat flag queried every 5 seconds via `checkHealth()`.
  - `selectedCase` & `customMessage`: Active scenario preset and user input buffer.

### 6. Lifecycle & Timeline Representation
- Maps 12 real events:
  - `case_started` -> Stage 1
  - `investigation_completed` -> Stage 2
  - `hindsight_recall_completed` -> Stage 3
  - `applicability_assessed` -> Stage 4
  - `reflection_completed` -> Stage 5
  - `simulation_completed` -> Stage 6
  - `guardian_validated` -> Stage 7
  - `recommendation_ready` -> Stage 8
  - `execution_started` -> Stage 8
  - `outcome_recorded` -> Stage 9
  - `experience_retained` -> Stage 10
  - `pipeline_completed` -> Stage 10
- **Identified Delta for Phase 6:** `App.jsx` currently retains a timer fallback (`setTimeout(..., 650)`) when not actively streaming. Per Track B non-negotiable rules, fake timers and simulated delay progressions must be eliminated in favor of 100% pure real-time event updates and clear error states.

### 7. Existing Hardcoded / Demo Data
- Preserved fallback profiles:
  - `informed` (Case 02: 600 GB batch, async chunked export)
  - `failure` (Case 01: 600 GB batch, increase timeout)
  - `boundary` (Case 03: 20 GB interactive, keep existing mode)
- `defaultExperiences`: 3 illustrative cards (`EXP-031`, `EXP-044`, `EXP-067`) displaying outcomes, conditions, and lessons learned.

### 8. Existing Track C Modifications
- The visual styling in `frontend/src/styles.css` and `App.jsx` represents Track C's bespoke dark-mode interface with monospace accent typography, glowing indicators, agent progress tracks, and comparison panels.
- Track B will strictly preserve this design without altering layout, CSS variables, or visual aesthetics.

### 9. Component Consumption of Backend Data
- Header status pill: Dynamic connection status and latency indicator.
- Stream ticker badge: Real-time active agent, event name, duration in ms, and step counter.
- Workflow track: Lights up agent nodes 01 through 07 in real-time as backend events arrive.
- Decision panel: Renders `final_recommendation`, `changed_by_hindsight`, and `simulation.outcome` from live backend data.
- Retention badge: Displays `retained_experience_id` (e.g. `EXP-RETAINED-*`) directly upon completion.

### 10. Components Using Static/Mock Data
- Offline scenario switchers provide instant fallback preview if backend is disconnected.
- Experience memory browser displays canonical lessons learned.

---

## 3. Planned Remediation Steps for Track B
1. **Types Update:** Add `simulation?: SimulationResult` and `retained_experience_id?: string | null` to `frontend/src/types/index.ts`.
2. **WebSocket & Timer Cleanup:** Remove artificial delay timers in `App.jsx` so the UI advances strictly from real backend events.
3. **Error State Handling:** Add explicit UI error banners when WebSocket connection fails or backend returns an unprocessable input error.
4. **Vite Build Verification:** Run `npm run build` and ensure clean bundle generation.
5. **Docker & Container Verification:** Validate single/dual container deployment and WebSocket routing.
