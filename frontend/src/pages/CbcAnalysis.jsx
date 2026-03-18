import { useState, useMemo, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import { C } from "../theme";

function CbcAnalysisPage() {
  const { user, logout, authFetch } = useAuth();
  const [pdfFile, setPdfFile] = useState(null);
  const [cbcResult, setCbcResult] = useState(null);
  const [cbcInterpretation, setCbcInterpretation] = useState(null);
  const [pdfError, setPdfError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [historyTab, setHistoryTab] = useState("table");
  const [myReports, setMyReports] = useState([]);

  // Manual Entry State
  const [intakeTab, setIntakeTab] = useState('upload'); // 'upload' or 'manual'
  const [loading, setLoading] = useState(false);
  const [manualData, setManualData] = useState({
    Hemoglobin: "",
    RBC: "",
    WBC: "",
    Platelets: "",
    ESR: "",
    MCV: "",
    MCH: "",
    RDW: "",
    Neutrophils: "",
    Lymphocytes: "",
    Monocytes: "",
    Eosinophils: "",
    Basophils: ""
  });

  const handleManualChange = (e) => {
    setManualData({ ...manualData, [e.target.name]: e.target.value });
  };

  const analyzeManualReport = async () => {
    setLoading(true);
    setCbcResult(null);
    setCbcInterpretation(null);

    // Filter out empty strings and convert to numbers
    const payload = {};
    Object.entries(manualData).forEach(([key, value]) => {
      if (value !== "") {
        payload[key] = parseFloat(value);
      }
    });

    if (Object.keys(payload).length === 0) {
      toast.warn("Please enter at least one value.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/cbc/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      const extracted = data.cbc || {};
      const interpretation = data.interpretation || null;

      setCbcResult(extracted);
      setCbcInterpretation(interpretation);

      await saveCbcReport(extracted, interpretation, "manual");
      toast.success("Analysis complete!");

    } catch (error) {
      console.error("Manual analysis error:", error);
      toast.error("Failed to analyze manual input.");
    } finally {
      setLoading(false);
    }
  };

  const saveCbcReport = async (cbcData, interpretation, source = "pdf") => {
    try {
      await authFetch("/cbc/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cbc: cbcData,
          interpretation,
          source: source
        })
      });
      // Refresh history if it's open
      if (showHistory) {
        fetchHistory();
      }
    } catch (error) {
      console.error("Failed to save CBC report", error);
      toast.error("Failed to save report to history");
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await authFetch("/cbc/history");
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
    return [...myReports].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(r => {
      const vals = r.cbc || {};
      return {
        date: new Date(r.created_at).toLocaleDateString(),
        Hemoglobin: vals.Hemoglobin?.value,
        RBC: vals.RBC?.value,
        WBC: vals.WBC?.value ? vals.WBC.value / 1000 : null, // Scale by 1000
        Platelets: vals.Platelets?.value ? vals.Platelets.value / 1000 : null // Scale by 1000
      };
    });
  }, [myReports]);

  const uploadPdf = async () => {
    if (!pdfFile) {
      toast.warn("Please select a PDF file first");
      return;
    }

    const formDataPdf = new FormData();
    formDataPdf.append("file", pdfFile);

    setPdfError("");
    setCbcResult(null);
    setCbcInterpretation(null);

    const loaderId = toast.loading("Processing report...");

    try {
      const response = await fetch("http://127.0.0.1:8000/cbc/upload-report", {
        method: "POST",
        body: formDataPdf
      });

      if (!response.ok) {
        setPdfError("PDF upload failed. Please try again.");
        toast.update(loaderId, { render: "Upload failed", type: "error", isLoading: false, autoClose: 3000 });
        return;
      }

      const data = await response.json();
      const extracted = data.cbc || {};
      const interpretation = data.interpretation || null;
      setCbcResult(extracted);
      setCbcInterpretation(interpretation);

      if (Object.keys(extracted).length === 0) {
        setPdfError("No CBC values detected. Try a clearer report.");
        toast.update(loaderId, { render: "No CBC data found", type: "warning", isLoading: false, autoClose: 3000 });
      } else {
        await saveCbcReport(extracted, interpretation, "pdf");
        toast.update(loaderId, { render: "Analysis complete!", type: "success", isLoading: false, autoClose: 3000 });
      }
    } catch (error) {
      setPdfError("Unable to process the PDF right now.");
      toast.update(loaderId, { render: "Processing error", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  /* ... inside the component ... */

  // Helper for individual gauges
  const MetricGauge = ({ label, value, unit, status }) => {
    // determine color based on status
    const color = status === 'Normal' ? C.emerald : (status === 'Low' ? C.amber : C.crimson);
    const bg = status === 'Normal' ? C.emeraldBg : (status === 'Low' ? C.amberBg : C.crimsonBg);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', padding: '16px', background: C.lightBg2, borderRadius: '12px', border: `1px solid ${C.lightBorder}` }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: C.lightMuted, textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' }}>
           <span style={{ fontSize: '24px', fontWeight: 800, color: C.lightText, fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
           <span style={{ fontSize: '12px', color: C.lightMuted }}>{unit}</span>
        </div>
        <div>
           <span style={{ display: 'inline-block', background: bg, color: color, padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>{status}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="grid-bg-light" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
      <Navbar />

      <div className="page-inner">
        <div className="animate-up" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span className="feature-pill">HEMATOLOGY INTELLIGENCE</span>
            <h2 className="page-title">Advanced Differential Analysis</h2>
            <p className="page-desc">Upload a PDF or simple photo of your report to get instant clinical insights and visualizations.</p>
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
                       <thead><tr><th>Date</th><th>Summary</th><th>Source</th></tr></thead>
                       <tbody>
                         {myReports.map(r => (
                           <tr key={r.id}>
                             <td style={{ fontWeight: 600 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                             <td>{r.interpretation?.summary || "No summary"}</td>
                             <td><span style={{ background: C.lightBg2, padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>{r.source}</span></td>
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
                          <Line type="monotone" dataKey="Hemoglobin" stroke={C.crimson} strokeWidth={3} dot={{ r: 4 }} name="Hemoglobin (g/dL)" />
                          <Line type="monotone" dataKey="RBC" stroke={C.amber} strokeWidth={3} dot={{ r: 4 }} name="RBC" />
                          <Line type="monotone" dataKey="WBC" stroke={C.blueBright} strokeWidth={3} dot={{ r: 4 }} name="WBC" />
                          <Line type="monotone" dataKey="Platelets" stroke={C.purple} strokeWidth={3} dot={{ r: 4 }} name="Platelets" />
                        </LineChart>
                     </ResponsiveContainer>
                   </div>
                 )}
               </>
             )}
          </section>
        )}

        <div className="layout animate-up" style={{ animationDelay: '0.2s', display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: '24px', marginBottom: '32px' }}>
          
          <section className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="bento-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>Report Intake</h3>
                  <p style={{ color: C.lightMuted, margin: 0 }}>Upload a PDF/Image or enter values manually.</p>
                </div>
                <div className="tabs-light">
                  <button className={intakeTab === 'upload' ? 'active' : ''} onClick={() => setIntakeTab('upload')}>Upload</button>
                  <button className={intakeTab === 'manual' ? 'active' : ''} onClick={() => setIntakeTab('manual')}>Manual Entry</button>
                </div>
              </div>

              {intakeTab === 'upload' ? (
                <div style={{ padding: '40px 20px', border: `2px dashed ${C.lightBorder}`, borderRadius: '16px', textAlign: 'center', background: C.lightBg2, transition: '0.2s' }}>
                  <div style={{ marginBottom: '16px', background: '#fff', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: C.shadowCard }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <input type="file" accept="application/pdf, image/*" onChange={(e) => setPdfFile(e.target.files[0])} style={{ padding: '10px', background: '#fff', borderRadius: '8px', border: `1px solid ${C.lightBorder}` }} />
                    <button onClick={uploadPdf} className="btn-primary" style={{ padding: '12px 24px' }}>Analyze Report</button>
                  </div>
                  <p style={{ marginTop: '16px', fontSize: '14px', color: C.lightMuted }}>Supports PDF, JPG, PNG. Ensure text is clear and readable.</p>
                  {pdfError && <p style={{ color: C.crimson, marginTop: '16px', fontWeight: 600 }}>{pdfError}</p>}
                </div>
              ) : (
                <div className="field-light">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                    {Object.keys(manualData).map((key) => (
                      <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span>{key}</span>
                        <input type="number" step="0.1" name={key} placeholder={`e.g. 10`} value={manualData[key]} onChange={handleManualChange} />
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <button onClick={analyzeManualReport} className="btn-primary" disabled={loading}>
                      {loading ? "Analyzing..." : "Analyze Values"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {cbcResult && Object.keys(cbcResult).length > 0 && (
              <div className="bento-card animate-up" style={{ background: C.lightBg1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Extracted Findings</h3>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(59,130,246,0.1)', color: C.blue, padding: '6px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 700 }}>
                     <span style={{ width: '6px', height: '6px', background: C.blueBright, borderRadius: '50%', boxShadow: `0 0 6px ${C.blueBright}` }} /> Analysis Complete
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                  {Object.entries(cbcResult).map(([key, value]) => (
                    <MetricGauge key={key} label={key} value={value.value} unit={value.unit} status={value.status} />
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="side">
            <div className="bento-card" style={{ height: '100%' }}>
              <div style={{ marginBottom: '20px', borderBottom: `1px solid ${C.lightBorder}`, paddingBottom: '16px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Clinical Interpretation</h3>
              </div>
              
              {cbcInterpretation ? (
                <div>
                  <p style={{ fontSize: '16px', lineHeight: 1.6, color: C.lightText, fontWeight: 500, margin: '0 0 24px' }}>
                    {cbcInterpretation.summary}
                  </p>

                  {cbcInterpretation.possible_conditions?.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: C.lightMuted, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Indications</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {cbcInterpretation.possible_conditions.map((item) => (
                          <span key={item} style={{ background: C.lightBg2, border: `1px solid ${C.lightBorder}`, padding: '8px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 600 }}>{item}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {cbcInterpretation.ml_prediction && (
                    <div style={{ background: C.lightBg2, padding: '20px', borderRadius: '16px', border: `1px solid ${C.lightBorder}`, marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                         <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: C.shadowCard }}>🤖</div>
                         <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: C.lightMuted, textTransform: 'uppercase' }}>ML Pattern Detected</div>
                            <strong style={{ fontSize: '16px', color: C.blueBright }}>{cbcInterpretation.ml_prediction}</strong>
                         </div>
                      </div>
                      
                      {cbcInterpretation.ml_model_insights && (
                        <div style={{ display: 'grid', gap: '12px', background: '#fff', padding: '16px', borderRadius: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                            <span style={{ color: C.lightMuted, fontWeight: 500 }}>Algorithm</span>
                            <strong style={{ color: C.lightText }}>{cbcInterpretation.ml_model_insights.algorithm}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                            <span style={{ color: C.lightMuted, fontWeight: 500 }}>Confidence</span>
                            <strong style={{ color: C.emerald }}>{cbcInterpretation.ml_model_insights.probability}%</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {cbcInterpretation.note && (
                    <div style={{ background: C.amberBg, color: '#d97706', padding: '16px', borderRadius: '12px', fontSize: '14px', fontWeight: 500, lineHeight: 1.5 }}>
                      <strong>Note:</strong> {cbcInterpretation.note}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', textAlign: 'center', color: C.lightMuted }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🔬</div>
                  <p style={{ margin: 0, fontSize: '15px', maxWidth: '200px' }}>Upload a report or enter manual data to generate clinical insights.</p>
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
                <p style={{ color: C.lightMuted, margin: 0 }}>Key indicators evaluated during a Complete Blood Count analysis.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {[
                  { t: 'Hemoglobin', d: 'The protein in red blood cells that carries oxygen. Low levels indicate anemia.' },
                  { t: 'RBC Count', d: 'Total number of red blood cells. Irregular counts often track alongside hemoglobin abnormalities.' },
                  { t: 'WBC Count', d: 'Total white blood cell count. High values often signify active infections or inflammation.' },
                  { t: 'Platelets', d: 'Cell fragments that help your blood clot. Low points risk excessive bleeding.' },
                  { t: 'MCV', d: 'The average size of your red blood cells. Differentiates between microcytic and macrocytic anemias.' },
                  { t: 'ESR', d: 'Erythrocyte Sedimentation Rate. A generalized marker that indicates inflammation.' }
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
                <p style={{ color: C.lightMuted, margin: 0 }}>Lifestyle and dietary habits to maintain a healthy blood profile.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {[
                  { i: '🥦', t: 'Iron & Vitamin Intake', d: 'Ensure adequate consumption of iron-rich foods (spinach, beans) and Vitamin B12.' },
                  { i: '💧', t: 'Hydration', d: 'Drinking enough water helps maintain proper blood volume and prevents inflated concentration.' },
                  { i: '🛡️', t: 'Immune Support', d: 'Manage stress, get adequate sleep, and exercise moderately to maintain WBC ratios.' }
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

export default CbcAnalysisPage;
