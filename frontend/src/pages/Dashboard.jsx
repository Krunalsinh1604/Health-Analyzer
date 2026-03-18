import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { C } from '../theme';

function DiabetesPage() {
  const { user, logout, authFetch } = useAuth();
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
  const [dataSource, setDataSource] = useState("manual");
  const [showHistory, setShowHistory] = useState(false);
  const [historyTab, setHistoryTab] = useState("table"); // 'table' or 'trends'
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // ... (existing referenceMetrics and helper functions remain unchanged)

  const referenceMetrics = useMemo(
    () => [
      {
        key: "Glucose",
        label: "Glucose",
        unit: "mg/dL",
        low: 70,
        high: 140,
        target: 100
      },
      {
        key: "BloodPressure",
        label: "Blood Pressure",
        unit: "mmHg",
        low: 60,
        high: 90,
        target: 75
      },
      {
        key: "BMI",
        label: "BMI",
        unit: "kg/m2",
        low: 18.5,
        high: 24.9,
        target: 22
      },
      {
        key: "Insulin",
        label: "Insulin",
        unit: "mu U/mL",
        low: 2,
        high: 25,
        target: 12
      },
      {
        key: "SkinThickness",
        label: "Skin Thickness",
        unit: "mm",
        low: 10,
        high: 45,
        target: 25
      },
      {
        key: "Age",
        label: "Age",
        unit: "years",
        low: 18,
        high: 65,
        target: 40
      }
    ],
    []
  );

  const parseNumber = (value) => {
    if (value === "") {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const compareRows = useMemo(() => {
    return referenceMetrics.map((metric) => {
      const value = parseNumber(formData[metric.key]);
      if (value === null) {
        return { ...metric, value: null, delta: null, status: "neutral" };
      }
      const delta = value - metric.target;
      const status = value < metric.low || value > metric.high ? "alert" : "ok";
      return { ...metric, value, delta, status };
    });
  }, [formData, referenceMetrics]);

  const filledFields = Object.values(formData).filter((value) => value !== "");
  const completionRate = Math.round(
    (filledFields.length / Object.keys(formData).length) * 100
  );

  const inRangeCount = compareRows.filter(
    (row) => row.value !== null && row.status === "ok"
  ).length;
  const trackedCount = compareRows.filter((row) => row.value !== null).length;
  const profileScore = trackedCount
    ? Math.round((inRangeCount / trackedCount) * 100)
    : 0;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setDataSource("manual");
  };

  const fetchHistory = async () => {
    try {
      const response = await authFetch("/reports/history");
      if (response.ok) {
        const data = await response.json();
        // Reverse for chart (oldest to newest), but keep logic flexible
        const reports = data.reports || [];
        setMyReports(reports);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
  };

  const analyzeReport = async () => {
    setLoading(true);
    setResult(null);

    try {
      // 1. Get Prediction
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

      // 2. Save Report (Authenticated)
      const payload = {
        inputs: {
          Glucose: Number(formData.Glucose),
          BloodPressure: Number(formData.BloodPressure),
          SkinThickness: Number(formData.SkinThickness),
          Insulin: Number(formData.Insulin),
          BMI: Number(formData.BMI),
          DiabetesPedigreeFunction: Number(formData.DiabetesPedigreeFunction),
          Age: Number(formData.Age)
        },
        outputs: data,
        source: dataSource,
      };

      await authFetch("/reports/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Refresh history if open
      if (showHistory) {
        fetchHistory();
      }

    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred during analysis or saving.");
    } finally {
      setLoading(false);
    }
  };

  const uploadPdf = async () => {
    if (!pdfFile) {
      toast.warn("Please select a file first");
      return;
    }

    const formDataPdf = new FormData();
    formDataPdf.append("file", pdfFile);

    setPdfError("");
    setPdfResult(null);

    const loaderId = toast.loading("Uploading report...");

    try {
      const response = await fetch("http://127.0.0.1:8000/upload-report", {
        method: "POST",
        body: formDataPdf
      });

      if (!response.ok) {
        setPdfError("PDF upload failed. Please try again.");
        toast.update(loaderId, { render: "Upload failed", type: "error", isLoading: false, autoClose: 3000 });
        return;
      }

      const data = await response.json();
      const extracted = data.extracted_parameters || {};
      setPdfResult(extracted);
      setDataSource("pdf");

      if (Object.keys(extracted).length === 0) {
        setPdfError("No parameters detected. Try a clearer report.");
        toast.update(loaderId, { render: "No data detected", type: "warning", isLoading: false, autoClose: 3000 });
      } else {
        toast.update(loaderId, { render: "Report processed successfully!", type: "success", isLoading: false, autoClose: 3000 });
      }
    } catch (error) {
      setPdfError("Unable to process the PDF right now.");
      toast.update(loaderId, { render: "Processing error", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const applyPdfData = () => {
    setFormData((prev) => ({
      ...prev,
      ...pdfResult
    }));
    setDataSource("manual");
  };

  // Prepare data for chart (sorted by date ascending)
  const chartData = useMemo(() => {
    return [...myReports].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(r => ({
      date: new Date(r.created_at).toLocaleDateString(),
      Glucose: r.glucose,
      BMI: r.bmi,
      BP: r.blood_pressure
    }));
  }, [myReports]);

  return (
    <div className="page-container">
      <div className="grid-bg-light" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
      <Navbar />

      <div className="page-inner">
        {/* Header */}
        <div className="animate-up" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span className="feature-pill">CHRONIC CONDITION TRACKING</span>
            <h2 className="page-title">Diabetes Intelligence</h2>
            <p className="page-desc">Real-time glucose monitoring and ML-driven risk assessment.</p>
          </div>
          <button className="btn-secondary-light" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? "Hide History" : "View My Report History"}
          </button>
        </div>

        {/* Status Metrics */}
        <div className="layout animate-up" style={{ animationDelay: '0.1s', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div className="bento-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px' }}>
            <div>
              <p style={{ color: C.lightMuted, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Diabetes Status</p>
              <h3 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: C.lightText }}>{result?.diabetes_prediction || "Pending"}</h3>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: result ? C.emeraldBg : C.lightBg2, color: result ? C.emerald : C.lightMuted }}>
              {result ? "Analysis Ready" : "Awaiting Data"}
            </span>
          </div>

          <div className="bento-card" style={{ padding: '24px' }}>
            <p style={{ color: C.lightMuted, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Risk Profile</p>
            <h3 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: result?.risk_level === 'High Risk' ? C.crimson : result?.risk_level === 'Medium Risk' ? '#FFB300' : result?.risk_level === 'Low Risk' ? C.emerald : C.lightText }}>
              {result?.risk_level || "Unknown"}
            </h3>
            <div style={{ height: '4px', background: C.lightBg2, borderRadius: '2px', overflow: 'hidden', marginTop: '12px' }}>
              <div style={{ height: '100%', width: result?.risk_level === 'High Risk' ? '100%' : result?.risk_level === 'Medium Risk' ? '60%' : '30%', background: result?.risk_level === 'High Risk' ? C.crimson : result?.risk_level === 'Medium Risk' ? '#FFB300' : C.emerald, transition: 'width 0.5s ease' }} />
            </div>
          </div>

          <div className="bento-card" style={{ padding: '24px' }}>
            <p style={{ color: C.lightMuted, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Profile Completeness</p>
            <h3 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: C.lightText }}>{completionRate}%</h3>
            <div style={{ height: '4px', background: C.lightBg2, borderRadius: '2px', overflow: 'hidden', marginTop: '12px' }}>
              <div style={{ height: '100%', width: `${completionRate}%`, background: C.primary, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        </div>

        {/* History Section overlay */}
        {showHistory && (
          <div className="bento-card animate-up" style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>My Report History</h3>
              <div style={{ display: 'flex', gap: '8px', background: C.lightBg2, padding: '4px', borderRadius: '8px' }}>
                <button style={{ padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', background: historyTab === 'table' ? '#fff' : 'transparent', color: historyTab === 'table' ? C.primary : C.lightMuted, boxShadow: historyTab === 'table' ? C.shadowCard : 'none', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setHistoryTab('table')}>Table</button>
                <button style={{ padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', background: historyTab === 'trends' ? '#fff' : 'transparent', color: historyTab === 'trends' ? C.primary : C.lightMuted, boxShadow: historyTab === 'trends' ? C.shadowCard : 'none', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setHistoryTab('trends')}>Trends</button>
              </div>
            </div>

            {myReports.length === 0 ? <p style={{ color: C.lightMuted, textAlign: 'center', padding: '40px 0' }}>No reports found.</p> : (
              <>
                {historyTab === 'table' ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${C.lightBorder}`, color: C.lightMuted }}>
                          <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600 }}>Glucose</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600 }}>BMI</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600 }}>Prediction</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600 }}>Risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myReports.map(r => (
                          <tr key={r.id} style={{ borderBottom: `1px solid ${C.lightBorder}` }}>
                            <td style={{ padding: '12px 16px', color: C.lightText, fontWeight: 500 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                            <td style={{ padding: '12px 16px', color: C.lightText }}>{r.glucose}</td>
                            <td style={{ padding: '12px 16px', color: C.lightText }}>{r.bmi}</td>
                            <td style={{ padding: '12px 16px', color: C.lightText }}>{r.diabetes_prediction}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', background: r.risk_level === 'High Risk' ? C.crimsonBg : r.risk_level === 'Medium Risk' ? 'rgba(255,179,0,0.1)' : C.emeraldBg, color: r.risk_level === 'High Risk' ? C.crimson : r.risk_level === 'Medium Risk' ? '#FFB300' : C.emerald }}>
                                {r.risk_level}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: 300, marginTop: '20px' }}>
                    <ResponsiveContainer>
                      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.lightBorder} />
                        <XAxis dataKey="date" stroke={C.lightMuted} fontSize={12} tickMargin={10} />
                        <YAxis stroke={C.lightMuted} fontSize={12} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${C.lightBorder}`, boxShadow: C.shadowCard }} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line type="monotone" dataKey="Glucose" stroke={C.primary} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Glucose (mg/dL)" />
                        <Line type="monotone" dataKey="BMI" stroke={C.emerald} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="BMI" />
                        <Line type="monotone" dataKey="BP" stroke="#FFB300" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Blood Pressure" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="layout animate-up" style={{ animationDelay: '0.2s', display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: '24px', marginBottom: '32px' }}>
          <section className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="bento-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>Report Intake</h3>
                  <p style={{ color: C.lightMuted, margin: 0 }}>Upload a PDF/Image or enter values manually.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', background: C.lightBg2, padding: '4px', borderRadius: '8px' }}>
                  <button style={{ padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', background: dataSource === 'pdf' ? '#fff' : 'transparent', color: dataSource === 'pdf' ? C.primary : C.lightMuted, boxShadow: dataSource === 'pdf' ? C.shadowCard : 'none', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setDataSource('pdf')}>Upload</button>
                  <button style={{ padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', background: dataSource === 'manual' ? '#fff' : 'transparent', color: dataSource === 'manual' ? C.primary : C.lightMuted, boxShadow: dataSource === 'manual' ? C.shadowCard : 'none', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setDataSource('manual')}>Manual Entry</button>
                </div>
              </div>

              {dataSource === 'pdf' ? (
                <div style={{ background: C.lightBg2, padding: '32px', borderRadius: '16px', border: `1px dashed ${C.lightBorder}`, textAlign: 'center' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <input type="file" accept="application/pdf, image/*" onChange={(e) => setPdfFile(e.target.files[0])} style={{ display: 'block', margin: '0 auto 16px' }} />
                    <button onClick={uploadPdf} className="btn-primary">Extract Data</button>
                  </div>
                  {pdfError && <p style={{ color: C.crimson }}>{pdfError}</p>}

                  {pdfResult && Object.keys(pdfResult).length > 0 && (
                    <div style={{ textAlign: 'left', background: '#fff', padding: '24px', borderRadius: '12px', border: `1px solid ${C.lightBorder}`, marginTop: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Extracted Parameters</h4>
                        <button className="btn-secondary-light" onClick={applyPdfData}>Apply to Form</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                        {Object.entries(pdfResult).map(([key, value]) => (
                          <div key={key} style={{ background: C.lightBg2, padding: '12px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '12px', color: C.lightMuted, marginBottom: '4px' }}>{key}</div>
                            <strong style={{ fontSize: '15px' }}>{value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="field-light">
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                    <button type="button" className="btn-secondary-light" onClick={() => setFormData({ Glucose: "", BloodPressure: "", SkinThickness: "", Insulin: "", BMI: "", DiabetesPedigreeFunction: "", Age: "" })}>Clear Form</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                    {Object.keys(formData).map((key) => (
                      <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: C.lightText }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <input
                          name={key}
                          type="number"
                          step="any"
                          placeholder={`Enter ${key}`}
                          value={formData[key]}
                          onChange={handleChange}
                          style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${C.lightBorder}`, width: '100%', outline: 'none' }}
                        />
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
                    <button type="button" onClick={analyzeReport} className="clinical-btn" disabled={loading}>
                      {loading ? "Analyzing..." : "Run Analysis"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>

          <aside className="side" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="bento-card" style={{ height: 'max-content' }}>
              <div style={{ marginBottom: '20px', borderBottom: `1px solid ${C.lightBorder}`, paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px' }}>Analysis Results</h3>
                  <p style={{ color: C.lightMuted, fontSize: '14px', margin: 0 }}>Model confidence & findings</p>
                </div>
                <span style={{ background: C.lightBg3, color: C.lightMuted, padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Auto</span>
              </div>

              {result ? (
                <div>
                  <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: result.diabetes_prediction === 'Positive' ? C.crimsonBg : C.emeraldBg, border: `1px solid ${result.diabetes_prediction === 'Positive' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, padding: '16px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: result.diabetes_prediction === 'Positive' ? '#ef4444' : '#10b981', textTransform: 'uppercase', marginBottom: '8px' }}>Prediction</div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: result.diabetes_prediction === 'Positive' ? C.crimson : C.emerald }}>{result.diabetes_prediction}</div>
                    </div>
                  </div>

                  <div style={{ background: '#fff', border: `1px solid ${C.lightBorder}`, padding: '20px', borderRadius: '16px', boxShadow: C.shadowCard }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px' }}>ML Model Insights</h4>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ color: C.lightMuted, fontWeight: 500 }}>Algorithm</span>
                        <strong style={{ color: C.lightText }}>{result.ml_model_insights?.algorithm || "Machine Learning Model"}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ color: C.lightMuted, fontWeight: 500 }}>Confidence</span>
                        <strong style={{ color: C.emerald }}>{result.ml_model_insights ? `${result.ml_model_insights.probability}%` : "High"}</strong>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '24px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px' }}>Recommendations</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: C.lightMuted, fontSize: '14px', lineHeight: 1.6 }}>
                      {result.possible_conditions?.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', textAlign: 'center', color: C.lightMuted }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📊</div>
                  <p style={{ margin: 0, fontSize: '15px', maxWidth: '200px' }}>Run analysis to see detailed prediction results.</p>
                </div>
              )}
            </div>

            <div className="bento-card" style={{ height: 'max-content' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', color: C.lightText }}>Reference Comparison</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', fontSize: '12px', fontWeight: 700, color: C.lightMuted, textTransform: 'uppercase', paddingBottom: '8px', borderBottom: `1px solid ${C.lightBorder}` }}>
                  <span>Metric</span>
                  <span>Val</span>
                  <span>Range</span>
                  <span style={{ textAlign: 'right' }}>Δ</span>
                </div>
                {compareRows.map((row) => (
                  <div key={row.key} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', fontSize: '14px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: C.lightText }}>{row.label}</span>
                    <span style={{ color: C.lightText }}>{row.value ?? "-"}</span>
                    <span style={{ color: C.lightMuted, fontSize: '12px' }}>{row.low}-{row.high}</span>
                    <span style={{ textAlign: 'right', fontWeight: 700, color: row.status === 'alert' ? C.crimson : row.status === 'ok' ? C.emerald : C.lightMuted }}>
                      {row.delta ? (row.delta > 0 ? `+${row.delta.toFixed(0)}` : row.delta.toFixed(0)) : "-"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Info Cards */}
        <div className="animate-up" style={{ animationDelay: '0.3s' }}>
          <div className="bento-card" style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>Understanding Your Metrics</h3>
              <p style={{ color: C.lightMuted, margin: 0 }}>Key indicators used in diabetes risk assessment.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {[
                { t: 'Glucose', d: 'Blood sugar level. High levels (hyperglycemia) can indicate diabetes. Normal fasting range is typically 70-100 mg/dL.' },
                { t: 'BMI', d: 'Body Mass Index. A measure of body fat based on height and weight. 18.5-24.9 is considered healthy.' },
                { t: 'Insulin', d: 'A hormone that regulates blood sugar. High insulin can indicate insulin resistance, a precursor to type 2 diabetes.' },
                { t: 'Blood Pressure', d: 'Force of circulating blood. High BP (Hypertension) is a common comorbidity with diabetes. Target: < 120/80 mmHg.' },
                { t: 'Skin Thickness', d: 'Triceps skinfold thickness. Used to estimate body fat percentage and nutritional status.' },
                { t: 'Diabetes Pedigree', d: 'A function that scores likelihood of diabetes based on family history and genetic predisposition.' }
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
              <p style={{ color: C.lightMuted, margin: 0 }}>Lifestyle changes to manage and reduce risk.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {[
                { i: '🥗', t: 'Healthy Diet', d: 'Focus on whole foods, fiber, and lean proteins. Limit sugary drinks and processed carbohydrates.' },
                { i: '🏃', t: 'Active Living', d: 'Aim for at least 150 minutes of moderate aerobic activity per week, like brisk walking or swimming.' },
                { i: '⚖️', t: 'Weight Management', d: 'Losing even a small amount of weight (5-7%) can significantly lower the risk of type 2 diabetes.' }
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

export default DiabetesPage;