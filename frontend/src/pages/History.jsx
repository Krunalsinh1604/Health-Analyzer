import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import "./Dashboard.css";

function History() {
    const { authFetch } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [viewMode, setViewMode] = useState('table');
    const [generalReports, setGeneralReports] = useState([]);
    const [cbcReports, setCbcReports] = useState([]);
    const [heartReports, setHeartReports] = useState([]);
    const [htnReports, setHtnReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);

    const openModal = (report, type) => { setSelectedReport({ ...report, type }); };
    const closeModal = () => { setSelectedReport(null); };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [gen, cbc, heart, htn] = await Promise.all([
                    authFetch("/reports/history"),
                    authFetch("/cbc/history"),
                    authFetch("/heart/history"),
                    authFetch("/hypertension/history")
                ]);
                if (gen.ok) setGeneralReports((await gen.json()).reports || []);
                if (cbc.ok) setCbcReports((await cbc.json()).reports || []);
                if (heart.ok) setHeartReports((await heart.json()).reports || []);
                if (htn.ok) setHtnReports((await htn.json()).reports || []);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [authFetch]);

    const chartData = useMemo(() => {
        return [...generalReports].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(r => ({
            date: new Date(r.created_at).toLocaleDateString(),
            Glucose: r.glucose,
            BMI: r.bmi,
            BP: r.blood_pressure
        }));
    }, [generalReports]);

    return (
        <div className="dashboard-root">
            <Navbar />

            <main className="db-container">
                <div style={{ gridColumn: 'span 12', marginBottom: '32px' }} className="animate-db">
                    <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--db-accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>NEURO-LINK REGISTRY</h2>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--db-text)', margin: 0, letterSpacing: '-0.02em' }}>Integrated Health History</h1>
                </div>

                <div className="db-card animate-db" style={{ gridColumn: 'span 12' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                        <div className="db-nav-links" style={{ height: 'auto', background: 'var(--db-bg)', padding: 4, borderRadius: 12 }}>
                            {['general', 'cbc', 'heart', 'hypertension'].map(t => (
                                <button key={t} className={`db-nav-item ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)} style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}>
                                    {t === 'general' ? 'Diabetes' : t === 'cbc' ? 'Hematology' : t === 'heart' ? 'Cardiac' : 'Vascular'}
                                </button>
                            ))}
                        </div>
                        <div className="db-nav-links" style={{ height: 'auto', background: 'var(--db-bg)', padding: 4, borderRadius: 12 }}>
                            <button className={`db-nav-item ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')} style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}>Registry</button>
                            <button className={`db-nav-item ${viewMode === 'trends' ? 'active' : ''}`} onClick={() => setViewMode('trends')} style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}>Trajectories</button>
                        </div>
                    </div>

                    {loading ? <p style={{ color: 'var(--db-muted)', textAlign: 'center', padding: '40px 0' }}>Accessing data vaults...</p> : (
                        <div className="db-table-container">
                            {viewMode === 'table' ? (
                                <table className="db-table">
                                    <thead>
                                        {activeTab === 'general' && <tr><th>Timestamp</th><th>Glucose</th><th>BMI</th><th>BP Rating</th><th>Prediction Vector</th></tr>}
                                        {activeTab === 'cbc' && <tr><th>Timestamp</th><th>Source</th><th>Status Vector</th><th>Action</th></tr>}
                                        {activeTab === 'heart' && <tr><th>Timestamp</th><th>Age</th><th>BP</th><th>Chol</th><th>Map</th><th>Action</th></tr>}
                                        {activeTab === 'hypertension' && <tr><th>Timestamp</th><th>Age</th><th>BMI</th><th>HR</th><th>Map</th><th>Action</th></tr>}
                                    </thead>
                                    <tbody>
                                        {activeTab === 'general' && generalReports.map(r => (
                                            <tr key={r.id}>
                                                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                                                <td>{r.glucose}</td><td>{r.bmi}</td><td>{r.blood_pressure}</td>
                                                <td><span className={`db-badge ${r.risk_level === 'High Risk' ? 'db-badge-crimson' : 'db-badge-green'}`}>{r.diabetes_prediction}</span></td>
                                            </tr>
                                        ))}
                                        {activeTab === 'cbc' && cbcReports.map(r => (
                                            <tr key={r.id}>
                                                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                                                <td>{r.source}</td>
                                                <td style={{ fontSize: 11, color: 'var(--db-muted)' }}>{r.interpretation?.summary?.substring(0, 48)}...</td>
                                                <td><button className="db-btn-secondary" style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => openModal(r, 'cbc')}>VIEW</button></td>
                                            </tr>
                                        ))}
                                        {activeTab === 'heart' && heartReports.map(r => (
                                            <tr key={r.id}>
                                                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                                                <td>{r.age}</td><td>{r.trestbps}</td><td>{r.chol}</td>
                                                <td><span className={`db-badge ${r.prediction?.includes('High') ? 'db-badge-crimson' : 'db-badge-green'}`}>{r.prediction}</span></td>
                                                <td><button className="db-btn-secondary" style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => openModal(r, 'heart')}>VIEW</button></td>
                                            </tr>
                                        ))}
                                        {activeTab === 'hypertension' && htnReports.map(r => (
                                            <tr key={r.id}>
                                                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                                                <td>{r.age}</td><td>{r.bmi}</td><td>{r.heart_rate}</td>
                                                <td><span className={`db-badge ${r.prediction?.includes('High') ? 'db-badge-crimson' : 'db-badge-green'}`}>{r.prediction}</span></td>
                                                <td><button className="db-btn-secondary" style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => openModal(r, 'hypertension')}>VIEW</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div style={{ height: 400, padding: 20 }}>
                                    <ResponsiveContainer>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                                            <XAxis dataKey="date" axisLine={{stroke: 'rgba(255, 255, 255, 0.1)'}} tick={{fill: 'var(--db-muted)', fontSize: 11}} />
                                            <YAxis axisLine={{stroke: 'rgba(255, 255, 255, 0.1)'}} tick={{fill: 'var(--db-muted)', fontSize: 11}} />
                                            <Tooltip contentStyle={{ background: 'var(--db-card)', border: '1px solid var(--db-border)', borderRadius: '8px', fontSize: 12 }} />
                                            <Legend />
                                            <Line type="monotone" dataKey="Glucose" stroke="var(--db-accent)" strokeWidth={3} />
                                            <Line type="monotone" dataKey="BMI" stroke="var(--db-emerald)" strokeWidth={3} />
                                            <Line type="monotone" dataKey="BP" stroke="var(--db-amber)" strokeWidth={3} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* MODAL */}
            {selectedReport && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={closeModal}>
                   <div className="db-card animate-db" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, width: '100%', border: '1px solid var(--db-accent)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                         <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Registry Telemetry Details</h3>
                         <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--db-muted)', fontSize: 24, cursor: 'pointer' }}>&times;</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                         {selectedReport.type === 'cbc' && (
                           <div style={{ gridColumn: 'span 2' }}>
                              <p style={{ fontSize: 14, color: 'var(--db-muted)', margin: '0 0 16px' }}>{selectedReport.interpretation?.summary}</p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                 {selectedReport.interpretation?.abnormal_findings?.map(f => <span key={f} className="db-badge db-badge-crimson">{f}</span>)}
                              </div>
                           </div>
                         )}
                         {selectedReport.type !== 'cbc' && Object.entries(selectedReport).map(([k, v]) => (
                           typeof v !== 'object' && !['id', 'created_at', 'prediction', 'type'].includes(k) && (
                             <div key={k} style={{ padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid var(--db-border)' }}>
                                <div style={{ fontSize: 10, color: 'var(--db-muted)', textTransform: 'uppercase' }}>{k}</div>
                                <div style={{ fontSize: 15, fontWeight: 700 }}>{String(v)}</div>
                             </div>
                           )
                         ))}
                      </div>
                   </div>
                </div>
            )}
        </div>
    );
}

export default History;
