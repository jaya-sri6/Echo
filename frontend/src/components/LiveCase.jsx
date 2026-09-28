const caseData = {
  title: '600 GB export',
  context: ['HIGH concurrency', 'NIGHTLY batch', 'SYNC execution'],
  steps: [
    'Case loaded',
    'Context extracted',
    'Hindsight recalled 4 experiences',
    'Historical failure detected',
    'Boundary detected',
    'Candidates evaluated',
  ],
  recommendation: 'ASYNC CHUNKED EXPORT',
  outcome: 'SUCCESS',
};

export default function LiveCase() {
  return (
    <section className="card">
      <h2>Live Case</h2>
      <div className="status-row">
        <span className="pill">CASE</span>
        <span className="pill">CONTEXT</span>
        <span className="pill">HINDSIGHT</span>
      </div>

      <h3>{caseData.title}</h3>
      <ul className="evidence-list">
        {caseData.context.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div className="flow">
        {caseData.steps.map((step) => (
          <div key={step} className="flow-step">
            <strong>✓</strong> {step}
          </div>
        ))}
      </div>

      <div className="decision-panel">
        <h3>Recommendation</h3>
        <div className="decision-box">{caseData.recommendation}</div>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="metric-label">Outcome</div>
          <div className="metric-value">{caseData.outcome}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Memory</div>
          <div className="metric-value">4 matches</div>
        </div>
      </div>
    </section>
  );
}
