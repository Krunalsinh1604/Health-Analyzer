import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertTriangle, UploadCloud, Droplets, Scale, User, ShieldCheck } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import GlowButton from '../components/GlowButton';
import FloatingInput from '../components/FloatingInput';
import AnimatedLoader from '../components/AnimatedLoader';
import HealthInfoCard from '../components/HealthInfoCard';
import { MicroscopeSVG } from '../components/HealthIllustrations';
import api from '../services/api';
import { useReports } from '../context/ReportContext';
import './DiseasePrediction.css';

const fieldConfig = [
  { key: 'Hemoglobin', label: 'Hemoglobin (g/dL)', icon: <Droplets size={18} /> },
  { key: 'RBC', label: 'RBC (M/µL)', icon: <Activity size={18} /> },
  { key: 'WBC', label: 'WBC (K/µL)', icon: <Activity size={18} /> },
  { key: 'Platelets', label: 'Platelets (K/µL)', icon: <Scale size={18} /> },
  { key: 'MCV', label: 'MCV (fL)', icon: <Scale size={18} /> },
  { key: 'MCH', label: 'MCH (pg)', icon: <Scale size={18} /> },
  { key: 'Neutrophils', label: 'Neutrophils (%)', icon: <User size={18} /> },
  { key: 'Lymphocytes', label: 'Lymphocytes (%)', icon: <User size={18} /> },
];

