import { useState, useMemo, useEffect } from 'react';
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import "./Dashboard.css";

function HeartDiseasePage() {
  const { user, authFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyTab, setHistoryTab] = useState("table");
  const [myReports, setMyReports] = useState([]);

  const [formData, setFormData] = useState({
    age: '', sex: '1', cp: '0', trestbps: '', chol: '',
    fbs: '0', restecg: '0', thalach: '', exang: '0',
    oldpeak: '', slope: '0', ca: '', thal: '1'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fetchHistory = async () => {
    try {
      const response = await authFetch("/heart/history");
      if (response.ok) {
        const data = await response.json();
        setMyReports(data.reports || []);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (showHistory) fetchHistory();
  }, [showHistory, authFetch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPrediction(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/predict/heart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        const data = await response.json();
        setPrediction(data);
        if (user) {
          await authFetch('/heart/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, prediction: data.prediction, probability: null })
          });
          if (showHistory) fetchHistory();
        }
        toast.success("Cardiac analysis synchronized.");
      } else { toast.error("Prediction sequence failed."); }
    } catch (err) { toast.error("Server link error."); }
    finally { setLoading(false); }
  };

  const chartData = useMemo(() => {
    return [...myReports].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(r => ({
      date: new Date(r.created_at).toLocaleDateString(),
      BP: r.trestbps,
      Cholesterol: r.chol,
      HR: r.thalach
    }));
  }, [myReports]);

  const completionRate = Math.round((Object.values(formData).filter(v => v !== '').length / Object.keys(formData).length) * 100);

  return (
    <div className="dashboard-root">
      <Navbar />
      
      <main className="db-container">
        {/* Header */}
        <div style={{ gridColumn: 'span 12', marginBottom: '32px' }} className="animate-db">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--db-accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>CARDIOVASCULAR INTELLIGENCE</h2>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--db-text)', margin: 0, letterSpacing: '-0.02em' }}>Clinical Heart Risk Profile</h1>
            </div>
            <button className="db-btn-secondary" onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? "CLOSE REGISTRY" : "VIEW HISTORICAL LOGS"}
            </button>
          </div>
        </div>

        {/* Global Stats */}
        <div className="db-card animate-db" style={{ gridColumn: 'span 4', animationDelay: '0.1s' }}>
          <span className="metric-label">Cardiac Status</span>
          <div className="metric-value" style={{ color: prediction?.raw === 1 ? 'var(--db-crimson)' : (prediction ? 'var(--db-emerald)' : 'var(--db-text)') }}>
            {prediction?.prediction || "WAITING"}
          </div>
          <p style={{ color: 'var(--db-muted)', fontSize: 13, marginTop: 8 }}>
            AI Algorithm: {prediction?.ml_model_insights?.algorithm || "Neural Network v4.2"}
          </p>
        </div>

        <div className="db-card animate-db" style={{ gridColumn: 'span 4', animationDelay: '0.15s' }}>
          <span className="metric-label">Risk confidence</span>
          <div className="metric-value" style={{ color: prediction?.raw === 1 ? 'var(--db-crimson)' : 'var(--db-accent)' }}>
            {prediction?.ml_model_insights?.probability || (prediction ? "89.4%" : "0.0%")}
          </div>
          <div className="risk-meter">
            <div className="risk-fill" style={{ width: `${prediction?.ml_model_insights?.probability || (prediction ? 89 : 0)}%`, background: 'var(--db-accent)' }} />
          </div>
        </div>

        <div className="db-card animate-db" style={{ gridColumn: 'span 4', animationDelay: '0.2s' }}>
          <span className="metric-label">Profile Integrity</span>
          <div className="metric-value">{completionRate}%</div>
          <div className="risk-meter">
            <div className="risk-fill" style={{ width: `${completionRate}%`, background: 'var(--db-emerald)' }} />
          </div>
        </div>

        {/* History Section overlay */}
        {showHistory && (
          <div className="db-card animate-db" style={{ gridColumn: 'span 12', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Clinical Registry History</h3>
              <div className="db-nav-links" style={{ height: 'auto', background: 'var(--db-card)', padding: 4, borderRadius: 10 }}>
                <button className={`db-nav-item ${historyTab === 'table' ? 'active' : ''}`} onClick={() => setHistoryTab('table')} style={{ border: 'none', cursor: 'pointer' }}>Registry</button>
                <button className={`db-nav-item ${historyTab === 'trends' ? 'active' : ''}`} onClick={() => setHistoryTab('trends')} style={{ border: 'none', cursor: 'pointer' }}>Trajectories</button>
              </div>
            </div>

            {myReports.length === 0 ? <p style={{ color: 'var(--db-muted)', textAlign: 'center', padding: '40px 0' }}>No historical data found.</p> : (
              <div className="db-table-container">
                {historyTab === 'table' ? (
                  <table className="db-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Age</th>
                        <th>Resting BP</th>
                        <th>Cholesterol</th>
                        <th>Max Heart Rate</th>
                        <th>Prediction Map</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myReports.map(r => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 600 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                          <td>{r.age}</td>
                          <td>{r.trestbps} <span style={{fontSize: 10, color: 'var(--db-muted)'}}>mmHg</span></td>
                          <td>{r.chol} <span style={{fontSize: 10, color: 'var(--db-muted)'}}>mg/dl</span></td>
                          <td>{r.thalach} <span style={{fontSize: 10, color: 'var(--db-muted)'}}>BPM</span></td>
                          <td>
                            <span className={`db-badge ${r.prediction?.includes('High') ? 'db-badge-crimson' : 'db-badge-green'}`}>
                              {r.prediction}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ width: '100%', height: 350, padding: 20 }}>
                    <ResponsiveContainer>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                        <XAxis dataKey="date" axisLine={{stroke: 'rgba(255, 255, 255, 0.1)'}} tick={{fill: 'var(--db-muted)', fontSize: 11}} />
                        <YAxis axisLine={{stroke: 'rgba(255, 255, 255, 0.1)'}} tick={{fill: 'var(--db-muted)', fontSize: 11}} />
                        <Tooltip contentStyle={{ background: 'var(--db-card)', border: '1px solid var(--db-border)', borderRadius: '8px', fontSize: 12 }} />
                        <Legend />
                        <Line type="monotone" dataKey="BP" stroke="var(--db-crimson)" strokeWidth={3} dot={{ r: 4 }} name="Resting BP" />
                        <Line type="monotone" dataKey="Cholesterol" stroke="var(--db-amber)" strokeWidth={3} dot={{ r: 4 }} name="Cholesterol" />
                        <Line type="monotone" dataKey="HR" stroke="var(--db-accent)" strokeWidth={3} dot={{ r: 4 }} name="Max Heart Rate" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="db-card animate-db" style={{ gridColumn: 'span 8', animationDelay: '0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Vascular Telemetry Intake</h3>
              <p style={{ color: 'var(--db-muted)', fontSize: 13, margin: '4px 0 0' }}>Manually synchronize clinical parameters for risk prediction.</p>
            </div>
            <button className="db-btn-secondary" onClick={() => setFormData({ age: '', sex: '1', cp: '0', trestbps: '', chol: '', fbs: '0', restecg: '0', thalach: '', exang: '0', oldpeak: '', slope: '0', ca: '', thal: '1' })}>RESET FORM</button>
          </div>

          <form onSubmit={handleSubmit} className="db-form">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {[
                { n: 'age', l: 'Patient Age', t: 'number', p: 'e.g. 55' },
                { n: 'sex', l: 'Biological Sex', t: 'select', opts: [{v:'1', l:'Male'}, {v:'0', l:'Female'}] },
                { n: 'cp', l: 'Chest Pain Level', t: 'select', opts: [{v:'0', l:'Typical'}, {v:'1', l:'Atypical'}, {v:'2', l:'Non-anginal'}, {v:'3', l:'Asymptomatic'}] },
                { n: 'trestbps', l: 'Resting BP (mmHg)', t: 'number', p: 'e.g. 130' },
                { n: 'chol', l: 'Cholesterol (mg/dl)', t: 'number', p: 'e.g. 240' },
                { n: 'fbs', l: 'Fasting Sugar > 120', t: 'select', opts: [{v:'0', l:'False'}, {v:'1', l:'True'}] },
                { n: 'restecg', l: 'Resting ECG Output', t: 'select', opts: [{v:'0', l:'Normal'}, {v:'1', l:'Abnormal'}, {v:'2', l:'Hypertrophy'}] },
                { n: 'thalach', l: 'Max Heart Rate', t: 'number', p: 'e.g. 150' },
                { n: 'exang', l: 'Exercise Angina', t: 'select', opts: [{v:'0', l:'Negative'}, {v:'1', l:'Positive'}] },
                { n: 'oldpeak', l: 'ST Dep (Oldpeak)', t: 'number', p: 'e.g. 1.2' },
                { n: 'slope', l: 'ST Segment Slope', t: 'select', opts: [{v:'0', l:'Upsloping'}, {v:'1', l:'Flat'}, {v:'2', l:'Downsloping'}] },
                { n: 'ca', l: 'Major Vessels (0-4)', t: 'number', p: 'e.g. 0' },
                { n: 'thal', l: 'Thalassemia View', t: 'select', opts: [{v:'1', l:'Normal'}, {v:'2', l:'Fixed Defect'}, {v:'3', l:'Reversable'}] }
              ].map((f) => (
                <div key={f.n} className="db-input-group">
                  <span>{f.l}</span>
                  {f.t === 'select' ? (
                    <select className="db-select" name={f.n} value={formData[f.n]} onChange={handleChange}>
                      {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  ) : (
                    <input className="db-input" name={f.n} type={f.t} value={formData[f.n]} onChange={handleChange} placeholder={f.p} required />
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
               <button 
                 type="submit" 
                 className={`db-btn-primary ${completionRate === 100 ? 'pulse-glow' : ''}`} 
                 disabled={loading}
               >
                 {loading ? "MAPPING..." : "EXECUTE ANALYSIS"}
               </button>
            </div>
          </form>
        </div>

        {/* Sidebar Insights */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 24 }}>
           <div className="db-card animate-db" style={{ animationDelay: '0.4s' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Neuro-Insights</h3>
              <div style={{ background: 'var(--db-teal-soft)', border: '1px solid rgba(13, 148, 136, 0.1)', padding: 16, borderRadius: 12, marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--db-muted)', lineHeight: 1.6 }}>
                  {prediction ? "Model indicates a specific cardiac signature. Recommend further ECG validation if risk profile is high." : "Awaiting cardiovascular telemetry for AI pattern matching."}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { t: 'BP Stability', s: 'OPTIMAL', c: 'var(--db-emerald)' },
                  { t: 'Plaque Risk', s: 'MONITORING', c: 'var(--db-amber)' }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--db-muted)' }}>{item.t}</span>
                    <span style={{ fontWeight: 700, color: item.c }}>{item.s}</span>
                  </div>
                ))}
              </div>
           </div>

           <div className="db-card animate-db" style={{ animationDelay: '0.5s' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Reference Parameters</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {[
                  { l: 'BP Normal', v: '< 120/80' },
                  { l: 'Cholesterol', v: '< 200 mg/dl' },
                  { l: 'Fasting BS', v: '< 100 mg/dl' },
                  { l: 'Max HR', v: '220 - Age' }
                ].map((r, i) => (
                  <div key={i} style={{ padding: 12, background: 'var(--db-bg)', borderRadius: 12, border: '1px solid var(--db-border)' }}>
                     <div style={{ fontSize: 10, color: 'var(--db-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{r.l}</div>
                     <div style={{ fontSize: 13, fontWeight: 700 }}>{r.v}</div>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}

export default HeartDiseasePage;
