import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
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
  }, [authFetch]);

  const totalAssessments = useMemo(() => {
    return patients.reduce((sum, p) => sum + p.total_assessments, 0);
  }, [patients]);

  const riskData = useMemo(() => {
    const counts = { Low: 0, Moderate: 0, High: 0 };
    patients.forEach(p => {
      const level = p.latest_risk_level || "Low";
      if (counts[level] !== undefined) counts[level]++;
    });
    return [
      { name: 'Low Risk', value: counts.Low, color: '#2dd4bf' },
      { name: 'Moderate Risk', value: counts.Moderate, color: '#FFD700' },
      { name: 'High Risk', value: counts.High, color: '#FF4560' }
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
      { name: 'Diabetes', cases: dia, fill: '#0d9488' },
      { name: 'Hypertension', cases: htn, fill: '#FFD700' },
      { name: 'Heart Disease', cases: heart, fill: '#FF4560' }
    ];
  }, [patients]);

  const filteredPatients = patients.filter(p => {
    if (filterRisk === "all") return true;
    if (filterRisk === "High") return p.latest_risk_level === "High";
    return true;
  });

  const emergencyPatients = patients.filter(p => p.latest_risk_level === "High");

  return (
    <div className="page-container">
      <Navbar />

      <main className="page-inner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div className="animate-up">
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--db-accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>PLATFORM ADMINISTRATION</h2>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--db-text)', margin: 0, letterSpacing: '-0.02em' }}>Clinical Patient Directory</h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--db-muted)', fontSize: '15px' }}>Oversee patient metrics and synchronize clinical telemetry.</p>
          </div>
          <button onClick={fetchData} className="db-btn-secondary animate-up" style={{ animationDelay: '0.1s' }}>
            ↻ Refresh Analytics
          </button>
        </div>

        {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #f87171' }}>{error}</div>}
        {loading && <div style={{ marginBottom: '2rem', color: '#64748b' }}>Syncing patient data...</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          {[
            { title: "Total Patients", value: patients.length, color: "var(--db-accent)", delay: '0.1s' },
            { title: "Clinical Assessments", value: totalAssessments, color: "var(--db-emerald)", delay: '0.2s' },
            { title: "High Risk Alerts", value: emergencyPatients.length, color: "var(--db-crimson)", delay: '0.3s' },
            { title: "System Integrations", value: 12, color: "var(--db-accent)", delay: '0.4s' }
          ].map((kpi, idx) => (
            <div key={idx} className="db-card animate-db" style={{ animationDelay: kpi.delay, borderTop: `4px solid ${kpi.color}` }}>
              <div style={{ color: 'var(--db-muted)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{kpi.title}</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--db-text)' }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="layout animate-up" style={{ animationDelay: '0.5s', gridTemplateColumns: '1fr 1fr', display: 'grid', gap: '24px', marginBottom: '40px' }}>
          <div className="db-card">
            <h3 style={{ margin: '0 0 24px 0', color: 'var(--db-text)', fontSize: '18px', fontWeight: 800 }}>Risk Distribution</h3>
            {patients.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '32px 0' }}>No data available to chart.</p>
            ) : (
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={riskData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                      {riskData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="db-card">
            <h3 style={{ margin: '0 0 24px 0', color: 'var(--db-text)', fontSize: '18px', fontWeight: 800 }}>Diagnostic Ingestion Frequency</h3>
            {patients.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '32px 0' }}>No data available to chart.</p>
            ) : (
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conditionData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--db-muted)', fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--db-muted)', fontSize: 11 }} />
                    <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }} contentStyle={{ background: 'var(--db-card)', borderRadius: '12px', border: '1px solid var(--db-border)', boxShadow: '0 10px 15px -10px rgba(0,0,0,0.5)' }} />
                    <Bar dataKey="cases" radius={[4, 4, 0, 0]} maxBarSize={60}>
                      {conditionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="db-card animate-db" style={{ animationDelay: '0.6s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--db-text)', fontSize: '18px', fontWeight: 800 }}>Patient Directory</h3>
              <p style={{ margin: '4px 0 0 0', color: 'var(--db-muted)', fontSize: '14px' }}>Unified repository of registered clinical profiles.</p>
            </div>
            <div className="db-input-group" style={{ width: '220px', marginBottom: 0 }}>
              <select className="db-select" value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
                <option value="all">Global Risk View</option>
                <option value="High">Alert: High Risk Only</option>
              </select>
            </div>
          </div>

          <div className="table-wrap">
            <table className="db-table">
              <thead>
                <tr>
                  <th>Patient Identity</th>
                  <th>Registration Date</th>
                  <th>Clinical Density</th>
                  <th>Risk Stratification</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--db-text)' }}>{p.full_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--db-muted)' }}>{p.email}</div>
                    </td>
                    <td>{new Date(p.joined_at).toLocaleDateString()}</td>
                    <td>
                      <span className="db-badge" style={{ background: 'var(--db-bg)', color: 'var(--db-muted)' }}>
                        {p.total_assessments} Records
                      </span>
                    </td>
                    <td>
                      <span className={`db-badge db-badge-${p.latest_risk_level === 'High' ? 'crimson' : p.latest_risk_level === 'Moderate' ? 'amber' : 'green'}`}>
                        {p.latest_risk_level} Risk
                      </span>
                    </td>
                    <td>
                      <button className="db-btn-secondary" style={{ padding: '6px 16px', fontSize: '13px' }} onClick={() => setSelectedPatient(p)}>
                        ACCESS FILE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPatients.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                No patients found matching the selected filters.
              </div>
            )}
          </div>
        </div>

        {selectedPatient && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedPatient(null)}>
            <div className="db-card animate-db" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--db-border)', background: 'var(--db-card)' }}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--db-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--db-card)' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--db-text)' }}>{selectedPatient.full_name}</h2>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--db-muted)', fontSize: '14px' }}>{selectedPatient.email} • Clinical Activity Log</p>
                </div>
                <button onClick={() => setSelectedPatient(null)} style={{ background: 'transparent', border: 'none', fontSize: '24px', color: 'var(--db-muted)', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ padding: '32px', overflowY: 'auto', background: 'var(--db-bg)', flex: 1 }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: 'var(--db-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient Telemetry Timeline</h3>

                {selectedPatient.history.length === 0 ? (
                  <div className="bento-card" style={{ textAlign: 'center', color: '#94a3b8' }}>
                    No assessments have been recorded yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {selectedPatient.history.map((record, index) => (
                      <div key={index} className="bento-card" style={{ borderLeft: `6px solid ${record.type === 'diabetes' ? '#00D4FF' : record.type === 'heart' ? '#FF4560' : record.type === 'hypertension' ? '#FFD700' : '#8b5cf6'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <strong style={{ textTransform: 'capitalize', color: 'var(--db-text)', fontSize: '16px', fontWeight: 800 }}>
                            {record.type === 'cbc' ? 'CBC Analysis' : `${record.type} Screening`}
                          </strong>
                          <span style={{ color: 'var(--db-muted)', fontSize: '14px', fontWeight: 600 }}>{new Date(record.created_at).toLocaleString()}</span>
                        </div>

                        {record.type === 'diabetes' && (
                          <div style={{ background: 'var(--db-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--db-border)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '15px' }}>
                              <div>Prediction: <strong style={{ color: 'var(--db-text)' }}>{record.diabetes_prediction}</strong></div>
                              <div>Risk Level: <strong style={{ color: 'var(--db-text)' }}>{record.risk_level}</strong></div>
                              <div>BMI: <strong style={{color: 'var(--db-text)'}}>{record.bmi}</strong></div>
                            </div>
                            <details style={{ marginTop: '16px' }}>
                              <summary style={{ cursor: 'pointer', color: 'var(--db-accent)', fontWeight: 700, fontSize: '14px', outline: 'none', userSelect: 'none' }}>⬇ View Detailed Clinical Data</summary>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginTop: '16px', padding: '16px', background: 'var(--db-card)', border: '1px solid var(--db-border)', borderRadius: '12px' }}>
                                <div><div style={{ fontSize: '12px', color: 'var(--db-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Glucose</div><div style={{ fontWeight: 600, color: 'var(--db-text)', marginTop: '4px' }}>{record.glucose || 'N/A'} mg/dL</div></div>
                                <div><div style={{ fontSize: '12px', color: 'var(--db-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Blood Pressure</div><div style={{ fontWeight: 600, color: 'var(--db-text)', marginTop: '4px' }}>{record.blood_pressure || 'N/A'} mmHg</div></div>
                                <div><div style={{ fontSize: '12px', color: 'var(--db-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Insulin</div><div style={{ fontWeight: 600, color: 'var(--db-text)', marginTop: '4px' }}>{record.insulin || 'N/A'} U/mL</div></div>
                                <div><div style={{ fontSize: '12px', color: 'var(--db-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Skin Thickness</div><div style={{ fontWeight: 600, color: 'var(--db-text)', marginTop: '4px' }}>{record.skin_thickness || 'N/A'} mm</div></div>
                                <div><div style={{ fontSize: '12px', color: 'var(--db-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>DPF</div><div style={{ fontWeight: 600, color: 'var(--db-text)', marginTop: '4px' }}>{record.diabetes_pedigree_function || 'N/A'}</div></div>
                                <div><div style={{ fontSize: '12px', color: 'var(--db-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Age</div><div style={{ fontWeight: 600, color: 'var(--db-text)', marginTop: '4px' }}>{record.age || 'N/A'} yrs</div></div>
                              </div>
                            </details>
                          </div>
                        )}

                        {record.type === 'heart' && (
                          <div style={{ background: 'rgba(251, 113, 133, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(251, 113, 133, 0.15)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', color: 'var(--db-crimson)', fontSize: '15px' }}>
                              <div>Heart Disease Prediction: <strong>{record.heart_disease_prediction}</strong></div>
                            </div>
                            <details style={{ marginTop: '16px' }}>
                              <summary style={{ cursor: 'pointer', color: 'var(--db-crimson)', fontWeight: 700, fontSize: '14px', outline: 'none', userSelect: 'none' }}>⬇ View Detailed Clinical Data</summary>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginTop: '16px', padding: '16px', background: 'var(--db-card)', border: '1px solid rgba(251, 113, 133, 0.2)', borderRadius: '12px' }}>
                                <div><div style={{ fontSize: '12px', color: 'var(--db-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Age</div><div style={{ fontWeight: 600, color: 'var(--db-text)', marginTop: '4px' }}>{record.age || 'N/A'} yrs</div></div>
                                <div><div style={{ fontSize: '12px', color: 'var(--db-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Sex</div><div style={{ fontWeight: 600, color: 'var(--db-text)', marginTop: '4px' }}>{record.sex === 1 ? 'Male' : record.sex === 0 ? 'Female' : 'N/A'}</div></div>
                                <div><div style={{ fontSize: '12px', color: 'var(--db-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Chest Pain</div><div style={{ fontWeight: 600, color: 'var(--db-text)', marginTop: '4px' }}>Type {record.cp ?? 'N/A'}</div></div>
                                <div><div style={{ fontSize: '12px', color: 'var(--db-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Resting BP</div><div style={{ fontWeight: 600, color: 'var(--db-text)', marginTop: '4px' }}>{record.trestbps || 'N/A'} mmHg</div></div>
                                <div><div style={{ fontSize: '12px', color: 'var(--db-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Cholesterol</div><div style={{ fontWeight: 600, color: 'var(--db-text)', marginTop: '4px' }}>{record.chol || 'N/A'} mg/dL</div></div>
                                <div><div style={{ fontSize: '12px', color: 'var(--db-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Max Heart Rate</div><div style={{ fontWeight: 600, color: 'var(--db-text)', marginTop: '4px' }}>{record.thalach || 'N/A'} bpm</div></div>
                              </div>
                            </details>
                          </div>
                        )}

                        {record.type === 'hypertension' && (
                          <div style={{ background: 'rgba(139, 92, 246, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', color: '#a78bfa', fontSize: '15px' }}>
                              <div>Hypertension Prediction: <strong>{record.hypertension_prediction}</strong></div>
                            </div>
                            <details style={{ marginTop: '16px' }}>
                              <summary style={{ cursor: 'pointer', color: '#a78bfa', fontWeight: 700, fontSize: '14px', outline: 'none', userSelect: 'none' }}>⬇ View Detailed Clinical Data</summary>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginTop: '16px', padding: '16px', background: 'var(--db-card)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '12px' }}>
                                <div><div style={{ fontSize: '12px', color: 'var(--db-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Age</div><div style={{ fontWeight: 600, color: 'var(--db-text)', marginTop: '4px' }}>{record.age || 'N/A'} yrs</div></div>
                                <div><div style={{ fontSize: '12px', color: 'var(--db-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Sex</div><div style={{ fontWeight: 600, color: 'var(--db-text)', marginTop: '4px' }}>{record.sex === 1 ? 'Male' : record.sex === 0 ? 'Female' : 'N/A'}</div></div>
                                <div><div style={{ fontSize: '12px', color: 'var(--db-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>BMI</div><div style={{ fontWeight: 600, color: 'var(--db-text)', marginTop: '4px' }}>{record.bmi || 'N/A'}</div></div>
                                <div><div style={{ fontSize: '12px', color: 'var(--db-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Heart Rate</div><div style={{ fontWeight: 600, color: 'var(--db-text)', marginTop: '4px' }}>{record.heart_rate || 'N/A'} bpm</div></div>
                                <div><div style={{ fontSize: '12px', color: 'var(--db-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Active Level</div><div style={{ fontWeight: 600, color: 'var(--db-text)', marginTop: '4px' }}>Level {record.activity_level ?? 'N/A'}</div></div>
                                <div><div style={{ fontSize: '12px', color: 'var(--db-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Smoker</div><div style={{ fontWeight: 600, color: 'var(--db-text)', marginTop: '4px' }}>{record.smoker === 1 ? 'Yes' : record.smoker === 0 ? 'No' : 'N/A'}</div></div>
                                <div><div style={{ fontSize: '12px', color: 'var(--db-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Family History</div><div style={{ fontWeight: 600, color: 'var(--db-text)', marginTop: '4px' }}>{record.family_history === 1 ? 'Yes' : record.family_history === 0 ? 'No' : 'N/A'}</div></div>
                              </div>
                            </details>
                          </div>
                        )}

                        {record.type === 'cbc' && (
                          <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', color: 'var(--db-emerald)', fontSize: '15px' }}>
                              <div><strong>CBC Complete Blood Count Results Available</strong></div>
                              {record.interpretation && record.interpretation.summary && (
                                <div style={{ fontStyle: 'italic', fontSize: '14px', lineHeight: 1.5, color: 'var(--db-muted)' }}>"{record.interpretation.summary}"</div>
                              )}
                            </div>
                            {record.cbc && Object.keys(record.cbc).length > 0 && (
                              <details style={{ marginTop: '16px' }}>
                                <summary style={{ cursor: 'pointer', color: 'var(--db-emerald)', fontWeight: 700, fontSize: '14px', outline: 'none', userSelect: 'none' }}>⬇ View Detailed Clinical Data</summary>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginTop: '16px', padding: '16px', background: 'var(--db-card)', border: '1px solid var(--db-emerald)', borderRadius: '12px' }}>
                                  {Object.entries(record.cbc).map(([key, data]) => (
                                    <div key={key}>
                                      <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--db-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{data.label}</h4>
                                      <div style={{ fontSize: '15px', fontWeight: 700, color: data.status === 'Low' || data.status === 'High' ? 'var(--db-crimson)' : 'var(--db-text)' }}>
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

               <div style={{ padding: '24px 32px', borderTop: '1px solid var(--db-border)', background: 'var(--db-card)', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="db-btn-secondary" onClick={() => setSelectedPatient(null)}>CLOSE FILE</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminPage;
