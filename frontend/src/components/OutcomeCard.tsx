import React from 'react';

const outcome = {
  status: 'success',
  title: 'Outcome',
  result: 'Export completed successfully',
  description: 'Async chunking avoided sustained processing saturation and kept the night batch moving.',
  details: 'SLA met · No escalation required',
};

export default function OutcomeCard() {
  return (
    <section style={styles.card}>
      <div style={styles.kicker}>OUTCOME</div>
      <h3 style={styles.title}>{outcome.title}</h3>

      <div style={statusStyle(outcome.status)}>{outcome.status}</div>

      <div style={styles.result}>{outcome.result}</div>
      <p style={styles.description}>{outcome.description}</p>
      <div style={styles.details}>{outcome.details}</div>
    </section>
  );
}

function statusStyle(status: string): React.CSSProperties {
  const colorMap: Record<string, React.CSSProperties> = {
    success: {
      color: '#7ee7c7',
      background: 'rgba(126, 231, 199, 0.12)',
      border: '1px solid rgba(126, 231, 199, 0.4)',
      borderRadius: 999,
      display: 'inline-block',
      padding: '6px 10px',
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      marginBottom: 12,
    },
    failure: {
      color: '#ffb4a9',
      background: 'rgba(255, 123, 123, 0.12)',
      border: '1px solid rgba(255, 123, 123, 0.4)',
      borderRadius: 999,
      display: 'inline-block',
      padding: '6px 10px',
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      marginBottom: 12,
    },
    partial: {
      color: '#ffd88a',
      background: 'rgba(255, 206, 106, 0.12)',
      border: '1px solid rgba(255, 206, 106, 0.35)',
      borderRadius: 999,
      display: 'inline-block',
      padding: '6px 10px',
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      marginBottom: 12,
    },
    boundary: {
      color: '#d0c9ff',
      background: 'rgba(133, 122, 255, 0.12)',
      border: '1px solid rgba(133, 122, 255, 0.35)',
      borderRadius: 999,
      display: 'inline-block',
      padding: '6px 10px',
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      marginBottom: 12,
    },
  };

  return colorMap[status] || colorMap.success;
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
    margin: '0 0 10px',
    fontSize: 24,
  },
  result: {
    fontSize: 20,
    fontWeight: 700,
    color: '#edf4ff',
    marginBottom: 10,
  },
  description: {
    lineHeight: 1.6,
    color: '#dfeaff',
    margin: '0 0 12px',
  },
  details: {
    color: '#7ee7c7',
    fontWeight: 600,
  },
};
