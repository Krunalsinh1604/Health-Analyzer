import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Heart, Zap, FileText, TrendingUp, AlertTriangle,
  CheckCircle, Clock, Upload, Users, BarChart2, Bell, Eye, XCircle, Download, RefreshCw
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip as ChartTooltip, Filler, Legend as ChartLegend,
  ArcElement,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Area, AreaChart, Legend as RechartsLegend 
} from 'recharts';
import FloatingCard from '../components/FloatingCard';
import AnimatedLoader from '../components/AnimatedLoader';
import { BloodDrop, HeartIcon, LungIcon, PulseWatermark } from '../components/HealthIllustrations';
import KPICard from '../components/KPICard';
import { useDashboard } from '../hooks/useDashboard';
import './Dashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, ChartTooltip, Filler, ChartLegend, ArcElement
);

// ── RISK BADGE component ──
const RiskBadge = ({ level }) => {
  const map = {
    Low:    { bg: 'rgba(16,185,129,0.12)', color: '#10B981' },
    Medium: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
    High:   { bg: 'rgba(239,68,68,0.12)',  color: '#EF4444' },
    Moderate: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
  };
  const s = map[level] || map.Low;
  return (
    <span style={{
      padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem',
      fontWeight: 600, background: s.bg, color: s.color
    }}>{level}</span>
  );
};

// ── STATUS BADGE ──
const StatusBadge = ({ status }) => {
  const map = {
    'Low Risk': { bg: 'rgba(16,185,129,0.12)', color: '#10B981' },
    'Moderate Risk':  { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
    'High Risk':{ bg: 'rgba(239,68,68,0.12)', color: '#EF4444' },
  };
  const s = map[status] || map['Low Risk'];
  return <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, background: s.bg, color: s.color }}>{status}</span>;
};

