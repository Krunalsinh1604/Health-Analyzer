import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../pages/Dashboard.css";

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        if (window.confirm("Terminate clinical session?")) {
            logout();
            navigate("/login");
        }
    };

    return (
        <nav className="db-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: 'var(--btn-gradient)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20 }}>🧬</div>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--db-text)', letterSpacing: '-0.02em' }}>HealthAnalyzer<span style={{color: 'var(--db-accent)'}}>.ai</span></span>
          </div>
          
          <div className="db-nav-links">
            <NavLink to="/dashboard" className={({ isActive }) => `db-nav-item ${isActive ? "active" : ""}`}>
                Home
            </NavLink>
            {user?.role !== "admin" && (
                <>
                    <NavLink to="/diabetes" className={({ isActive }) => `db-nav-item ${isActive ? "active" : ""}`}>
                        Diabetes
                    </NavLink>
                    <NavLink to="/heart-disease" className={({ isActive }) => `db-nav-item ${isActive ? "active" : ""}`}>
                        Heart Disease
                    </NavLink>
                    <NavLink to="/hypertension" className={({ isActive }) => `db-nav-item ${isActive ? "active" : ""}`}>
                        Hypertension
                    </NavLink>
                    <NavLink to="/cbc" className={({ isActive }) => `db-nav-item ${isActive ? "active" : ""}`}>
                        Report Analyzer
                    </NavLink>
                    <NavLink to="/history" className={({ isActive }) => `db-nav-item ${isActive ? "active" : ""}`}>
                        History
                    </NavLink>
                </>
            )}
            {user?.role === "admin" && (
                <NavLink to="/admin" className={({ isActive }) => `db-nav-item ${isActive ? "active" : ""}`}>
                    Doctor Dashboard
                </NavLink>
            )}
          </div>

          {user && (
            <div className="db-profile" onClick={handleLogout} title="Click to logout">
              <div className="db-profile-info">
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--db-text)' }}>{user.full_name || 'Practitioner'}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--db-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session Active</div>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--db-teal-soft)', border: '1px solid var(--db-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👩‍⚕️</div>
            </div>
          )}
        </nav>
    );
}

export default Navbar;
