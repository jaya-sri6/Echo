# Echo Handoff — Domain / Simulator

## Owner
Jaya

## Role
Domain / Simulator Lead

## Branch
[Branch name to be filled]

## Tasks Completed
- Implemented domain models for case context, experiences, and candidate actions.
- Created deterministic export simulator for Echo MVP scenarios.
- Added seeded historical experiences dataset for export-timeout and export-performance scenarios.
- Created canonical demo scenarios for failure learning, learned-experience reuse, and non-transferable boundary behavior.
- Added Domain / Simulator tests covering domain models, dataset validation, simulator outcomes, determinism, and canonical scenarios.

## Files Changed
- backend/app/domain/case_context.py
- backend/app/domain/experiences.py
- backend/app/domain/candidates.py
- backend/app/domain/simulator.py
- data/experiences/seeded_experiences.json
- data/scenarios/case_01_failure.json
- data/scenarios/case_02_learning.json
- data/scenarios/case_03_boundary.json
- backend/tests/test_domain.py
- backend/tests/test_simulator.py

## Implementation Summary
This work establishes the deterministic domain layer for Echo's B2B SaaS export-support MVP. It captures customer workload context, stores seeded organizational experiences, evaluates supported remediation actions, and simulates export outcomes without external dependencies or random behavior.

## How It Works
The domain layer models canonical export contexts and historical experiences. The simulator evaluates a deterministic set of rules tied to export size, concurrency, workload, execution mode, and chosen action. These rules produce structured outcomes that are predictable and easy for the rest of the team to reuse in demo flows and integration scenarios.

## Inputs
- export_size_gb
- concurrency
- workload
- execution_mode
- action

## Outputs
- outcome
- resolution_time_minutes
- escalated
- reason
- lesson

## Supported Actions
- increase_timeout
- reduce_concurrency
- async_chunked_export
- retry_with_backoff
- schedule_off_peak

## Seeded Dataset
- data/experiences/seeded_experiences.json
- 15 experiences total
- 6 SUCCESS
- 4 FAILURE
- 2 PARTIAL
- 2 BOUNDARY
- 1 NON-TRANSFERABLE
- source = SEEDED
- all experiences relate to export timeout / export performance scenarios

## Canonical Scenarios
- data/scenarios/case_01_failure.json
- data/scenarios/case_02_learning.json
- data/scenarios/case_03_boundary.json

These represent:
- failure learning
- learned-experience usage
- boundary / non-blind memory transfer

## Interfaces With Other Components
This work is designed to be consumed by downstream application logic and orchestration in a deterministic, typed way. No API, agent, orchestrator, or Hindsight implementation was added here.

## Tests Performed
- Domain model import and construction checks
- Seeded dataset validation
- Simulator critical scenario checks
- Determinism validation
- Canonical scenario JSON validation
- Pytest suite execution

## Known Issues / Limitations
- Domain layer is intentionally deterministic and synthetic for the hackathon MVP.
- These rules are designed for demo clarity and team iteration, not production-grade forecasting.
- No external dependency or external API integration is included.

## Dependencies
- Python
- Pydantic
- Existing repository structure and Python test environment

## Integration Notes
Integration status: PASS

Validated successfully:
- Domain imports
- seeded dataset compatibility
- simulator behavior
- determinism
- canonical scenarios
- Python test suite execution

Compatibility issues: None found.

## Environment / Configuration
- Repository: Echo
- Python interpreter used for validation: py -3
- Test command: py -3 -m pytest backend/tests/test_domain.py backend/tests/test_simulator.py -q

## Handoff Status
READY
