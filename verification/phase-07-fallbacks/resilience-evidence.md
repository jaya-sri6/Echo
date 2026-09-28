# Phase 07 — Fallback & Resilience Evidence

## 1. Resilience Architecture
In `backend/app/hindsight/memory.py`:
```python
except HindsightError as error:
    with self._lock:
        self._remote_failed = True
        self._memory_mode = "SEEDED DEMO FALLBACK"
    logger.warning(
        "Hindsight %s failed; continuing with the seeded memory provider: %s",
        operation,
        error,
    )
    return None
```
When an outage, network disconnect, or timeout occurs:
1. `_remote_failed` flag is locked to `True`.
2. `memory_mode` is updated to `"SEEDED DEMO FALLBACK"`.
3. Subsequent operations bypass network calls and query the internal thread-safe `_experiences` store (seeded + locally retained).
4. No exceptions bubble up to users or calling agents.
5. All 10 seeded canonical experiences remain instantly available in memory.

## 2. Real Network Outage Trace
During benchmark and test runs under restricted network conditions:
```
Hindsight recall failed; continuing with the seeded memory provider: Could not reach Hindsight at https://api.hindsight.vectorize.io: The read operation timed out
```
**Result**:
- Pipeline Status: `COMPLETE`
- Final Recommendation: `async_chunked_export`
- Decision Changed by Hindsight: `True`
- Error Count: `0`
- Zero data loss or unhandled exceptions.
