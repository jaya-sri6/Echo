# Echo Handoff — Hindsight / Memory Lead

## Owner

Name: Not specified

## Role

Person 2 — Hindsight / Memory Engine Lead; owns Tasks T11–T20.

## Branch

Branch name: Not available in this workspace.

## Tasks Completed

| Task | Status | Implementation and verification |
| --- | --- | --- |
| T11 — Connect Hindsight | Implemented and live-service tested | Added a synchronous REST client for Hindsight retain, recall, and reflect. The live test verified these operations against the configured Hindsight service. Hindsight Cloud creates a bank on its first retain; the client follows that behavior instead of calling an unsupported explicit bank-creation endpoint. |
| T12 — Create experience memory bank | Implemented | Uses the `support-experiences` bank by default. Loads the project's 15 seeded experiences locally and sends them to Hindsight on first use when a remote client is configured. |
| T13 — Implement `retain()` | Implemented and tested | Validates and stores experience outcomes locally, then retains them remotely when available. Uses stable Hindsight document IDs for seeded records and retained cases so repeated writes update the same documents. |
| T14 — Implement `recall()` | Implemented and tested | Queries Hindsight and returns remote recall evidence. Locally available structured experiences are ranked against the new case and annotated with applicability and transfer confidence. |
| T15 — Implement `reflect()` | Implemented and tested | Produces deterministic, outcome-backed recommendation reasoning; calls Hindsight reflect only when multiple applicable experiences have conflicting outcomes/actions. |
| T16 — Implement experience schema | Implemented and tested | `ExperienceRecord` extends the existing domain experience with outcome status: `SUCCESS`, `FAILURE`, `PARTIAL`, `BOUNDARY`, or `NON-TRANSFERABLE`. Seeded records and invalid-record rejection are covered by tests. |
| T17 — Implement applicability checking | Implemented and tested | Checks problem type and supported applicability conditions, including workload, execution mode, concurrency, and export-size ranges. Missing or unsupported conditions do not silently become applicable. |
| T18 — Implement boundary detection | Implemented and tested | Flags non-matching cases and prevents boundary/non-transferable experiences from being applied as successful guidance. The 20 GB interactive case does not inherit the large nightly-batch recommendation. |
| T19 — Return memory evidence to UI | Module output implemented; application wiring pending | Produces JSON-ready evidence with memory mode, bank, experience details, applicability, boundaries, reflection, and normalized raw Hindsight memories. This handoff does not claim that the API/WebSocket or frontend consumes or displays it. |
| T20 — Verify complete memory loop | Module-level loop tested, including live service calls; app-level loop pending | The opt-in live test retains a failure and successful alternative, recalls relevant Hindsight memories, calls Hindsight reflect, and verifies that the module's next recommendation changes. The end-to-end customer-to-UI flow through Echo orchestration is not included in this role's changes. |

## Files Changed

Only these files were changed for the Hindsight implementation and its local configuration/test support:

- `backend/app/hindsight/__init__.py`
- `backend/app/hindsight/client.py`
- `backend/app/hindsight/memory.py`
- `backend/app/hindsight/recall.py`
- `backend/app/hindsight/reflect.py`
- `backend/tests/test_hindsight.py`
- `.env.example`
- `.gitignore`

No orchestration, API/WebSocket, agent, domain, simulator, or frontend files were changed.

## Implementation Summary

The Hindsight package provides a support-experiences memory bank, typed experience records, local seeded fallback, and an optional Hindsight REST client. It retains outcomes, recalls historical evidence for a new case, checks whether that evidence applies, detects boundaries, and reflects on conflicting applicable history before returning a recommendation explanation.

Remote Hindsight recall results are normalized into a stable evidence type containing the source, memory ID when available, text, and a validated structured experience when one can be parsed. Arbitrary provider-specific fields are not passed through as UI evidence. Unstructured remote text remains visible as evidence but is not treated as a validated local experience for deterministic recommendations.

If Hindsight raises a connection/API error, the module switches to the explicitly named `SEEDED DEMO FALLBACK` and can continue using seeded and process-local records.

## How It Works

1. `ExperienceMemory` loads and validates seeded records from `data/experiences/seeded_experiences.json`.
2. On first remote operation, the configured client retains the seeded records to the selected Hindsight bank, with stable document IDs and synchronous processing.
3. `retain()` validates an outcome record, stores it in the local memory provider, and sends it to Hindsight when configured.
4. `recall()` creates a structured case query, asks Hindsight for relevant memories, normalizes the remote results, and ranks known structured experiences locally.
5. Applicability logic checks the experience conditions against the current case. Inapplicable/boundary records are not used as applicable recommendations.
6. `reflect()` chooses an applicable successful action when one exists, explains any applicable failures, and invokes Hindsight reflect only when there are conflicting applicable experiences.
7. `ui_evidence()` returns a JSON-ready payload with evidence and reflection details.
8. On remote Hindsight errors, the module logs a warning, labels the provider as `SEEDED DEMO FALLBACK`, and continues using local data.

## Inputs

- A `CaseContext` or mapping with `export_size_gb`, numeric `concurrency`, `workload`, `execution_mode`, and `problem_type`.
- An experience mapping or Pydantic experience model with ID, source, problem type, context, diagnosis, action, outcome, lesson, applicability, and optional outcome status.
- Optional Hindsight connection settings from the process environment or root `.env`.

