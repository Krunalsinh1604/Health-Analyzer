import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

function HeartDiseasePage() {
  const { user, logout } = useAuth();

  return (
    <div className="app">
      <Navbar />

      <div className="module-header" style={{ margin: '0 2rem 2rem' }}>
        <div>
          <h1>Cardiovascular Risk Assessment</h1>
          <p>Advanced predictive modeling for heart health.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span className="chip chip-muted">Beta Preview</span>
        </div>
      </div>

      <div className="layout">
        <section className="panel">
          <div className="card">
            <div className="card-header">
              <div>
                <h3>Prediction Model</h3>
                <p>Input patient parameters for risk evaluation.</p>
              </div>
            </div>

            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', background: 'var(--bg)', borderRadius: '12px', margin: '20px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>❤️</div>
              <h3>Module Coming Soon</h3>
              <p style={{ maxWidth: '400px', margin: '0 auto' }}>
                We are currently training our heart disease prediction model with verified clinical datasets. This feature will be available in the next release.
              </p>
            </div>
          </div>
        </section>

        <aside className="side">
          <div className="card">
            <div className="card-header">
              <h3>Latest Research</h3>
            </div>
            <ul className="insight-list">
              <li>Accuracy rate target &gt; 95%</li>
              <li>Multi-variable regression analysis</li>
              <li>Integrated with wearable data (planned)</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default HeartDiseasePage;
