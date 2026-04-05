import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertTriangle, Heart as HeartIcon, Droplets, Scale, User, Zap, ShieldCheck } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import GlowButton from '../components/GlowButton';
import FloatingInput from '../components/FloatingInput';
import AnimatedLoader from '../components/AnimatedLoader';
import HealthInfoCard from '../components/HealthInfoCard';
import { HeartAnatomySVG } from '../components/HealthIllustrations';
import api from '../services/api';
import { useReports } from '../context/ReportContext';
import './DiseasePrediction.css';

const iconsMap = {
  age: <User size={18} />,
  sex: <User size={18} />,
  cp: <HeartIcon size={18} />,
  trestbps: <Activity size={18} />,
  chol: <Droplets size={18} />,
  fbs: <Droplets size={18} />,
  restecg: <Activity size={18} />,
  thalach: <HeartIcon size={18} />,
  exang: <Zap size={18} />,
  oldpeak: <Activity size={18} />,
  slope: <Activity size={18} />,
  ca: <Activity size={18} />,
  thal: <Activity size={18} />
};

const Heart = () => {
  const { reports, saveReport, loading: reportsLoading } = useReports();
  const [formData, setFormData] = useState({
    age: '', sex: '', cp: '', trestbps: '', chol: '', 
    fbs: '', restecg: '', thalach: '', exang: '', 
    oldpeak: '', slope: '', ca: '', thal: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const values = Object.values(formData);
    if (values.some(v => v === '')) {
      setError('Please fill in all diagnostic markers.');
      return false;
    }
    return true;
  };

  const isFormValid = !Object.values(formData).some(v => v === '');

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setResult(null);
    setError('');

    try {
      const payload = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, v === '' ? 0 : Number(v)])
      );
      const res = await api.post('/predict/heart', payload);
      const predictionData = res.data;
      setResult(predictionData);

      // --- AUTO SAVE ---
      await saveReport('heart', {
        ...payload,
        prediction: predictionData?.prediction || 'Unknown',
        probability: predictionData?.ml_model_insights?.probability || 0
      });

    } catch (err) {
      console.error('HEART ERROR:', err);
      setError(err?.response?.data?.detail || 'Vector scan failed. Connection unstable.');
    } finally {
      setLoading(false);
    }
  };

  const isHighRisk = result?.raw === 1;
  const heartProb = result?.ml_model_insights?.probability || 0;

  const getRiskColor = () => {
    if (isHighRisk && heartProb >= 0.7) return '#EF4444';
    if (isHighRisk) return '#F59E0B';
    return '#10B981';
  };

  // Filter local history from global reports
  const heartHistory = reports.filter(r => r.type === 'heart').slice(0, 6);

  return (
    <div className="prediction-page">
      <header className="page-header">
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          Cardiovascular AI Scan
        </motion.h1>
        <p>Advanced neural prediction for heart disease markers</p>
      </header>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="error-banner mb-6">
          <AlertTriangle size={18} /> {error}
        </motion.div>
      )}

      <div className="prediction-grid">
        <FloatingCard className="form-card">
          <h3 className="mb-4 text-lg font-semibold" style={{ marginBottom: '24px' }}>Diagnostic Markers</h3>
          <form onSubmit={handlePredict}>
            <div className="form-grid">
              {Object.keys(formData).map((key) => {
                const helperText = {
                  age: "Your current age in years",
                  sex: "Biological sex (0 = Female, 1 = Male) — affects risk calculations",
                  cp: "Chest Pain type (0-3). 3: Typical Angina, 0: Asymptomatic",
                  trestbps: "Resting blood pressure. Normal: below 120/80 mmHg",
                  chol: "Total cholesterol in blood. Healthy: below 200 mg/dL",
                  fbs: "Fasting blood sugar > 120 mg/dL (1 = true; 0 = false)",
                  restecg: "Resting electrocardiographic results (0-2)",
                  thalach: "Maximum heart rate achieved during stress test",
                  exang: "Exercise induced angina (1 = yes; 0 = no)",
                  oldpeak: "ST depression induced by exercise relative to rest",
                  slope: "The slope of the peak exercise ST segment",
                  ca: "Number of major vessels (0-3) colored by flourosopy",
                  thal: "Thalassemia (1 = normal; 2 = fixed; 3 = reversible)"
                }[key];

                const infoContent = {
                  age: { desc: "Chronological age.", why: "Heart disease risk increases significantly as you get older.", abnormal: "N/A", link: "https://en.wikipedia.org/wiki/Cardiovascular_disease" },
                  sex: { desc: "Biological sex.", why: "Men are generally at higher risk for heart disease, though women's risk increases after menopause.", abnormal: "N/A", link: "https://en.wikipedia.org/wiki/Sex_differences_in_medicine" },
                  cp: { desc: "Type of chest pain experienced.", why: "Angina (chest pain) is a primary symptom of reduced blood flow to the heart.", abnormal: "Typical angina is a strong indicator of heart issues.", link: "https://en.wikipedia.org/wiki/Angina" },
                  trestbps: { desc: "Resting blood pressure.", why: "High blood pressure strains the heart and leads to cardiovascular disease.", abnormal: ">140 mmHg is considered hypertensive.", link: "https://en.wikipedia.org/wiki/Hypertension" },
                  chol: { desc: "Total serum cholesterol.", why: "High cholesterol leads to plaque buildup in arteries (atherosclerosis).", abnormal: ">240 mg/dL is high risk.", link: "https://en.wikipedia.org/wiki/Cholesterol" },
                  fbs: { desc: "Fasting blood sugar level.", why: "Diabetes is a major risk factor for heart disease.", abnormal: ">120 mg/dL suggests pre-diabetes/diabetes.", link: "https://en.wikipedia.org/wiki/Blood_sugar_level" },
                  restecg: { desc: "Resting EKG results.", why: "Detects abnormal heart rhythms or past heart muscle damage.", abnormal: "Any non-zero value indicates potential EKG anomalies.", link: "https://en.wikipedia.org/wiki/Electrocardiography" },
                  thalach: { desc: "Maximum heart rate achieved.", why: "Indicates how well the heart performs under physical stress.", abnormal: "Low peak heart rates can indicate cardiovascular weakness.", link: "https://en.wikipedia.org/wiki/Heart_rate" },
                  exang: { desc: "Angina during exercise.", why: "Chest pain triggered by activity is a sign of blocked coronary arteries.", abnormal: "Yes (1) is a strong risk marker.", link: "https://en.wikipedia.org/wiki/Angina" },
                  oldpeak: { desc: "ST segment depression.", why: "Shows how much the heart's electrical activity changes during exercise.", abnormal: "Higher values indicate significant heart stress.", link: "https://en.wikipedia.org/wiki/ST_depression" },
                  slope: { desc: "Slope of peak exercise ST segment.", why: "Reflects the heart's recovery after exertion.", abnormal: "Flat or down-sloping segments are concerning.", link: "https://en.wikipedia.org/wiki/Electrocardiography" },
                  ca: { desc: "Major vessels visible by fluoroscopy.", why: "Shows clear blockages in the main coronary arteries.", abnormal: "Any value >0 indicates visible vessel obstruction.", link: "https://en.wikipedia.org/wiki/Coronary_catheterization" },
                  thal: { desc: "Thalassemia/Blood flow marker.", why: "Indicates permanent or reversible blood flow defects to the heart.", abnormal: "3 (reversible defect) is a high-risk indicator.", link: "https://en.wikipedia.org/wiki/Thalassemia" }
                }[key];

                return (
                  <div key={key} className="input-group-enhanced">
                    <div className="flex items-center gap-1 mb-1">
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {key.toUpperCase()}
                      </label>
                      <HealthInfoCard 
                        title={key.toUpperCase()}
                        description={infoContent.desc}
                        whyItMatters={infoContent.why}
                        abnormalIndicators={infoContent.abnormal}
                        learnMoreLink={infoContent.link}
                      />
                    </div>
                    <FloatingInput
                      name={key}
                      label=""
                      type="number"
                      step="any"
                      value={formData[key]}
                      onChange={handleChange}
                      icon={iconsMap[key]}
                      required
                    />
                    <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>{helperText}</p>
                  </div>
                );
              })}
            </div>
            <div className="form-actions mt-6" style={{ marginTop: '32px' }}>
              <button
                type="submit"
                disabled={!isFormValid || loading}
                className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-4 px-8 rounded-2xl w-full text-lg shadow-md transition-all duration-200 flex flex-col items-center justify-center gap-1"
                aria-label="Run Heart Assessment"
              >
                <div className="flex items-center gap-3">
                  {loading ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      <span>⏳ Analysing... Please wait</span>
                    </>
                  ) : (
                    <>
                      <span>❤️ Run Heart Risk Assessment</span>
                    </>
                  )}
                </div>
              </button>
              <p className="text-center text-xs text-slate-500 mt-2 italic">
                *Provide your diagnostic markers for a cardiovascular risk prediction
              </p>
            </div>
          </form>
        </FloatingCard>

        <FloatingCard className="result-card">
          <h3 className="mb-4 text-lg font-semibold">AI Scan Result</h3>
          
          {!result && !loading && (
            <div className="result-placeholder" style={{ padding: '40px 0' }}>
              <HeartAnatomySVG className="w-full h-48 mb-6" />
              <HeartIcon size={48} opacity={0.3} color="var(--primary-color)" className="mb-4" />
              <p style={{ marginTop: '16px', maxWidth: '280px', textAlign: 'center' }}>
                Initialize scan to generate a cardiovascular risk assessment.
              </p>
            </div>
          )}

          {loading && (
            <div className="result-placeholder">
              <AnimatedLoader size="medium" text="Mapping Vectors..." />
            </div>
          )}

          {result && (
            <div className="result-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="result-icon">
                {isHighRisk ? (
                  <AlertTriangle size={80} color={getRiskColor()} />
                ) : (
                  <CheckCircle size={80} color={getRiskColor()} />
                )}
              </div>
              <div 
                className="result-value"
                style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: 800, 
                  margin: '16px 0', 
                  color: getRiskColor(),
                  background: 'none',
                  WebkitTextFillColor: 'initial'
                }}
              >
                {result?.prediction || 'Unknown'}
              </div>
              <p className="result-message" style={{ fontSize: '1.2rem' }}>
                Confidence: <strong>{(heartProb * 100).toFixed(2)}%</strong>
              </p>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Algorithm: {result?.ml_model_insights?.algorithm || 'ML Model'}
              </p>
              
              <div style={{ marginTop: 'auto', paddingTop: '24px', width: '100%' }}>
                <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} />
                  Result committed to neural history.
                </p>
              </div>
            </div>
          )}
        </FloatingCard>
      </div>

      <div className="history-section mt-8" style={{ marginTop: '40px' }}>
        <h3 className="mb-4 text-lg font-semibold">Past Heart Screenings</h3>
        {reportsLoading && heartHistory.length === 0 ? (
          <AnimatedLoader size="small" text="Syncing logs..." />
        ) : heartHistory.length === 0 ? (
          <p className="text-muted">No records found.</p>
        ) : (
          <div className="mini-history-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {heartHistory.map((item, idx) => {
              const itemRisk = (item?.prediction || '').toLowerCase().includes('high');
              return (
                <FloatingCard key={idx} className="mini-history-card" style={{ padding: '16px !important' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>Record #{item?.id || idx + 1000}</span>
                    <span className={`finding-badge ${itemRisk ? 'risk' : 'safe'}`} style={{ fontSize: '0.85rem' }}>
                      {item?.prediction || 'Normal'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Confidence: {((item?.probability || 0.99) * 100).toFixed(1)}%
                  </div>
                </FloatingCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Heart;
