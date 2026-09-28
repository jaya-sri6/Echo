import React from 'react';

const caseData = {
  id: 'CASE-600-001',
  title: 'Large Export Timeout',
  problem: 'Nightly batch export is timing out during peak concurrency.',
  context: [
    { label: 'Export size', value: '600 GB' },
    { label: 'Concurrency', value: 'High' },
    { label: 'Execution mode', value: 'Sync' },
    { label: 'Workload', value: 'Nightly batch' },
  ],
  memoryRecall: 4,
  memorySummary: 'Historical failure patterns detected under similar load conditions.',
  recommendation: 'Async chunked export',
  outcome: 'Resolved',
  flow: [
    'Case',
    'Context',
    'Memory',
    'Evidence',
    'Boundary',
    'Recommendation',
    'Outcome',
  ],
  candidates: ['Increase timeout', 'Throttle concurrency', 'Async chunked export'],
};

export default function LiveCase() {
  return (
    <section style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.kicker}>LIVE CASE</div>
          <h2 style={styles.title}>{caseData.id}</h2>
        </div>
        <span style={styles.badge}>ACTIVE</span>
      </div>

      <h3 style={styles.problemTitle}>{caseData.title}</h3>
      <p style={styles.problemText}>{caseData.problem}</p>

      <div style={styles.sectionLabel}>Case context</div>
      <div style={styles.contextGrid}>
        {caseData.context.map((item) => (
          <div key={item.label} style={styles.contextBox}>
            <div style={styles.contextLabel}>{item.label}</div>
            <div style={styles.contextValue}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={styles.sectionLabel}>Decision flow</div>
      <div style={styles.flowWrap}>
        {caseData.flow.map((step, index) => (
          <div key={step} style={styles.flowItem}>
            <span style={styles.stepIndex}>{index + 1}</span>
            <span>{step}</span>
          </div>
        ))}
      </div>

      <div style={styles.sectionLabel}>Memory recall</div>
      <div style={styles.memoryBox}>
        <strong style={{ color: '#7ee7c7' }}>Hindsight recall:</strong> {caseData.memoryRecall} relevant experiences
        <div style={{ marginTop: 8, color: '#dfeaff' }}>{caseData.memorySummary}</div>
      </div>

      <div style={styles.sectionLabel}>Candidate actions</div>
      <div style={styles.candidateList}>
        {caseData.candidates.map((candidate) => (
          <div key={candidate} style={styles.candidateItem}>{candidate}</div>
        ))}
      </div>

      <div style={styles.recommendationBox}>
        <div style={styles.sectionLabel}>Current recommendation</div>
        <div style={styles.recommendationValue}>{caseData.recommendation}</div>
      </div>

      <div style={styles.outcomeRow}>
        <div>
          <div style={styles.smallLabel}>Outcome</div>
          <div style={styles.outcomeText}>{caseData.outcome}</div>
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#101a2d',
    border: '1px solid #2b3d5d',
    borderRadius: 18,
    padding: 22,
    boxShadow: '0 14px 32px rgba(0,0,0,0.18)',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 18,
  },
  kicker: {
    fontSize: 11,
    color: '#7ee7c7',
    letterSpacing: '0.18em',
    fontWeight: 700,
    marginBottom: 6,
  },
  title: {
    margin: 0,
    fontSize: 28,
    color: '#edf4ff',
  },
  badge: {
    background: 'rgba(126, 231, 199, 0.14)',
    border: '1px solid rgba(126, 231, 199, 0.4)',
    color: '#7ee7c7',
    borderRadius: 999,
    padding: '6px 10px',
    fontSize: 11,
    fontWeight: 700,
  },
  problemTitle: {
    margin: '0 0 8px',
    fontSize: 22,
  },
  problemText: {
    margin: '0 0 18px',
    color: '#d9e8ff',
    lineHeight: 1.6,
  },
  sectionLabel: {
    margin: '18px 0 12px',
    fontSize: 12,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#8ca4c5',
    fontWeight: 700,
  },
  contextGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
  },
  contextBox: {
    background: '#0d1628',
    border: '1px solid #2d4569',
    borderRadius: 12,
    padding: 12,
  },
  contextLabel: {
    color: '#a7bbd7',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 6,
  },
  contextValue: {
    fontSize: 18,
    fontWeight: 700,
    color: '#edf4ff',
  },
  flowWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  flowItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 999,
    background: '#0d1628',
    border: '1px solid #2d4569',
    color: '#eaf2ff',
    fontSize: 12,
  },
  stepIndex: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#7ee7c7',
    color: '#07141a',
    fontWeight: 700,
    fontSize: 11,
  },
  memoryBox: {
    background: 'rgba(126, 231, 199, 0.08)',
    border: '1px solid rgba(126, 231, 199, 0.4)',
    color: '#ecf7ff',
    borderRadius: 12,
    padding: 14,
    lineHeight: 1.5,
  },
  candidateList: {
    display: 'grid',
    gap: 8,
  },
  candidateItem: {
    padding: '10px 12px',
    borderRadius: 10,
    background: '#0d1628',
    border: '1px solid #2d4569',
    color: '#ddeaff',
  },
  recommendationBox: {
    marginTop: 20,
    borderRadius: 12,
    background: '#12263e',
    border: '1px solid #2f6d94',
    padding: 16,
  },
  recommendationValue: {
    fontSize: 24,
    fontWeight: 800,
    color: '#7ee7c7',
    marginTop: 6,
    letterSpacing: '0.02em',
  },
  outcomeRow: {
    marginTop: 18,
    display: 'flex',
    justifyContent: 'flex-start',
  },
  smallLabel: {
    color: '#a7bbd7',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 6,
  },
  outcomeText: {
    color: '#7ee7c7',
    fontSize: 22,
    fontWeight: 700,
  },
};
