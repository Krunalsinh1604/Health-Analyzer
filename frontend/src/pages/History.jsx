import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, FileText, Calendar, Activity, Heart, AlertTriangle, Clock, ArrowRight
} from 'lucide-react';
import FloatingCard from '../components/FloatingCard';
import AnimatedLoader from '../components/AnimatedLoader';
import { useReports } from '../context/ReportContext';
import './History.css';

const History = () => {
  const { reports, loading, error } = useReports();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  const filteredDocs = reports.filter(doc => {
    const matchesSearch = 
      (doc.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'All' || doc.category === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading && reports.length === 0) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatedLoader size="large" text="Syncing Neural Logs..." />
      </div>
    );
  }

  const getRiskStatus = (doc) => {
    if (doc.type === 'diabetes') return doc.risk_level?.toLowerCase().includes('high') ? 'risk' : 'safe';
    const pred = (doc.prediction || '').toString().toLowerCase();
    if (pred.includes('high')) return 'risk';
    return 'safe';
  };

  const getIcon = (type) => {
    switch(type) {
      case 'diabetes': return <Activity size={20} color="#2EC4B6" />;
      case 'heart': return <Heart size={20} color="#EF4444" />;
      case 'hypertension': return <AlertTriangle size={20} color="#F59E0B" />;
      case 'cbc': return <FileText size={20} color="#4DA8DA" />;
      default: return <Clock size={20} />;
    }
  };

  return (
    <div className="history-page">
      <header className="page-header">
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          Patient Neural Logs
        </motion.h1>
        <p>Comprehensive historical record of all AI clinical assessments</p>
      </header>

      {error && <div className="error-banner mb-6"><AlertTriangle size={18} /> {error}</div>}

      <div className="history-controls">
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search diagnostics..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          {['All', 'Diabetes', 'Cardiovascular', 'Hypertension', 'CBC Analysis'].map((type) => (
            <button 
              key={type}
              className={`filter-btn ${filterType === type ? 'active' : ''}`}
              onClick={() => setFilterType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="history-list">
        <AnimatePresence mode="popLayout">
          {filteredDocs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="no-results"
            >
              <div className="placeholder-content">
                <Clock size={64} strokeWidth={1} opacity={0.3} color="var(--primary-color)" />
                <p>No historical vectors match your current filter.</p>
              </div>
            </motion.div>
          ) : (
            filteredDocs.map((doc, idx) => (
              <motion.div
                key={`${doc.type}-${doc.id}-${idx}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
              >
                <FloatingCard className="history-item-card" hover={false}>
                  <div className="item-main">
                    <div className="item-icon-wrapper">
                      {getIcon(doc.type)}
                    </div>
                    <div className="item-info">
                      <div className="item-header">
                        <h3>{doc.category}</h3>
                        <span className="item-date">
                          <Calendar size={14} /> 
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="item-body">
                        <span className={`finding-badge ${getRiskStatus(doc)}`}>
                          {doc.type === 'diabetes' ? doc.diabetes_prediction : (doc.prediction || 'Scan Complete')}
                        </span>
                        <div className="item-meta">
                          <span>#HT-{doc.id?.toString().padStart(4, '0')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button className="action-btn view">
                      Details <ArrowRight size={16} />
                    </button>
                  </div>
                </FloatingCard>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {loading && reports.length > 0 && (
        <div className="sync-indicator">
          <AnimatedLoader size="small" text="Synchronizing Background Streams..." />
        </div>
      )}
    </div>
  );
};

export default History;

