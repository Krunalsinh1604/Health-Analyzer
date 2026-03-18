import { useState, useMemo, useEffect } from 'react';
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { C } from "../theme";

function HeartDiseasePage() {
  const { user, logout, authFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const [showHistory, setShowHistory] = useState(false);
  const [historyTab, setHistoryTab] = useState("table"); // 'table' or 'trends'
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
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory, authFetch]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    return [...myReports].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(r => ({
      date: new Date(r.created_at).toLocaleDateString(),
      BP: r.trestbps,
      Cholesterol: r.chol,
      HR: r.thalach
    }));
  }, [myReports]);

  // Profile Completeness
  const totalFields = Object.keys(formData).length;
  const filledFields = Object.values(formData).filter((val) => val !== '').length;
  const completionRate = Math.round((filledFields / totalFields) * 100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPrediction(null);
    try {
      // 1. Get Prediction
      const response = await fetch('http://127.0.0.1:8000/predict/heart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setPrediction(data);

        // 2. Save to History (if logged in)
        if (user) {
          try {
            const saveRes = await authFetch('/heart/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...formData,
                prediction: data.prediction,
                probability: null
              })
            });
            if (!saveRes.ok) {
              console.error("Failed to save heart report");
            } else if (showHistory) {
              fetchHistory();
            }
          } catch (saveErr) {
            console.error("Error saving heart report:", saveErr);
          }
        }

        toast.success("Analysis Complete & Saved");
      } else {
        toast.error("Prediction failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="grid-bg-light" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
      <Navbar />
      
      <div className="page-inner">
        <div className="animate-up" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span className="feature-pill">CARDIOVASCULAR INTELLIGENCE</span>
            <h2 className="page-title">Heart Risk Stratification</h2>
            <p className="page-desc">Real-time multi-variable regression and ML-driven risk assessment.</p>
          </div>
          <button className="btn-secondary-light" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? "Hide History" : "View My Report History"}
          </button>
        </div>

        {showHistory && (
          <section className="bento-card animate-up" style={{ animationDelay: '0.1s', marginBottom: '40px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>My Report History</h3>
              <div className="tabs-light">
                <button className={historyTab === 'table' ? 'active' : ''} onClick={() => setHistoryTab('table')}>Table</button>
                <button className={historyTab === 'trends' ? 'active' : ''} onClick={() => setHistoryTab('trends')}>Trends</button>
              </div>
            </div>

            {myReports.length === 0 ? <p style={{ color: C.lightMuted }}>No reports found.</p> : (
              <>
                {historyTab === 'table' ? (
                  <div style={{ overflowX: 'auto', borderRadius: '12px', border: `1px solid ${C.lightBorder}` }}>
                    <table className="table-light">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Age</th>
                          <th>BP (Resting)</th>
                          <th>Cholesterol</th>
                          <th>Max HR</th>
                          <th>Prediction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myReports.map(r => (
                          <tr key={r.id}>
                            <td style={{ fontWeight: 600 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                            <td>{r.age}</td>
                            <td><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.trestbps}</span> <span style={{fontSize: '12px', color: C.lightMuted}}>mmHg</span></td>
                            <td><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.chol}</span> <span style={{fontSize: '12px', color: C.lightMuted}}>mg/dl</span></td>
                            <td><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.thalach}</span> <span style={{fontSize: '12px', color: C.lightMuted}}>BPM</span></td>
                            <td>
                              <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, 
                                background: r.prediction?.includes('High') ? C.crimsonBg : C.emeraldBg,
                                color: r.prediction?.includes('High') ? C.crimson : C.emerald
                              }}>
                                {r.prediction}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: 300, background: '#fff', padding: '20px', borderRadius: '12px', border: `1px solid ${C.lightBorder}` }}>
                    <ResponsiveContainer>
                      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.lightBorder} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: C.lightMuted }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: C.lightMuted }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: `1px solid ${C.lightBorder}`, boxShadow: C.shadowCard }} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line type="monotone" dataKey="BP" stroke={C.crimson} strokeWidth={3} dot={{ r: 4 }} name="Resting BP" />
                        <Line type="monotone" dataKey="Cholesterol" stroke={C.amber} strokeWidth={3} dot={{ r: 4 }} name="Cholesterol" />
                        <Line type="monotone" dataKey="HR" stroke={C.blueBright} strokeWidth={3} dot={{ r: 4 }} name="Max Heart Rate" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        <section className="animate-up" style={{ animationDelay: '0.15s', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {[
             { l: 'Heart Disease Status', v: prediction?.prediction || "Pending", s: prediction ? "Analysis Ready" : "Awaiting Data", c: prediction ? C.emerald : C.lightMuted, bg: prediction ? C.emeraldBg : C.lightBg3 },
             { l: 'Risk Profile', v: prediction?.raw === 1 ? 'High Risk' : prediction?.raw === 0 ? 'Low Risk' : 'Unknown', prog: prediction?.raw === 1 ? 100 : prediction?.raw === 0 ? 30 : 0, progC: prediction?.raw === 1 ? C.crimson : C.emerald },
             { l: 'Profile Completeness', v: `${completionRate}%`, prog: completionRate, progC: C.blueBright }
          ].map((s, i) => (
             <div key={i} className="bento-card" style={{ padding: '24px' }}>
               <div style={{ fontSize: '13px', fontWeight: 600, color: C.lightMuted, textTransform: 'uppercase', marginBottom: '8px' }}>{s.l}</div>
               <div style={{ fontSize: '28px', fontWeight: 800, color: C.lightText, marginBottom: '16px' }}>{s.v}</div>
               {s.s && <span style={{ display: 'inline-block', background: s.bg, color: s.c, padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>{s.s}</span>}
               {typeof s.prog !== 'undefined' && (
                 <div style={{ width: '100%', height: '6px', background: C.lightBg3, borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${s.prog}%`, height: '100%', background: s.progC, borderRadius: '99px', transition: 'width 1s' }} />
                 </div>
               )}
             </div>
          ))}
        </section>

        <div className="layout animate-up" style={{ animationDelay: '0.2s', display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: '24px', marginBottom: '32px' }}>
          
          <section className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="bento-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>Patient Vitals</h3>
                  <p style={{ color: C.lightMuted, margin: 0 }}>Enter clinical parameters for risk prediction.</p>
                </div>
                <button className="btn-secondary-light" onClick={() => setFormData({ age: '', sex: '1', cp: '0', trestbps: '', chol: '', fbs: '0', restecg: '0', thalach: '', exang: '0', oldpeak: '', slope: '0', ca: '', thal: '1' })}>Clear Details</button>
              </div>

              <form onSubmit={handleSubmit} className="field-light">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span>Age</span>
                    <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="e.g. 55" required />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span>Sex</span>
                    <select name="sex" value={formData.sex} onChange={handleChange}>
                      <option value="1">Male</option>
                      <option value="0">Female</option>
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span>Chest Pain Type</span>
                    <select name="cp" value={formData.cp} onChange={handleChange}>
                      <option value="0">Typical Angina</option>
                      <option value="1">Atypical Angina</option>
                      <option value="2">Non-anginal Pain</option>
                      <option value="3">Asymptomatic</option>
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span>Resting BP (mmHg)</span>
                    <input type="number" name="trestbps" value={formData.trestbps} onChange={handleChange} placeholder="e.g. 130" required />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span>Cholesterol (mg/dl)</span>
                    <input type="number" name="chol" value={formData.chol} onChange={handleChange} placeholder="e.g. 240" required />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span>Fasting BS &gt; 120 mg/dl</span>
                    <select name="fbs" value={formData.fbs} onChange={handleChange}>
                      <option value="0">False</option>
                      <option value="1">True</option>
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span>Resting ECG</span>
                    <select name="restecg" value={formData.restecg} onChange={handleChange}>
                      <option value="0">Normal</option>
                      <option value="1">ST-T Wave Abnormality</option>
                      <option value="2">LV Hypertrophy</option>
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span>Max Heart Rate</span>
                    <input type="number" name="thalach" value={formData.thalach} onChange={handleChange} placeholder="e.g. 150" required />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span>Exercise Angina</span>
                    <select name="exang" value={formData.exang} onChange={handleChange}>
                      <option value="0">No</option>
                      <option value="1">Yes</option>
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span>Oldpeak (ST Dep)</span>
                    <input type="number" step="0.1" name="oldpeak" value={formData.oldpeak} onChange={handleChange} placeholder="e.g. 1.2" required />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span>Slope</span>
                    <select name="slope" value={formData.slope} onChange={handleChange}>
                      <option value="0">Upsloping</option>
                      <option value="1">Flat</option>
                      <option value="2">Downsloping</option>
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span>Major Vessels (0-4)</span>
                    <input type="number" name="ca" value={formData.ca} onChange={handleChange} placeholder="e.g. 0" required />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span>Thalassemia</span>
                    <select name="thal" value={formData.thal} onChange={handleChange}>
                      <option value="0">Unknown</option>
                      <option value="1">Normal</option>
                      <option value="2">Fixed Defect</option>
                      <option value="3">Reversable Defect</option>
                    </select>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
                  <button type="submit" className="clinical-btn" disabled={loading}>
                    {loading ? "Analyzing..." : "Run Analysis"}
                  </button>
                </div>
              </form>
            </div>
          </section>

          <aside className="side">
            <div className="bento-card" style={{ height: '100%' }}>
              <div style={{ marginBottom: '20px', borderBottom: `1px solid ${C.lightBorder}`, paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px' }}>Analysis Results</h3>
                  <p style={{ color: C.lightMuted, fontSize: '14px', margin: 0 }}>Model confidence & findings</p>
                </div>
                <span style={{ background: C.lightBg3, color: C.lightMuted, padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Auto</span>
              </div>

              {prediction ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: prediction.raw === 1 ? C.crimsonBg : C.emeraldBg, border: `1px solid ${prediction.raw === 1 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, padding: '16px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: prediction.raw === 1 ? '#ef4444' : '#10b981', textTransform: 'uppercase', marginBottom: '8px' }}>Prediction</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: prediction.raw === 1 ? C.crimson : C.emerald }}>{prediction.prediction}</div>
                    </div>
                    <div style={{ background: C.lightBg2, border: `1px solid ${C.lightBorder}`, padding: '16px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: C.lightMuted, textTransform: 'uppercase', marginBottom: '8px' }}>Confidence</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: C.lightText }}>{prediction.ml_model_insights ? `${prediction.ml_model_insights.probability}%` : "High"}</div>
                    </div>
                  </div>

                  <div style={{ background: '#fff', border: `1px solid ${C.lightBorder}`, padding: '20px', borderRadius: '16px', boxShadow: C.shadowCard }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px' }}>ML Model Insights</h4>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: C.lightBg2, padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: C.lightText }}>
                      <span style={{ color: C.lightMuted }}>Algorithm</span>
                      <span>{prediction.ml_model_insights?.algorithm || "Machine Learning Model"}</span>
                    </div>
                    <p style={{ color: C.lightMuted, fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                      This assessment is based on a trained machine learning model analyzing key indicators like chest pain type, cholesterol, and max heart rate.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', textAlign: 'center', color: C.lightMuted }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🫀</div>
                  <p style={{ margin: 0, fontSize: '15px', maxWidth: '200px' }}>Run analysis to see detailed prediction results.</p>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Info Cards */}
        <div className="animate-up" style={{ animationDelay: '0.3s' }}>
            <div className="bento-card" style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>Understanding Your Metrics</h3>
                <p style={{ color: C.lightMuted, margin: 0 }}>Key indicators used in cardiovascular risk assessment.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {[
                  { t: 'Resting BP', d: 'Blood pressure when the subject is at rest. Normal ranges are typically below 120/80 mmHg.' },
                  { t: 'Cholesterol', d: 'Serum cholestoral in mg/dl. Elevated low-density lipids contribute directly to plaque buildup.' },
                  { t: 'Max Heart Rate', d: 'Maximum heart rate achieved. Useful for assessing heart mechanical potential and fitness.' },
                  { t: 'Exercise Angina', d: 'Chest pain brought on by physical exercise. Important indicator for CAD blockages.' },
                  { t: 'Fasting Blood Sugar', d: 'Indicators denoting if resting metabolism sugar is > 120 mg/dl. Intersects with diabetic risk.' },
                  { t: 'Resting ECG', d: 'Electrocardiographic signals. Identifies abnormalities or left ventricular hypertrophy.' }
                ].map((item, i) => (
                   <div key={i} style={{ background: C.lightBg1, padding: '20px', borderRadius: '16px', border: `1px solid ${C.lightBorder}` }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>{item.t}</h4>
                      <p style={{ fontSize: '14px', color: C.lightMuted, lineHeight: 1.5, margin: 0 }}>{item.d}</p>
                   </div>
                ))}
              </div>
            </div>

            <div className="bento-card">
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>Prevention & Wellness</h3>
                <p style={{ color: C.lightMuted, margin: 0 }}>Lifestyle changes to manage cardiovascular health.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {[
                  { i: '🏃', t: 'Cardio Exercise', d: 'Engage in 150+ mins/week of moderate aerobic activity to improve circulation and heart efficiency.' },
                  { i: '🚭', t: 'Avoid Smoking', d: 'Smoking accelerates atherosclerosis. Quitting reduces immediate risk of heart attacks.' },
                  { i: '🥑', t: 'Heart-Healthy Diet', d: 'Focus on omega-3s, soluble fiber, and unsaturated fats. Limit sodium and saturated fats.' }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '16px', padding: '20px', background: C.lightBg2, borderRadius: '16px' }}>
                     <div style={{ fontSize: '28px' }}>{item.i}</div>
                     <div>
                       <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px' }}>{item.t}</h4>
                       <p style={{ fontSize: '14px', color: C.lightMuted, lineHeight: 1.5, margin: 0 }}>{item.d}</p>
                     </div>
                  </div>
                ))}
              </div>
            </div>
        </div>

      </div>
    </div>
  );
}

export default HeartDiseasePage;
