import React from 'react';

const recommendation = {
  initial: 'Increase timeout',
  final: 'Async chunked export',
  state: 'Decision changed by memory evidence',
  rationale:
    'Historical failure under the same export pattern plus boundary detection on high concurrency made the timeout approach unsafe.',
  evidence: [
    'EXP-031 recorded a prior timeout failure with the same nightly batch pattern.',
    'Boundary logic identified that the export is large and sync, which increases saturation risk.',
    'Chunked async export reduced resource pressure and matched the successful pattern from prior memory.',
  ],
};

export default function Recommendation() {
  return (
    <section style={styles.card}>
      <div style={styles.kicker}>DECISION</div>
      <h3 style={styles.title}>Recommendation</h3>

      <div style={styles.block}>
        <div style={styles.label}>Initial</div>
        <div style={styles.value}>{recommendation.initial}</div>
      </div>

      <div style={styles.arrow}>↓</div>

      <div style={styles.blockPrimary}>
        <div style={styles.label}>Final</div>
        <div style={styles.valuePrimary}>{recommendation.final}</div>
      </div>

      <div style={styles.state}>{recommendation.state}</div>
      <p style={styles.rationale}>{recommendation.rationale}</p>

      <div style={styles.evidenceList}>
        {recommendation.evidence.map((item) => (
          <div key={item} style={styles.evidenceItem}>{item}</div>
        ))}
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
  kicker: {
    color: '#7ee7c7',
    letterSpacing: '0.18em',
    fontWeight: 700,
    fontSize: 11,
    marginBottom: 10,
  },
  title: {
    margin: '0 0 18px',
    fontSize: 24,
  },
  block: {
    padding: '12px 14px',
    borderRadius: 12,
    background: '#0d1628',
    border: '1px solid #2d4569',
  },
  blockPrimary: {
    padding: '14px 14px',
    borderRadius: 12,
    background: 'rgba(126, 231, 199, 0.08)',
    border: '1px solid rgba(126, 231, 199, 0.4)',
  },
  label: {
    color: '#a7bbd7',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 6,
  },
  value: {
    fontSize: 18,
    fontWeight: 700,
    color: '#edf4ff',
  },
  valuePrimary: {
    fontSize: 24,
    fontWeight: 800,
    color: '#7ee7c7',
  },
  arrow: {
    textAlign: 'center',
    color: '#a7bbd7',
    fontSize: 22,
    margin: '8px 0',
  },
  state: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#7ee7c7',
  },
  rationale: {
    marginTop: 12,
    lineHeight: 1.6,
    color: '#dbeaff',
  },
  evidenceList: {
    display: 'grid',
    gap: 8,
    marginTop: 12,
  },
  evidenceItem: {
    background: '#0d1628',
    border: '1px solid #2d4569',
    borderRadius: 10,
    padding: 10,
    color: '#edf4ff',
    lineHeight: 1.5,
    fontSize: 13,
  },
};
