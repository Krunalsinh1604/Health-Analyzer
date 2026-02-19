import { useState } from 'react';
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";

function HypertensionPage() {
  const { user, logout } = useAuth();
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
        if (user && user.access_token) {
          await fetch('http://127.0.0.1:8000/hypertension/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.access_token}`
            },
            body: JSON.stringify({
              ...formData,
              prediction: data.prediction
            })
          });
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

      <div className="clinical-container">
        <header className="clinical-header">
          <h2>Hypertension Monitoring</h2>
          <p>Longitudinal tracking and risk analysis of blood pressure indicators.</p>
        </header>

        <div className="clinical-card">
          {prediction ? (
            <div className="clinical-result">
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--muted)' }}>Risk Analysis Complete</h3>
              <div style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
                <span className={prediction.raw === 1 ? 'badge-risk-high' : 'badge-risk-low'}>
                  {prediction.prediction}
                </span>
              </div>
              <p style={{ color: 'var(--muted)', maxWidth: '500px', margin: '0 auto 2rem' }}>
                Based on your vitals and lifestyle factors, our AI model has profiled your hypertension risk.
              </p>
              <button className="clinical-btn" onClick={() => setPrediction(null)} style={{ background: 'var(--muted)' }}>
                Check Another Profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="clinical-grid">
                <div className="clinical-field">
                  <label className="clinical-label">Age</label>
                  <input className="clinical-input" type="number" name="age" value={formData.age} onChange={handleChange} placeholder="e.g. 45" required />
                </div>

                <div className="clinical-field">
                  <label className="clinical-label">Sex</label>
                  <select className="clinical-select" name="sex" value={formData.sex} onChange={handleChange}>
                    <option value="1">Male</option>
                    <option value="0">Female</option>
                  </select>
                </div>

                <div className="clinical-field">
                  <label className="clinical-label">BMI</label>
                  <input className="clinical-input" type="number" step="0.1" name="bmi" value={formData.bmi} onChange={handleChange} placeholder="e.g. 24.5" required />
                </div>

                <div className="clinical-field">
                  <label className="clinical-label">Heart Rate (BPM)</label>
                  <input className="clinical-input" type="number" name="heart_rate" value={formData.heart_rate} onChange={handleChange} placeholder="e.g. 72" required />
                </div>

                <div className="clinical-field">
                  <label className="clinical-label">Activity Level</label>
                  <select className="clinical-select" name="activity_level" value={formData.activity_level} onChange={handleChange}>
                    <option value="0">Sedentary</option>
                    <option value="1">Moderate</option>
                    <option value="2">Active</option>
                  </select>
                </div>

                <div className="clinical-field">
                  <label className="clinical-label">Smoker Status</label>
                  <select className="clinical-select" name="smoker" value={formData.smoker} onChange={handleChange}>
                    <option value="0">Non-Smoker</option>
                    <option value="1">Smoker</option>
                  </select>
                </div>

                <div className="clinical-field">
                  <label className="clinical-label">Family History</label>
                  <select className="clinical-select" name="family_history" value={formData.family_history} onChange={handleChange}>
                    <option value="0">No Family History</option>
                    <option value="1">Has Family History</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                <button type="submit" className="clinical-btn" disabled={loading}>
                  {loading ? 'Processing...' : 'Assess Risk'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default HypertensionPage;
