import { useState } from 'react';
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";

function HeartDiseasePage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const [formData, setFormData] = useState({
    age: '', sex: '1', cp: '0', trestbps: '', chol: '',
    fbs: '0', restecg: '0', thalach: '', exang: '0',
    oldpeak: '', slope: '0', ca: '', thal: '1'
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
      const response = await fetch('http://127.0.0.1:8000/predict/heart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setPrediction(data);

        // 2. Save to History (if logged in)
        if (user && user.access_token) {
          await fetch('http://127.0.0.1:8000/heart/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.access_token}`
            },
            body: JSON.stringify({
              ...formData,
              prediction: data.prediction,
              probability: null
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

      <div className="module-header" style={{ margin: '0 2rem 2rem' }}>
        <div className="clinical-container">
          <header className="clinical-header">
            <h2>Cardiovascular Intelligence</h2>
            <p>Advanced predictive modeling for heart health assessment.</p>
          </header>

          <div className="clinical-card">
            {prediction ? (
              <div className="clinical-result">
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--muted)' }}>Assessment Complete</h3>
                <div style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
                  <span className={prediction.raw === 1 ? 'badge-risk-high' : 'badge-risk-low'}>
                    {prediction.prediction}
                  </span>
                </div>
                <p style={{ color: 'var(--muted)', maxWidth: '500px', margin: '0 auto 2rem' }}>
                  This assessment is based on a machine learning model analyzing key indicators like chest pain type, cholesterol, and max heart rate.
                </p>
                <button className="clinical-btn" onClick={() => setPrediction(null)} style={{ background: 'var(--muted)' }}>
                  Analyzye Another Patient
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="clinical-grid">
                  <div className="clinical-field">
                    <label className="clinical-label">Age</label>
                    <input className="clinical-input" type="number" name="age" value={formData.age} onChange={handleChange} placeholder="e.g. 55" required />
                  </div>

                  <div className="clinical-field">
                    <label className="clinical-label">Sex</label>
                    <select className="clinical-select" name="sex" value={formData.sex} onChange={handleChange}>
                      <option value="1">Male</option>
                      <option value="0">Female</option>
                    </select>
                  </div>

                  <div className="clinical-field">
                    <label className="clinical-label">Chest Pain Type</label>
                    <select className="clinical-select" name="cp" value={formData.cp} onChange={handleChange}>
                      <option value="0">Typical Angina</option>
                      <option value="1">Atypical Angina</option>
                      <option value="2">Non-anginal Pain</option>
                      <option value="3">Asymptomatic</option>
                    </select>
                  </div>

                  <div className="clinical-field">
                    <label className="clinical-label">Resting BP (mmHg)</label>
                    <input className="clinical-input" type="number" name="trestbps" value={formData.trestbps} onChange={handleChange} placeholder="e.g. 130" required />
                  </div>

                  <div className="clinical-field">
                    <label className="clinical-label">Cholesterol (mg/dl)</label>
                    <input className="clinical-input" type="number" name="chol" value={formData.chol} onChange={handleChange} placeholder="e.g. 240" required />
                  </div>

                  <div className="clinical-field">
                    <label className="clinical-label">Fasting BS &gt; 120 mg/dl</label>
                    <select className="clinical-select" name="fbs" value={formData.fbs} onChange={handleChange}>
                      <option value="0">False</option>
                      <option value="1">True</option>
                    </select>
                  </div>

                  <div className="clinical-field">
                    <label className="clinical-label">Resting ECG</label>
                    <select className="clinical-select" name="restecg" value={formData.restecg} onChange={handleChange}>
                      <option value="0">Normal</option>
                      <option value="1">ST-T Wave Abnormality</option>
                      <option value="2">LV Hypertrophy</option>
                    </select>
                  </div>

                  <div className="clinical-field">
                    <label className="clinical-label">Max Heart Rate</label>
                    <input className="clinical-input" type="number" name="thalach" value={formData.thalach} onChange={handleChange} placeholder="e.g. 150" required />
                  </div>

                  <div className="clinical-field">
                    <label className="clinical-label">Exercise Angina</label>
                    <select className="clinical-select" name="exang" value={formData.exang} onChange={handleChange}>
                      <option value="0">No</option>
                      <option value="1">Yes</option>
                    </select>
                  </div>

                  <div className="clinical-field">
                    <label className="clinical-label">Oldpeak (ST Depression)</label>
                    <input className="clinical-input" type="number" step="0.1" name="oldpeak" value={formData.oldpeak} onChange={handleChange} placeholder="e.g. 1.2" required />
                  </div>

                  <div className="clinical-field">
                    <label className="clinical-label">Slope</label>
                    <select className="clinical-select" name="slope" value={formData.slope} onChange={handleChange}>
                      <option value="0">Upsloping</option>
                      <option value="1">Flat</option>
                      <option value="2">Downsloping</option>
                    </select>
                  </div>

                  <div className="clinical-field">
                    <label className="clinical-label">Major Vessels (0-4)</label>
                    <input className="clinical-input" type="number" name="ca" value={formData.ca} onChange={handleChange} placeholder="e.g. 0" required />
                  </div>

                  <div className="clinical-field">
                    <label className="clinical-label">Thalassemia</label>
                    <select className="clinical-select" name="thal" value={formData.thal} onChange={handleChange}>
                      <option value="0">Unknown</option>
                      <option value="1">Normal</option>
                      <option value="2">Fixed Defect</option>
                      <option value="3">Reversable Defect</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                  <button type="submit" className="clinical-btn" disabled={loading}>
                    {loading ? 'Processing...' : 'Generate Prediction'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <aside className="side">
          <div className="card">
            <div className="card-header">
              <h3>Latest Research</h3>
            </div>
            <ul className="insight-list">
              <li>Accuracy rate target &gt; 95%</li>
              <li>Multi-variable regression analysis</li>
              <li>Integrated with wearable data (planned)</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default HeartDiseasePage;
