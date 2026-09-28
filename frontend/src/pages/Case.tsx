import React from 'react';
import LiveCase from '../components/LiveCase';
import MemoryEvidence from '../components/MemoryEvidence';
import AgentExecution from '../components/AgentExecution';
import Recommendation from '../components/Recommendation';
import OutcomeCard from '../components/OutcomeCard';
import WhatChangedMyMind from '../components/WhatChangedMyMind';

export default function CasePage() {
  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.kicker}>ECHO</div>
          <h1 style={styles.title}>Customer Case Review</h1>
        </div>
      </header>

      <div style={styles.layout}>
        <div style={styles.mainColumn}>
          <LiveCase />
          <MemoryEvidence />
        </div>

        <div style={styles.sideColumn}>
          <AgentExecution />
          <Recommendation />
          <OutcomeCard />
        </div>
      </div>

      <div style={styles.fullWidth}>
        <WhatChangedMyMind />
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 1360,
    margin: '0 auto',
    padding: '32px 24px 56px',
    fontFamily: 'Inter, Segoe UI, sans-serif',
    background: '#0b1020',
    color: '#edf4ff',
    minHeight: '100vh',
  },
  header: {
    marginBottom: 26,
  },
  kicker: {
    fontSize: 12,
    color: '#6ee7b7',
    letterSpacing: '0.2em',
    fontWeight: 700,
    marginBottom: 8,
  },
  title: {
    margin: 0,
    fontSize: 'clamp(28px, 4vw, 42px)',
    lineHeight: 1.1,
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 0.9fr',
    gap: 22,
  },
  mainColumn: {
    display: 'grid',
    gap: 22,
  },
  sideColumn: {
    display: 'grid',
    gap: 22,
    alignContent: 'start',
  },
  fullWidth: {
    marginTop: 22,
  },
};
