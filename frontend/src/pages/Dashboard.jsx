import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import dashboardHero from '../assets/dashboard-hero.png';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
          ...formData,
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
          ...formData,
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
    <div className="app">
      <Navbar />

      <div className="dashboard-banner">
        <img src={dashboardHero} alt="Diabetes Analytics" />
        <div className="banner-content">
          <h2>Diabetes Intelligence</h2>
          <p>
            Real-time glucose monitoring and ML-driven risk assessment. <br />
            Upload lab reports or enter data manually for instant analysis.
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
                        <th>Glucose</th>
                        <th>BMI</th>
                        <th>Prediction</th>
                        <th>Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myReports.map(r => (
                        <tr key={r.id}>
                          <td>{new Date(r.created_at).toLocaleDateString()}</td>
                          <td>{r.glucose}</td>
                          <td>{r.bmi}</td>
                          <td>{r.diabetes_prediction}</td>
                          <td>
                            <span className={`badge ${r.risk_level?.toLowerCase()}`}>
                              {r.risk_level}
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
                      <Line type="monotone" dataKey="Glucose" stroke="#8884d8" name="Glucose (mg/dL)" />
                      <Line type="monotone" dataKey="BMI" stroke="#82ca9d" name="BMI" />
                      <Line type="monotone" dataKey="BP" stroke="#ffc658" name="Blood Pressure" />
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
            <p>Diabetes Status</p>
            <h2>{result?.diabetes_prediction || "Pending"}</h2>
            <span className={`chip ${result ? "chip-live" : "chip-muted"}`}>
              {result ? "Analysis Ready" : "Awaiting Data"}
            </span>
          </div>
          <div className="stat-card">
            <p>Risk Profile</p>
            <h2>{result?.risk_level || "Unknown"}</h2>
            <div className="progress" style={{ marginTop: '8px' }}>
              <span style={{ width: result?.risk_level === 'High' ? '100%' : result?.risk_level === 'Medium' ? '60%' : '30%', background: result?.risk_level === 'High' ? '#dc2626' : '#2563eb' }} />
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
                  <p>Upload a PDF/Image or enter values manually.</p>
                </div>
                <div className="tabs">
                  <button
                    className={dataSource === 'pdf' ? 'active' : ''}
                    onClick={() => setDataSource('pdf')}
                  >
                    Upload
                  </button>
                  <button
                    className={dataSource === 'manual' ? 'active' : ''}
                    onClick={() => setDataSource('manual')}
                  >
                    Manual Entry
                  </button>
                </div>
              </div>

              {dataSource === 'pdf' ? (
                // Upload Tab Content
                <div className="upload-container">
                  <div className="upload-row" style={{ marginBottom: '1rem' }}>
                    <input
                      type="file"
                      accept="application/pdf, image/*"
                      onChange={(e) => setPdfFile(e.target.files[0])}
                    />
                    <button onClick={uploadPdf} className="btn-primary">Extract Data</button>
                  </div>
                  {pdfError && <p className="error-text">{pdfError}</p>}

                  {pdfResult && Object.keys(pdfResult).length > 0 && (
                    <div className="pdf-preview">
                      <div className="pdf-header">
                        <h4>Extracted Parameters</h4>
                        <button className="ghost" onClick={applyPdfData}>
                          Apply to Form
                        </button>
                      </div>
                      <div className="pill-grid">
                        {Object.entries(pdfResult).map(([key, value]) => (
                          <div className="pill" key={key}>
                            <span>{key}</span>
                            <strong>{value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Manual Entry Tab Content
                <>
                  <div className="form-header" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <button
                      className="ghost"
                      onClick={() =>
                        setFormData({
                          Glucose: "",
                          BloodPressure: "",
                          SkinThickness: "",
                          Insulin: "",
                          BMI: "",
                          DiabetesPedigreeFunction: "",
                          Age: ""
                        })
                      }
                    >
                      Clear Form
                    </button>
                  </div>
                  <div className="form-grid">
                    {Object.keys(formData).map((key) => (
                      <label key={key} className="field">
                        <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <input
                          name={key}
                          placeholder={`Enter ${key}`}
                          value={formData[key]}
                          onChange={handleChange}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="card-actions">
                    <button
                      onClick={analyzeReport}
                      className="btn-primary"
                      disabled={loading}
                    >
                      {loading ? "Analyzing..." : "Run Analysis"}
                    </button>
                  </div>
                </>
              )}
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

              {result ? (
                <div className="results-summary">
                  <div className="summary-grid">
                    <div>
                      <span>Prediction</span>
                      <strong>{result.diabetes_prediction}</strong>
                    </div>
                    <div>
                      <span>Confidence</span>
                      <strong>High</strong>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <h4>Recommendations</h4>
                    <ul className="insight-list">
                      {result.possible_conditions?.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
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
                  <h3>Reference Comparison</h3>
                </div>
              </div>
              <div className="compare-table">
                <div className="compare-row header">
                  <span>Metric</span>
                  <span>Val</span>
                  <span>Range</span>
                  <span>Δ</span>
                </div>
                {compareRows.map((row) => (
                  <div className="compare-row" key={row.key}>
                    <span className="metric">{row.label}</span>
                    <span className="value">{row.value ?? "-"}</span>
                    <span className="range">{row.low}-{row.high}</span>
                    <span className={`delta ${row.status}`}>
                      {row.delta ? (row.delta > 0 ? `+${row.delta.toFixed(0)}` : row.delta.toFixed(0)) : "-"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
        <div className="layout" style={{ marginTop: '3rem' }}>
          <section className="panel" style={{ gridColumn: '1 / -1' }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Understanding Your Metrics</h3>
                  <p>Key indicators used in diabetes risk assessment.</p>
                </div>
              </div>
              <div className="grid three">
                <div>
                  <h4>Glucose</h4>
                  <p className="note-text">Blood sugar level. High levels (hyperglycemia) can indicate diabetes. Normal fasting range is typically 70-100 mg/dL.</p>
                </div>
                <div>
                  <h4>BMI</h4>
                  <p className="note-text">Body Mass Index. A measure of body fat based on height and weight. <br />18.5-24.9 is considered healthy.</p>
                </div>
                <div>
                  <h4>Insulin</h4>
                  <p className="note-text">A hormone that regulates blood sugar. High insulin can indicate insulin resistance, a precursor to type 2 diabetes.</p>
                </div>
                <div>
                  <h4>Blood Pressure</h4>
                  <p className="note-text">Force of circulating blood. High BP (Hypertension) is a common comorbidity with diabetes. <br />Target: &lt; 120/80 mmHg.</p>
                </div>
                <div>
                  <h4>Skin Thickness</h4>
                  <p className="note-text">Triceps skinfold thickness. Used to estimate body fat percentage and nutritional status.</p>
                </div>
                <div>
                  <h4>Diabetes Pedigree</h4>
                  <p className="note-text">A function that scores likelihood of diabetes based on family history and genetic predisposition.</p>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
              <div className="card-header">
                <div>
                  <h3>Prevention & Wellness</h3>
                  <p>Lifestyle changes to manage and reduce risk.</p>
                </div>
              </div>
              <div className="grid three">
                <div className="feature-card" style={{ padding: '20px', border: '1px solid var(--line)', boxShadow: 'none' }}>
                  <div className="icon-wrapper" style={{ width: '48px', height: '48px', fontSize: '20px', marginBottom: '12px' }}>🥗</div>
                  <h4 style={{ marginBottom: '8px' }}>Healthy Diet</h4>
                  <p className="note-text">Focus on whole foods, fiber, and lean proteins. Limit sugary drinks and processed carbohydrates.</p>
                </div>
                <div className="feature-card" style={{ padding: '20px', border: '1px solid var(--line)', boxShadow: 'none' }}>
                  <div className="icon-wrapper" style={{ width: '48px', height: '48px', fontSize: '20px', marginBottom: '12px' }}>🏃</div>
                  <h4 style={{ marginBottom: '8px' }}>Active Living</h4>
                  <p className="note-text">Aim for at least 150 minutes of moderate aerobic activity per week, like brisk walking or swimming.</p>
                </div>
                <div className="feature-card" style={{ padding: '20px', border: '1px solid var(--line)', boxShadow: 'none' }}>
                  <div className="icon-wrapper" style={{ width: '48px', height: '48px', fontSize: '20px', marginBottom: '12px' }}>⚖️</div>
                  <h4 style={{ marginBottom: '8px' }}>Weight Management</h4>
                  <p className="note-text">Losing even a small amount of weight (5-7%) can significantly lower the risk of type 2 diabetes.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default DiabetesPage;