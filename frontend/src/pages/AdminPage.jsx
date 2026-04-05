import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useNotification } from "../context/NotificationContext";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { 
  Activity, 
  Users, 
  AlertTriangle, 
  Settings, 
  RefreshCw, 
  Search, 
  ChevronRight, 
  X,
  FileText,
  CheckCircle,
  Clock,
  Heart,
  Droplets,
  Zap,
  Activity as ActivityIcon
} from "lucide-react";
import "./admin.css";

function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { showNotification } = useNotification();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/reports/admin");
      setPatients(response.data.patients || []);
      showNotification("Clinical diagnostics synchronized", "success");
    } catch (err) {
      console.error("ADMIN FETCH ERROR:", err);
      const msg = err?.response?.data?.detail || "Failed to fetch clinical patient data.";
      setError(msg);
      showNotification(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      { name: 'Moderate Risk', value: counts.Moderate, color: '#f59e0b' },
      { name: 'High Risk', value: counts.High, color: '#ef4444' }
    ].filter(d => d.value > 0);
  }, [patients]);

  const conditionData = useMemo(() => {
    let dia = 0, htn = 0, heart = 0, cbc = 0;
    patients.forEach(p => {
      if (p.has_diabetes) dia++;
      if (p.has_hypertension) htn++;
      if (p.has_heart) heart++;
      if (p.has_cbc) cbc++;
    });
    return [
      { name: 'Diabetes', cases: dia, fill: '#4da6ff' },
      { name: 'Hypertension', cases: htn, fill: '#f59e0b' },
      { name: 'Heart Disease', cases: heart, fill: '#ef4444' },
      { name: 'CBC Analysis', cases: cbc, fill: '#10b981' }
    ];
  }, [patients]);

  const filteredPatients = patients.filter(p => {
    if (filterRisk === "all") return true;
    if (filterRisk === "High") return p.latest_risk_level === "High";
    return true;
  });

  const emergencyPatients = patients.filter(p => p.latest_risk_level === "High");

  return (
    <div className="page-inner">
      <header className="admin-header animate-up">
        <div className="header-title-group">
          <h1>Clinical Patient Directory</h1>
        </div>
        <button onClick={fetchData} className="btn btn-secondary">
          <RefreshCw size={16} style={{ marginRight: 8 }} />
          Refresh Analytics
        </button>
      </header>

        {error && <div className="card" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #f87171', marginBottom: 32 }}>{error}</div>}
        {loading && <div style={{ marginBottom: 32, color: 'var(--muted)', fontWeight: 600 }}>Syncing patient data...</div>}

        <div className="grid grid-cols-4 mb-40">
          {[
            { title: "Total Patients", value: patients.length, icon: <Users size={20} />, delay: '0.1s', color: 'var(--primary)' },
            { title: "Clinical Assessments", value: totalAssessments, icon: <Activity size={20} />, delay: '0.2s', color: 'var(--success)' },
            { title: "High Risk Alerts", value: emergencyPatients.length, icon: <AlertTriangle size={20} />, delay: '0.3s', color: 'var(--danger)' },
            { title: "System Integrations", value: 12, icon: <Settings size={20} />, delay: '0.4s', color: 'var(--primary)' }
          ].map((kpi, idx) => (
            <div key={idx} className="card kpi-card animate-up" style={{ animationDelay: kpi.delay, borderTopColor: kpi.color }}>
              <div className="kpi-label">{kpi.title}</div>
              <div className="kpi-value">{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 mb-40 animate-up" style={{ animationDelay: '0.5s' }}>
          <div className="card">
            <h3 className="chart-title">Risk Distribution</h3>
            {patients.length === 0 ? (
              <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '48px 0' }}>No data available to chart.</p>
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={riskData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                      {riskData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)', padding: '12px' }} 
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="chart-title">Diagnostic Ingestion Frequency</h3>
            {patients.length === 0 ? (
              <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '48px 0' }}>No data available to chart.</p>
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conditionData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }} />
                    <Bar dataKey="cases" radius={[6, 6, 0, 0]} maxBarSize={50}>
                      {conditionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="card animate-up" style={{ animationDelay: '0.6s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h3 className="chart-title" style={{ marginBottom: 4 }}>Patient Directory</h3>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>Unified repository of registered clinical profiles.</p>
            </div>
            <div style={{ position: 'relative' }}>
              <select className="btn btn-secondary" style={{ paddingRight: 40, appearance: 'none', width: 220, textAlign: 'left' }} value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
                <option value="all">Global Risk View</option>
                <option value="High">Alert: High Risk Only</option>
              </select>
              <ChevronRight size={16} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none', color: 'var(--muted)' }} />
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
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
                      <div className="patient-identity">
                        <span className="patient-name">{p.full_name}</span>
                        <span className="patient-email">{p.email}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 14 }}>{new Date(p.joined_at).toLocaleDateString()}</td>
                    <td>
                      <span className="badge badge-muted">
                        {p.total_assessments} Records
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${p.latest_risk_level?.toLowerCase() || 'low'}`}>
                        {p.latest_risk_level || 'Low'} Risk
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: 13 }} onClick={() => setSelectedPatient(p)}>
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPatients.length === 0 && (
              <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--muted)' }}>
                <Search size={48} style={{ marginBottom: 16, opacity: 0.2 }} />
                <p>No patients found matching the selected filters.</p>
              </div>
            )}
          </div>
        </div>

        {selectedPatient && (
          <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{selectedPatient.full_name}</h2>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--muted)', fontSize: 14 }}>{selectedPatient.email} • Clinical Activity Log</p>
                </div>
                <button className="close-btn" onClick={() => setSelectedPatient(null)}><X size={24} /></button>
              </div>

              <div className="modal-body">
                <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                  <Clock size={16} style={{ marginRight: 8, color: 'var(--primary)' }} />
                  Clinical Telemetry Timeline
                </h3>

                {selectedPatient.history.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', background: '#f8fafc' }}>
                    <FileText size={40} style={{ marginBottom: 16, opacity: 0.2 }} />
                    <p>No assessments have been recorded yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {selectedPatient.history.map((record, index) => (
                      <div key={index} className="timeline-item" style={{ borderLeftColor: record.type === 'diabetes' ? 'var(--primary)' : record.type === 'heart' ? 'var(--danger)' : record.type === 'hypertension' ? 'var(--warning)' : '#8b5cf6' }}>
                        <div className="timeline-header">
                          <strong style={{ textTransform: 'capitalize', fontSize: 16, fontWeight: 800 }}>
                            {record.type === 'cbc' ? 'CBC Analysis' : `${record.type} Screening`}
                          </strong>
                          <span style={{ color: 'var(--muted)', fontSize: 14 }}>{new Date(record.created_at).toLocaleString()}</span>
                        </div>

                        {record.type === 'diabetes' && (
                          <div style={{ background: '#f0f9ff', padding: 16, borderRadius: 12, border: '1px solid #bae6fd' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 15, marginBottom: 16 }}>
                              <div>Prediction: <strong>{record.diabetes_prediction}</strong></div>
                              <div>Risk Level: <strong>{record.risk_level}</strong></div>
                            </div>
                            <details>
                              <summary style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, fontSize: 14, outline: 'none' }}>View Detailed Parameters</summary>
                              <div className="clinical-data-grid" style={{ marginTop: 12 }}>
                                <div><div className="data-item-label">Glucose</div><div className="data-item-value">{record.glucose || 'N/A'} mg/dL</div></div>
                                <div><div className="data-item-label">BP</div><div className="data-item-value">{record.blood_pressure || 'N/A'} mmHg</div></div>
                                <div><div className="data-item-label">Insulin</div><div className="data-item-value">{record.insulin || 'N/A'} U/mL</div></div>
                                <div><div className="data-item-label">BMI</div><div className="data-item-value">{record.bmi || 'N/A'}</div></div>
                              </div>
                            </details>
                          </div>
                        )}

                        {record.type === 'heart' && (
                          <div style={{ background: '#fff1f2', padding: 16, borderRadius: 12, border: '1px solid #fecdd3' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, color: 'var(--danger)', fontSize: 15, marginBottom: 16 }}>
                              <div>Heart Disease Prediction: <strong>{record.heart_disease_prediction}</strong></div>
                            </div>
                            <details>
                              <summary style={{ cursor: 'pointer', color: 'var(--danger)', fontWeight: 700, fontSize: 14, outline: 'none' }}>View Detailed Parameters</summary>
                              <div className="clinical-data-grid" style={{ marginTop: 12 }}>
                                <div><div className="data-item-label">Resting BP</div><div className="data-item-value">{record.trestbps || 'N/A'} mmHg</div></div>
                                <div><div className="data-item-label">Cholesterol</div><div className="data-item-value">{record.chol || 'N/A'} mg/dL</div></div>
                                <div><div className="data-item-label">Max HR</div><div className="data-item-value">{record.thalach || 'N/A'} bpm</div></div>
                                <div><div className="data-item-label">Age</div><div className="data-item-value">{record.age || 'N/A'} yrs</div></div>
                              </div>
                            </details>
                          </div>
                        )}

                        {record.type === 'cbc' && (
                          <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 12, border: '1px solid #bbf7d0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, color: '#16a34a', fontSize: 15, marginBottom: 16 }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}><CheckCircle size={14} style={{ marginRight: 6 }} /> <strong>Hematology Analysis Completed</strong></div>
                              {record.interpretation && record.interpretation.summary && (
                                <div style={{ fontStyle: 'italic', fontSize: 14, color: 'var(--muted)' }}>"{record.interpretation.summary}"</div>
                              )}
                            </div>
                            <details>
                              <summary style={{ cursor: 'pointer', color: '#16a34a', fontWeight: 700, fontSize: 14, outline: 'none' }}>View CBC Details</summary>
                              <div className="clinical-data-grid" style={{ marginTop: 12 }}>
                                {record.cbc && Object.entries(record.cbc).slice(0, 4).map(([key, data]) => (
                                  <div key={key}>
                                    <div className="data-item-label">{data.label}</div>
                                    <div className="data-item-value">{data.value} {data.unit}</div>
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

               <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedPatient(null)}>Close Profile</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default AdminPage;
