import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCcw, TrendingUp, TrendingDown } from 'lucide-react';
import FloatingCard from './FloatingCard';

const KPICard = ({ 
  title, 
  value, 
  unit = '', 
  change = 0, 
  status = 'normal', 
  loading = false, 
  error = false, 
  onRetry, 
  lastUpdated,
  icon,
  organ,
  tooltip
}) => {
  
  const getStatusColor = (v, type) => {
    // Basic logic for color coding based on user prompt
    if (type === 'glucose') {
      if (v >= 126) return 'text-red-500';
      if (v >= 100) return 'text-amber-500';
      return 'text-green-500';
    }
    if (type === 'bp') {
      const systolic = parseInt(v.split('/')[0]);
      if (systolic >= 140) return 'text-red-500';
      if (systolic >= 120) return 'text-amber-500';
      return 'text-green-500';
    }
    if (type === 'heartRate') {
      if (v > 100 || v < 60) return 'text-amber-500';
      return 'text-green-500';
    }
    if (type === 'cbc') {
      if (v > 0) return 'text-red-500';
      return 'text-green-500';
    }
    return 'text-slate-800';
  };

  const statusColor = getStatusColor(value, title.toLowerCase().includes('glucose') ? 'glucose' : 
                                       title.toLowerCase().includes('pressure') ? 'bp' :
                                       title.toLowerCase().includes('heart') ? 'heartRate' :
                                       title.toLowerCase().includes('cbc') ? 'cbc' : 'other');

  return (
    <FloatingCard className="stat-card p-0" title={tooltip}>
      <div className="p-6 relative overflow-hidden" aria-live="polite">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-slate-100 rounded-lg animate-pulse" />
                <div className="w-16 h-4 bg-slate-100 rounded animate-pulse" />
              </div>
              <div className="w-24 h-8 bg-slate-100 rounded animate-pulse" />
              <div className="w-32 h-3 bg-slate-50 rounded animate-pulse" />
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-2 text-center"
            >
              <AlertCircle className="text-red-400 mb-2" size={24} />
              <p className="text-xs text-slate-500 mb-2">Sync failed</p>
              <button 
                onClick={onRetry}
                className="text-teal-600 text-xs font-bold flex items-center gap-1 hover:underline"
              >
                <RefreshCcw size={12} /> Retry
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="stat-icon" style={{ background: 'rgba(45, 212, 191, 0.08)' }}>
                  <span className="text-teal-600">{icon}</span>
                </div>
                {change !== 0 && (
                  <div className={`flex items-center gap-1 text-xs font-bold ${change > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(change)}%
                  </div>
                )}
              </div>
              
              <div className="stat-info">
                <h3 className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                  {organ && <span>{organ}</span>}
                  {title}
                </h3>
                <h2 className={`text-2xl font-extrabold ${statusColor} flex items-baseline gap-1`}>
                  {value}
                  {unit && <span className="text-sm font-semibold opacity-60">{unit}</span>}
                </h2>
                <div className="mt-4 flex flex-col gap-1">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <ClockIcon size={10} /> 
                    {lastUpdated ? `Last updated: ${lastUpdated}s ago` : 'Updated just now'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FloatingCard>
  );
};

const ClockIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default KPICard;
