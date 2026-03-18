import { useState } from 'react';
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import { C } from "../theme";

function HypertensionPage() {
  const { user, logout, authFetch } = useAuth();
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
      // 1. Get Prediction
      const response = await fetch('http://127.0.0.1:8000/predict/hypertension', {
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
            const saveRes = await authFetch('/hypertension/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...formData,
                prediction: data.prediction
              })
            });
            if (!saveRes.ok) {
              console.error("Failed to save hypertension report");
            }
          } catch (saveErr) {
            console.error("Error saving hypertension report:", saveErr);
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
            <span className="feature-pill">CHRONIC CONDITION TRACKING</span>
            <h2 className="page-title">Hypertension Monitoring</h2>
            <p className="page-desc">Longitudinal tracking and ML-driven risk analysis of blood pressure indicators.</p>
          </div>
        </div>

        <div className="layout animate-up" style={{ animationDelay: '0.1s', display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: '24px', marginBottom: '32px' }}>
          <section className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="bento-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>Patient Vitals</h3>
                  <p style={{ color: C.lightMuted, margin: 0 }}>Enter clinical parameters for hypertension risk prediction.</p>
                </div>
                <button className="btn-secondary-light" onClick={() => setFormData({ age: '', sex: '1', bmi: '', heart_rate: '', activity_level: '1', smoker: '0', family_history: '0' })}>Clear Details</button>
              </div>

              <form onSubmit={handleSubmit} className="field-light">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span>Age</span>
                    <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="e.g. 45" required />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span>Sex</span>
                    <select name="sex" value={formData.sex} onChange={handleChange}>
                      <option value="1">Male</option>
                      <option value="0">Female</option>
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span>BMI</span>
                    <input type="number" step="0.1" name="bmi" value={formData.bmi} onChange={handleChange} placeholder="e.g. 24.5" required />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span>Heart Rate (BPM)</span>
                    <input type="number" name="heart_rate" value={formData.heart_rate} onChange={handleChange} placeholder="e.g. 72" required />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span>Activity Level</span>
                    <select name="activity_level" value={formData.activity_level} onChange={handleChange}>
                      <option value="0">Sedentary</option>
                      <option value="1">Moderate</option>
                      <option value="2">Active</option>
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span>Smoker Status</span>
                    <select name="smoker" value={formData.smoker} onChange={handleChange}>
                      <option value="0">Non-Smoker</option>
                      <option value="1">Smoker</option>
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span>Family History</span>
                    <select name="family_history" value={formData.family_history} onChange={handleChange}>
                      <option value="0">No Family History</option>
                      <option value="1">Has Family History</option>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: prediction.raw === 1 ? C.crimsonBg : C.emeraldBg, border: `1px solid ${prediction.raw === 1 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, padding: '16px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: prediction.raw === 1 ? '#ef4444' : '#10b981', textTransform: 'uppercase', marginBottom: '8px' }}>Risk Stratification</div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: prediction.raw === 1 ? C.crimson : C.emerald }}>{prediction.prediction}</div>
                    </div>
                  </div>

                  <div style={{ background: '#fff', border: `1px solid ${C.lightBorder}`, padding: '20px', borderRadius: '16px', boxShadow: C.shadowCard }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px' }}>ML Model Insights</h4>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ color: C.lightMuted, fontWeight: 500 }}>Algorithm</span>
                        <strong style={{ color: C.lightText }}>{prediction.ml_model_insights?.algorithm || "Machine Learning Model"}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ color: C.lightMuted, fontWeight: 500 }}>Confidence</span>
                        <strong style={{ color: C.emerald }}>{prediction.ml_model_insights ? `${prediction.ml_model_insights.probability}%` : "High"}</strong>
                      </div>
                    </div>
                  </div>
                  
                  <p style={{ color: C.lightMuted, fontSize: '14px', lineHeight: '1.5', marginTop: '24px' }}>
                    Based on your vitals and lifestyle factors, our trained AI model has profiled your hypertension risk.
                  </p>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                    <button className="btn-secondary-light" onClick={() => setPrediction(null)} style={{ width: '100%' }}>
                      Check Another Profile
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', textAlign: 'center', color: C.lightMuted }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🩺</div>
                  <p style={{ margin: 0, fontSize: '15px', maxWidth: '200px' }}>Run analysis to see detailed prediction results.</p>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Info Cards */}
        <div className="animate-up" style={{ animationDelay: '0.2s' }}>
            <div className="bento-card" style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>Understanding Your Metrics</h3>
                <p style={{ color: C.lightMuted, margin: 0 }}>Key indicators evaluated for your hypertension risk profile.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {[
                  { t: 'Age & Genetics', d: 'Blood vessels naturally lose elasticity over time. A family history of hypertension roughly doubles your personal baseline risk of developing chronic high blood pressure.' },
                  { t: 'BMI', d: 'Body Mass Index significantly correlates with blood volume and vascular resistance. Overweight individuals require more pressure to move blood through excess tissue.' },
                  { t: 'Resting Heart Rate', d: 'A higher resting heart rate means your heart works harder per minute. Over time, this constant intense mechanical stress weakens the heart walls.' }
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
                <p style={{ color: C.lightMuted, margin: 0 }}>Actionable lifestyle changes to manage or prevent hypertension.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {[
                  { i: '🧂', t: 'DASH Diet & Sodium', d: 'Limit daily sodium intake to under 2,300mg (ideally 1,500mg) and focus on the DASH diet emphasizing potassium-rich vegetables and whole grains.' },
                  { i: '🚭', t: 'Eliminate Smoking', d: 'Nicotine causes your blood vessels to constrict and your heart to beat faster, temporarily raising blood pressure after every single cigarette.' },
                  { i: '🧘', t: 'Stress Management', d: 'Chronic stress keeps your body in an adrenaline-fueled fight-or-flight state. Practice mindfulness, deep breathing, or yoga to lower your resting vascular tension.' }
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

export default HypertensionPage;
