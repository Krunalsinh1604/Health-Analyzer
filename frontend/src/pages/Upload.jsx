import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, File, CheckCircle, X } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import GlowButton from '../components/GlowButton';
import AnimatedLoader from '../components/AnimatedLoader';
import './Upload.css';

const Upload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setSuccess(true);
    }, 3000);
  };

  const reset = () => {
    setFile(null);
    setSuccess(false);
  };

  return (
    <div className="upload-page">
      <header className="page-header">
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          Data Ingestion
        </motion.h1>
        <p>Securely upload patient scans and vitals for neural analysis</p>
      </header>

      <div className="upload-container">
        {!file && !success && (
          <FloatingCard 
            className={`dropzone ${dragActive ? 'active' : ''}`}
            delay={0.1}
          >
            <form 
              onDragEnter={handleDrag} 
              onDragLeave={handleDrag} 
              onDragOver={handleDrag} 
              onDrop={handleDrop}
              onSubmit={(e) => e.preventDefault()}
            >
              <input 
                type="file" 
                id="file-upload" 
                multiple={false} 
                onChange={handleChange} 
                accept=".csv,.json,.dcm,.jpg,.png" 
              />
              <label htmlFor="file-upload" className="dropzone-label">
                <div className="dropzone-icon">
                  <UploadCloud size={64} />
                  <div className="icon-glow"></div>
                </div>
                <h3>Drag & Drop Files Here</h3>
                <p>or click to browse local storage</p>
                <div className="supported-formats">
                  <span>DICOM</span>
                  <span>CSV</span>
                  <span>JSON</span>
                  <span>Images</span>
                </div>
              </label>
            </form>
          </FloatingCard>
        )}

        {file && !uploading && !success && (
          <FloatingCard className="file-preview" delay={0.1}>
            <div className="file-details">
              <div className="file-icon"><File size={40} color="var(--primary-color)" /></div>
              <div className="file-info">
                <h3>{file.name}</h3>
                <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button className="remove-btn" onClick={reset}><X size={20} /></button>
            </div>
            <div className="upload-actions">
              <GlowButton variant="outline" onClick={reset}>Cancel</GlowButton>
              <GlowButton onClick={handleUpload}>Process Data</GlowButton>
            </div>
          </FloatingCard>
        )}

        {uploading && (
          <FloatingCard className="uploading-state" delay={0.1}>
            <AnimatedLoader size="large" text={`Analyzing ${file.name}...`} />
          </FloatingCard>
        )}

        {success && (
          <FloatingCard className="success-state" delay={0.1}>
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="success-icon"
            >
              <CheckCircle size={80} color="#10B981" />
              <div className="success-glow"></div>
            </motion.div>
            <h2>Analysis Complete</h2>
            <p>Data has been processed by the neural network.</p>
            <GlowButton onClick={reset} className="mt-4">Upload Another File</GlowButton>
          </FloatingCard>
        )}
      </div>
    </div>
  );
};

export default Upload;
