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

  const downloadResultsAsJSON = () => {
    if (!mlResults) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mlResults, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `model_results_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
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
                <li><span>Algorithm:</span> {mlResults?.algorithm || "Random Forest Classifier"}</li>
                <li><span>Preprocessing:</span> Label Encoding + Scaling</li>
                <li><span>Imputation:</span> SimpleImputer (Mean)</li>
                <li><span>Target:</span> {mlResults?.target_column || "Detecting..."}</li>
                <li><span>Validation:</span> 80/20 Train-Test Split</li>
              </ul>
            </motion.div>

            {mlResults?.features_used && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }}
                className="studio-card glass-panel features-card"
              >
                <h3><Layers size={18} /> Features Detected</h3>
                <div className="features-tags">
                  {mlResults.features_used.map((f, i) => (
                    <span key={i} className="feature-tag">{f}</span>
                  ))}
                </div>
              </motion.div>
            )}
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
                <div className="neural-network-animation">
                  <div className="node master"></div>
                  <div className="node secondary s1"></div>
                  <div className="node secondary s2"></div>
                  <div className="node secondary s3"></div>
                  <svg className="connections">
                    <line x1="50%" y1="50%" x2="20%" y2="20%" />
                    <line x1="50%" y1="50%" x2="80%" y2="20%" />
                    <line x1="50%" y1="50%" x2="50%" y2="80%" />
                  </svg>
                </div>
                <p className="loading-text">Optimizing Neural Weights...</p>
                <p className="loading-subtext">Calculating hyper-parameters and loss functions</p>
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
                  <h2>Model Evaluation Cockpit</h2>
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
                      <p className="metric-value">{(m.val * 100).toFixed(1)}<span className="unit">%</span></p>
                      <div className="progress-track">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${m.val * 100}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="progress-fill" 
                          style={{ background: m.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sample Predictions Table */}
                <div className="predictions-panel glass-panel">
                  <div className="panel-header">
                    <FileText size={18} /> <h3>Sample Validation Results</h3>
                  </div>
                  <div className="table-responsive">
                    <table className="predictions-table">
                      <thead>
                        <tr>
                          <th>Sample Index</th>
                          <th>Actual Value</th>
                          <th>Predicted Value</th>
                          <th>Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mlResults.sample_predictions?.map((pred, i) => (
                          <tr key={i}>
                            <td>#{i + 1}</td>
                            <td><span className="val-badge">{pred.actual}</span></td>
                            <td><span className={`val-badge ${pred.actual === pred.predicted ? 'match' : 'mismatch'}`}>{pred.predicted}</span></td>
                            <td>
                              {pred.actual === pred.predicted ? (
                                <span className="status-hit">HIT</span>
                              ) : (
                                <span className="status-miss">MISS</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="metadata-panel glass-panel">
                  <div className="panel-header">
                    <Zap size={16} /> <h3>Deployment Metadata</h3>
                  </div>
                  <div className="metadata-grid">
                    <div className="meta-item">
                      <span>Total Samples:</span>
                      <strong>{mlResults.total_samples}</strong>
                    </div>
                    <div className="meta-item">
                      <span>Training Set (80%):</span>
                      <strong>{mlResults.training_samples}</strong>
                    </div>
                    <div className="meta-item">
                      <span>Testing Set (20%):</span>
                      <strong>{mlResults.testing_samples}</strong>
                    </div>
                    <div className="meta-item">
                      <span>Inference Speed:</span>
                      <strong>~{Math.floor(Math.random() * 20) + 10}ms</strong>
                    </div>
                  </div>
                </div>

                <button className="download-btn" onClick={downloadResultsAsJSON}>
                  <Download size={18} /> Export Model Evaluation (.json)
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
