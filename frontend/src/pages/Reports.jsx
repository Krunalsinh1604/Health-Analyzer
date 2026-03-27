import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import GlowButton from '../components/GlowButton';
import './Reports.css';

const reports = [
  {
    id: 'RPT-2024-89V',
    patient: 'Alexia Vance',
    riskLevel: 'high',
    prediction: '85% probability of arrhythmias in 48h',
    insights: 'Elevated stress markers combined with disrupted REM cycles detected.',
    date: '2 hours ago'
  },
  {
    id: 'RPT-2024-88A',
    patient: 'Marcus Chen',
    riskLevel: 'low',
    prediction: 'Stable recovery trajectory',
    insights: 'Post-op vitals nominal. Inflammation markers decreasing.',
    date: '5 hours ago'
  },
  {
    id: 'RPT-2024-87T',
    patient: 'Sarah Jenkins',
    riskLevel: 'medium',
    prediction: 'Potential glucose irregularity',
    insights: 'Slight deviations in metabolic rate during fasting periods.',
    date: '1 day ago'
  }
];

const Reports = () => {
  return (
    <div className="reports-page">
      <header className="page-header">
        <div className="header-top">
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            AI Diagnostics & Reports
          </motion.h1>
          <GlowButton variant="primary">Generate New Report</GlowButton>
        </div>
        <p>Neural engine analysis and predictive healthcare modeling</p>
      </header>

      <div className="reports-grid">
        {reports.map((report, idx) => (
          <FloatingCard key={report.id} delay={0.1 * idx} className={`report-card ${report.riskLevel}`}>
            <div className={`risk-glow ${report.riskLevel}`}></div>
            
            <div className="report-header">
              <span className="report-id">{report.id}</span>
              <span className="report-date">{report.date}</span>
            </div>
            
            <div className="patient-name">Patient: {report.patient}</div>
            
            <div className="prediction-box">
              {report.riskLevel === 'high' && <AlertTriangle size={20} className="text-red" />}
              {report.riskLevel === 'medium' && <Info size={20} className="text-yellow" />}
              {report.riskLevel === 'low' && <CheckCircle size={20} className="text-green" />}
              <h4>{report.prediction}</h4>
            </div>

            <div className="insights-container">
              <h5>Neural Insights</h5>
              <p>{report.insights}</p>
            </div>

            <div className="progress-container">
              <div className="progress-labels">
                <span>Confidence Score</span>
                <span>{report.riskLevel === 'high' ? '92%' : report.riskLevel === 'medium' ? '86%' : '98%'}</span>
              </div>
              <div className="progress-bar-bg">
                <motion.div 
                  className={`progress-bar-fill ${report.riskLevel}`}
                  initial={{ width: 0 }}
                  animate={{ width: report.riskLevel === 'high' ? '92%' : report.riskLevel === 'medium' ? '86%' : '98%' }}
                  transition={{ duration: 1, delay: 0.5 + (0.1 * idx) }}
                ></motion.div>
              </div>
            </div>

            <div className="report-actions">
              <GlowButton variant="outline" className="w-full">View Full Scan</GlowButton>
            </div>
          </FloatingCard>
        ))}
      </div>
    </div>
  );
};

export default Reports;
