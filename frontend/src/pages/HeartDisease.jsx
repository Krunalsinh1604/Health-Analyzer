import { useState, useMemo, useEffect } from 'react';
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import dashboardHero from '../assets/dashboard-hero.png';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
    <div className="app">
      <Navbar />

      <div className="dashboard-banner">
        <img src={dashboardHero} alt="Heart Analytics" />
        <div className="banner-content">
          <h2>Cardiovascular Intelligence</h2>
          <p>
            Real-time multi-variable regression and ML-driven risk assessment. <br />
            Enter patient data manually for instant cardiology analysis.
          </p>
        </div>
      </div>

      <div style={{ padding: '0 0.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="secondary" onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? "Hide History" : "View My Report History"}
        </button>
      </div>

      {showHistory && (
        <section className="history-section card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3>My Report History</h3>
            <div className="tabs">
              <button className={historyTab === 'table' ? 'active' : ''} onClick={() => setHistoryTab('table')}>
                Table
              </button>
              <button className={historyTab === 'trends' ? 'active' : ''} onClick={() => setHistoryTab('trends')}>
                Trends
              </button>
            </div>
          </div>

          {myReports.length === 0 ? <p>No reports found.</p> : (
            <>
              {historyTab === 'table' ? (
                <div className="table-wrap">
                  <table>
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
                          <td>{new Date(r.created_at).toLocaleDateString()}</td>
                          <td>{r.age}</td>
                          <td>{r.trestbps} mmHg</td>
                          <td>{r.chol} mg/dl</td>
                          <td>{r.thalach} BPM</td>
                          <td>
                            <span className={`badge ${r.prediction?.includes('High') ? 'alert' : 'ok'}`}>
                              {r.prediction}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="BP" stroke="#ef4444" name="Resting BP" />
                      <Line type="monotone" dataKey="Cholesterol" stroke="#f59e0b" name="Cholesterol" />
                      <Line type="monotone" dataKey="HR" stroke="#3b82f6" name="Max Heart Rate" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <main className="main-content">
        <section className="stat-row">
          <div className="stat-card">
            <p>Heart Disease Status</p>
            <h2>{prediction?.prediction || "Pending"}</h2>
            <span className={`chip ${prediction ? "chip-live" : "chip-muted"}`}>
              {prediction ? "Analysis Ready" : "Awaiting Data"}
            </span>
          </div>
          <div className="stat-card">
            <p>Risk Profile</p>
            <h2>{prediction?.raw === 1 ? 'High Risk' : prediction?.raw === 0 ? 'Low Risk' : 'Unknown'}</h2>
            <div className="progress" style={{ marginTop: '8px' }}>
              <span style={{
                width: prediction?.raw === 1 ? '100%' : prediction?.raw === 0 ? '30%' : '0%',
                background: prediction?.raw === 1 ? '#ef4444' : '#22c55e'
              }} />
            </div>
          </div>
          <div className="stat-card">
            <p>Profile Completeness</p>
            <h2>{completionRate}%</h2>
            <div className="progress" style={{ marginTop: '8px' }}>
              <span style={{ width: `${completionRate}%` }} />
            </div>
          </div>
        </section>

        <div className="layout">
          <section className="panel">
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Report Intake</h3>
                  <p>Enter patient vitals and test results manually.</p>
                </div>
                <div className="tabs">
                  <button className="active">Manual Entry</button>
                </div>
              </div>

              <div className="form-header" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button
                  className="ghost"
                  onClick={() =>
                    setFormData({
                      age: '', sex: '1', cp: '0', trestbps: '', chol: '',
                      fbs: '0', restecg: '0', thalach: '', exang: '0',
                      oldpeak: '', slope: '0', ca: '', thal: '1'
                    })
                  }
                >
                  Clear Form
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <label className="field">
                    <span>Age</span>
                    <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="e.g. 55" required />
                  </label>

                  <label className="field">
                    <span>Sex</span>
                    <select name="sex" value={formData.sex} onChange={handleChange}>
                      <option value="1">Male</option>
                      <option value="0">Female</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>Chest Pain Type</span>
                    <select name="cp" value={formData.cp} onChange={handleChange}>
                      <option value="0">Typical Angina</option>
                      <option value="1">Atypical Angina</option>
                      <option value="2">Non-anginal Pain</option>
                      <option value="3">Asymptomatic</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>Resting BP (mmHg)</span>
                    <input type="number" name="trestbps" value={formData.trestbps} onChange={handleChange} placeholder="e.g. 130" required />
                  </label>

                  <label className="field">
                    <span>Cholesterol (mg/dl)</span>
                    <input type="number" name="chol" value={formData.chol} onChange={handleChange} placeholder="e.g. 240" required />
                  </label>

                  <label className="field">
                    <span>Fasting BS &gt; 120 mg/dl</span>
                    <select name="fbs" value={formData.fbs} onChange={handleChange}>
                      <option value="0">False</option>
                      <option value="1">True</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>Resting ECG</span>
                    <select name="restecg" value={formData.restecg} onChange={handleChange}>
                      <option value="0">Normal</option>
                      <option value="1">ST-T Wave Abnormality</option>
                      <option value="2">LV Hypertrophy</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>Max Heart Rate</span>
                    <input type="number" name="thalach" value={formData.thalach} onChange={handleChange} placeholder="e.g. 150" required />
                  </label>

                  <label className="field">
                    <span>Exercise Angina</span>
                    <select name="exang" value={formData.exang} onChange={handleChange}>
                      <option value="0">No</option>
                      <option value="1">Yes</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>Oldpeak (ST Dep)</span>
                    <input type="number" step="0.1" name="oldpeak" value={formData.oldpeak} onChange={handleChange} placeholder="e.g. 1.2" required />
                  </label>

                  <label className="field">
                    <span>Slope</span>
                    <select name="slope" value={formData.slope} onChange={handleChange}>
                      <option value="0">Upsloping</option>
                      <option value="1">Flat</option>
                      <option value="2">Downsloping</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>Major Vessels (0-4)</span>
                    <input type="number" name="ca" value={formData.ca} onChange={handleChange} placeholder="e.g. 0" required />
                  </label>

                  <label className="field">
                    <span>Thalassemia</span>
                    <select name="thal" value={formData.thal} onChange={handleChange}>
                      <option value="0">Unknown</option>
                      <option value="1">Normal</option>
                      <option value="2">Fixed Defect</option>
                      <option value="3">Reversable Defect</option>
                    </select>
                  </label>
                </div>

                <div className="card-actions">
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? "Analyzing..." : "Run Analysis"}
                  </button>
                </div>
              </form>
            </div>
          </section>

          <aside className="side">
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Analysis Results</h3>
                  <p>Model confidence & findings</p>
                </div>
                <span className="chip chip-muted">Auto</span>
              </div>

              {prediction ? (
                <div className="results-summary">
                  <div className="summary-grid">
                    <div>
                      <span>Prediction</span>
                      <strong className={prediction.raw === 1 ? 'text-alert' : 'text-success'}>
                        {prediction.prediction}
                      </strong>
                    </div>
                    <div>
                      <span>Confidence</span>
                      <strong>High</strong>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <h4>Clinical Note</h4>
                    <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                      This assessment is based on a machine learning model analyzing key indicators like chest pain type, cholesterol, and max heart rate.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                  <p>Run analysis to see results</p>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Latest Research</h3>
                </div>
              </div>
              <ul className="insight-list">
                <li>Accuracy rate target &gt; 95%</li>
                <li>Multi-variable regression analysis</li>
                <li>Integrated with wearable data (planned)</li>
              </ul>
            </div>
          </aside>
        </div>

        <div className="layout" style={{ marginTop: '3rem' }}>
          <section className="panel" style={{ gridColumn: '1 / -1' }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Understanding Your Metrics</h3>
                  <p>Key indicators used in cardiovascular risk assessment.</p>
                </div>
              </div>
              <div className="grid three">
                <div>
                  <h4>Resting BP</h4>
                  <p className="note-text">Blood pressure when the subject is at rest. Normal ranges are typically below 120/80 mmHg. High scores indicate increased arterial tension.</p>
                </div>
                <div>
                  <h4>Cholesterol</h4>
                  <p className="note-text">Serum cholestoral in mg/dl. Elevated low-density lipids contribute directly to plaque buildup and ischemic events.</p>
                </div>
                <div>
                  <h4>Max Heart Rate</h4>
                  <p className="note-text">Maximum heart rate achieved during physical stress exertion testing. Useful for assessing heart mechanical potential and fitness.</p>
                </div>
                <div>
                  <h4>Exercise Angina</h4>
                  <p className="note-text">Chest pain brought on by physical exercise. An important potential indicator for underlying coronary artery disease blockages.</p>
                </div>
                <div>
                  <h4>Fasting Blood Sugar</h4>
                  <p className="note-text">Indicators denoting if resting metabolism sugar is &gt; 120 mg/dl. Often intersects with diabetic risk comorbidities.</p>
                </div>
                <div>
                  <h4>Resting ECG</h4>
                  <p className="note-text">Electrocardiographic signals. Identifies ST-T wave abnormalities or left ventricular hypertrophy conditions.</p>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
              <div className="card-header">
                <div>
                  <h3>Prevention & Wellness</h3>
                  <p>Lifestyle changes to manage cardiovascular health.</p>
                </div>
              </div>
              <div className="grid three">
                <div className="feature-card" style={{ padding: '20px', border: '1px solid var(--line)', boxShadow: 'none' }}>
                  <div className="icon-wrapper" style={{ width: '48px', height: '48px', fontSize: '20px', marginBottom: '12px' }}>🏃</div>
                  <h4 style={{ marginBottom: '8px' }}>Cardio Exercise</h4>
                  <p className="note-text">Engage in 150+ mins/week of moderate aerobic activity to improve circulation and heart efficiency.</p>
                </div>
                <div className="feature-card" style={{ padding: '20px', border: '1px solid var(--line)', boxShadow: 'none' }}>
                  <div className="icon-wrapper" style={{ width: '48px', height: '48px', fontSize: '20px', marginBottom: '12px' }}>🚭</div>
                  <h4 style={{ marginBottom: '8px' }}>Avoid Smoking</h4>
                  <p className="note-text">Smoking accelerates atherosclerosis. Quitting reduces immediate and long-term risk of heart attacks.</p>
                </div>
                <div className="feature-card" style={{ padding: '20px', border: '1px solid var(--line)', boxShadow: 'none' }}>
                  <div className="icon-wrapper" style={{ width: '48px', height: '48px', fontSize: '20px', marginBottom: '12px' }}>🥑</div>
                  <h4 style={{ marginBottom: '8px' }}>Heart-Healthy Diet</h4>
                  <p className="note-text">Focus on omega-3s, soluble fiber, and unsaturated fats. Limit sodium and saturated fats.</p>
                </div>
              </div>
            </div>

          </section>
        </div>
      </main>
    </div>
  );
}

export default HeartDiseasePage;