const CBC = () => {
  const { saveReport } = useReports();
  const initialForm = Object.fromEntries(fieldConfig.map(f => [f.key, '']));
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleManualChange = (e) => {
    setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isFormValid = !Object.values(formData).some(v => v === '') || file;

  const handleManualAnalyze = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true); setResult(null); setFile(null); setError('');
    try {
      const payload = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, v === '' ? 0 : Number(v)])
      );
      const res = await api.post('/cbc/analyze', payload);
      const resData = res.data;
      setResult(resData);

      // --- AUTO SAVE ---
      await saveReport('cbc', {
        cbc: resData?.cbc || {},
        interpretation: resData?.interpretation || {},
        source: 'manual',
      });

    } catch (err) {
      console.error('CBC ERROR:', err);
      setError(err?.response?.data?.detail || 'Manual analysis failed. Connection unstable.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e?.target?.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setLoading(true); setResult(null); setError('');
    
    const fd = new FormData();
    fd.append('file', selectedFile);

    try {
      const res = await api.post('/cbc/upload-report', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const resData = res.data;
      setResult(resData);

      // --- AUTO SAVE ---
      await saveReport('cbc', {
        cbc: resData?.cbc || {},
        interpretation: resData?.interpretation || {},
        source: 'upload',
      });

    } catch (err) {
      console.error('CBC UPLOAD ERROR:', err);
      setError(err?.response?.data?.detail || 'Report synthesis failed. Check document format.');
    } finally {
      setLoading(false);
    }
  };

  const interpretationData = result?.interpretation || {};
  const cbcValues = result?.cbc || {};
  
  const getInterpretationSummary = () => {
    if (!interpretationData || typeof interpretationData !== 'object') return 'Scan Complete';
    const flags = Object.entries(interpretationData)
      .filter(([, v]) => v && typeof v === 'string' && (v.toLowerCase().includes('high') || v.toLowerCase().includes('low') || v.toLowerCase().includes('abnormal')))
      .map(([k]) => k);
    
    if (flags.length > 0) return `${flags.length} Abnormal Vector(s) Detected`;
    return 'All Systems Normal';
  };

  const hasAnomalies = Object.values(interpretationData).some(v => 
    typeof v === 'string' && (v.toLowerCase().includes('high') || v.toLowerCase().includes('low') || v.toLowerCase().includes('abnormal'))
  );

  const resultColor = hasAnomalies ? '#EF4444' : '#10B981';

  return (
    <div className="prediction-page">
      <header className="page-header">
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          CBC Blood Analysis
        </motion.h1>
        <p>Interpret Complete Blood Count datasets using Computer Vision and NLP</p>
      </header>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="error-banner mb-6">
          <AlertTriangle size={18} /> {error}
        </motion.div>
      )}

      <div className="prediction-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <FloatingCard className="form-card">
            <h3 className="mb-4 text-lg font-semibold" style={{ marginBottom: '16px' }}>Upload Digital Report (.pdf, .jpg)</h3>
            <div 
              style={{ 
                border: '2px dashed rgba(46, 196, 182, 0.3)', 
                background: 'rgba(255,255,255,0.4)',
                padding: '32px', 
                textAlign: 'center', 
                borderRadius: '16px', 
                cursor: 'pointer', 
                position: 'relative', 
                transition: 'all 0.3s ease' 
              }}
            >
               <input 
                  type="file" 
                  onChange={handleFileUpload} 
                  accept=".pdf,.jpg,.png" 
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
                />
               <UploadCloud size={48} color="var(--primary-color)" style={{ margin: '0 auto 16px auto' }} />
               <p style={{ color: 'var(--text-muted)' }}>{file ? file.name : 'Click or drop medical report to extract data'}</p>
            </div>
          </FloatingCard>

          <FloatingCard className="form-card">
            <h3 className="mb-4 text-lg font-semibold" style={{ marginBottom: '24px' }}>Manual Vector Entry</h3>
            <form onSubmit={handleManualAnalyze}>
              <div className="form-grid">
                {fieldConfig.map((field) => {
                  const helperText = {
                    Hemoglobin: "Protein in red blood cells that carries oxygen. Normal: 12–17 g/dL",
                    RBC: "Red Blood Cells — oxygen carriers in your blood. Normal: 4.2–5.9 M/µL",
                    WBC: "White Blood Cells — your immune fighters. Normal: 4.5–11.0 K/µL",
                    Platelets: "Tiny cells that stop bleeding. Normal: 150–400 K/µL",
                    MCV: "Mean Corpuscular Volume — average size of RBCs. Normal: 80–100 fL",
                    MCH: "Mean Corpuscular Hemoglobin — average amount per RBC. Normal: 27–33 pg",
                    Neutrophils: "Type of WBC that fights infections. Normal: 40–60%",
                    Lymphocytes: "Type of WBC that manages immune response. Normal: 20–40%"
                  }[field.key];

                  const infoContent = {
                    Hemoglobin: { desc: "Protein in red blood cells.", why: "Essential for carrying oxygen from lungs to the rest of the body.", abnormal: "Low levels indicate anemia; high levels may suggest polycythemia.", link: "https://en.wikipedia.org/wiki/Hemoglobin" },
                    RBC: { desc: "Red Blood Cell count.", why: "Carries oxygen and carbon dioxide throughout the body.", abnormal: "Low RBC may indicate blood loss or vitamin deficiency.", link: "https://en.wikipedia.org/wiki/Red_blood_cell" },
                    WBC: { desc: "White Blood Cell count.", why: "Part of the immune system that helps the body fight infection and disease.", abnormal: "High WBC often indicates infection or inflammation.", link: "https://en.wikipedia.org/wiki/White_blood_cell" },
                    Platelets: { desc: "Smallest blood cells involved in clotting.", why: "Necessary to prevent excessive bleeding by forming clots.", abnormal: "Low platelets (thrombocytopenia) increase bruising/bleeding risk.", link: "https://en.wikipedia.org/wiki/Platelet" },
                    MCV: { desc: "Average volume/size of red blood cells.", why: "Helps classify types of anemia (e.g., microcytic vs macrocytic).", abnormal: "Abnormal sizes suggest specific nutritional or genetic issues.", link: "https://en.wikipedia.org/wiki/Mean_corpuscular_volume" },
                    MCH: { desc: "Average mass of hemoglobin per red blood cell.", why: "Further characterizes the makeup of red blood cells.", abnormal: "Often parallels MCV changes.", link: "https://en.wikipedia.org/wiki/Mean_corpuscular_hemoglobin" },
                    Neutrophils: { desc: "The most abundant type of white blood cells.", why: "First responders to bacterial infections.", abnormal: "High levels (neutrophilia) commonly point to acute infection.", link: "https://en.wikipedia.org/wiki/Neutrophil" },
                    Lymphocytes: { desc: "Immune cells that include B cells and T cells.", why: "Vital for viral defense and long-term immunity.", abnormal: "High levels may indicate viral infection or chronic inflammation.", link: "https://en.wikipedia.org/wiki/Lymphocyte" }
                  }[field.key];

                  return (
                    <div key={field.key} className="input-group-enhanced">
                      <div className="flex items-center gap-1 mb-1">
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                          {field.label}
                        </label>
                        <HealthInfoCard 
                          title={field.key}
                          description={infoContent.desc}
                          whyItMatters={infoContent.why}
                          abnormalIndicators={infoContent.abnormal}
                          learnMoreLink={infoContent.link}
                        />
                      </div>
                      <FloatingInput
                        name={field.key}
                        label=""
                        type="number"
                        step="any"
                        value={formData[field.key]}
                        onChange={handleManualChange}
                        icon={field.icon}
                        required={!file}
                      />
                      <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>{helperText}</p>
                    </div>
                  );
                })}
              </div>
              <div className="form-actions mt-6" style={{ marginTop: '32px' }}>
                <button
                  type="submit"
                  disabled={loading || (!file && !isFormValid)}
                  className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-4 px-8 rounded-2xl w-full text-lg shadow-md transition-all duration-200 flex flex-col items-center justify-center gap-1"
                  aria-label="Check Blood Results"
                >
                  <div className="flex items-center gap-3">
                    {loading && !file ? (
                      <>
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                        <span>⏳ Analysing... Please wait</span>
                      </>
                    ) : (
                      <>
                        <span>🧪 Check My Blood Results</span>
                      </>
                    )}
                  </div>
                </button>
                <p className="text-center text-xs text-slate-500 mt-2 italic">
                  *Enter your lab values to get an AI explanation of your CBC report
                </p>
              </div>
            </form>
          </FloatingCard>
        </div>

        <FloatingCard className="result-card">
          <h3 className="mb-4 text-lg font-semibold">AI Interpretation</h3>
          
          {!result && !loading && (
            <div className="result-placeholder" style={{ padding: '40px 0' }}>
              <MicroscopeSVG className="w-64 h-64 mb-6" />
              <Activity size={48} opacity={0.3} color="var(--primary-color)" className="mb-4" />
              <p style={{ marginTop: '16px', maxWidth: '280px', textAlign: 'center' }}>
                Upload a report or input fields to generate hematology insights.
              </p>
            </div>
          )}

          {loading && (
            <div className="result-placeholder">
              <AnimatedLoader size="medium" text="Extracting Biometrics..." />
            </div>
          )}

          {result && (
            <div className="result-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="result-icon">
                 {hasAnomalies ? <AlertTriangle size={80} color={resultColor} /> : <CheckCircle size={80} color={resultColor} />}
              </div>
              <div 
                className="result-value" 
                style={{ 
                  fontSize: '2rem', 
                  fontWeight: 800, 
                  margin: '16px 0', 
                  color: resultColor,
                  background: 'none',
                  WebkitTextFillColor: 'initial',
                  textAlign: 'center'
                }}
              >
                {getInterpretationSummary()}
              </div>

              {/* CBC Values Table */}
              {cbcValues && typeof cbcValues === 'object' && Object.keys(cbcValues).length > 0 && (
                <div style={{ width: '100%', marginTop: '24px', background: 'rgba(255,255,255,0.4)', padding: '16px', borderRadius: '12px', fontSize: '0.9rem' }}>
                  <h4 style={{ marginBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px', color: 'var(--text-dark)' }}>Extracted Biometrics</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {Object.entries(cbcValues).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{k}:</span>
                        <span style={{ fontWeight: 600 }}>{v != null ? String(v) : 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interpretation Details */}
              {interpretationData && typeof interpretationData === 'object' && Object.keys(interpretationData).length > 0 && (
                <div style={{ width: '100%', marginTop: '16px', background: 'rgba(255,255,255,0.4)', padding: '16px', borderRadius: '12px', fontSize: '0.9rem' }}>
                  <h4 style={{ marginBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px', color: 'var(--text-dark)' }}>System Interpretation</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                    {Object.entries(interpretationData).map(([k, v]) => {
                      const isAbnormal = typeof v === 'string' && (v.toLowerCase().includes('high') || v.toLowerCase().includes('low') || v.toLowerCase().includes('abnormal'));
                      return (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{k}:</span>
                          <span style={{ fontWeight: 600, color: isAbnormal ? '#EF4444' : '#10B981' }}>{v != null ? String(v) : 'Normal'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div style={{ marginTop: 'auto', paddingTop: '24px', width: '100%' }}>
                <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} />
                  Record committed to clinical vault.
                </p>
              </div>
            </div>
          )}
        </FloatingCard>
      </div>
    </div>
  );
};

export default CBC;

