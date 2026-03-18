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
      { name: 'Low Risk', value: counts.Low, color: '#00D4FF' },
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
      { name: 'Diabetes', cases: dia, fill: '#00D4FF' },
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
            <span className="feature-pill">CLINICAL DIRECTORY</span>
            <h1 className="page-title">Dashboard Overview</h1>
            <p className="page-desc">Monitor your patients' clinical assessments and real-time risk factors.</p>
          </div>
          <button onClick={fetchData} className="btn-primary animate-up" style={{ animationDelay: '0.1s' }}>
            ↻ Refresh Data
          </button>
        </div>

        {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #f87171' }}>{error}</div>}
        {loading && <div style={{ marginBottom: '2rem', color: '#64748b' }}>Syncing patient data...</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          {[
            { title: "Total Patients", value: patients.length, color: "#00D4FF", delay: '0.1s' },
            { title: "Clinical Assessments", value: totalAssessments, color: "#FFD700", delay: '0.2s' },
            { title: "High Risk Alerts", value: emergencyPatients.length, color: "#FF4560", delay: '0.3s' },
            { title: "Critical Interventions", value: emergencyPatients.length > 0 ? emergencyPatients.length : 0, color: "#FF4560", delay: '0.4s' }
          ].map((kpi, idx) => (
            <div key={idx} className="bento-card animate-up" style={{ animationDelay: kpi.delay, borderTop: `4px solid ${kpi.color}` }}>
              <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{kpi.title}</div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a' }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="layout animate-up" style={{ animationDelay: '0.5s' }}>
          <div className="bento-card">
            <h3 style={{ margin: '0 0 24px 0', color: '#0f172a', fontSize: '20px', fontWeight: 800 }}>Patient Risk Distribution</h3>
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

          <div className="bento-card">
            <h3 style={{ margin: '0 0 24px 0', color: '#0f172a', fontSize: '20px', fontWeight: 800 }}>Condition Frequency</h3>
            {patients.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '32px 0' }}>No data available to chart.</p>
            ) : (
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conditionData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="cases" radius={[4, 4, 0, 0]} maxBarSize={60}>
                      {conditionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="bento-card animate-up" style={{ animationDelay: '0.6s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '20px', fontWeight: 800 }}>Patient Directory</h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '15px' }}>Comprehensive database of registered patients.</p>
            </div>
            <div className="field-light" style={{ width: '200px' }}>
              <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
                <option value="all">View All Risk Levels</option>
                <option value="High">High Risk Only</option>
              </select>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table-light">
              <thead>
                <tr>
                  <th>Patient Info</th>
                  <th>Joined On</th>
                  <th>Assessments</th>
                  <th>Latest Risk</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.full_name}</div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>{p.email}</div>
                    </td>
                    <td>{new Date(p.joined_at).toLocaleDateString()}</td>
                    <td>
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '999px', fontSize: '13px', fontWeight: 600 }}>
                        {p.total_assessments} Records
                      </span>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 12px', borderRadius: '999px', fontSize: '13px', fontWeight: 600,
                        background: p.latest_risk_level === 'High' ? '#fecdd3' : p.latest_risk_level === 'Moderate' ? '#fef3c7' : '#d1fae5',
                        color: p.latest_risk_level === 'High' ? '#be123c' : p.latest_risk_level === 'Moderate' ? '#b45309' : '#047857'
                      }}>
                        {p.latest_risk_level} Risk
                      </span>
                    </td>
                    <td>
                      <button className="btn-secondary-light" onClick={() => setSelectedPatient(p)}>
                        View History
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
          <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
            <div className="bento-card animate-up" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{selectedPatient.full_name}</h2>
                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '15px' }}>{selectedPatient.email} • {selectedPatient.total_assessments} Total clinical assessments</p>
                </div>
                <button onClick={() => setSelectedPatient(null)} style={{ background: 'transparent', border: 'none', fontSize: '24px', color: '#64748b', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ padding: '32px', overflowY: 'auto', background: '#f1f5f9', flex: 1 }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Comprehensive Medical Timeline</h3>

                {selectedPatient.history.length === 0 ? (
                  <div className="bento-card" style={{ textAlign: 'center', color: '#94a3b8' }}>
                    No assessments have been recorded yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {selectedPatient.history.map((record, index) => (
                      <div key={index} className="bento-card" style={{ borderLeft: `6px solid ${record.type === 'diabetes' ? '#00D4FF' : record.type === 'heart' ? '#FF4560' : record.type === 'hypertension' ? '#FFD700' : '#8b5cf6'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <strong style={{ textTransform: 'capitalize', color: '#0f172a', fontSize: '16px', fontWeight: 800 }}>
                            {record.type === 'cbc' ? 'CBC Analysis' : `${record.type} Screening`}
                          </strong>
                          <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>{new Date(record.created_at).toLocaleString()}</span>
                        </div>

                        {record.type === 'diabetes' && (
                          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '15px' }}>
                              <div>Prediction: <strong style={{ color: '#0f172a' }}>{record.diabetes_prediction}</strong></div>
                              <div>Risk Level: <strong style={{ color: '#0f172a' }}>{record.risk_level}</strong></div>
                              <div>BMI: <strong>{record.bmi}</strong></div>
                            </div>
                            <details style={{ marginTop: '16px' }}>
                              <summary style={{ cursor: 'pointer', color: '#2563eb', fontWeight: 700, fontSize: '14px', outline: 'none', userSelect: 'none' }}>⬇ View Detailed Clinical Data</summary>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginTop: '16px', padding: '16px', background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px' }}>
                                <div><div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Glucose</div><div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{record.glucose || 'N/A'} mg/dL</div></div>
                                <div><div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Blood Pressure</div><div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{record.blood_pressure || 'N/A'} mmHg</div></div>
                                <div><div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Insulin</div><div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{record.insulin || 'N/A'} U/mL</div></div>
                                <div><div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Skin Thickness</div><div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{record.skin_thickness || 'N/A'} mm</div></div>
                                <div><div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>DPF</div><div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{record.diabetes_pedigree_function || 'N/A'}</div></div>
                                <div><div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Age</div><div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{record.age || 'N/A'} yrs</div></div>
                              </div>
                            </details>
                          </div>
                        )}

                        {record.type === 'heart' && (
                          <div style={{ background: '#fff1f2', padding: '16px', borderRadius: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', color: '#be123c', fontSize: '15px' }}>
                              <div>Heart Disease Prediction: <strong>{record.heart_disease_prediction}</strong></div>
                            </div>
                            <details style={{ marginTop: '16px' }}>
                              <summary style={{ cursor: 'pointer', color: '#e11d48', fontWeight: 700, fontSize: '14px', outline: 'none', userSelect: 'none' }}>⬇ View Detailed Clinical Data</summary>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginTop: '16px', padding: '16px', background: 'white', border: '1px solid #fecdd3', borderRadius: '12px' }}>
                                <div><div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Age</div><div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{record.age || 'N/A'} yrs</div></div>
                                <div><div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Sex</div><div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{record.sex === 1 ? 'Male' : record.sex === 0 ? 'Female' : 'N/A'}</div></div>
                                <div><div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Chest Pain</div><div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>Type {record.cp ?? 'N/A'}</div></div>
                                <div><div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Resting BP</div><div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{record.trestbps || 'N/A'} mmHg</div></div>
                                <div><div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Cholesterol</div><div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{record.chol || 'N/A'} mg/dL</div></div>
                                <div><div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Max Heart Rate</div><div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{record.thalach || 'N/A'} bpm</div></div>
                              </div>
                            </details>
                          </div>
                        )}

                        {record.type === 'hypertension' && (
                          <div style={{ background: '#f5f3ff', padding: '16px', borderRadius: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', color: '#6d28d9', fontSize: '15px' }}>
                              <div>Hypertension Prediction: <strong>{record.hypertension_prediction}</strong></div>
                            </div>
                            <details style={{ marginTop: '16px' }}>
                              <summary style={{ cursor: 'pointer', color: '#7c3aed', fontWeight: 700, fontSize: '14px', outline: 'none', userSelect: 'none' }}>⬇ View Detailed Clinical Data</summary>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginTop: '16px', padding: '16px', background: 'white', border: '1px solid #ddd6fe', borderRadius: '12px' }}>
                                <div><div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Age</div><div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{record.age || 'N/A'} yrs</div></div>
                                <div><div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Sex</div><div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{record.sex === 1 ? 'Male' : record.sex === 0 ? 'Female' : 'N/A'}</div></div>
                                <div><div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>BMI</div><div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{record.bmi || 'N/A'}</div></div>
                                <div><div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Heart Rate</div><div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{record.heart_rate || 'N/A'} bpm</div></div>
                                <div><div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Active Level</div><div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>Level {record.activity_level ?? 'N/A'}</div></div>
                                <div><div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Smoker</div><div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{record.smoker === 1 ? 'Yes' : record.smoker === 0 ? 'No' : 'N/A'}</div></div>
                                <div><div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Family History</div><div style={{ fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{record.family_history === 1 ? 'Yes' : record.family_history === 0 ? 'No' : 'N/A'}</div></div>
                              </div>
                            </details>
                          </div>
                        )}

                        {record.type === 'cbc' && (
                          <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', color: '#047857', fontSize: '15px' }}>
                              <div><strong>CBC Complete Blood Count Results Available</strong></div>
                              {record.interpretation && record.interpretation.summary && (
                                <div style={{ fontStyle: 'italic', fontSize: '14px', lineHeight: 1.5 }}>"{record.interpretation.summary}"</div>
                              )}
                            </div>
                            {record.cbc && Object.keys(record.cbc).length > 0 && (
                              <details style={{ marginTop: '16px' }}>
                                <summary style={{ cursor: 'pointer', color: '#059669', fontWeight: 700, fontSize: '14px', outline: 'none', userSelect: 'none' }}>⬇ View Detailed Clinical Data</summary>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginTop: '16px', padding: '16px', background: 'white', border: '1px solid #10b981', borderRadius: '12px' }}>
                                  {Object.entries(record.cbc).map(([key, data]) => (
                                    <div key={key}>
                                      <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{data.label}</h4>
                                      <div style={{ fontSize: '15px', fontWeight: 700, color: data.status === 'Low' || data.status === 'High' ? '#e11d48' : '#0f172a' }}>
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

              <div style={{ padding: '24px 32px', borderTop: '1px solid rgba(0,0,0,0.08)', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-secondary-light" onClick={() => setSelectedPatient(null)}>Close File</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminPage;
