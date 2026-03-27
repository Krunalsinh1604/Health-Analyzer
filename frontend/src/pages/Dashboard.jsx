import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Heart, Zap, FileText, TrendingUp, AlertTriangle,
  CheckCircle, Clock, Upload, Users, BarChart2, Bell, Eye, XCircle
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Filler, Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import FloatingCard from '../components/FloatingCard';
import AnimatedLoader from '../components/AnimatedLoader';
import { useReports } from '../context/ReportContext';
import './Dashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, Tooltip, Filler, Legend, ArcElement
);

// ── RISK BADGE component ──
const RiskBadge = ({ level }) => {
  const map = {
    Low:    { bg: 'rgba(16,185,129,0.12)', color: '#10B981' },
    Medium: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
    High:   { bg: 'rgba(239,68,68,0.12)',  color: '#EF4444' },
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
    Complete: { bg: 'rgba(16,185,129,0.12)', color: '#10B981' },
    Pending:  { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
    Reviewing:{ bg: 'rgba(99,102,241,0.12)', color: '#6366F1' },
  };
  const s = map[status] || map.Pending;
  return <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, background: s.bg, color: s.color }}>{status}</span>;
};

// ── SAMPLE DATA ──
const SAMPLE_PATIENTS = [
  { id: '#P-4821', name: 'Arjun Mehta',    scan: 'MRI Brain',        date: 'Mar 27, 2025', risk: 'High',   status: 'Reviewing' },
  { id: '#P-3302', name: 'Priya Sharma',   scan: 'ECG Analysis',     date: 'Mar 27, 2025', risk: 'Medium', status: 'Pending'   },
  { id: '#P-5519', name: 'Carlos Lima',    scan: 'CBC Report',       date: 'Mar 26, 2025', risk: 'Low',    status: 'Complete'  },
  { id: '#P-2201', name: 'Emily Watson',   scan: 'Hypertension Scan',date: 'Mar 26, 2025', risk: 'Medium', status: 'Pending'   },
  { id: '#P-1004', name: 'Jae-won Oh',     scan: 'Diabetes Analysis',date: 'Mar 25, 2025', risk: 'Low',    status: 'Complete'  },
];

const ALERTS = [
  { level: 'high',   icon: <AlertTriangle size={16} />, color: '#EF4444', bg: 'rgba(239,68,68,0.06)',   text: 'High neurological risk detected', patient: 'Patient #4821', time: '2m ago' },
  { level: 'medium', icon: <Zap size={16} />,           color: '#F59E0B', bg: 'rgba(245,158,11,0.06)',  text: 'Unusual cardiac marker found',    patient: 'Patient #3302', time: '18m ago' },
  { level: 'low',    icon: <CheckCircle size={16} />,   color: '#10B981', bg: 'rgba(16,185,129,0.06)',  text: 'Scan complete, no anomalies',      patient: 'Patient #5519', time: '1h ago' },
];

