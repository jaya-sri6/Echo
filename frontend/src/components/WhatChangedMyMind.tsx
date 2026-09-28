import React from 'react';

const changeSummary = {
  initial: 'Increase timeout',
  memory: 'Historical failure found',
  boundary: 'Large export + high concurrency + sync execution',
  final: 'Async chunked export',
  experienceId: 'EXP-031',
  historicalOutcome: 'Failure',
  whyFailed: 'The previous timeout action escalated resource pressure instead of reducing it.',
  whyApplies: 'This case matches the same large transfer pattern and workload profile.',
};

export default function WhatChangedMyMind() {
  return (
    <section style={styles.card}>
      <div style={styles.kicker}>WHAT CHANGED MY MIND?</div>
      <h2 style={styles.title}>Decision change</h2>

      <div style={styles.flow}>
        <div style={styles.step}>
          <div style={styles.label}>Initial recommendation</div>
          <div style={styles.value}>{changeSummary.initial}</div>
        </div>

        <div style={styles.arrow}>↓</div>

        <div style={styles.step}>
          <div style={styles.label}>Hindsight recall</div>
          <div style={styles.value}>{changeSummary.memory}</div>
        </div>

        <div style={styles.arrow}>↓</div>

        <div style={styles.step}>
          <div style={styles.label}>Boundary detected</div>
          <div style={styles.value}>{changeSummary.boundary}</div>
        </div>

        <div style={styles.arrow}>↓</div>

        <div style={styles.stepPrimary}>
          <div style={styles.label}>Final recommendation</div>
          <div style={styles.valuePrimary}>{changeSummary.final}</div>
        </div>
      </div>

      <div style={styles.callout}>
        <div style={styles.calloutTitle}>Don’t repeat the company’s mistake</div>
        <div style={styles.meta}>{changeSummary.experienceId}</div>
        <div style={styles.metaValue}>{changeSummary.historicalOutcome}</div>
        <p style={styles.text}>{changeSummary.whyFailed}</p>
        <p style={styles.text}>{changeSummary.whyApplies}</p>
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
    marginBottom: 8,
  },
  title: {
    margin: '0 0 18px',
    fontSize: 26,
  },
  flow: {
    display: 'grid',
    gap: 10,
  },
  step: {
    borderRadius: 12,
    background: '#0d1628',
    border: '1px solid #2d4569',
    padding: '12px 14px',
  },
  stepPrimary: {
    borderRadius: 12,
    background: 'rgba(126, 231, 199, 0.08)',
    border: '1px solid rgba(126, 231, 199, 0.4)',
    padding: '14px 14px',
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
    lineHeight: 1,
  },
  callout: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    background: '#12263e',
    border: '1px solid #2f6d94',
  },
  calloutTitle: {
    fontWeight: 700,
    fontSize: 16,
    marginBottom: 8,
  },
  meta: {
    color: '#a7bbd7',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  metaValue: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: 700,
    color: '#ffd88a',
  },
  text: {
    margin: '10px 0 0',
    color: '#dfeaff',
    lineHeight: 1.6,
  },
};
