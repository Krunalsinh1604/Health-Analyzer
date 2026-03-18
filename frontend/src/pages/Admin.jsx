import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

function AdminPage() {
  const { user, authFetch, logout } = useAuth();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");

  // Modal state
  const [selectedPatient, setSelectedPatient] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch("/reports/admin");
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
      } else {
        setError("Failed to fetch clinical patient data.");
      }
    } catch (err) {
      setError(err.message || "An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // -------------------------
  // Data Processing for Charts
  // -------------------------
  const totalAssessments = useMemo(() => {
    return patients.reduce((sum, p) => sum + p.total_assessments, 0);
  }, [patients]);

  const riskData = useMemo(() => {
    const counts = { Low: 0, Moderate: 0, High: 0 };
    patients.forEach(p => {
      const level = p.latest_risk_level || "Low";
      if (counts[level] !== undefined) {
        counts[level]++;
      }
    });

    return [
      { name: 'Low Risk', value: counts.Low, color: '#10b981' },
      { name: 'Moderate Risk', value: counts.Moderate, color: '#f59e0b' },
      { name: 'High Risk', value: counts.High, color: '#ef4444' }
    ].filter(d => d.value > 0);
  }, [patients]);

  const conditionData = useMemo(() => {
    let dia = 0, htn = 0, heart = 0;
    patients.forEach(p => {
      if (p.has_diabetes) dia++;
      if (p.has_hypertension) htn++;
      if (p.has_heart) heart++;
    });
    return [
      { name: 'Diabetes', cases: dia, fill: '#3b82f6' },
      { name: 'Hypertension', cases: htn, fill: '#8b5cf6' },
      { name: 'Heart Disease', cases: heart, fill: '#f43f5e' }
    ];
  }, [patients]);


  // -------------------------
  // Table Filters
  // -------------------------
  const filteredPatients = patients.filter(p => {
    if (filterRisk === "all") return true;
    if (filterRisk === "High") return p.latest_risk_level === "High";
    return true;
  });

  const emergencyPatients = patients.filter(p => p.latest_risk_level === "High");

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>

      {/* ----------------- TOP NAVBAR ----------------- */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2.5rem', background: '#0f172a', color: 'white', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.5px' }}>⚕️ HealthAnalyzer <span style={{ fontWeight: 300, opacity: 0.8 }}>|</span> <span style={{ color: '#bae6fd' }}>Clinical Portal</span></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
            Welcome, <strong style={{ color: 'white' }}>Dr. {user?.full_name || 'Admin'}</strong>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
          >
            Log Out
          </button>
        </div>
      </header>

      <main style={{ padding: '2.5rem', maxWidth: '1600px', margin: '0 auto' }}>

        {/* ----------------- HEADERS & ACTIONS ----------------- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.25rem', color: '#0f172a', fontWeight: '800', letterSpacing: '-1px' }}>Dashboard Overview</h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '1.1rem' }}>Monitor your patients' clinical assessments and real-time risk factors.</p>
          </div>
          <button
            onClick={fetchData}
            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 6px -1px rgb(59 130 246 / 0.3)' }}
          >
            ↻ Refresh Data
          </button>
        </div>

        {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #f87171' }}>{error}</div>}
        {loading && <div style={{ marginBottom: '2rem', color: '#64748b' }}>Syncing patient data...</div>}

        {/* ----------------- KPI CARDS ----------------- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {[
            { title: "Total Patients", value: patients.length, color: "#3b82f6", bg: "#eff6ff" },
            { title: "Clinical Assessments", value: totalAssessments, color: "#8b5cf6", bg: "#f5f3ff" },
            { title: "High Risk Alerts", value: emergencyPatients.length, color: "#ef4444", bg: "#fef2f2" },
            { title: "Critical Interventions", value: emergencyPatients.length > 0 ? emergencyPatients.length : 0, color: "#f59e0b", bg: "#fffbeb" }
          ].map((kpi, idx) => (
            <div key={idx} style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', borderTop: `4px solid ${kpi.color}` }}>
              <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>{kpi.title}</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a' }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* ----------------- CHARTS GRID ----------------- */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', marginBottom: '2.5rem' }}>

          {/* Pie Chart: Risk Distribution */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>Patient Risk Distribution</h3>
            {patients.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>No data available to chart.</p>
            ) : (
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%" cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Bar Chart: Positive Predictions */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>Condition Frequency (Any Positive Assessment)</h3>
            {patients.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>No data available to chart.</p>
            ) : (
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conditionData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="cases" radius={[4, 4, 0, 0]} maxBarSize={60}>
                      {conditionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* ----------------- PATIENT DIRECTORY TABLE ----------------- */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem' }}>Patient Directory</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Comprehensive database of registered patients.</p>
            </div>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 500, color: '#334155', outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">View All Risk Levels</option>
              <option value="High">High Risk Only</option>
            </select>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 600, borderBottom: '2px solid #e2e8f0' }}>Patient Info</th>
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 600, borderBottom: '2px solid #e2e8f0' }}>Joined On</th>
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 600, borderBottom: '2px solid #e2e8f0' }}>Assessments</th>
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 600, borderBottom: '2px solid #e2e8f0' }}>Latest Risk</th>
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 600, borderBottom: '2px solid #e2e8f0' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.full_name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{p.email}</div>
                    </td>
                    <td style={{ padding: '1rem', color: '#475569' }}>{new Date(p.joined_at).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ background: '#e2e8f0', color: '#475569', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600 }}>
                        {p.total_assessments} Records
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        background: p.latest_risk_level === 'High' ? '#fecdd3' : p.latest_risk_level === 'Moderate' ? '#fef3c7' : '#d1fae5',
                        color: p.latest_risk_level === 'High' ? '#be123c' : p.latest_risk_level === 'Moderate' ? '#b45309' : '#047857'
                      }}>
                        {p.latest_risk_level} Risk
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#334155' }}>
                      <button
                        onClick={() => setSelectedPatient(p)}
                        style={{ background: 'white', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, color: '#0f172a', transition: 'all 0.2s' }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                      >
                        View Full History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPatients.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
                No patients found matching the selected filters.
              </div>
            )}
          </div>
        </div>

        {/* ----------------- PATIENT DETAILS MODAL ----------------- */}
        {selectedPatient && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
            <div style={{ background: 'white', width: '100%', maxWidth: '900px', maxHeight: '90vh', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' }}>

              <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#0f172a' }}>{selectedPatient.full_name}</h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>{selectedPatient.email} • {selectedPatient.total_assessments} Total clinical assessments</p>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: '2rem', overflowY: 'auto', background: '#f1f5f9', flex: 1 }}>
                <h3 style={{ margin: '0 0 1.5rem 0', color: '#334155' }}>Comprehensive Medical Timeline</h3>

                {selectedPatient.history.length === 0 ? (
                  <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', textAlign: 'center', color: '#94a3b8' }}>
                    No assessments have been recorded yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {selectedPatient.history.map((record, index) => (
                      <div key={index} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', borderLeft: `4px solid ${record.type === 'diabetes' ? '#3b82f6' : record.type === 'heart' ? '#f43f5e' : record.type === 'hypertension' ? '#8b5cf6' : '#10b981'}` }}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <strong style={{ textTransform: 'capitalize', color: '#0f172a', fontSize: '1.1rem' }}>
                            {record.type === 'cbc' ? 'CBC Analysis' : `${record.type} Screening`}
                          </strong>
                          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{new Date(record.created_at).toLocaleString()}</span>
                        </div>

                        {record.type === 'diabetes' && (
                          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                              <div>Prediction: <strong>{record.diabetes_prediction}</strong></div>
                              <div>Risk Level: <strong>{record.risk_level}</strong></div>
                              <div>BMI: {record.bmi}</div>
                            </div>
                            <details style={{ marginTop: '1rem' }}>
                              <summary style={{ cursor: 'pointer', color: '#3b82f6', fontWeight: 600, fontSize: '0.9rem', outline: 'none', userSelect: 'none' }}>⬇ View Detailed Clinical Data</summary>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginTop: '1rem', padding: '1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                <div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>Glucose</div><div style={{ fontWeight: 600, color: '#0f172a' }}>{record.glucose || 'N/A'} mg/dL</div></div>
                                <div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>Blood Pressure</div><div style={{ fontWeight: 600, color: '#0f172a' }}>{record.blood_pressure || 'N/A'} mmHg</div></div>
                                <div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>Insulin</div><div style={{ fontWeight: 600, color: '#0f172a' }}>{record.insulin || 'N/A'} U/mL</div></div>
                                <div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>Skin Thickness</div><div style={{ fontWeight: 600, color: '#0f172a' }}>{record.skin_thickness || 'N/A'} mm</div></div>
                                <div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>DPF</div><div style={{ fontWeight: 600, color: '#0f172a' }}>{record.diabetes_pedigree_function || 'N/A'}</div></div>
                                <div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>Age</div><div style={{ fontWeight: 600, color: '#0f172a' }}>{record.age || 'N/A'} yrs</div></div>
                              </div>
                            </details>
                          </div>
                        )}

                        {record.type === 'heart' && (
                          <div style={{ background: '#fff1f2', padding: '1rem', borderRadius: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', color: '#9f1239' }}>
                              <div>Heart Disease Prediction: <strong>{record.heart_disease_prediction}</strong></div>
                            </div>
                            <details style={{ marginTop: '1rem' }}>
                              <summary style={{ cursor: 'pointer', color: '#e11d48', fontWeight: 600, fontSize: '0.9rem', outline: 'none', userSelect: 'none' }}>⬇ View Detailed Clinical Data</summary>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginTop: '1rem', padding: '1rem', background: 'white', border: '1px solid #fecdd3', borderRadius: '8px' }}>
                                <div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Age</div><div style={{ fontWeight: 600, color: '#0f172a' }}>{record.age || 'N/A'} yrs</div></div>
                                <div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Sex</div><div style={{ fontWeight: 600, color: '#0f172a' }}>{record.sex === 1 ? 'Male' : record.sex === 0 ? 'Female' : 'N/A'}</div></div>
                                <div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Chest Pain</div><div style={{ fontWeight: 600, color: '#0f172a' }}>Type {record.cp ?? 'N/A'}</div></div>
                                <div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Resting BP</div><div style={{ fontWeight: 600, color: '#0f172a' }}>{record.trestbps || 'N/A'} mmHg</div></div>
                                <div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Cholesterol</div><div style={{ fontWeight: 600, color: '#0f172a' }}>{record.chol || 'N/A'} mg/dL</div></div>
                                <div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Max Heart Rate</div><div style={{ fontWeight: 600, color: '#0f172a' }}>{record.thalach || 'N/A'} bpm</div></div>
                              </div>
                            </details>
                          </div>
                        )}

                        {record.type === 'hypertension' && (
                          <div style={{ background: '#f5f3ff', padding: '1rem', borderRadius: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', color: '#5b21b6' }}>
                              <div>Hypertension Prediction: <strong>{record.hypertension_prediction}</strong></div>
                            </div>
                            <details style={{ marginTop: '1rem' }}>
                              <summary style={{ cursor: 'pointer', color: '#7c3aed', fontWeight: 600, fontSize: '0.9rem', outline: 'none', userSelect: 'none' }}>⬇ View Detailed Clinical Data</summary>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginTop: '1rem', padding: '1rem', background: 'white', border: '1px solid #ddd6fe', borderRadius: '8px' }}>
                                <div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Age</div><div style={{ fontWeight: 600, color: '#0f172a' }}>{record.age || 'N/A'} yrs</div></div>
                                <div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Sex</div><div style={{ fontWeight: 600, color: '#0f172a' }}>{record.sex === 1 ? 'Male' : record.sex === 0 ? 'Female' : 'N/A'}</div></div>
                                <div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>BMI</div><div style={{ fontWeight: 600, color: '#0f172a' }}>{record.bmi || 'N/A'}</div></div>
                                <div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Heart Rate</div><div style={{ fontWeight: 600, color: '#0f172a' }}>{record.heart_rate || 'N/A'} bpm</div></div>
                                <div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Active Level</div><div style={{ fontWeight: 600, color: '#0f172a' }}>Level {record.activity_level ?? 'N/A'}</div></div>
                                <div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Smoker</div><div style={{ fontWeight: 600, color: '#0f172a' }}>{record.smoker === 1 ? 'Yes' : record.smoker === 0 ? 'No' : 'N/A'}</div></div>
                                <div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Family History</div><div style={{ fontWeight: 600, color: '#0f172a' }}>{record.family_history === 1 ? 'Yes' : record.family_history === 0 ? 'No' : 'N/A'}</div></div>
                              </div>
                            </details>
                          </div>
                        )}

                        {record.type === 'cbc' && (
                          <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', color: '#065f46' }}>
                              <div><strong>CBC Complete Blood Count Results Available</strong></div>
                              {record.interpretation && record.interpretation.summary && (
                                <div style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>"{record.interpretation.summary}"</div>
                              )}
                            </div>
                            {record.cbc && Object.keys(record.cbc).length > 0 && (
                              <details style={{ marginTop: '1rem' }}>
                                <summary style={{ cursor: 'pointer', color: '#10b981', fontWeight: 600, fontSize: '0.9rem', outline: 'none', userSelect: 'none' }}>⬇ View Detailed Clinical Data</summary>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginTop: '1rem', padding: '1rem', background: 'white', border: '1px solid #a7f3d0', borderRadius: '8px' }}>
                                  {Object.entries(record.cbc).map(([key, data]) => (
                                    <div key={key}>
                                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{key}</div>
                                      <div style={{ fontWeight: 600, color: data.status === 'Low' || data.status === 'High' ? '#ef4444' : '#0f172a' }}>
                                        {data.value !== null && data.value !== undefined ? data.value : 'N/A'} {data.unit || ''}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ padding: '1rem 2rem', borderTop: '1px solid #e2e8f0', background: 'white', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setSelectedPatient(null)}
                  style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Close File
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default AdminPage;
