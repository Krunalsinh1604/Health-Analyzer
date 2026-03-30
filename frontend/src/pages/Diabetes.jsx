import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertTriangle, Heart, Droplets, Scale, User, ShieldCheck } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import GlowButton from '../components/GlowButton';
import FloatingInput from '../components/FloatingInput';
import AnimatedLoader from '../components/AnimatedLoader';
import HealthInfoCard from '../components/HealthInfoCard';
import { PancreasSVG } from '../components/HealthIllustrations';
import api from '../services/api';
import { useReports } from '../context/ReportContext';
import './DiseasePrediction.css';

const iconsMap = {
  Glucose: <Activity size={18} />,
  BloodPressure: <Heart size={18} />,
  SkinThickness: <Droplets size={18} />,
  Insulin: <Activity size={18} />,
  BMI: <Scale size={18} />,
  DiabetesPedigreeFunction: <Activity size={18} />,
  Age: <User size={18} />
};

const Diabetes = () => {
  const { saveReport } = useReports();
  const [formData, setFormData] = useState({
    Glucose: '', BloodPressure: '', SkinThickness: '',
    Insulin: '', BMI: '', DiabetesPedigreeFunction: '', Age: ''
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
      const res = await api.post('/predict', payload);
      const predictionData = res.data;
      setResult(predictionData);

      // --- AUTO SAVE ---
      await saveReport('diabetes', {
        inputs: payload,
        outputs: predictionData,
        source: 'manual'
      });

    } catch (err) {
      console.error('DIABETES ERROR:', err);
      setError(err?.response?.data?.detail || 'Analysis failed. Check your data link.');
    } finally {
      setLoading(false);
    }
  };

  const isPositive = result?.diabetes_prediction === 'Positive';
  const probability = result?.ml_model_insights?.probability || 0;

  const getRiskColor = () => {
    const risk = result?.risk_level || '';
    if (risk.toLowerCase().includes('high')) return '#EF4444';
    if (risk.toLowerCase().includes('medium') || risk.toLowerCase().includes('moderate')) return '#F59E0B';
    return '#10B981';
  };

  return (
    <div className="prediction-page">
      <header className="page-header">
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          Diabetes AI Analysis
        </motion.h1>
        <p>Neural inference engine for early diabetes onset detection</p>
      </header>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="error-banner mb-6">
          <AlertTriangle size={18} /> {error}
        </motion.div>
      )}

      <div className="prediction-grid">
        <FloatingCard className="form-card">
          <h3 className="mb-4 text-lg font-semibold" style={{ marginBottom: '24px' }}>Patient Biometrics</h3>
          <form onSubmit={handlePredict}>
            <div className="form-grid">
              {Object.keys(formData).map((key) => {
                const helperText = {
                  Glucose: "Your blood sugar level. Normal: 70–99 mg/dL fasting",
                  BloodPressure: "The force of blood against artery walls. Normal: below 120/80 mmHg",
                  BMI: "Body Mass Index — your weight-to-height ratio. Healthy range: 18.5–24.9",
                  Age: "Your current age in years",
                  Insulin: "Hormone regulating blood sugar. Fasting normal: 2–25 µIU/mL",
                  SkinThickness: "Triceps skin fold measurement. Used to estimate body fat",
                  DiabetesPedigreeFunction: "Likelihood of diabetes based on family history score"
                }[key];

                const infoContent = {
                  Glucose: {
                    desc: "Concentration of sugar (glucose) in your blood.",
                    why: "Main indicator of how well your body processes sugar. Persistent high levels define diabetes.",
                    abnormal: "Fasting levels >126 mg/dL often indicate diabetes.",
                    link: "https://en.wikipedia.org/wiki/Blood_sugar_level"
                  },
                  BloodPressure: {
                    desc: "Pressure exerted by circulating blood on vessel walls.",
                    why: "High blood pressure (hypertension) often coexists with diabetes and increases cardiovascular risk.",
                    abnormal: "Above 140/90 mmHg is clinically concerning.",
                    link: "https://en.wikipedia.org/wiki/Blood_pressure"
                  },
                  BMI: {
                    desc: "Measure of body fat based on height and weight.",
                    why: "Higher BMI is a significant risk factor for Type 2 diabetes.",
                    abnormal: ">30 is considered obese and higher risk.",
                    link: "https://en.wikipedia.org/wiki/Body_mass_index"
                  },
                  Insulin: {
                    desc: "A hormone made by the pancreas that allows your body to use sugar.",
                    why: "Low insulin or insulin resistance leads to high blood sugar levels.",
                    abnormal: "Extremely high/low fasting levels suggest metabolic dysfunction.",
                    link: "https://en.wikipedia.org/wiki/Insulin"
                  },
                  SkinThickness: {
                    desc: "Thickness of the triceps skin fold.",
                    why: "Used as a proxy for body fat percentage in clinical datasets.",
                    abnormal: "Thicker folds correlate with higher body fat.",
                    link: "https://en.wikipedia.org/wiki/Skinfold_thickness"
                  },
                  Age: {
                    desc: "Patient's chronological age.",
                    why: "Risk for Type 2 diabetes increases with age, particularly after 45.",
                    abnormal: "N/A",
                    link: "https://en.wikipedia.org/wiki/Ageing"
                  },
                  DiabetesPedigreeFunction: {
                    desc: "Function representing the likelihood of diabetes based on family history.",
                    why: "Genetics play a major role in diabetes predisposition.",
                    abnormal: "Higher values indicate stronger hereditary links.",
                    link: "https://en.wikipedia.org/wiki/Medical_genetics"
                  }
                }[key];

                return (
                  <div key={key} className="input-group-enhanced">
                    <div className="flex items-center gap-1 mb-1">
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <HealthInfoCard 
                        title={key.replace(/([A-Z])/g, ' $1').trim()}
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
                aria-label="Run AI Health Scan"
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
          <h3 className="mb-4 text-lg font-semibold">AI Prediction Result</h3>
          
          {!result && !loading && (
            <div className="result-placeholder" style={{ padding: '40px 0' }}>
              <PancreasSVG className="w-full h-48 mb-6" />
              <Activity size={48} opacity={0.3} color="var(--primary-color)" />
              <p style={{ marginTop: '16px', maxWidth: '280px', textAlign: 'center' }}>
                Enter patient vitals and run prediction to view neural analysis results.
              </p>
            </div>
          )}

          {loading && (
            <div className="result-placeholder">
              <AnimatedLoader size="medium" text="Synthesizing..." />
            </div>
          )}

          {result && (
            <div className="result-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="result-icon">
                {isPositive ? (
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
                {result?.diabetes_prediction || 'Unknown'} — {result?.risk_level || 'N/A'}
              </div>
              <p className="result-message" style={{ fontSize: '1.2rem' }}>
                Model Confidence: <strong>{(probability * 100).toFixed(2)}%</strong>
              </p>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Algorithm: {result?.ml_model_insights?.algorithm || 'ML Model'}
              </p>

              {/* Analysis Breakdown */}
              {Array.isArray(result?.analysis) && result.analysis.length > 0 && (
                <div style={{ width: '100%', marginTop: '24px', background: 'rgba(255,255,255,0.4)', padding: '16px', borderRadius: '12px', fontSize: '0.9rem' }}>
                  <h4 style={{ marginBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px', color: 'var(--text-dark)' }}>Parameter Analysis</h4>
                  {result.analysis.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{item?.parameter || `Param ${i+1}`}</span>
                      <span style={{ fontWeight: 600, color: item?.status === 'Abnormal' ? '#EF4444' : '#10B981' }}>{item?.status || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              )}
              
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
    </div>
  );
};

export default Diabetes;


