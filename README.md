# Echo — Organizational Customer Experience Memory

> **Echo doesn't remember what customers said. It remembers what the company learned.**
> 
> 📋 **Team & Deployment Notice:** For full details on all changes, module updates, real-time WebSocket streaming, benchmarks, and step-by-step deployment instructions, see **[CHANGES.md](CHANGES.md)**.

Echo is an organizational customer-experience memory system designed for technical support and customer-success engineers at B2B SaaS companies. Instead of blindly repeating past advice because a new ticket superficially resembles an old one, Echo recalls the consequence of prior remediation attempts, checks contextual applicability boundaries, and avoids repeating company mistakes.

---

## The Core Loop

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
```

---

## Architecture — Five Specialized Agents

1. **Conversation Agent**: Extracts structured technical workload context (`export_size_gb`, `concurrency`, `workload`, `execution_mode`, `problem_type`) from customer messages.
2. **Investigator**: Identifies operational constraints, system bottlenecks, and severity levels.
3. **Experience Reasoner**: Leverages Hindsight recall and reflect to analyze historical successes and detect past failure boundaries.
4. **Resolution Agent**: Evaluates candidate actions against the deterministic simulator and formulates the optimal recommendation.
5. **Guardian**: Validates safety, reversibility, confidence thresholds, and human escalation requirements.

---

## Quick Start

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- Docker & Docker Compose (optional, for containerized run)

### 2. Environment Configuration
Copy the example environment file and configure your credentials:
```bash
cp .env.example .env
```
Fill in `.env`:
```env
HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=your_hindsight_api_key
HINDSIGHT_BANK_ID=support-experiences
HINDSIGHT_TEST_BANK_ID=echo-hindsight-test
GROQ_API_KEY=your_groq_api_key
```
*(Note: If Hindsight Cloud is unreachable, Echo automatically falls back to deterministic seeded demo mode using the 15 verified experiences).*

### 3. Running Backend Locally
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Start FastAPI server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at `http://localhost:8000/docs`.

### 4. Running Frontend Locally
```bash
cd frontend
npm install
npm run dev
```
Access the UI at `http://localhost:5173`.

---

## Running with Docker Compose

To launch the full unified stack in containers:
```bash
docker-compose up --build
```
- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## Demos & Evaluation

### Run Deterministic 3-Hero-Cases Demo
Demonstrates Case 1 (failure), Case 2 (learning & recommendation change), and Case 3 (context boundary protection):
```bash
python demo/demo_runner.py
```

### Run 8-Case Controlled Benchmark (Person 4)
Runs the full evaluation comparing **Memory OFF** vs **Memory ON**:
```bash
python evaluation/run_benchmark.py
```

Benchmark Results:
- **Decision Success Rate**: Improved from **25.0%** (Memory OFF) to **100.0%** (Memory ON)
- **Failed Intervention Rate**: Reduced from **62.5%** to **0.0%**
- **Average Resolution Time**: Reduced by **60 minutes** (from 137 min to 77 min)

---

## Testing

Run the complete backend regression test suite (67 tests):
```bash
pytest backend/tests
```
All unit tests, API tests, WebSocket tests, simulator rules, and evaluation metrics are tested with 100% pass rate.
