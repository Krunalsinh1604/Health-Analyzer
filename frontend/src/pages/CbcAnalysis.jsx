import { useState, useMemo, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import Navbar from "../components/Navbar";
import dashboardHero from "../assets/dashboard-hero.png";
import { toast } from "react-toastify";

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
    const color = status === 'Normal' ? '#22c55e' : (status === 'Low' ? '#f59e0b' : '#ef4444');
    // simple ring data
    const data = [{ value: 1 }];

    return (
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '120px', height: '120px', position: 'relative' }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={55}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={color} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            width: '80%'
          }}>
            <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--text-main)', lineHeight: 1.2 }}>{value}</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{unit}</span>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>{label}</h4>
          <span className={`badge ${status === 'Normal' ? 'ok' : 'alert'}`}>{status}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <Navbar />

      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Hematology Intelligence</h2>
            <p style={{ color: 'var(--muted)', maxWidth: '600px' }}>
              Advanced differential analysis of blood reports. Upload a PDF or simple photo of your report to get instant clinical insights and visualizations.
            </p>
          </div>
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
              <button
                className={historyTab === 'table' ? 'active' : ''}
                onClick={() => setHistoryTab('table')}
              >
                Table
              </button>
              <button
                className={historyTab === 'trends' ? 'active' : ''}
                onClick={() => setHistoryTab('trends')}
              >
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
                        <th>Summary</th>
                        <th>Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myReports.map(r => (
                        <tr key={r.id}>
                          <td>{new Date(r.created_at).toLocaleDateString()}</td>
                          <td>{r.interpretation?.summary || "No summary"}</td>
                          <td>{r.source}</td>
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
                      <Line type="monotone" dataKey="Hemoglobin" stroke="#ef4444" name="Hemoglobin (g/dL)" />
                      <Line type="monotone" dataKey="RBC" stroke="#f97316" name="RBC (mill/cumm)" />
                      <Line type="monotone" dataKey="WBC" stroke="#3b82f6" name="WBC (x1000/cumm)" />
                      <Line type="monotone" dataKey="Platelets" stroke="#8b5cf6" name="Platelets (x1000)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <div className="layout">
        <section className="panel">
          <div className="card">
            <div className="card-header">
              <div>
                <h3>Report Intake</h3>
                <p>Upload a PDF/Image or enter values manually.</p>
              </div>
              <div className="tabs">
                <button
                  className={intakeTab === 'upload' ? 'active' : ''}
                  onClick={() => setIntakeTab('upload')}
                >
                  Upload
                </button>
                <button
                  className={intakeTab === 'manual' ? 'active' : ''}
                  onClick={() => setIntakeTab('manual')}
                >
                  Manual Entry
                </button>
              </div>
            </div>

            {intakeTab === 'upload' ? (
              <div className="upload-container" style={{ padding: '2rem', border: '2px dashed var(--border)', borderRadius: '12px', textAlign: 'center', background: 'var(--bg-sub)' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div className="upload-row" style={{ justifyContent: 'center' }}>
                  <input
                    type="file"
                    accept="application/pdf, image/*"
                    onChange={(event) => setPdfFile(event.target.files[0])}
                    style={{ maxWidth: '300px' }}
                  />
                  <button onClick={uploadPdf} className="btn-primary">Analyze Report</button>
                </div>
                <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                  Supports PDF, JPG, PNG. Ensure text is clear.
                </p>
                {pdfError && <p className="error-text" style={{ textAlign: 'center', marginTop: '1rem' }}>{pdfError}</p>}
              </div>
            ) : (
              <div className="manual-entry-form">
                <div className="form-grid">
                  {Object.keys(manualData).map((key) => (
                    <label key={key} className="field">
                      <span>{key}</span>
                      <input
                        type="number"
                        step="0.1"
                        name={key}
                        placeholder={`Enter ${key}`}
                        value={manualData[key]}
                        onChange={handleManualChange}
                      />
                    </label>
                  ))}
                </div>
                <div className="card-actions" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button onClick={analyzeManualReport} className="btn-primary" disabled={loading}>
                    {loading ? "Analyzing..." : "Analyze Values"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {cbcResult && Object.keys(cbcResult).length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3>Extracted Findings</h3>
                <span className="chip chip-live">Analysis Complete</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                {Object.entries(cbcResult).map(([key, value]) => (
                  <MetricGauge
                    key={key}
                    label={key}
                    value={value.value}
                    unit={value.unit}
                    status={value.status}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="side">
          <div className="card">
            <div className="card-header">
              <h3>Clinical Interpretation</h3>
            </div>
            {cbcInterpretation ? (
              <div className="summary-block">
                <p style={{ lineHeight: '1.6', fontSize: '1.25rem', fontWeight: 500 }}>{cbcInterpretation.summary}</p>

                {cbcInterpretation.possible_conditions?.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ fontSize: '1rem', color: 'var(--muted)', marginBottom: '12px' }}>Possible Indication</h4>
                    <div className="pill-grid">
                      {cbcInterpretation.possible_conditions.map((item) => (
                        <div className="pill" key={item} style={{ fontSize: '1.1rem', padding: '8px 16px' }}>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {cbcInterpretation.ml_prediction && (
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                    <h4 style={{ fontSize: '1rem', color: 'var(--muted)', marginBottom: '8px' }}>AI Model Classification</h4>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>{cbcInterpretation.ml_prediction}</strong>
                  </div>
                )}
                {cbcInterpretation.note && (
                  <p className="note-text" style={{ marginTop: '20px', fontStyle: 'italic', color: 'var(--muted)', fontSize: '1rem' }}>{cbcInterpretation.note}</p>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
                Upload a report to generate clinical insights.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default CbcAnalysisPage;
