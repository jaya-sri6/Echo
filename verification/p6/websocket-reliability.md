# Echo — WebSocket Reliability & Streaming Fallback Specification (P6)

## 1. WebSocket Endpoint & Contract (Discovered from Codebase)

- **Route:** `ws://<backend-host>:<port>/ws/case`
- **Source File:** `backend/app/api/websocket.py`
- **Protocol:** JSON message exchange over RFC 6455 WebSocket.

### Input Message Format
The client initiates a case execution by sending a single JSON payload:
```json
{
  "message": "Customer's 600 GB nightly export keeps timing out under high concurrency in sync mode."
}
```

### Event Streaming Schema
Events emitted by the server follow this exact schema:
```json
{
  "agent": "string",
  "status": "string",
  "message": "string",
  "data": {}
}
```

#### Lifecycle Events
1. **Pipeline Start:**
   ```json
   {
     "agent": "conversation_agent",
     "status": "started",
     "message": "Customer message received; starting the Echo pipeline.",
     "data": {}
   }
   ```
2. **Pipeline Completion (Success):**
   ```json
   {
     "agent": "completed",
     "status": "completed",
     "message": "Echo pipeline completed.",
     "data": {
       "status": "COMPLETE",
       "case_context": { ... },
       "investigation": { ... },
       "experience_reasoning": { ... },
       "resolution": { ... },
       "guardian": { ... },
       "final_recommendation": "async_chunked_export",
       "changed_by_hindsight": true,
       "decision_evidence": [ ... ],
       "errors": []
     }
   }
   ```
   *Followed by clean WebSocket close with code `1000` (Normal Closure).*

3. **Pipeline Incomplete / No Recommendation:**
   ```json
   {
     "agent": "completed",
     "status": "failed",
     "message": "Echo pipeline finished without an approved recommendation.",
     "data": {
       "status": "INCOMPLETE_CASE",
       "errors": ["Required case information is missing: execution_mode."]
     }
   }
   ```
   *Followed by clean close with code `1000`.*

4. **Error / Close Codes:**
   - `1003`: Invalid non-JSON payload.
   - `1008`: Blank or non-string customer message.
   - `1011`: Internal pipeline exception (tracebacks sanitized).
   - Clean handling of client-side disconnects via `WebSocketDisconnect`.

---

## 2. Reliability & Resilience Verification

The WebSocket implementation has been validated with Starlette's `TestClient` in `backend/tests/test_websocket.py`:

```text
backend/tests/test_websocket.py::test_websocket_emits_start_and_final_recommendation_then_closes_cleanly PASSED
backend/tests/test_websocket.py::test_websocket_reports_incomplete_pipeline_result_without_recommending PASSED
backend/tests/test_websocket.py::test_websocket_rejects_invalid_input_and_closes_with_policy_code PASSED
backend/tests/test_websocket.py::test_websocket_sanitizes_pipeline_exception_and_closes_with_error_code PASSED
```

### Key Reliability Invariants:
1. **Backend Remains Alive on Unexpected Disconnect:** When a client abruptly terminates the socket (network disruption, browser tab closed), the server catches `WebSocketDisconnect` cleanly without thread death or memory leaks.
2. **Threadpool Execution:** `run_in_threadpool(EchoPipeline.run, payload["message"])` prevents blocking the async event loop during intensive analysis.
3. **No Leaked Stack Traces:** Internal failures emit `{"code": "pipeline_failure"}` with code `1011` without exposing backend paths or code lines.

---

## 3. Fallback Hierarchy

Echo ensures the application remains usable even when WebSocket streams are blocked by corporate firewalls, reverse proxies, or network drops.

```text
┌──────────────────────────────────────────────┐
│  Tier 1: Live WebSocket Streaming (/ws/case) │
│  - Real-time event progression               │
│  - Instant UI step updates                   │
└──────────────────────┬───────────────────────┘
                       │ WebSocket fails or disconnects
                       ▼
┌──────────────────────────────────────────────┐
│  Tier 2: Synchronous HTTP Fallback (/api/case)│
│  - Calls the identical EchoPipeline.run()    │
│  - Returns full PipelineResult payload       │
│  - Zero architecture duplication             │
└──────────────────────┬───────────────────────┘
                       │ HTTP 4xx / 5xx error
                       ▼
┌──────────────────────────────────────────────┐
│  Tier 3: Clear UI Error & Escalation State   │
│  - Actionable error code (e.g. invalid input) │
│  - Escalation pathway for operator           │
└──────────────────────────────────────────────┘
```

### Implementing Tier 2 HTTP Fallback
If the frontend cannot open a WebSocket connection within 3 seconds, or receives an abnormal closure, it falls back to:
```http
POST /api/case HTTP/1.1
Host: localhost:8000
Content-Type: application/json

{
  "message": "Customer's 600 GB nightly export keeps timing out under high concurrency in sync mode."
}
```
The response contains the identical `PipelineResult` model, allowing the frontend to immediately render the recommendation without changing rendering logic.
