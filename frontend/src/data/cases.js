import seededData from './seeded_experiences.json';

// Titles for all 15 seeded cases
const caseTitles = {
  'EXP-001': 'Database Pool Throttling',
  'EXP-002': 'Async Chunked Batch Success',
  'EXP-003': 'Bounded Retry Network Jitter',
  'EXP-004': 'Off-Peak Scheduling Window',
  'EXP-005': 'Storage Partition I/O Bottleneck',
  'EXP-006': 'Asynchronous Compliance Queue',
  'EXP-007': 'Saturated Monolithic Timeout (Hero Failure)',
  'EXP-008': 'Structural Queue Thrashing Failure',
  'EXP-009': 'Shared Storage Latency Exhaustion',
  'EXP-010': 'Peak Warehouse Contention Overlap',
  'EXP-011': 'Long-Tail Interactive Download SLA',
  'EXP-012': 'Shared Warehouse Intermittent Latency',
  'EXP-013': 'Small Interactive Dashboard Boundary',
  'EXP-014': 'Table Snapshot Timing Irrelevance',
  'EXP-015': 'Third-Party Platform Throttle Boundary',
};

// Natural incident messages formatted for ConversationAgent context extraction
const customerMessages = {
  'EXP-001': "Customer's 180 GB nightly batch export is timing out under medium concurrency in sync mode.",
  'EXP-002': "Customer's 600 GB nightly batch export keeps timing out under high concurrency in async mode.",
  'EXP-003': "Customer's 95 GB ad-hoc export is timing out under medium concurrency in sync mode.",
  'EXP-004': "Customer's 320 GB daily batch export keeps timing out under high concurrency in async mode.",
  'EXP-005': "Customer's 240 GB data migration export is timing out under high concurrency in sync mode.",
  'EXP-006': "Customer's 88 GB compliance export is timing out under low concurrency in async mode.",
  'EXP-007': "Customer's 600 GB nightly export keeps timing out under high concurrency in sync mode.",
  'EXP-008': "Customer's 450 GB daily batch export keeps timing out under high concurrency in sync mode.",
  'EXP-009': "Customer's 150 GB low priority export is timing out under high concurrency in sync mode.",
  'EXP-010': "Customer's 90 GB sap report export is timing out under medium concurrency in sync mode.",
  'EXP-011': "Customer's 75 GB interactive export is timing out under medium concurrency in async mode.",
  'EXP-012': "Customer's 40 GB scheduled report export is timing out under high concurrency in sync mode.",
  'EXP-013': "Customer's 4 GB interactive export is timing out under low concurrency in sync mode.",
  'EXP-014': "Customer's 12 GB table snapshot export is timing out under low concurrency in async mode.",
  'EXP-015': "Customer's 800 GB warehouse migration export is timing out under high concurrency in sync mode.",
};

// Build enriched 15 cases directly from seeded JSON source of truth
export const all15Cases = seededData.map((item) => {
  const ctx = item.context || {};
  const sizeGb = ctx.export_size_gb;
  const concurrency = ctx.concurrency;
  const workload = (ctx.workload || '').replace(/_/g, ' ');
  const mode = ctx.execution_mode || 'sync';

  return {
    id: item.experience_id,
    title: caseTitles[item.experience_id] || item.experience_id,
    status: item.status || 'UNKNOWN',
    category: item.status || 'UNKNOWN',
    action: item.action,
    problem_type: item.problem_type,
    context: ctx,
    diagnosis: item.diagnosis,
    outcome: item.outcome,
    lesson: item.lesson,
    applicability: item.applicability,
    message: customerMessages[item.experience_id] || `Customer's ${sizeGb} GB ${workload} export is timing out in ${mode} mode.`,
    tags: [
      `${sizeGb} GB`,
      typeof concurrency === 'number' ? (concurrency >= 20 ? 'HIGH CONCURRENCY' : concurrency >= 10 ? 'MED CONCURRENCY' : 'LOW CONCURRENCY') : `${concurrency} CONCURRENCY`.toUpperCase(),
      workload.toUpperCase(),
      `${mode.toUpperCase()} MODE`,
    ],
  };
});

// Canonical Hero Presets for guided demonstrations
export const heroPresets = {
  hero_case_a: {
    key: 'hero_case_a',
    label: 'CASE 01: FIRST ATTEMPT',
    title: 'Baseline Heuristic (Memory Not Yet Retained)',
    message: "Customer's 600 GB nightly export keeps timing out under high concurrency in sync mode.",
    tags: ['600 GB', 'HIGH CONCURRENCY', 'NIGHTLY BATCH', 'SYNC MODE'],
    initialAction: 'increase_timeout',
    expectedAction: 'increase_timeout',
    expectedOutcome: 'FAILURE',
    expectedTime: '180 min',
    isHero: true,
    stepDescription: 'Tests naive timeout heuristic. Saturation causes failure, which is retained to memory.',
    matchedCaseId: 'EXP-007',
  },
  hero_case_b: {
    key: 'hero_case_b',
    label: 'CASE 02: MEMORY INFORMED',
    title: 'Hindsight in Action (What Changed My Mind?)',
    message: "Customer's 600 GB nightly export keeps timing out again under high concurrency in sync mode.",
    tags: ['600 GB', 'HIGH CONCURRENCY', 'NIGHTLY BATCH', 'SYNC MODE'],
    initialAction: 'increase_timeout',
    expectedAction: 'async_chunked_export',
    expectedOutcome: 'SUCCESS',
    expectedTime: '110 min',
    isHero: true,
    stepDescription: 'Echo recalls prior EXP-007 failure, shifts to async chunking, and avoids repeating the mistake.',
    matchedCaseId: 'EXP-002',
  },
  hero_case_c: {
    key: 'hero_case_c',
    label: 'CASE 03: BOUNDARY CHECK',
    title: 'Anti-RAG Boundary (Do Not Blindly Transfer)',
    message: "Customer's 20 GB interactive export is timing out under low concurrency in sync mode.",
    tags: ['20 GB', 'LOW CONCURRENCY', 'INTERACTIVE', 'SYNC MODE'],
    initialAction: 'keep_existing_mode',
    expectedAction: 'keep_existing_mode',
    expectedOutcome: 'SUCCESS',
    expectedTime: '8 min',
    isHero: true,
    stepDescription: 'Memory exists, but conditions (20 GB interactive) fall outside bounds. Blind transfer rejected.',
    matchedCaseId: 'EXP-013',
  },
};
