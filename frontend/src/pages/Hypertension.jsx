import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertTriangle, Heart as HeartIcon, User, Scale, Zap, Users, ShieldCheck } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import GlowButton from '../components/GlowButton';
import FloatingInput from '../components/FloatingInput';
import AnimatedLoader from '../components/AnimatedLoader';
import HealthInfoCard from '../components/HealthInfoCard';
import { BloodVesselSVG } from '../components/HealthIllustrations';
import api from '../services/api';
import { useReports } from '../context/ReportContext';
import './DiseasePrediction.css';

const iconsMap = {
  age: <User size={18} />,
  sex: <User size={18} />,
  bmi: <Scale size={18} />,
  heart_rate: <HeartIcon size={18} />,
  activity_level: <Activity size={18} />,
  smoker: <Zap size={18} />,
  family_history: <Users size={18} />
};

const Hypertension = () => {
  const { reports, saveReport, loading: reportsLoading } = useReports();
  const [formData, setFormData] = useState({
    age: '', sex: '', bmi: '', heart_rate: '', 
    activity_level: '', smoker: '', family_history: ''
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
      setError('Please fill in all biometric fields.');
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
      const res = await api.post('/predict/hypertension', payload);
      const predictionData = res.data;
      setResult(predictionData);

      // --- AUTO SAVE ---
      await saveReport('hypertension', {
        ...payload,
        prediction: predictionData?.prediction || 'Unknown',
        probability: predictionData?.ml_model_insights?.probability || 0
      });

    } catch (err) {
      console.error('HYPERTENSION ERROR:', err);
      setError(err?.response?.data?.detail || 'Analysis failed. Check your data link.');
    } finally {
      setLoading(false);
    }
  };

  const isHighRisk = result?.raw === 1;
  const htnProb = result?.ml_model_insights?.probability || 0;

  const getRiskColor = () => {
    if (isHighRisk && htnProb >= 0.7) return '#EF4444'; 
    if (isHighRisk) return '#F59E0B'; 
    return '#10B981'; 
  };

  const hyperHistory = reports.filter(r => r.type === 'hypertension').slice(0, 6);

  return (
    <div className="prediction-page">
      <header className="page-header">
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          Hypertension AI Analysis
        </motion.h1>
        <p>Predictive engine for hypertension risk assessment</p>
      </header>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="error-banner mb-6">
          <AlertTriangle size={18} /> {error}
        </motion.div>
      )}

      <div className="prediction-grid">
        <FloatingCard className="form-card">
          <h3 className="mb-4 text-lg font-semibold" style={{ marginBottom: '24px' }}>Patient Readings</h3>
          <form onSubmit={handlePredict}>
            <div className="form-grid">
              {Object.keys(formData).map((key) => {
                const helperText = {
                  age: "Your current age in years",
                  sex: "Biological sex (0 = Female, 1 = Male) — affects risk calculations",
                  bmi: "Body Mass Index — your weight-to-height ratio. Healthy range: 18.5–24.9",
                  heart_rate: "Beats per minute. Resting normal: 60–100 bpm",
                  activity_level: "Physical activity level (1-4). 1: Sedentary, 4: Very Active",
                  smoker: "Current smoking status — significantly increases hypertension risk",
                  family_history: "Whether a close relative has hypertension or heart disease"
                }[key];

                const infoContent = {
                  age: { desc: "Chronological age.", why: "Blood vessels naturally stiffen with age, increasing blood pressure risk.", abnormal: "N/A", link: "https://en.wikipedia.org/wiki/Hypertension" },
                  sex: { desc: "Biological sex.", why: "Men are often diagnosed earlier; women's risk rises after menopause.", abnormal: "N/A", link: "https://en.wikipedia.org/wiki/Sex_differences_in_medicine" },
                  bmi: { desc: "Body Mass Index.", why: "Excess weight increases the strain on your heart and vessels.", abnormal: ">25 is overweight, >30 is obese.", link: "https://en.wikipedia.org/wiki/Body_mass_index" },
                  heart_rate: { desc: "Resting heart rate in beats per minute.", why: "A high resting heart rate can be a sign of cardiovascular stress.", abnormal: ">100 bpm is considered tachycardia.", link: "https://en.wikipedia.org/wiki/Heart_rate" },
                  activity_level: { desc: "Frequency of physical exercise.", why: "Regular activity keeps arteries flexible and reduces blood pressure.", abnormal: "Score of 1 (Sedentary) is a high-risk factor.", link: "https://en.wikipedia.org/wiki/Sedentary_lifestyle" },
                  smoker: { desc: "Current smoking status (0: No, 1: Yes).", why: "Nicotine narrows blood vessels and damages arterial walls.", abnormal: "1 (Yes) significantly increases stroke risk.", link: "https://en.wikipedia.org/wiki/Smoking_and_cardiovascular_disease" },
                  family_history: { desc: "Genetic predisposition (0: No, 1: Yes).", why: "Hypertension often has a strong hereditary component.", abnormal: "N/A", link: "https://en.wikipedia.org/wiki/Medical_genetics" }
                }[key];

                return (
                  <div key={key} className="input-group-enhanced">
                    <div className="flex items-center gap-1 mb-1">
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {key.replace(/_/g, ' ').toUpperCase()}
                      </label>
                      <HealthInfoCard 
                        title={key.replace(/_/g, ' ').toUpperCase()}
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
                aria-label="Run Hypertension Scan"
              >
                <div className="flex items-center gap-3">
                  {loading ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      <span>⏳ Analysing... Please wait</span>
                    </>
                  ) : (
                    <>
                      <span>🔍 Analyse My Health Data</span>
                    </>
                  )}
                </div>
              </button>
              <p className="text-center text-xs text-slate-500 mt-2 italic">
                *Takes less than 3 seconds — results are for informational purposes only
              </p>
            </div>
          </form>
        </FloatingCard>

        <FloatingCard className="result-card">
          <h3 className="mb-4 text-lg font-semibold">AI Scan Result</h3>
          
          {!result && !loading && (
            <div className="result-placeholder" style={{ padding: '40px 0' }}>
              <BloodVesselSVG className="w-full h-32 mb-6" />
              <Activity size={48} opacity={0.3} color="var(--primary-color)" className="mb-4" />
              <p style={{ marginTop: '16px', maxWidth: '280px', textAlign: 'center' }}>
                Inject data points to process the hypertension probability vector.
              </p>
            </div>
          )}

          {loading && (
            <div className="result-placeholder">
              <AnimatedLoader size="medium" text="Analyzing Tensor..." />
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
                Confidence Correlation: <strong>{(htnProb * 100).toFixed(2)}%</strong>
              </p>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Algorithm: {result?.ml_model_insights?.algorithm || 'ML Model'}
              </p>
              
              <div style={{ marginTop: 'auto', paddingTop: '24px', width: '100%' }}>
                <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} />
                  Result committed to vascular log.
                </p>
              </div>
            </div>
          )}
        </FloatingCard>
      </div>

      <div className="history-section mt-8" style={{ marginTop: '40px' }}>
        <h3 className="mb-4 text-lg font-semibold">Past Hypertension Screenings</h3>
        {reportsLoading && hyperHistory.length === 0 ? (
          <AnimatedLoader size="small" text="Syncing logs..." />
        ) : hyperHistory.length === 0 ? (
          <p className="text-muted">No records found.</p>
        ) : (
          <div className="mini-history-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {hyperHistory.map((item, idx) => {
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

export default Hypertension;

