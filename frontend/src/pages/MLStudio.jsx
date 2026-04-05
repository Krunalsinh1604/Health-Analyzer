import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Upload, FileText, Cpu, Layers, RefreshCw, CheckCircle, 
  AlertTriangle, Database, Zap, Download 
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';
import './MLStudio.css';

const MLStudio = () => {
  const { user } = useAuth();
  const [mlFile, setMlFile] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlResults, setMlResults] = useState(null);
  const [mlError, setMlError] = useState(null);
  const fileRef = useRef(null);

  const handleMLFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.csv')) {
      setMlFile(file);
      setMlError(null);
    } else {
      setMlError("Please select a valid .csv file");
    }
  };

  const handleMLTrain = async () => {
    if (!mlFile) return;
    setMlLoading(true);
    setMlError(null);
    setMlResults(null);

    const formData = new FormData();
    formData.append('file', mlFile);

    try {
      const data = await dashboardService.trainCustomML(formData);
      setMlResults(data);
    } catch (err) {
      setMlError(err.response?.data?.detail || "Training failed. Ensure CSV format is correct.");
    } finally {
      setMlLoading(false);
    }
  };

  return (
    <div className="ml-studio-page">
      <header className="page-header">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="badge-glow">🤖 Advanced Neural Training</div>
          <h1>Custom ML Studio</h1>
          <p>Train and evaluate custom clinical models with your own datasets.</p>
          
          {!user && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="guest-mode-alert glass-panel"
            >
              <AlertTriangle size={16} /> 
              <span><strong>Guest Mode:</strong> Your training sessions are temporary. <Link to="/login" className="text-secondary underline">Sign in</Link> to save models and history.</span>
            </motion.div>
          )}
        </motion.div>
      </header>

      <div className="studio-container">
        <div className="studio-grid">
          {/* Config & Upload Side */}
          <div className="studio-sidebar">
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="studio-card glass-panel upload-card"
            >
              <h3><Upload size={18} /> Dataset Configuration</h3>
              <p className="helper-text">Upload a clean CSV file. The last column will be used as the target variable.</p>
              
              <div 
                className={`drop-zone ${mlFile ? 'has-file' : ''}`}
                onClick={() => fileRef.current.click()}
              >
                <input 
                  type="file" 
                  ref={fileRef}
                  onChange={handleMLFileChange}
                  accept=".csv"
                  className="hidden" 
                />
                <div className="drop-zone-content">
                  <div className="icon-wrap">
                    {mlFile ? <FileText className="text-primary" /> : <Upload />}
                  </div>
                  <div className="text-wrap">
                    <p className="file-name">{mlFile ? mlFile.name : 'Click to Upload'}</p>
                    <p className="file-hint">MIME: text/csv (.csv)</p>
                  </div>
                </div>
              </div>

              <button 
                className="train-btn"
                disabled={!mlFile || mlLoading}
                onClick={handleMLTrain}
              >
                {mlLoading ? (
                  <><RefreshCw size={18} className="animate-spin" /> Training Model...</>
                ) : (
                  <><Cpu size={18} /> Initialize Neural Engine</>
                )}
              </button>

              {mlError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-msg">
                  <AlertTriangle size={14} /> {mlError}
                </motion.div>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="studio-card glass-panel info-card"
            >
              <h3><Database size={18} /> Model Strategy</h3>
              <ul className="info-list">
                <li><span>Algorithm:</span> Random Forest Classifier</li>
                <li><span>Preprocessing:</span> Label Encoding + Scaling</li>
                <li><span>Imputation:</span> Mean/Median Strategy</li>
                <li><span>Validation:</span> 80/20 Train-Test Split</li>
              </ul>
            </motion.div>
          </div>

          {/* Results Side */}
          <div className="studio-main">
            {!mlResults && !mlLoading && (
              <div className="placeholder-container">
                <Layers size={64} className="placeholder-icon" />
                <h2>Awaiting Neural Input</h2>
                <p>Upload a dataset to begin supervised learning and performance evaluation.</p>
              </div>
            )}

            {mlLoading && (
              <div className="training-loader">
                <div className="neural-node node-1"></div>
                <div className="neural-node node-2"></div>
                <div className="neural-node node-3"></div>
                <p className="loading-text">Optimizing Neural Weights...</p>
              </div>
            )}

            {mlResults && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="results-dashboard"
              >
                <div className="results-header">
                  <div className="status-badge"><CheckCircle size={14} /> Training Successful</div>
                  <h2>Model Performance Metrics</h2>
                </div>

                <div className="metrics-grid">
                  {[
                    { label: 'Accuracy', val: mlResults.accuracy, color: '#10B981' },
                    { label: 'Precision', val: mlResults.precision, color: '#3b82f6' },
                    { label: 'Recall', val: mlResults.recall, color: '#8b5cf6' },
                    { label: 'F1-Score', val: mlResults.f1_score, color: '#f59e0b' },
                  ].map((m, i) => (
                    <div key={i} className="metric-card glass-panel">
                      <p className="metric-label">{m.label}</p>
                      <p className="metric-value">{(m.val * 100).toFixed(1)}%</p>
                      <div className="progress-track">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${m.val * 100}%` }}
                          className="progress-fill" 
                          style={{ background: m.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="metadata-panel glass-panel">
                  <div className="panel-header">
                    <Zap size={16} /> <h3>Model Metadata</h3>
                  </div>
                  <div className="metadata-grid">
                    <div className="meta-item">
                      <span>Total Samples:</span>
                      <strong>{mlResults.total_samples}</strong>
                    </div>
                    <div className="meta-item">
                      <span>Training Set:</span>
                      <strong>{mlResults.training_samples}</strong>
                    </div>
                    <div className="meta-item">
                      <span>Testing Set:</span>
                      <strong>{mlResults.testing_samples}</strong>
                    </div>
                    <div className="meta-item">
                      <span>Inference Speed:</span>
                      <strong>~42ms</strong>
                    </div>
                  </div>
                </div>

                <button className="download-btn">
                  <Download size={18} /> Export Model Parameters (.json)
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLStudio;
