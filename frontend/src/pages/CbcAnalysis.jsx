import { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import dashboardHero from "../assets/dashboard-hero.png";

function CbcAnalysisPage() {
  const { user, logout } = useAuth();
  const [pdfFile, setPdfFile] = useState(null);
  const [cbcResult, setCbcResult] = useState(null);
  const [cbcInterpretation, setCbcInterpretation] = useState(null);
  const [pdfError, setPdfError] = useState("");

  const saveCbcReport = async (cbcData, interpretation) => {
    try {
      await fetch("/api/save_cbc_report.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cbc: cbcData,
          interpretation,
          source: "cbc"
        })
      });
    } catch (error) {
      console.error("Failed to save CBC report", error);
    }
  };

  const uploadPdf = async () => {
    if (!pdfFile) {
      alert("Please select a PDF file first");
      return;
    }

    const formDataPdf = new FormData();
    formDataPdf.append("file", pdfFile);

    setPdfError("");
    setCbcResult(null);
    setCbcInterpretation(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/cbc/upload-pdf", {
        method: "POST",
        body: formDataPdf
      });

      if (!response.ok) {
        setPdfError("PDF upload failed. Please try again.");
        return;
      }

      const data = await response.json();
      const extracted = data.cbc || {};
      const interpretation = data.interpretation || null;
      setCbcResult(extracted);
      setCbcInterpretation(interpretation);

      if (Object.keys(extracted).length === 0) {
        setPdfError("No CBC values detected. Try a clearer report.");
      } else {
        await saveCbcReport(extracted, interpretation);
      }
    } catch (error) {
      setPdfError("Unable to process the PDF right now.");
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
      <header className="topbar">
        <div>
          <p className="eyebrow">Clinical Intelligence Suite</p>
          <h1>Blood Report Analysis</h1>
        </div>
        <div className="topbar-actions">
          <NavLink to="/" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>Home</NavLink>
          <NavLink to="/diabetes" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>Diabetes</NavLink>
          <NavLink to="/heart-disease" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>Heart Disease</NavLink>
          <NavLink to="/hypertension" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>Hypertension</NavLink>
          <NavLink to="/cbc" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>Report Analyzer</NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>Admin</NavLink>
          )}
          <button onClick={logout} className="tab" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}>Logout {user?.full_name}</button>
        </div>
      </header>

      <div className="dashboard-banner">
        <img src={dashboardHero} alt="Blood Analysis" />
        <div className="banner-content">
          <h2>Hematology Intelligence</h2>
          <p>
            Automated extraction and differential analysis of blood reports. <br />
            Visualizing cell composition and flagging abnormalities instantly.
          </p>
        </div>
      </div>

      <div className="layout">
        <section className="panel">
          <div className="card">
            <div className="card-header">
              <div>
                <h3>Report Intake</h3>
                <p>Upload a PDF file to extract CBC parameters.</p>
              </div>
            </div>
            <div className="upload-row">
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => setPdfFile(event.target.files[0])}
              />
              <button onClick={uploadPdf} className="btn-primary">Analyze Report</button>
            </div>
            {pdfError && <p className="error-text">{pdfError}</p>}
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
                  <p style={{lineHeight: '1.6', fontSize: '1.25rem', fontWeight: 500 }}>{cbcInterpretation.summary}</p>
                  
                  {cbcInterpretation.possible_conditions?.length > 0 && (
                    <div style={{marginTop: '20px'}}>
                        <h4 style={{fontSize: '1rem', color: 'var(--muted)', marginBottom: '12px'}}>Possible Indication</h4>
                        <div className="pill-grid">
                          {cbcInterpretation.possible_conditions.map((item) => (
                            <div className="pill" key={item} style={{ fontSize: '1.1rem', padding: '8px 16px' }}>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                    </div>
                  )}
                  {cbcInterpretation.note && (
                    <p className="note-text" style={{marginTop: '20px', fontStyle: 'italic', color: 'var(--muted)', fontSize: '1rem' }}>{cbcInterpretation.note}</p>
                  )}
                </div>
             ) : (
                <p style={{color: 'var(--muted)', fontStyle: 'italic'}}>
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
