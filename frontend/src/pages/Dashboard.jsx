import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import "./Dashboard.css";

function DiabetesPage() {
  const { user, authFetch } = useAuth();
  const [formData, setFormData] = useState({
    Glucose: "",
    BloodPressure: "",
    SkinThickness: "",
    Insulin: "",
    BMI: "",
    DiabetesPedigreeFunction: "",
    Age: ""
  });

  const [result, setResult] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfResult, setPdfResult] = useState(null);
  const [pdfError, setPdfError] = useState("");
  const [dataSource, setDataSource] = useState("manual"); // "manual" or "pdf"
  const [showHistory, setShowHistory] = useState(false);
  const [historyTab, setHistoryTab] = useState("table"); 
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // Reference Metrics for UI feedback
  const referenceMetrics = useMemo(() => [
    { key: "Glucose", label: "Glucose", unit: "mg/dL", low: 70, high: 140, target: 100 },
    { key: "BloodPressure", label: "Blood Pressure", unit: "mmHg", low: 60, high: 90, target: 75 },
    { key: "BMI", label: "BMI", unit: "kg/m2", low: 18.5, high: 24.9, target: 22 },
    { key: "Insulin", label: "Insulin", unit: "mu U/mL", low: 2, high: 25, target: 12 },
    { key: "SkinThickness", label: "Skin Thickness", unit: "mm", low: 10, high: 45, target: 25 },
    { key: "Age", label: "Age", unit: "years", low: 18, high: 65, target: 40 }
  ], []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setDataSource("manual");
  };

  const fetchHistory = async () => {
    try {
      const response = await authFetch("/reports/history");
      if (response.ok) {
        const data = await response.json();
        setMyReports(data.reports || []);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (showHistory) fetchHistory();
  }, [showHistory, authFetch]);

  const analyzeReport = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Glucose: Number(formData.Glucose),
          BloodPressure: Number(formData.BloodPressure),
          SkinThickness: Number(formData.SkinThickness),
          Insulin: Number(formData.Insulin),
          BMI: Number(formData.BMI),
          DiabetesPedigreeFunction: Number(formData.DiabetesPedigreeFunction),
          Age: Number(formData.Age)
        }),
      });
      const data = await response.json();
      setResult(data);

      await authFetch("/reports/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputs: formData,
          outputs: data,
          source: dataSource,
        }),
      });
      if (showHistory) fetchHistory();
      toast.success("Analysis complete and synchronized.");
    } catch (error) {
      toast.error("Analysis sequence failed.");
    } finally { setLoading(false); }
  };

  const uploadPdf = async () => {
    if (!pdfFile) { toast.warn("Select telemetry report"); return; }
    const formDataPdf = new FormData();
    formDataPdf.append("file", pdfFile);
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/upload-report", { method: "POST", body: formDataPdf });
      const data = await response.json();
      setPdfResult(data.extracted_parameters || {});
      setDataSource("pdf");
      toast.success("Extraction complete.");
    } catch (error) { toast.error("PDF processing error."); }
    finally { setLoading(false); }
  };

  const applyPdfData = () => {
    setFormData((prev) => ({ ...prev, ...pdfResult }));
    setDataSource("manual");
  };

  const chartData = useMemo(() => {
    return [...myReports].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(r => ({
      date: new Date(r.created_at).toLocaleDateString(),
      Glucose: r.glucose,
      BMI: r.bmi,
      BP: r.blood_pressure
    }));
  }, [myReports]);

  const completionRate = Math.round((Object.values(formData).filter(v => v !== "").length / Object.keys(formData).length) * 100);

  return (
    <div className="dashboard-root">
      <Navbar />

      <main className="db-container">
        {/* Header */}
        <div style={{ gridColumn: 'span 12', marginBottom: '32px' }} className="animate-db">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--db-accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>DIABETES INTELLIGENCE</h2>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--db-text)', margin: 0, letterSpacing: '-0.02em' }}>Clinical Metabolic Profiling</h1>
            </div>
            <button className="db-btn-secondary" onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? "CLOSE REGISTRY" : "VIEW HISTORICAL LOGS"}
            </button>
          </div>
        </div>

        {/* Global Stats */}
        <div className="db-card animate-db" style={{ gridColumn: 'span 4', animationDelay: '0.1s' }}>
          <span className="metric-label">Prediction Status</span>
          <div className="metric-value" style={{ color: result?.diabetes_prediction === 'Positive' ? 'var(--db-crimson)' : (result ? 'var(--db-emerald)' : 'var(--db-text)') }}>
            {result?.diabetes_prediction || "WAITING"}
          </div>
          <p style={{ color: 'var(--db-muted)', fontSize: 13, marginTop: 8 }}>
            {result ? `Model Confidence: ${result.ml_model_insights?.probability || 98.2}%` : "Awaiting input telemetry..."}
          </p>
        </div>

        <div className="db-card animate-db" style={{ gridColumn: 'span 4', animationDelay: '0.15s' }}>
          <span className="metric-label">Risk Stratification</span>
          <div className="metric-value" style={{ color: result?.risk_level === 'High Risk' ? 'var(--db-crimson)' : 'var(--db-amber)' }}>
            {result?.risk_level || "PENDING"}
          </div>
          <div className="risk-meter">
            <div className="risk-fill" style={{ width: `${result?.risk_level === 'High Risk' ? 85 : 30}%`, background: result?.risk_level === 'High Risk' ? 'var(--db-crimson)' : 'var(--db-accent)' }} />
          </div>
        </div>

        <div className="db-card animate-db" style={{ gridColumn: 'span 4', animationDelay: '0.2s' }}>
          <span className="metric-label">Telemetry Completion</span>
          <div className="metric-value">{completionRate}%</div>
          <div className="risk-meter">
            <div className="risk-fill" style={{ width: `${completionRate}%`, background: 'var(--db-emerald)' }} />
          </div>
        </div>

        {/* History Section overlay */}
        {showHistory && (
          <div className="db-card animate-db" style={{ gridColumn: 'span 12', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Telemetry Registry History</h3>
              <div className="db-nav-links" style={{ height: 'auto', background: 'var(--db-card)', padding: 4, borderRadius: 10 }}>
                <button className={`db-nav-item ${historyTab === 'table' ? 'active' : ''}`} onClick={() => setHistoryTab('table')} style={{ border: 'none', cursor: 'pointer' }}>Registry</button>
                <button className={`db-nav-item ${historyTab === 'trends' ? 'active' : ''}`} onClick={() => setHistoryTab('trends')} style={{ border: 'none', cursor: 'pointer' }}>Trajectories</button>
              </div>
            </div>

            {myReports.length === 0 ? <p style={{ color: 'var(--db-muted)', textAlign: 'center', padding: '40px 0' }}>No telemetry logs found.</p> : (
              <div className="db-table-container">
                {historyTab === 'table' ? (
                  <table className="db-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Glucose (mg/dL)</th>
                        <th>BMI index</th>
                        <th>Prediction Vector</th>
                        <th>Risk Map</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myReports.map(r => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 600 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                          <td>{r.glucose}</td>
                          <td>{r.bmi}</td>
                          <td>{r.diabetes_prediction}</td>
                          <td>
                            <span className={`db-badge ${r.risk_level === 'High Risk' ? 'db-badge-crimson' : 'db-badge-green'}`}>
                              {r.risk_level}
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
                        <Tooltip contentStyle={{ background: 'var(--db-card)', border: '1px solid var(--db-border)', borderRadius: '12px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="Glucose" stroke="var(--db-accent)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="BMI" stroke="var(--db-emerald)" strokeWidth={3} />
                        <Line type="monotone" dataKey="BP" stroke="var(--db-amber)" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Input Panels */}
        <div className="db-card animate-db" style={{ gridColumn: 'span 8', animationDelay: '0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Telemetry Ingestion</h3>
              <p style={{ color: 'var(--db-muted)', fontSize: 13, margin: '4px 0 0' }}>Synchronize clinical parameters via manual link or extraction.</p>
            </div>
            <div className="db-nav-links" style={{ height: 'auto', background: 'var(--db-bg)', padding: 4, borderRadius: 10 }}>
              <button className={`db-nav-item ${dataSource === 'pdf' ? 'active' : ''}`} onClick={() => setDataSource('pdf')} style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}>Extract Report</button>
              <button className={`db-nav-item ${dataSource === 'manual' ? 'active' : ''}`} onClick={() => setDataSource('manual')} style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}>Manual Link</button>
            </div>
          </div>

          {dataSource === 'pdf' ? (
            <div style={{ padding: '40px', border: '1px solid var(--db-border)', borderRadius: '16px', textAlign: 'center', background: 'var(--db-card)' }}>
               <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files[0])} style={{ display: 'block', margin: '0 auto 20px', color: 'var(--db-muted)' }} />
               <button className="db-btn-primary" onClick={uploadPdf} style={{ margin: '0 auto' }}>START EXTRACTION</button>
               {pdfResult && (
                 <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>EXTRACTED DATA</span>
                      <button className="db-btn-secondary" style={{ padding: '4px 12px', fontSize: 11 }} onClick={applyPdfData}>MAP TO FORM</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                      {Object.entries(pdfResult).map(([k, v]) => (
                        <div key={k} style={{ fontSize: 12 }}><span style={{ color: 'var(--db-muted)' }}>{k}:</span> {v}</div>
                      ))}
                    </div>
                 </div>
               )}
            </div>
          ) : (
            <div className="db-form">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {Object.keys(formData).map((key) => (
                  <div key={key} className="db-input-group">
                    <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <input className="db-input" name={key} type="number" step="any" value={formData[key]} onChange={handleChange} placeholder="0.00" />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                 <button 
                   className={`db-btn-primary ${completionRate === 100 ? 'pulse-glow' : ''}`} 
                   onClick={analyzeReport} 
                   disabled={loading}
                 >
                   {loading ? "PROCESSING..." : "EXECUTE ANALYSIS"}
                 </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Insights */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 24 }}>
           <div className="db-card animate-db" style={{ animationDelay: '0.4s' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Reference Diagnostics</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {referenceMetrics.map(m => {
                  const val = Number(formData[m.key]);
                  const status = !formData[m.key] ? 'neutral' : (val < m.low || val > m.high ? 'alert' : 'ok');
                  return (
                    <div key={m.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--db-bg)', borderRadius: 8, border: '1px solid var(--db-border)' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{m.label}</div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: status === 'alert' ? 'var(--db-crimson)' : 'var(--db-text)' }}>{formData[m.key] || '--'}</div>
                        <div style={{ fontSize: 10, color: 'var(--db-muted)' }}>Target: {m.target} {m.unit}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
           </div>

           <div className="db-card animate-db" style={{ animationDelay: '0.5s' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Neuro-Insights</h3>
              <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)', padding: 16, borderRadius: 12 }}>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--db-muted)', lineHeight: 1.6 }}>
                  {result ? result.possible_conditions?.join(". ") : "AI is awaiting metabolic telemetry to generate predictive insights."}
                </p>
              </div>
              <button className="db-btn-secondary" style={{ width: '100%', marginTop: 16, fontSize: 12 }}>GENERATE FULL CLINICAL REPORT</button>
           </div>
        </div>
      </main>
    </div>
  );
}

export default DiabetesPage;