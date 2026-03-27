import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertTriangle, Heart, Droplets, Scale, User, ShieldCheck } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import GlowButton from '../components/GlowButton';
import FloatingInput from '../components/FloatingInput';
import AnimatedLoader from '../components/AnimatedLoader';
import api from '../services/api';
import { useReports } from '../context/ReportContext';
import './DiseasePrediction.css';

const iconsMap = {
  Pregnancies: <User size={18} />,
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
    Pregnancies: '', Glucose: '', BloodPressure: '', SkinThickness: '',
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
              {Object.keys(formData).map((key) => (
                <FloatingInput
                  key={key}
                  name={key}
                  label={key.replace(/([A-Z])/g, ' $1').trim()}
                  type="number"
                  step="any"
                  value={formData[key]}
                  onChange={handleChange}
                  icon={iconsMap[key]}
                  required
                />
              ))}
            </div>
            <div className="form-actions mt-4" style={{ marginTop: '32px' }}>
              <GlowButton 
                type="submit" 
                disabled={!isFormValid || loading} 
                loading={loading}
                loadingText="Running Network..."
                className="w-full"
              >
                Run AI Scan
              </GlowButton>
            </div>
          </form>
        </FloatingCard>

        <FloatingCard className="result-card">
          <h3 className="mb-4 text-lg font-semibold">AI Prediction Result</h3>
          
          {!result && !loading && (
            <div className="result-placeholder">
              <Activity size={48} opacity={0.3} color="var(--primary-color)" />
              <p>Enter patient vitals and run prediction to view neural analysis results.</p>
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


