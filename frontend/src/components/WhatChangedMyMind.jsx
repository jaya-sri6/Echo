const timeline = [
  {
    label: 'Initial recommendation',
    value: 'Increase timeout',
  },
  {
    label: 'Hindsight recall',
    value: 'Historical failure found',
  },
  {
    label: 'Boundary detected',
    value: 'Large export + high concurrency',
  },
  {
    label: 'Final recommendation',
    value: 'Async chunked export',
  },
];

export default function WhatChangedMyMind() {
  return (
    <section className="card">
      <h2>What Changed My Mind?</h2>

      <div className="flow">
        {timeline.map((item, index) => (
          <div key={item.label} className="flow-step">
            <div className="small">{index + 1}. {item.label}</div>
            <div>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="decision-panel">
        <h3>Don’t repeat the company’s mistake</h3>
        <div className="small">EXP-031</div>
        <div className="decision-box">Increase timeout</div>
        <div className="small" style={{ marginTop: '12px' }}>Historical outcome: FAILURE</div>
      </div>
    </section>
  );
}
