import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import "./Dashboard.css";

// --- MOCK DATA FOR CLINICAL VISUALIZATION ---
const trendData = [
  { day: 'Mon', glucose: 95, bp: 118, hr: 68 },
  { day: 'Tue', glucose: 102, bp: 122, hr: 70 },
  { day: 'Wed', glucose: 98, bp: 120, hr: 72 },
  { day: 'Thu', glucose: 110, bp: 125, hr: 75 },
  { day: 'Fri', glucose: 105, bp: 123, hr: 71 },
  { day: 'Sat', glucose: 97, bp: 119, hr: 69 },
  { day: 'Sun', glucose: 100, bp: 121, hr: 70 },
];

const riskDist = [
  { category: 'Glucose', risk: 35, color: '#10b981' },
  { category: 'Cardiac', risk: 82, color: '#ef4444' },
  { category: 'Vitals', risk: 55, color: '#f59e0b' },
];

function HomePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="dashboard-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--db-accent)', fontSize: '24px', fontWeight: 'bold' }}>INITIALIZING SAAS WORKSPACE...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-root">

      <Navbar />

      {/* --- DASHBOARD CONTENT --- */}
      <main className="db-container">
        
        {/* Header Section */}
        <div style={{ gridColumn: 'span 12', marginBottom: '24px' }} className="animate-db">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--db-accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>PLATFORM OVERVIEW</h2>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--db-text)', margin: 0, letterSpacing: '-0.02em' }}>Clinical Analytics Dashboard</h1>
            </div>
            <div style={{ color: 'var(--db-muted)', fontSize: 13, textAlign: 'right' }}>
              <div>System Uptime: 99.98%</div>
              <div>Last Analysis: 5 mins ago</div>
            </div>
          </div>
        </div>

        {/* --- METRICS GRID --- */}
        {[
          { label: 'Mean Glucose', value: '102', unit: 'mg/dL', trend: '+2.4%', status: 'green', color: 'var(--db-emerald)' },
          { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', trend: 'Stable', status: 'green', color: 'var(--db-emerald)' },
          { label: 'Avg Heart Rate', value: '72', unit: 'bpm', trend: '-1.2%', status: 'green', color: 'var(--db-emerald)' },
          { label: 'CBC Flags', value: '1', unit: 'Active', trend: 'Critical', status: 'crimson', color: 'var(--db-crimson)' }
        ].map((m, i) => (
          <div key={i} className="db-card metric-card animate-db" style={{ gridColumn: 'span 3', animationDelay: `${0.1 + i * 0.05}s` }}>
            <span className="metric-label">{m.label}</span>
            <div className="metric-value">{m.value}<span className="metric-unit">{m.unit}</span></div>
            <div className="metric-trend" style={{ color: m.color }}>
              <span>{m.status === 'green' ? '●' : '▲'}</span> {m.trend}
            </div>
          </div>
        ))}

        {/* --- MAIN CHART: VITAL TRENDS --- */}
        <div className="db-card animate-db" style={{ gridColumn: 'span 8', animationDelay: '0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Neuro-Link Vital Trajectories</h3>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--db-muted)' }}>
                <div style={{ width: 8, height: 8, background: 'var(--db-accent)', borderRadius: '50%' }} /> Glucose
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--db-muted)' }}>
                <div style={{ width: 8, height: 8, background: '#a855f7', borderRadius: '50%' }} /> BP
              </div>
            </div>
          </div>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <AreaChart data={trendData}>
                <defs />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis dataKey="day" axisLine={{stroke: 'rgba(255, 255, 255, 0.1)'}} tickLine={false} tick={{fill: 'var(--db-muted)', fontSize: 11}} />
                <YAxis axisLine={{stroke: 'rgba(255, 255, 255, 0.1)'}} tickLine={false} tick={{fill: 'var(--db-muted)', fontSize: 11}} />
                <Tooltip 
                  contentStyle={{ background: 'var(--db-card)', border: '1px solid var(--db-border)', borderRadius: '12px', fontSize: 12 }}
                  itemStyle={{ fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="glucose" stroke="var(--db-accent)" strokeWidth={3} fillOpacity={0.1} fill="var(--db-accent)" />
                <Area type="monotone" dataKey="bp" stroke="var(--db-teal-soft)" strokeWidth={3} fillOpacity={0.05} fill="var(--db-teal-soft)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- RISK ANALYSIS PANEL --- */}
        <div className="db-card animate-db" style={{ gridColumn: 'span 4', animationDelay: '0.4s' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 24px' }}>AI Risk Perception</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {riskDist.map((item, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{item.category} Vector</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.risk}% Confidence</span>
                </div>
                <div className="risk-meter">
                  <div className="risk-fill" style={{ width: `${item.risk}%`, background: `linear-gradient(to right, ${item.color}88, ${item.color})`, boxShadow: `0 0 10px ${item.color}` }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32, padding: 16, background: 'rgba(239, 68, 68, 0.05)', borderRadius: 16, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: 'var(--db-crimson)' }}>⚠️</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--db-crimson)' }}>SYSTEM ALERT</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--db-muted)', lineHeight: 1.5 }}>
              Cardiac risk trajectory exceeds normal thresholds. Recommend immediate ECG synchronization.
            </p>
          </div>
        </div>

        {/* --- RECENT REPORTS --- */}
        <div className="db-card animate-db" style={{ gridColumn: 'span 7', animationDelay: '0.5s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Telemetry Ingestion Log</h3>
            <Link to="/history" style={{ fontSize: 13, color: 'var(--db-accent)', textDecoration: 'none', fontWeight: 600 }}>Explore Database &rarr;</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { id: 'REC-102', time: '12:42 PM', type: 'CBC Extraction', result: 'Completed', status: 'green' },
              { id: 'REC-098', time: '10:15 AM', type: 'Hypertension Analysis', result: 'Critical Alert', status: 'crimson' },
              { id: 'REC-085', time: 'Yesterday', type: 'Diabetes Profiling', result: 'Normal Range', status: 'green' },
              { id: 'REC-071', time: 'Yesterday', type: 'Heart Risk Sync', result: 'Moderate Flags', status: 'amber' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--db-border)', background: 'var(--db-bg)' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ fontSize: 18 }}>{r.type.includes('CBC') ? '🩸' : r.type.includes('Heart') ? '🫀' : '🩺'}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{r.type}</div>
                    <div style={{ fontSize: 11, color: 'var(--db-muted)' }}>ID: {r.id} • {r.time}</div>
                  </div>
                </div>
                <span className={`db-badge db-badge-${r.status}`}>{r.result}</span>
              </div>
            ))}
          </div>
        </div>

        {/* --- RECOMMENDATIONS PANEL --- */}
        <div className="db-card animate-db" style={{ gridColumn: 'span 5', animationDelay: '0.6s' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 24px' }}>Predictive Insights</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ padding: '16px', background: 'var(--db-teal-soft)', borderRadius: 12, border: '1px solid rgba(13, 148, 136, 0.1)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--db-accent)', marginBottom: 8, textTransform: 'uppercase' }}>GLUCOSE REGULARITY</div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--db-muted)', lineHeight: 1.5 }}>
                Neural models suggest stabilization in nocturnal glucose levels. Maintain current dietary protocol.
              </p>
            </div>
            <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.1)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--db-emerald)', marginBottom: 8, textTransform: 'uppercase' }}>COMPLIANCE STATUS</div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--db-muted)', lineHeight: 1.5 }}>
                Patient response to recent vital shifts is optimal. Data synchronization successfully mapped.
              </p>
            </div>
            <button className="db-btn-primary" style={{ width: '100%' }}>
              Synchronize Full Report
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
