import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function HypertensionPage() {
  const { user, logout } = useAuth();
  
  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Clinical Intelligence Suite</p>
          <h1>Hypertension Analysis</h1>
        </div>
        <div className="topbar-actions">
          <NavLink to="/" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>Home</NavLink>
          <NavLink to="/diabetes" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>Diabetes</NavLink>
          <NavLink to="/hypertension" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>Hypertension</NavLink>
           <NavLink to="/cbc" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>Report Analyzer</NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>Admin</NavLink>
          )}
          <button onClick={logout} className="tab" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}>Logout {user?.full_name}</button>
        </div>
      </header>

      <div className="module-header" style={{ margin: '0 2rem 2rem' }}>
        <div>
           <h1>Blood Pressure Monitoring</h1>
           <p>Longitudinal tracking and analysis of hypertension indicators.</p>
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
                  <h3>Vitals Input</h3>
                  <p>Systolic and diastolic recording.</p>
               </div>
            </div>
            
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', background: 'var(--bg)', borderRadius: '12px', margin: '20px 0' }}>
               <div style={{ fontSize: '48px', marginBottom: '16px' }}>🩺</div>
               <h3>Module Coming Soon</h3>
               <p style={{ maxWidth: '400px', margin: '0 auto' }}>
                 The hypertension tracking module is under development. You will soon be able to log daily readings and view trend analysis.
               </p>
            </div>
          </div>
        </section>

        <aside className="side">
          <div className="card">
            <div className="card-header">
              <h3>Guidelines</h3>
            </div>
            <ul className="insight-list">
               <li>Normal: &lt; 120/80 mmHg</li>
               <li>Elevated: 120-129/&lt;80 mmHg</li>
               <li>Stage 1: 130-139/80-89 mmHg</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default HypertensionPage;