// ══════════════════════════════
// DASHBOARD COMPONENT
// ══════════════════════════════
const Dashboard = () => {
  const { reports, loading, error } = useReports();
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef(null);

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <AnimatedLoader size="large" text="Syncing Neural Data..." />
    </div>
  );

  // ── Dynamic calculations ──
  const reportsCount = reports.length;

  const riskStats = reports.reduce((acc, r) => {
    let risk = 'low';
    if (r.type === 'diabetes') risk = (r.risk_level || 'low').toLowerCase().includes('high') ? 'high' : 'low';
    else if (r.type === 'heart' || r.type === 'hypertension') {
      const isHigh = typeof r.prediction === 'string' ? r.prediction.toLowerCase().includes('high') : r.prediction === 1;
      risk = isHigh ? 'high' : 'low';
    }
    acc[risk]++;
    return acc;
  }, { low: 0, medium: 0, high: 0 });

  const healthScoreRaw = reportsCount === 0 ? 100 : ((riskStats.low * 100 + riskStats.medium * 70 + riskStats.high * 30) / reportsCount);
  const healthScore = `${Math.round(healthScoreRaw)}%`;

  const latestResult = reports[0]
    ? (reports[0].type === 'diabetes' ? reports[0].diabetes_prediction : reports[0].prediction || 'Scan Complete')
    : 'No Data';

  // ── Top stat cards ──
  const topStats = [
    { title: 'Total Scans Today', value: '48',              icon: <Activity size={22} />, color: '#2DD4BF', bg: 'rgba(45,212,191,0.1)' },
    { title: 'Risk Alerts',       value: '3',               icon: <AlertTriangle size={22} />, color: '#EF4444', bg: 'rgba(239,68,68,0.1)', badge: true },
    { title: 'Pending Reports',   value: '12',              icon: <Clock size={22} />,         color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    { title: 'Patients Monitored',value: '284',             icon: <Users size={22} />,         color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
    { title: 'Health Score',      value: healthScore,        icon: <Heart size={22} />,         color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    { title: 'Records Logged',    value: String(reportsCount),icon: <FileText size={22} />,    color: '#0EA5E9', bg: 'rgba(14,165,233,0.1)' },
  ];

  // ── Weekly scan chart ──
  const last7 = reports.slice(0, 7).reverse();
  const weekLabels = last7.length > 0
    ? last7.map(r => new Date(r.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }))
    : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const weekData = last7.length > 0
    ? last7.map((_, i) => 30 + i * 8 + Math.floor(Math.random() * 10))
    : [38, 52, 45, 67, 59, 73, 48];

  const lineChartData = {
    labels: weekLabels,
    datasets: [{
      fill: true, label: 'Scans',
      data: weekData,
      borderColor: '#2DD4BF',
      backgroundColor: 'rgba(45,212,191,0.12)',
      tension: 0.45,
      pointBackgroundColor: '#2DD4BF',
      pointRadius: 4,
    }],
  };

  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'white', titleColor: '#0F172A', bodyColor: '#64748B', borderColor: 'rgba(0,0,0,0.06)', borderWidth: 1, padding: 10 }
    },
    scales: {
      y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#94A3B8' } },
      x: { grid: { display: false }, ticks: { color: '#94A3B8' } },
    },
  };

  // ── Risk distribution donut ──
  const donutData = {
    labels: ['Low Risk', 'Medium Risk', 'High Risk'],
    datasets: [{
      data: [riskStats.low || 10, riskStats.medium || 4, riskStats.high || 3],
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
      <header className="page-header">
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          AI Health Intelligence
        </motion.h1>
        <p>Dynamic patient longitudinal modeling and real-time risk stratification</p>
      </header>

      {error && (
        <div className="error-banner mb-6" style={{ marginBottom: '24px', opacity: 0.8 }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* ── TOP STATS ── */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {topStats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
          >
            <FloatingCard className="stat-card">
              <div className="stat-icon" style={{ background: stat.bg, position: 'relative' }}>
                <span style={{ color: stat.color }}>{stat.icon}</span>
                {stat.badge && <span className="stat-badge">!</span>}
              </div>
              <div className="stat-info">
                <h3>{stat.title}</h3>
                <h2 style={{ fontSize: stat.value.length > 12 ? '1.3rem' : '1.8rem', color: stat.color }}>{stat.value}</h2>
              </div>
            </FloatingCard>
          </motion.div>
        ))}
      </div>

      {/* ── RECENT PATIENT SCANS TABLE ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <FloatingCard className="table-card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3>Recent Patient Scans</h3>
            <span className="live-indicator"><span className="dot"></span> Live</span>
          </div>
          <div className="table-wrapper">
            <table className="scan-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Name</th>
                  <th>Scan Type</th>
                  <th>Date</th>
                  <th>Risk Level</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_PATIENTS.map((p, i) => (
                  <tr key={i}>
                    <td><code style={{ color: '#0EA5E9', fontSize: '0.85rem' }}>{p.id}</code></td>
                    <td><strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{p.name}</strong></td>
                    <td style={{ color: '#64748B', fontSize: '0.88rem' }}>{p.scan}</td>
                    <td style={{ color: '#94A3B8', fontSize: '0.85rem' }}>{p.date}</td>
                    <td><RiskBadge level={p.risk} /></td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>
                      <button className="table-action-btn"><Eye size={14} /> View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FloatingCard>
      </motion.div>

      {/* ── CHARTS + ALERTS ROW ── */}
      <div className="main-grid three-col">
        {/* Weekly Chart */}
        <FloatingCard delay={0.4} className="chart-card span-2">
          <div className="card-header">
            <h3>Weekly Scan Volume</h3>
            <span className="live-indicator"><span className="dot"></span> Real-time Sync</span>
          </div>
          <div className="chart-container" style={{ height: '220px' }}>
            <Line options={lineOpts} data={lineChartData} />
          </div>
        </FloatingCard>

        {/* Donut */}
        <FloatingCard delay={0.45} className="chart-card">
          <div className="card-header"><h3>Risk Distribution</h3></div>
          <div className="chart-container" style={{ height: '220px' }}>
            <Doughnut options={donutOpts} data={donutData} />
          </div>
        </FloatingCard>
      </div>

      {/* ── ALERTS + UPLOAD ROW ── */}
      <div className="main-grid two-col" style={{ marginTop: '24px' }}>
        {/* Alerts Panel */}
        <FloatingCard delay={0.5} className="alerts-card">
          <div className="card-header">
            <h3><Bell size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />Recent Alerts</h3>
          </div>
          <div className="alerts-list">
            {ALERTS.map((a, i) => (
              <div key={i} className="alert-item" style={{ background: a.bg }}>
                <span className="alert-icon" style={{ color: a.color }}>{a.icon}</span>
                <div className="alert-body">
                  <p style={{ color: '#0F172A', fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>{a.text}</p>
                  <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>{a.patient} · {a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </FloatingCard>

        {/* Quick Upload */}
        <FloatingCard delay={0.55} className="upload-card">
          <div className="card-header"><h3><Upload size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />Quick Scan Upload</h3></div>
          <div
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" hidden accept=".dcm,.jpg,.png,.pdf,.jpeg" />
            <div className="drop-icon"><Upload size={28} color="#2DD4BF" /></div>
            <p className="drop-title">Drop patient scan here</p>
            <p className="drop-sub">or click to browse files</p>
            <div className="drop-formats">
              {['DICOM', 'JPG', 'PNG', 'PDF'].map(f => <span key={f} className="format-tag">{f}</span>)}
            </div>
          </div>
        </FloatingCard>
      </div>

      {/* ── RECENT ACTIVITY TIMELINE ── */}
      <div style={{ marginTop: '24px' }}>
        <FloatingCard delay={0.6} className="activity-card">
          <h3 className="mb-4">Recent Status Insights</h3>
          <div className="timeline">
            {reports.slice(0, 5).map((r, i) => (
              <div className="timeline-item" key={i}>
                <div className={`timeline-dot ${i === 0 ? 'success' : 'active'}`}></div>
                <div className="timeline-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0 }}>{r.category || 'Clinical Scan'}</h4>
                    <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                      {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                    {r.type === 'diabetes' ? r.diabetes_prediction : (r.prediction || 'Interpretation complete')}
                  </p>
                </div>
              </div>
            ))}
            {reports.length === 0 && (
              <div className="timeline-item">
                <div className="timeline-dot success"></div>
                <div className="timeline-content">
                  <h4>Neural Link Established</h4>
                  <p>Ready for initial biometrics ingest — run an analysis to populate the log</p>
                </div>
              </div>
            )}
          </div>
        </FloatingCard>
      </div>
    </div>
  );
};

export default Dashboard;
