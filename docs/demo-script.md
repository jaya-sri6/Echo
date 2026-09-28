# Echo — 4-Minute Hackathon Demo Script

## 0:00–0:30 — The Problem Hook
> *"Support systems remember tickets. They don't remember what the company learned from those tickets."*

A customer reports: *"Our 600 GB nightly export is timing out under high concurrency in sync mode."*
A standard support engineer or generic chatbot looks up previous tickets, sees "export timeout", and suggests: **Increase timeout**.

---

## 0:30–1:15 — Case 1: First Attempt (Memory OFF)
- Click **CASE 01** in the UI switcher or run `python demo/demo_runner.py`.
- Echo evaluates the naive action: `increase_timeout`.
- The simulator evaluates the result: **FAILURE (180 min, Escalated)**.
- **Why?** High concurrency and 600 GB payload causes database processing saturation. Increasing timeout just waits longer on a locked thread.
- Echo retains this consequence into Hindsight memory (`EXP-031`).

---

## 1:15–2:15 — Case 2: The Decision Moment (What Changed My Mind?)
- Click **CASE 02** (the repeated case).
- Echo's 5 specialists run:
  1. **Conversation Agent**: Extracts structured technical facts.
  2. **Investigator**: Flags CRITICAL severity due to synchronous lockup.
  3. **Experience Reasoner**: Queries Hindsight memory and recalls that `increase_timeout` previously failed on this exact pattern.
  4. **Resolution Agent**: Counterfactually evaluates candidate actions and changes the recommendation to **Async chunked export**.
  5. **Guardian**: Validates safety and approves the remediation.
- The UI highlights the hero card: **WHAT CHANGED MY MIND?**
  - *Without Echo Memory*: `Increase timeout` ➔ FAILED
  - *With Echo Memory*: `Async chunked export` ➔ SUCCESS

---

## 2:15–3:00 — Case 3: Anti-RAG / Boundary Protection
- Click **CASE 03** (20 GB interactive export).
- A naive RAG system matches "export timeout" and forces heavy asynchronous chunking onto this small job.
- Echo detects the **applicability boundary**: 20 GB interactive transfer does not suffer from batch saturation.
- Echo keeps the existing lightweight flow (`reduce_concurrency`), ensuring memories are not blindly hallucinated across workloads.

---

## 3:00–4:00 — Proof & Controlled 8-Case Benchmark
- Run `python evaluation/run_benchmark.py`.
- Show the 8-case benchmark results:
  - Decision Success Rate: **25% ➔ 100%**
  - Failed Interventions: **62.5% ➔ 0%**
  - Average Resolution Time: **-60 minutes reduction**
- Closing line: *"Echo turns repeated customer failures into institutional wisdom."*
