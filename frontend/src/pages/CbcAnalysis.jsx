import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import "./Dashboard.css";

function CbcAnalysisPage() {
  const { user, authFetch } = useAuth();
  const [pdfFile, setPdfFile] = useState(null);
  const [cbcResult, setCbcResult] = useState(null);
  const [cbcInterpretation, setCbcInterpretation] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyTab, setHistoryTab] = useState("table");
  const [myReports, setMyReports] = useState([]);
  const [intakeTab, setIntakeTab] = useState('upload'); // 'upload' or 'manual'
  const [loading, setLoading] = useState(false);

  const [manualData, setManualData] = useState({
    Hemoglobin: "", RBC: "", WBC: "", Platelets: "", ESR: "",
    MCV: "", MCH: "", RDW: "", Neutrophils: "", Lymphocytes: "",
    Monocytes: "", Eosinophils: "", Basophils: ""
  });

  const handleManualChange = (e) => {
    setManualData({ ...manualData, [e.target.name]: e.target.value });
  };

  const analyzeManualReport = async () => {
    setLoading(true);
    const payload = {};
    Object.entries(manualData).forEach(([k, v]) => { if (v !== "") payload[k] = parseFloat(v); });
    if (Object.keys(payload).length === 0) { toast.warn("Enter telemetry values."); setLoading(false); return; }

    try {
      const response = await fetch("http://127.0.0.1:8000/cbc/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      setCbcResult(data.cbc || {});
      setCbcInterpretation(data.interpretation || null);
      await authFetch("/cbc/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cbc: data.cbc, interpretation: data.interpretation, source: "manual" })
      });
      if (showHistory) fetchHistory();
      toast.success("Hematology analysis synchronized.");
    } catch (e) { toast.error("Sequence failed."); }
    finally { setLoading(false); }
  };

  const uploadPdf = async () => {
    if (!pdfFile) { toast.warn("Select report image/PDF"); return; }
    const formDataPdf = new FormData();
    formDataPdf.append("file", pdfFile);
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/cbc/upload-report", { method: "POST", body: formDataPdf });
      const data = await response.json();
      setCbcResult(data.cbc || {});
      setCbcInterpretation(data.interpretation || null);
      if (Object.keys(data.cbc || {}).length > 0) {
        await authFetch("/cbc/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cbc: data.cbc, interpretation: data.interpretation, source: "pdf" })
        });
        if (showHistory) fetchHistory();
        toast.success("Extraction map complete.");
      } else { toast.error("No detectable telemetry data."); }
    } catch (e) { toast.error("Extraction failed."); }
    finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    try {
      const response = await authFetch("/cbc/history");
      if (response.ok) {
        const data = await response.json();
        setMyReports(data.reports || []);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (showHistory) fetchHistory();
  }, [showHistory, authFetch]);

  const chartData = useMemo(() => {
    return [...myReports].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(r => {
      const v = r.cbc || {};
      return {
        date: new Date(r.created_at).toLocaleDateString(),
        Hemoglobin: v.Hemoglobin?.value,
        RBC: v.RBC?.value,
        WBC: v.WBC?.value ? v.WBC.value / 1000 : null,
        Platelets: v.Platelets?.value ? v.Platelets.value / 1000 : null
      };
    });
  }, [myReports]);

  return (
    <div className="dashboard-root">
      <Navbar />

      <main className="db-container">
        {/* Header */}
        <div style={{ gridColumn: 'span 12', marginBottom: '32px' }} className="animate-db">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--db-accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>HEMATOLOGY INTELLIGENCE</h2>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--db-text)', margin: 0, letterSpacing: '-0.02em' }}>Advanced Differential Analysis</h1>
            </div>
            <button className="db-btn-secondary" onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? "CLOSE REGISTRY" : "VIEW HISTORICAL LOGS"}
            </button>
          </div>
        </div>

        {/* History overlay */}
        {showHistory && (
          <div className="db-card animate-db" style={{ gridColumn: 'span 12', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Clinical Registry History</h3>
              <div className="db-nav-links" style={{ height: 'auto', background: 'var(--db-card)', padding: 4, borderRadius: 10 }}>
                <button className={`db-nav-item ${historyTab === 'table' ? 'active' : ''}`} onClick={() => setHistoryTab('table')} style={{ border: 'none', cursor: 'pointer' }}>Registry</button>
                <button className={`db-nav-item ${historyTab === 'trends' ? 'active' : ''}`} onClick={() => setHistoryTab('trends')} style={{ border: 'none', cursor: 'pointer' }}>Trajectories</button>
              </div>
            </div>

            <div className="db-table-container">
              {historyTab === 'table' ? (
                <table className="db-table">
                  <thead><tr><th>Timestamp</th><th>Interpretation Vector</th><th>Telemetry Density</th></tr></thead>
                  <tbody>
                    {myReports.map(r => (
                      <tr key={r.id}>
                        <td>{new Date(r.created_at).toLocaleDateString()}</td>
                        <td style={{ fontSize: 13, color: 'var(--db-muted)' }}>{r.interpretation?.summary || "No data"}</td>
                        <td><span className="db-badge db-badge-green">{r.source}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ height: 350, padding: 20 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                      <XAxis dataKey="date" axisLine={{stroke: 'rgba(255, 255, 255, 0.1)'}} tick={{fill: 'var(--db-muted)', fontSize: 11}} />
                      <YAxis axisLine={{stroke: 'rgba(255, 255, 255, 0.1)'}} tick={{fill: 'var(--db-muted)', fontSize: 11}} />
                      <Tooltip contentStyle={{ background: 'var(--db-card)', border: '1px solid var(--db-border)', borderRadius: '8px', fontSize: 12 }} />
                      <Legend />
                      <Line type="monotone" dataKey="Hemoglobin" stroke="var(--db-crimson)" strokeWidth={3} />
                      <Line type="monotone" dataKey="RBC" stroke="var(--db-amber)" strokeWidth={3} />
                      <Line type="monotone" dataKey="WBC" stroke="var(--db-accent)" strokeWidth={3} />
                      <Line type="monotone" dataKey="Platelets" stroke="var(--db-emerald)" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Extraction Panel */}
        <div className="db-card animate-db" style={{ gridColumn: 'span 8', animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Telemetry Ingestion</h3>
            <div className="db-nav-links" style={{ height: 'auto', background: 'var(--db-bg)', padding: 4, borderRadius: 10 }}>
              <button className={`db-nav-item ${intakeTab === 'upload' ? 'active' : ''}`} onClick={() => setIntakeTab('upload')} style={{ border: 'none', cursor: 'pointer' }}>Pulse Upload</button>
              <button className={`db-nav-item ${intakeTab === 'manual' ? 'active' : ''}`} onClick={() => setIntakeTab('manual')} style={{ border: 'none', cursor: 'pointer' }}>Manual Link</button>
            </div>
          </div>

          {intakeTab === 'upload' ? (
            <div style={{ padding: '60px', border: '1px dashed var(--db-border)', borderRadius: '24px', textAlign: 'center', background: 'var(--db-card)' }}>
              <input type="file" accept="application/pdf, image/*" onChange={(e) => setPdfFile(e.target.files[0])} style={{ display: 'block', margin: '0 auto 24px', color: 'var(--db-muted)' }} />
              <button className="db-btn-primary" style={{ margin: '0 auto' }} onClick={uploadPdf} disabled={loading}>{loading ? "PROCESSING..." : "EXECUTE EXTRACTION"}</button>
            </div>
          ) : (
            <div className="db-form">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {Object.keys(manualData).map(k => (
                  <div key={k} className="db-input-group">
                    <span>{k}</span>
                    <input className="db-input" name={k} type="number" step="0.1" value={manualData[k]} onChange={handleManualChange} placeholder="0.0" />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button 
                  className={`db-btn-primary ${Object.values(manualData).some(v => v !== '') ? 'pulse-glow' : ''}`} 
                  onClick={analyzeManualReport} 
                  disabled={loading}
                >
                  {loading ? "PROCESSING..." : "EXECUTE ANALYSIS"}
                </button>
              </div>
            </div>
          )}

          {cbcResult && (
            <div style={{ marginTop: 32 }}>
               <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--db-muted)', textTransform: 'uppercase', marginBottom: 16 }}>Telemetry Markers</h4>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  {Object.entries(cbcResult).map(([k, v]) => (
                    <div key={k} className="db-card" style={{ padding: 16, border: '1px solid var(--db-border)', background: 'var(--db-bg)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--db-muted)', marginBottom: 4 }}>{k}</div>
                      <div style={{ fontSize: 20, fontWeight: 800 }}>{v.value} <span style={{fontSize: 10, color: 'var(--db-muted)'}}>{v.unit}</span></div>
                      <span className={`db-badge ${v.status === 'Normal' ? 'db-badge-green' : 'db-badge-crimson'}`} style={{ marginTop: 10 }}>{v.status}</span>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>

        {/* Interp Panel */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="db-card animate-db" style={{ animationDelay: '0.2s', height: '100%' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 24px' }}>Neuro-Pulse Interpretation</h3>
            {cbcInterpretation ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--db-text)', margin: 0 }}>{cbcInterpretation.summary}</p>
                <div>
                   <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--db-muted)', textTransform: 'uppercase' }}>Identified Vectors</span>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                     {cbcInterpretation.possible_conditions?.map(c => <span key={c} className="db-badge" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--db-border)' }}>{c}</span>)}
                   </div>
                </div>
                {cbcInterpretation.ml_prediction && (
                  <div style={{ background: 'var(--db-teal-soft)', border: '1px solid rgba(13, 148, 136, 0.1)', padding: 16, borderRadius: 16 }}>
                     <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--db-accent)' }}>AI PATTERN DETECTED</div>
                     <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4, color: 'var(--db-text)' }}>{cbcInterpretation.ml_prediction}</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--db-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🔬</div>
                <p style={{ margin: 0, fontSize: 14 }}>Awaiting blood telemetry sync to generate differential diagnostics.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default CbcAnalysisPage;
