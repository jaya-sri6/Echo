import React from 'react';

const memories = [
  {
    id: 'EXP-031',
    problem: 'Large export timeout during nightly batch',
    action: 'Increase timeout',
    outcome: 'Failure',
    status: 'failure',
    applicability: 'High',
    boundary: 'Large export + high concurrency + sync execution',
    explanation: 'Same pattern previously consumed resources until the export still failed.',
  },
  {
    id: 'EXP-010',
    problem: 'Bulk data send saturated system resources',
    action: 'Async chunked export',
    outcome: 'Success',
    status: 'success',
    applicability: 'Medium',
    boundary: 'Valid when batch workload can be chunked',
    explanation: 'Chunking reduced saturation and avoided the timeout pattern.',
  },
  {
    id: 'EXP-142',
    problem: 'Small interactive transfer',
    action: 'Keep existing mode',
    outcome: 'Partial',
    status: 'partial',
    applicability: 'Low',
    boundary: 'Not relevant to large nightly export',
    explanation: 'This pattern does not apply because the workload is much smaller and less concurrent.',
  },
];

export default function MemoryEvidence() {
  return (
    <section style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.kicker}>MEMORY EVIDENCE</div>
          <h2 style={styles.title}>Relevant historical experiences</h2>
        </div>
      </div>

      <div style={styles.grid}>
        {memories.map((memory) => (
          <article key={memory.id} style={styles.memoryCard}>
            <div style={styles.topRow}>
              <strong>{memory.id}</strong>
              <span style={statusStyle(memory.status)}>{memory.status}</span>
            </div>

            <div style={styles.infoRow}>
              <span style={styles.label}>Problem</span>
              <span>{memory.problem}</span>
            </div>

            <div style={styles.infoRow}>
              <span style={styles.label}>Previous action</span>
              <span>{memory.action}</span>
            </div>

            <div style={styles.infoRow}>
              <span style={styles.label}>Outcome</span>
              <span>{memory.outcome}</span>
            </div>

            <div style={styles.infoRow}>
              <span style={styles.label}>Applicability</span>
              <span>{memory.applicability}</span>
            </div>

            <div style={styles.infoRow}>
              <span style={styles.label}>Boundary</span>
              <span>{memory.boundary}</span>
            </div>

            <div style={styles.explanation}>{memory.explanation}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

function statusStyle(status: string): React.CSSProperties {
  if (status === 'failure') {
    return {
      color: '#ffb4a9',
      background: 'rgba(255, 123, 123, 0.12)',
      border: '1px solid rgba(255, 123, 123, 0.4)',
      borderRadius: 999,
      padding: '4px 8px',
      fontSize: 11,
      textTransform: 'uppercase',
      fontWeight: 700,
    };
  }

  if (status === 'success') {
    return {
      color: '#7ee7c7',
      background: 'rgba(126, 231, 199, 0.12)',
      border: '1px solid rgba(126, 231, 199, 0.4)',
      borderRadius: 999,
      padding: '4px 8px',
      fontSize: 11,
      textTransform: 'uppercase',
      fontWeight: 700,
    };
  }

  return {
    color: '#ffd88a',
    background: 'rgba(255, 206, 106, 0.12)',
    border: '1px solid rgba(255, 206, 106, 0.35)',
    borderRadius: 999,
    padding: '4px 8px',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: 700,
  };
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: 26,
  },
  grid: {
    display: 'grid',
    gap: 12,
  },
  memoryCard: {
    background: '#0d1628',
    border: '1px solid #2d4569',
    borderRadius: 12,
    padding: 16,
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  infoRow: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr',
    gap: 10,
    fontSize: 13,
    color: '#edf4ff',
    marginBottom: 8,
  },
  label: {
    color: '#9bb0ce',
    fontWeight: 600,
  },
  explanation: {
    marginTop: 10,
    lineHeight: 1.5,
    color: '#dfeaff',
    borderTop: '1px solid #243758',
    paddingTop: 10,
  },
};
