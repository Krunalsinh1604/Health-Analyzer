import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminPage() {
  const { user, authFetch } = useAuth();
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch("/reports/admin");
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
        setUsers(data.users || []);
      } else {
        setError("Failed to fetch admin data.");
      }
    } catch (err) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredReports = reports.filter(report => {
    if (filterRisk === "all") return true;
    if (filterRisk === "High") return report.risk_level === "High";
    if (filterRisk === "Emergency") return report.risk_level === "High" && report.diabetes_prediction === "Positive"; // Example logic
    return true;
  });

  const emergencyPatients = reports.filter(
    (report) => report.risk_level === "High"
  );

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Clinical Intelligence Suite</p>
          <h1>Admin Analytics</h1>
          <p className="subtitle">
            Welcome, {user?.full_name || "Admin"}. System Overview.
          </p>
        </div>
        <div className="topbar-actions">
          <NavLink to="/" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>Home</NavLink>
          <NavLink to="/diabetes" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>Diabetes</NavLink>
          <NavLink to="/cbc" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>CBC</NavLink>
          <NavLink to="/admin" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>Admin</NavLink>
        </div>
      </header>

      <section className="admin">
        <div className="admin-grid">
          
          {/* Emergency Section */}
          <div className="card emergency-section" style={{ borderColor: '#ef4444' }}>
            <div className="card-header">
              <h3 style={{ color: '#ef4444' }}>⚠️ Emergency / High Risk Patients</h3>
            </div>
            {emergencyPatients.length === 0 ? (
              <p>No high risk patients detected.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Email</th>
                      <th>Condition</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emergencyPatients.map((report) => (
                      <tr key={report.id}>
                        <td>{report.full_name || "Unknown"}</td>
                        <td>{report.email || "Unknown"}</td>
                        <td>{report.risk_level} - {report.diabetes_prediction}</td>
                        <td>{new Date(report.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <h3>All Patient Reports</h3>
                <p>Comprehensive database of all assessments.</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <select 
                  value={filterRisk} 
                  onChange={(e) => setFilterRisk(e.target.value)}
                  style={{ padding: '0.5rem' }}
                >
                  <option value="all">All Risks</option>
                  <option value="High">High Risk Only</option>
                </select>
                <button className="ghost" onClick={fetchData}>Refresh</button>
              </div>
            </div>

            <div className="admin-stats">
              <div>
                <span>Total Reports</span>
                <strong>{reports.length}</strong>
              </div>
              <div>
                <span>Registered Users</span>
                <strong>{users.length}</strong>
              </div>
              <div>
                <span>High Risk Cases</span>
                <strong>{emergencyPatients.length}</strong>
              </div>
            </div>

            {loading ? (
              <p>Loading data...</p>
            ) : error ? (
              <p className="error-text">{error}</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>User</th>
                      <th>Diabetes</th>
                      <th>Hypertension</th>
                      <th>Heart Disease</th>
                      <th>Risk</th>
                      <th>BMI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr key={report.id}>
                        <td>{new Date(report.created_at).toLocaleDateString()}</td>
                        <td>
                          <div>{report.full_name}</div>
                          <div style={{ fontSize: '0.8em', color: '#666' }}>{report.email}</div>
                        </td>
                        <td>{report.diabetes_prediction}</td>
                        <td>{report.hypertension_prediction}</td>
                        <td>{report.heart_disease_prediction}</td>
                        <td>
                          <span className={`badge ${report.risk_level.toLowerCase()}`}>
                            {report.risk_level}
                          </span>
                        </td>
                        <td>{report.bmi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <h3>Registered Users</h3>
                <p>List of all users registered in the system.</p>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined Date</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.full_name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'high' : 'neutral'}`} style={{ textTransform: 'capitalize' }}>
                          {u.role}
                        </span>
                      </td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminPage;
