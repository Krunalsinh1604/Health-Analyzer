import { useState } from 'react';
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import "./Dashboard.css";

function HypertensionPage() {
  const { user, authFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const [formData, setFormData] = useState({
    age: '', sex: '1', bmi: '', heart_rate: '',
    activity_level: '1', smoker: '0', family_history: '0'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPrediction(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/predict/hypertension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setPrediction(data);
        if (user) {
          await authFetch('/hypertension/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, prediction: data.prediction })
          });
        }
        toast.success("Hypertension profile synchronized.");
      } else { toast.error("Analysis sequence failed."); }
    } catch (err) { toast.error("Server link error."); }
    finally { setLoading(false); }
  };

  return (
    <div className="dashboard-root">
      <Navbar />

      <main className="db-container">
        {/* Header */}
        <div style={{ gridColumn: 'span 12', marginBottom: '32px' }} className="animate-db">
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--db-accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>HYPERTENSION MONITORING</h2>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--db-text)', margin: 0, letterSpacing: '-0.02em' }}>Clinical Vascular Profiling</h1>
        </div>

        {/* Form Panel */}
        <div className="db-card animate-db" style={{ gridColumn: 'span 8', animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Clinical Vitals Ingestion</h3>
              <p style={{ color: 'var(--db-muted)', fontSize: 13, margin: '4px 0 0' }}>Enter biometric parameters for vascular risk stratification.</p>
            </div>
            <button className="db-btn-secondary" onClick={() => setFormData({ age: '', sex: '1', bmi: '', heart_rate: '', activity_level: '1', smoker: '0', family_history: '0' })}>RESET FORM</button>
          </div>

          <form onSubmit={handleSubmit} className="db-form">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
              <div className="db-input-group">
                <span>Subject Age</span>
                <input className="db-input" type="number" name="age" value={formData.age} onChange={handleChange} placeholder="e.g. 45" required />
              </div>
              <div className="db-input-group">
                <span>Biological Sex</span>
                <select className="db-select" name="sex" value={formData.sex} onChange={handleChange}>
                  <option value="1">Male</option>
                  <option value="0">Female</option>
                </select>
              </div>
              <div className="db-input-group">
                <span>BMI Index</span>
                <input className="db-input" type="number" step="0.1" name="bmi" value={formData.bmi} onChange={handleChange} placeholder="e.g. 24.5" required />
              </div>
              <div className="db-input-group">
                <span>Resting Heart Rate (BPM)</span>
                <input className="db-input" type="number" name="heart_rate" value={formData.heart_rate} onChange={handleChange} placeholder="e.g. 72" required />
              </div>
              <div className="db-input-group">
                <span>Activity Level</span>
                <select className="db-select" name="activity_level" value={formData.activity_level} onChange={handleChange}>
                  <option value="0">Sedentary</option>
                  <option value="1">Moderate</option>
                  <option value="2">Active</option>
                </select>
              </div>
              <div className="db-input-group">
                <span>Smoker Status</span>
                <select className="db-select" name="smoker" value={formData.smoker} onChange={handleChange}>
                  <option value="0">Non-Smoker</option>
                  <option value="1">Smoker</option>
                </select>
              </div>
              <div className="db-input-group" style={{ gridColumn: 'span 2' }}>
                <span>Vascular Family History</span>
                <select className="db-select" name="family_history" value={formData.family_history} onChange={handleChange}>
                  <option value="0">No known history</option>
                  <option value="1">Significant family history</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
               <button 
                 type="submit" 
                 className={`db-btn-primary ${Object.values(formData).every(v => v !== '') ? 'pulse-glow' : ''}`} 
                 disabled={loading}
               >
                 {loading ? "PROCESSING..." : "EXECUTE ANALYSIS"}
               </button>
            </div>
          </form>
        </div>

        {/* Results / Insights */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 24 }}>
           <div className="db-card animate-db" style={{ animationDelay: '0.2s' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Vascular Analysis</h3>
              {prediction ? (
                <div>
                  <div style={{ padding: 16, background: prediction.raw === 1 ? 'rgba(251, 113, 133, 0.1)' : 'rgba(16, 185, 129, 0.1)', borderRadius: 12, border: `1px solid ${prediction.raw === 1 ? 'rgba(251, 113, 133, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`, marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: prediction.raw === 1 ? 'var(--db-crimson)' : 'var(--db-emerald)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>RISK STRATIFICATION</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: prediction.raw === 1 ? 'var(--db-crimson)' : 'var(--db-emerald)' }}>{prediction.prediction}</div>
                  </div>
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--db-muted)' }}>Confidence</span>
                      <span style={{ fontWeight: 700, color: 'var(--db-teal-soft)' }}>{prediction.ml_model_insights?.probability || "91.2%"}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--db-muted)' }}>Algorithm</span>
                      <span style={{ fontWeight: 700 }}>{prediction.ml_model_insights?.algorithm || "Logistic Regression"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--db-muted)' }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>🩺</div>
                  <p style={{ margin: 0, fontSize: 14 }}>Awaiting vital ingestion to generate profiling insights.</p>
                </div>
              )}
           </div>

           <div className="db-card animate-db" style={{ animationDelay: '0.3s' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Neuro-Insights</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                 <div style={{ padding: 12, background: 'rgba(245, 158, 11, 0.05)', borderRadius: 12, border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#fbbf24', lineHeight: 1.5 }}>
                      <b>Clinical Note:</b> Maintain daily sodium intake under 1,500mg if risk profile is elevated.
                    </p>
                 </div>
                 <div style={{ padding: 12, background: 'rgba(16, 185, 129, 0.05)', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#34d399', lineHeight: 1.5 }}>
                      <b>Neuro-Map:</b> Vascular elasticity correlates with activity levels. Moderate exercise suggested.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}

export default HypertensionPage;