// ══════════════════════════════
// DASHBOARD COMPONENT
// ══════════════════════════════
const Dashboard = () => {
  const { vitals, chartData, telemetry, riskData, insights, loading, error, lastUpdated, refetch } = useDashboard();
  
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef(null);

  // Derive active alerts based on Insights
  const generateAlerts = () => {
    if (!insights) return [];
    const alerts = [];
    
    if (insights.cardiac_confidence > 0.7) alerts.push({
      level: 'high', icon: <AlertTriangle size={16} />, color: '#EF4444', bg: 'rgba(239,68,68,0.06)',
      title: 'SYSTEM ALERT', text: `Cardiac risk trajectory exceeds normal thresholds (${(insights.cardiac_confidence * 100).toFixed(0)}%). Recommend ECG synchronization.`, time: 'Just now'
    });
    
    if (insights.hypertension_confidence > 0.6) alerts.push({
      level: 'medium', icon: <Zap size={16} />, color: '#F59E0B', bg: 'rgba(245,158,11,0.06)',
      title: 'VASCULAR WARNING', text: `Elevated vascular tension vector detected (${(insights.hypertension_confidence * 100).toFixed(0)}% confidence).`, time: '12m ago'
    });

    if (insights.glucose_confidence < 0.4) alerts.push({
      level: 'low', icon: <CheckCircle size={16} />, color: '#10B981', bg: 'rgba(16,185,129,0.06)',
      title: 'COMPLIANCE STATUS', text: 'Neural models suggest stabilization. Glucose response is optimal.', time: '1h ago'
    });

    if (alerts.length === 0) alerts.push({
      level: 'low', icon: <CheckCircle size={16} />, color: '#10B981', bg: 'rgba(16,185,129,0.06)',
      title: 'SYSTEM OPTIMAL', text: 'All clinical vectors within nominal parameters.', time: 'Just now'
    });

    return alerts;
  };

  const dynamicAlerts = generateAlerts();

  const getProgressBarColor = (conf) => {
    if (conf > 0.7) return 'bg-red-500';
    if (conf >= 0.4) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  // ── Donut Chart Data ──
  const totalRisks = riskData.low + riskData.moderate + riskData.high;
  const pLow = totalRisks > 0 ? ((riskData.low / totalRisks) * 100).toFixed(0) : 0;
  const pMod = totalRisks > 0 ? ((riskData.moderate / totalRisks) * 100).toFixed(0) : 0;
  const pHigh = totalRisks > 0 ? ((riskData.high / totalRisks) * 100).toFixed(0) : 0;

  const donutChartData = {
    labels: [`Low Risk (${pLow}%)`, `Moderate Risk (${pMod}%)`, `High Risk (${pHigh}%)`],
    datasets: [{
      data: [riskData.low || 1, riskData.moderate || 0, riskData.high || 0],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };
  
  const donutOpts = {
    responsive: true, maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { position: 'bottom', labels: { color: '#64748B', usePointStyle: true, boxWidth: 8, padding: 16 } },
      tooltip: { backgroundColor: 'white', titleColor: '#0F172A', bodyColor: '#64748B', borderColor: 'rgba(0,0,0,0.06)', borderWidth: 1 },
    },
  };

  return (
    <div className="dashboard">
      <header className="page-header flex justify-between items-end">
        <div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            AI Health Intelligence
          </motion.h1>
          <p>Dynamic patient longitudinal modeling and real-time risk stratification</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={refetch}
          className="bg-white/80 border border-teal-100/50 p-3 rounded-xl text-teal-600 shadow-sm hover:shadow-md transition-all flex items-center gap-2 font-bold mb-2"
          aria-label="Refresh All Data"
        >
          <RefreshCw size={18} className={loading && !vitals ? 'animate-spin' : ''} />
          Refresh
        </motion.button>
      </header>

      {error && (
        <div className="error-banner mb-6" style={{ marginBottom: '24px', opacity: 0.8, background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* ── TOP STATS ── */}
      <div className="stats-grid mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <KPICard 
          title="Mean Glucose"
          value={vitals?.glucose?.value || '---'}
          unit={vitals?.glucose?.unit}
          change={vitals?.glucose?.change}
          status={vitals?.glucose?.status}
          loading={loading && !vitals}
          error={!!error && !vitals}
          onRetry={refetch}
          lastUpdated={lastUpdated ? Math.floor((new Date() - lastUpdated) / 1000) : 0}
          icon={<Activity size={22} />}
          organ={<BloodDrop size={16} />}
          tooltip="Average blood sugar over time based on latest records."
        />
        <KPICard 
          title="Blood Pressure"
          value={vitals?.bloodPressure ? `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}` : '---'}
          unit={vitals?.bloodPressure?.unit}
          status={vitals?.bloodPressure?.status}
          loading={loading && !vitals}
          error={!!error && !vitals}
          onRetry={refetch}
          lastUpdated={lastUpdated ? Math.floor((new Date() - lastUpdated) / 1000) : 0}
          icon={<Heart size={22} />}
          organ={<HeartIcon size={16} />}
          tooltip="Latest recorded systolic pressure."
        />
        <KPICard 
          title="Avg Heart Rate"
          value={vitals?.heartRate?.value || '---'}
          unit={vitals?.heartRate?.unit}
          change={vitals?.heartRate?.change}
          status={vitals?.heartRate?.status}
          loading={loading && !vitals}
          error={!!error && !vitals}
          onRetry={refetch}
          lastUpdated={lastUpdated ? Math.floor((new Date() - lastUpdated) / 1000) : 0}
          icon={<Zap size={22} />}
          organ={<HeartIcon size={16} />}
          tooltip="Max heart rate from most recent scan."
        />
        <KPICard 
          title="CBC Flags"
          value={vitals?.cbcFlags?.count != null ? vitals.cbcFlags.count : '---'}
          status={vitals?.cbcFlags?.severity?.toLowerCase()}
          loading={loading && !vitals}
          error={!!error && !vitals}
          onRetry={refetch}
          lastUpdated={lastUpdated ? Math.floor((new Date() - lastUpdated) / 1000) : 0}
          icon={<FileText size={22} />}
          organ={<BloodDrop size={16} />}
          tooltip="Number of out-of-bounds CBC markers."
        />
      </div>

      {/* ── CHARTS + ALERTS ROW ── */}
      <div className="main-grid three-col">
        {/* Weekly Chart */}
        <FloatingCard delay={0.4} className="chart-card span-2" style={{ position: 'relative', overflow: 'hidden' }}>
          {loading && vitals && (
            <div className="absolute inset-0 bg-white/40 z-20 flex items-center justify-center backdrop-blur-[1px]">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="animate-spin text-teal-500" size={24} />
                <span className="text-xs font-bold text-teal-600">Syncing Bio-Vectors...</span>
              </div>
            </div>
          )}
          <PulseWatermark className="absolute inset-0 pointer-events-none" style={{ opacity: 0.1, top: '40px' }} />
          <div className="card-header pb-0" style={{ position: 'relative', zIndex: 1 }}>
            <h3 className="text-lg font-extrabold text-slate-800">Neuro-Link Vital Trajectories</h3>
            <span className="live-indicator"><span className="dot"></span> Real-time Ingest (60s refresh)</span>
          </div>
          <div className="chart-container" style={{ height: '280px', position: 'relative', zIndex: 1 }}>
            {(loading && !chartData.length) ? (
              <div className="w-full h-full animate-pulse bg-slate-50 flex items-center justify-center rounded-xl">
                <div className="text-slate-300 font-bold uppercase tracking-widest">Loading Bio-Vectors...</div>
              </div>
            ) : (
              <ResponsiveContainer width="99%" height={280}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <RechartsLegend verticalAlign="top" iconType="circle" height={36}/>
                  <Area type="monotone" name="Glucose (mg/dL)" dataKey="glucose" stroke="#2DD4BF" strokeWidth={3} fillOpacity={1} fill="url(#colorGlucose)" />
                  <Area type="monotone" name="Blood Pressure (mmHg)" dataKey="systolic" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorBP)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </FloatingCard>

        {/* Donut */}
        <FloatingCard delay={0.45} className="chart-card">
          <div className="card-header"><h3 className="text-lg font-extrabold text-slate-800">Risk Distribution</h3></div>
          <div className="chart-container" style={{ height: '280px' }}>
            <Doughnut options={donutOpts} data={donutChartData} />
          </div>
        </FloatingCard>
      </div>

      {/* ── ALERTS + INSIGHTS ROW ── */}
      <div className="main-grid two-col" style={{ marginTop: '24px' }}>
        {/* Alerts Panel */}
        <FloatingCard delay={0.5} className="alerts-card">
          <div className="card-header">
            <h3><Bell size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />System Alerts</h3>
          </div>
          <div className="alerts-list">
            {loading && !insights ? (
              <div className="animate-pulse space-y-3 p-4">
                <div className="h-4 bg-slate-100 rounded w-full"/>
                <div className="h-4 bg-slate-100 rounded w-full"/>
              </div>
            ) : dynamicAlerts.map((a, i) => (
              <div key={i} className="alert-item" style={{ background: a.bg }}>
                <span className="alert-icon" style={{ color: a.color }}>{a.icon}</span>
                <div className="alert-body">
                  <p style={{ color: '#0F172A', fontWeight: 600, fontSize: '0.82rem', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{a.title}</p>
                  <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '4px' }}>{a.text}</p>
                  <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </FloatingCard>

        {/* Predictive Insights Panel */}
        <FloatingCard delay={0.55} className="insights-card">
          <div className="card-header border-b border-slate-100 pb-4 mb-4">
            <h3><Activity size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />Predictive Insights</h3>
          </div>
          <div className="space-y-6">
            {loading && !insights ? (
               <div className="animate-pulse space-y-4">
                 <div className="h-8 bg-slate-100 rounded w-full"/>
                 <div className="h-8 bg-slate-100 rounded w-full"/>
                 <div className="h-8 bg-slate-100 rounded w-full"/>
               </div>
            ) : (
              <>
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-semibold text-slate-700">Cardiac Vector</span>
                    <span className="text-xs font-bold text-slate-500">{(insights?.cardiac_confidence * 100).toFixed(0)}% Conf.</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`${getProgressBarColor(insights?.cardiac_confidence)} h-2 rounded-full transition-all duration-1000`} style={{ width: `${(insights?.cardiac_confidence * 100)}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-semibold text-slate-700">Glucose Stability</span>
                    <span className="text-xs font-bold text-slate-500">{(insights?.glucose_confidence * 100).toFixed(0)}% Conf.</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`${getProgressBarColor(insights?.glucose_confidence)} h-2 rounded-full transition-all duration-1000`} style={{ width: `${(insights?.glucose_confidence * 100)}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-semibold text-slate-700">Vascular Tension</span>
                    <span className="text-xs font-bold text-slate-500">{(insights?.hypertension_confidence * 100).toFixed(0)}% Conf.</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`${getProgressBarColor(insights?.hypertension_confidence)} h-2 rounded-full transition-all duration-1000`} style={{ width: `${(insights?.hypertension_confidence * 100)}%` }}></div>
                  </div>
                </div>
              </>
            )}
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-6 rounded-xl w-full text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Download size={16} /> Print Full Analytics Report
            </motion.button>
          </div>
        </FloatingCard>
      </div>

      {/* ── RECENT PATIENT SCANS TABLE ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <FloatingCard className="table-card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <h3 className="text-lg font-extrabold text-slate-800">Telemetry Ingestion Log</h3>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Showing {telemetry.length} of {telemetry.length} records</span>
          </div>
          <div className="table-wrapper">
            <table className="scan-table">
              <thead>
                <tr>
                  <th>Ingestion ID</th>
                  <th>Scan Type</th>
                  <th>Timestamp</th>
                  <th>Inference Result</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && telemetry.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-8 text-slate-400">Syncing local records...</td></tr>
                ) : telemetry.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-8 text-slate-400">No telemetry records found. Run a prediction to populate log.</td></tr>
                ) : telemetry.map((p, i) => (
                  <tr key={i}>
                    <td><code style={{ color: '#0EA5E9', fontSize: '0.85rem' }}>{p.id}</code></td>
                    <td><strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{p.scanType}</strong></td>
                    <td style={{ color: '#94A3B8', fontSize: '0.85rem' }}>{p.timestamp}</td>
                    <td style={{ color: '#64748B', fontSize: '0.88rem' }}>{p.inferenceResult}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>
                      <button className="table-action-btn"><Eye size={14} /> Inspect</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FloatingCard>
      </motion.div>

    </div>
  );
};

export default Dashboard;