## Outputs

- Validated `ExperienceRecord` from retain.
- `RecallResult` with query, bank ID, memory mode, ranked local structured evidence, normalized Hindsight memories, and a boundary flag.
- `ReflectionResult` with initial and recommended action, whether the recommendation changed, reasoning, supporting/contradicting experience IDs, boundary state, and optional Hindsight reflection text.
- A JSON-ready `ui_evidence()` payload derived from recall and reflection results.

## Interfaces With Other Components

- Reuses the existing `backend.app.domain.case_context.CaseContext` and `backend.app.domain.experiences.Experience` contracts.
- Hindsight REST requests are isolated in `backend.app.hindsight.client.HindsightClient`.
- The module exports its public classes/helpers from `backend.app.hindsight`.
- `ui_evidence()` is ready for an owning integration layer to serialize and send to the UI.
- **Pending cross-role integration:** no orchestration/API/WebSocket call site or frontend consumer was added. Coordinate with the integration/backend owner and frontend owner to connect the case lifecycle and evidence display. Do not represent UI wiring as complete until verified in the running app.

## Tests Performed

Permanent regression coverage is in `backend/tests/test_hindsight.py`:

- Seed bank count/status distribution and experience schema validation.
- Retain, local upsert, and invalid input rejection.
- Recall ranking, result limits, and applicability conditions.
- Large-batch to small-interactive boundary behavior.
- Failure → retained memory → repeated case → changed recommendation.
- Failure-only history does not invent an unsupported alternative.
- Normalized structured/unstructured remote recall output.
- Conditional reflect behavior for conflicting applicable outcomes.
- Explicit fallback labeling and local recall after simulated Hindsight outage.
- REST endpoint/request shape, bearer authorization, and root `.env` loading behavior.
- Opt-in live Hindsight retain/recall/reflect lifecycle test.

Verification completed:

- `python -m pytest backend\tests -q` — **26 passed, 1 skipped**. The skip is the opt-in live Hindsight test under the normal, non-integration run.
- Live test with `.env` settings and `HINDSIGHT_RUN_INTEGRATION=1` — **1 passed**. It ran against the configured Hindsight service/test bank, retained test outcomes, recalled related remote evidence, invoked reflect, and verified that the module produced a changed recommendation.
- `python -m compileall -q backend\app\hindsight backend\tests\test_hindsight.py` — passed.

The live loop test validates the Hindsight module and its real REST operations. The final recommendation is selected by the module's deterministic applicability/reflection logic over locally retained structured experiences; the Hindsight reflect response is captured as additional reflection evidence, not treated as the sole authority for the action.

## Known Issues / Bugs

- New records in the seeded fallback are process-local and are lost when the process restarts. Persistent fallback storage is not implemented; the project permits an explicitly labeled seeded fallback for the MVP.
- The module returns UI-ready evidence but does not itself send it through Echo's API/WebSocket or render it in the frontend.
- Live Hindsight API behavior was tested against the configured service and test bank, but the test bank is separate from the production/application bank.
- Hindsight may return useful memories as unstructured text. These are preserved in `remote_memories`, but only records matching the validated structured experience schema enter local applicability/recommendation logic.
- T20 has not been verified through the full running Echo customer → orchestration → memory → recommendation → outcome → retain → UI path.

## Dependencies

- Existing Pydantic models and backend domain modules.
- Standard-library HTTP and JSON modules for Hindsight REST calls.
- Pytest for unit and integration tests.
- Hindsight service and a valid API key only for the opt-in live integration test.
- Seed data at `data/experiences/seeded_experiences.json`.

## Integration Notes

- The first retain to a Hindsight bank creates the bank automatically. No standalone create-bank request is required for the configured Hindsight Cloud API.
- The live test must use `HINDSIGHT_TEST_BANK_ID`, a disposable test bank, not the application's shared/production bank.
- Seed records are retained on first remote use using stable IDs (`echo-seed-<experience_id>`); case records use stable `echo-case-<experience_id>` IDs.
- The Hindsight response's remote memory evidence and the locally validated experience evidence are separate fields. An integration consumer should preserve `memory_mode` so the UI never presents fallback as live Hindsight.
- To finish T19/T20 at application level, the owning integration role should call recall/reflection at the agreed orchestration seam, include the evidence in the existing event/API response contract, and run the three-case scenario through the UI.

## Environment / Configuration

Create a local root `.env` from `.env.example` and fill in credentials locally:

```text
HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=<your key>
HINDSIGHT_BANK_ID=support-experiences
HINDSIGHT_TEST_BANK_ID=<disposable test bank>
```

`.gitignore` ignores `.env` and `.env.*` while allowing `.env.example`. The Hindsight client reads `HINDSIGHT_*` variables from the process environment first and loads missing values from the project root `.env`; no secret value is stored in the repository.

Run the real-service test from the project root in PowerShell:

```powershell
$env:HINDSIGHT_RUN_INTEGRATION = "1"
python -m pytest backend\tests\test_hindsight.py::test_real_hindsight_retain_recall_reflect_contract -q
```

## Handoff Status

IN PROGRESS — Hindsight module work and live service test are ready for review; app-level T19 UI wiring and the complete running-app T20 flow remain with the relevant integration/UI owners.
