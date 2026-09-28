import React from 'react';

type AgentStatus = 'completed' | 'active' | 'pending' | 'failed';

const agents = [
  { name: 'Conversation Agent', status: 'completed' as AgentStatus },
  { name: 'Investigator', status: 'completed' as AgentStatus },
  { name: 'Experience Reasoner', status: 'active' as AgentStatus },
  { name: 'Resolution Agent', status: 'pending' as AgentStatus },
  { name: 'Guardian', status: 'pending' as AgentStatus },
];

export default function AgentExecution() {
  return (
    <section style={styles.card}>
      <div style={styles.kicker}>AGENT EXECUTION</div>
      <h3 style={styles.title}>Execution timeline</h3>

      <div style={styles.list}>
        {agents.map((agent, index) => (
          <div key={agent.name} style={styles.row}>
            <div style={styles.index}>{index + 1}</div>
            <div style={styles.nameWrap}>
              <div style={styles.name}>{agent.name}</div>
              <div style={styles.stateLabel}>{agent.status}</div>
            </div>
            <span style={statusStyle(agent.status)}>{agent.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function statusStyle(status: AgentStatus): React.CSSProperties {
  const palette: Record<AgentStatus, React.CSSProperties> = {
    completed: {
      background: 'rgba(126, 231, 199, 0.12)',
      border: '1px solid rgba(126, 231, 199, 0.4)',
      color: '#7ee7c7',
      borderRadius: 999,
      padding: '5px 8px',
      fontSize: 10,
      textTransform: 'uppercase',
      fontWeight: 700,
      display: 'inline-block',
    },
    active: {
      background: 'rgba(110, 160, 255, 0.12)',
      border: '1px solid rgba(110, 160, 255, 0.4)',
      color: '#9ac1ff',
      borderRadius: 999,
      padding: '5px 8px',
      fontSize: 10,
      textTransform: 'uppercase',
      fontWeight: 700,
      display: 'inline-block',
    },
    pending: {
      background: 'rgba(164, 177, 197, 0.12)',
      border: '1px solid rgba(164, 177, 197, 0.3)',
      color: '#cfe0ff',
      borderRadius: 999,
      padding: '5px 8px',
      fontSize: 10,
      textTransform: 'uppercase',
      fontWeight: 700,
      display: 'inline-block',
    },
    failed: {
      background: 'rgba(255, 123, 123, 0.12)',
      border: '1px solid rgba(255, 123, 123, 0.4)',
      color: '#ffb4a9',
      borderRadius: 999,
      padding: '5px 8px',
      fontSize: 10,
      textTransform: 'uppercase',
      fontWeight: 700,
      display: 'inline-block',
    },
  };

  return palette[status];
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
    fontSize: 24,
  },
  list: {
    display: 'grid',
    gap: 12,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '32px 1fr auto',
    gap: 12,
    alignItems: 'center',
    background: '#0d1628',
    border: '1px solid #2d4569',
    borderRadius: 12,
    padding: '10px 12px',
  },
  index: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1c2942',
    border: '1px solid #3b5376',
    fontSize: 12,
    fontWeight: 700,
  },
  nameWrap: {
    display: 'grid',
    gap: 4,
  },
  name: {
    fontWeight: 700,
    color: '#edf4ff',
  },
  stateLabel: {
    fontSize: 11,
    color: '#a7bbd7',
    textTransform: 'capitalize',
  },
};
