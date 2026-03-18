import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { C } from '../theme';

function History() {
    const { authFetch } = useAuth();
    const [activeTab, setActiveTab] = useState('general'); // 'general' or 'cbc'
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'trends'

    const [generalReports, setGeneralReports] = useState([]);
    const [cbcReports, setCbcReports] = useState([]);
    const [heartReports, setHeartReports] = useState([]);
    const [htnReports, setHtnReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);

    const openModal = (report, type) => {
        setSelectedReport({ ...report, type });
    };

    const closeModal = () => {
        setSelectedReport(null);
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch General Reports
                const genRes = await authFetch("/reports/history");
                if (genRes.ok) {
                    const genData = await genRes.json();
                    setGeneralReports(genData.reports || []);
                }

                // Fetch CBC Reports
                const cbcRes = await authFetch("/cbc/history");
                if (cbcRes.ok) {
                    const cbcData = await cbcRes.json();
                    setCbcReports(cbcData.reports || []);
                }

                // Fetch Heart Reports
                const heartRes = await authFetch("/heart/history");
                if (heartRes.ok) {
                    const heartData = await heartRes.json();
                    setHeartReports(heartData.reports || []);
                }

                // Fetch Hypertension Reports
                const htnRes = await authFetch("/hypertension/history");
                if (htnRes.ok) {
                    const htnData = await htnRes.json();
                    setHtnReports(htnData.reports || []);
                }

            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [authFetch]);

    // Prepare Chart Data for General Reports
    const generalChartData = useMemo(() => {
        return [...generalReports]
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            .map(r => ({
                date: new Date(r.created_at).toLocaleDateString(),
                Glucose: r.glucose,
                BMI: r.bmi,
                BP: r.blood_pressure
            }));
    }, [generalReports]);

    return (
        <div className="page-container">
            <div className="grid-bg-light" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
            <Navbar />

            <div className="page-inner">
                <div className="animate-up" style={{ marginBottom: '40px' }}>
                    <span className="feature-pill">CHRONIC CONDITION TRACKING</span>
                    <h2 className="page-title">Health History</h2>
                    <p className="page-desc">Track your health trends over time.</p>
                </div>

                <div className="bento-card animate-up" style={{ animationDelay: '0.1s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '32px', borderBottom: `1px solid ${C.lightBorder}`, paddingBottom: '20px' }}>
                        <div className="tabs-light" style={{ overflowX: 'auto' }}>
                            {['general', 'cbc', 'heart', 'hypertension'].map((tab) => (
                                <button
                                    key={tab}
                                    className={activeTab === tab ? 'active' : ''}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab === 'general' ? 'Diabetes' : tab === 'cbc' ? 'CBC Analysis' : tab === 'heart' ? 'Heart' : 'Hypertension'}
                                </button>
                            ))}
                        </div>
                        <div className="tabs-light">
                            <button
                                className={viewMode === 'table' ? 'active' : ''}
                                onClick={() => setViewMode('table')}
                            >
                                Table View
                            </button>
                            <button
                                className={viewMode === 'trends' ? 'active' : ''}
                                onClick={() => setViewMode('trends')}
                            >
                                Trends View
                            </button>
                        </div>
                    </div>

                    <div>
                        {loading ? (
                            <p style={{ color: C.lightMuted, textAlign: 'center', padding: '40px 0' }}>Loading history...</p>
                        ) : (
                                    <>
                                        {/* GENERAL REPORTS VIEW */}
                                        {activeTab === 'general' && (
                                            <>
                                                {generalReports.length === 0 ? (
                                                    <p>No diabetes reports found.</p>
                                                ) : (
                                                    <>
                                                        {viewMode === 'table' ? (
                                                            <div className="table-wrap">
                                                                <table className="table-light">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Date</th>
                                                                            <th>Glucose</th>
                                                                            <th>BMI</th>
                                                                            <th>BP</th>
                                                                            <th>Prediction</th>
                                                                            <th>Risk</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {generalReports.map(r => (
                                                                            <tr key={r.id}>
                                                                                <td>{new Date(r.created_at).toLocaleDateString()} {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                                                <td>{r.glucose}</td>
                                                                                <td>{r.bmi}</td>
                                                                                <td>{r.blood_pressure}</td>
                                                                                <td>{r.diabetes_prediction}</td>
                                                                                <td>
                                                                                    <span className={`badge ${r.risk_level?.toLowerCase()}`}>
                                                                                        {r.risk_level}
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        ) : (
                                                            <div style={{ width: '100%', height: 400 }}>
                                                                <ResponsiveContainer>
                                                                    <LineChart data={generalChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                                        <CartesianGrid strokeDasharray="3 3" />
                                                                        <XAxis dataKey="date" />
                                                                        <YAxis />
                                                                        <Tooltip />
                                                                        <Legend />
                                                                        <Line type="monotone" dataKey="Glucose" stroke="#8884d8" name="Glucose (mg/dL)" strokeWidth={2} />
                                                                        <Line type="monotone" dataKey="BMI" stroke="#82ca9d" name="BMI" strokeWidth={2} />
                                                                        <Line type="monotone" dataKey="BP" stroke="#ffc658" name="Blood Pressure" strokeWidth={2} />
                                                                    </LineChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </>
                                        )}

                                        {/* CBC REPORTS VIEW */}
                                        {activeTab === 'cbc' && (
                                            <>
                                                {cbcReports.length === 0 ? (
                                                    <p>No CBC reports found.</p>
                                                ) : (
                                                    <>
                                                        {viewMode === 'trends' && (
                                                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                                                                <p>Trend visualization for CBC parameters is coming soon.</p>
                                                                <button className="ghost" onClick={() => setViewMode('table')}>Switch to Table View</button>
                                                            </div>
                                                        )}

                                                        {viewMode === 'table' && (
                                                            <div className="table-wrap">
                                                                <table className="table-light">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Date</th>
                                                                            <th>Source</th>
                                                                            <th>Interpretation Summary</th>
                                                                            <th>Actions</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {cbcReports.map(r => (
                                                                            <tr key={r.id}>
                                                                                <td>{new Date(r.created_at).toLocaleDateString()} {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                                                <td>
                                                                                    {r.source || 'Manual'}
                                                                                </td>
                                                                                <td>
                                                                                    {/* Safe access to nested interpretation data */}
                                                                                    {r.interpretation?.summary ? (
                                                                                        <span>{r.interpretation.summary.substring(0, 50)}...</span>
                                                                                    ) : (
                                                                                        <span className="text-muted">No summary</span>
                                                                                    )}
                                                                                </td>
                                                                                <td>
                                                                                    <button className="btn-link" onClick={() => openModal(r, 'cbc')}>View Details</button>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </>
                                        )}

                                        {/* HEART REPORTS VIEW */}
                                        {activeTab === 'heart' && (
                                            <>
                                                {heartReports.length === 0 ? (
                                                    <p>No heart health reports found.</p>
                                                ) : (
                                                    <div className="table-wrap">
                                                        <table className="table-light">
                                                            <thead>
                                                                <tr>
                                                                    <th>Date</th>
                                                                    <th>Age</th>
                                                                    <th>BP</th>
                                                                    <th>Chol</th>
                                                                    <th>Max HR</th>
                                                                    <th>Prediction</th>
                                                                    <th>Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {heartReports.map(r => (
                                                                    <tr key={r.id}>
                                                                        <td>{new Date(r.created_at).toLocaleDateString()} {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                                        <td>{r.age}</td>
                                                                        <td>{r.trestbps}</td>
                                                                        <td>{r.chol}</td>
                                                                        <td>{r.thalach}</td>
                                                                        <td>
                                                                            <span className={`badge ${r.prediction?.includes('High') ? 'high' : 'low'}`}>
                                                                                {r.prediction}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <button className="btn-link" onClick={() => openModal(r, 'heart')}>View Details</button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* HYPERTENSION REPORTS VIEW */}
                                        {activeTab === 'hypertension' && (
                                            <>
                                                {htnReports.length === 0 ? (
                                                    <p>No hypertension reports found.</p>
                                                ) : (
                                                    <div className="table-wrap">
                                                        <table className="table-light">
                                                            <thead>
                                                                <tr>
                                                                    <th>Date</th>
                                                                    <th>Age</th>
                                                                    <th>BMI</th>
                                                                    <th>BP Rating (HR)</th>
                                                                    <th>Smoker</th>
                                                                    <th>Prediction</th>
                                                                    <th>Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {htnReports.map(r => (
                                                                    <tr key={r.id}>
                                                                        <td>{new Date(r.created_at).toLocaleDateString()} {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                                        <td>{r.age}</td>
                                                                        <td>{r.bmi}</td>
                                                                        <td>{r.heart_rate}</td>
                                                                        <td>{r.smoker ? 'Yes' : 'No'}</td>
                                                                        <td>
                                                                            <span className={`badge ${r.prediction?.includes('High') ? 'high' : 'low'}`}>
                                                                                {r.prediction}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <button className="btn-link" onClick={() => openModal(r, 'hypertension')}>View Details</button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                    </div>
                </div>
            </div>

            {/* DETAILS MODAL */}
            {selectedReport && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={closeModal}>
                    <div className="bento-card animate-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: `1px solid ${C.lightBorder}`, paddingBottom: '16px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Report Details</h3>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: C.lightMuted }}>&times;</button>
                        </div>
                        <div style={{ paddingBottom: '24px' }}>
                            {selectedReport.type === 'cbc' && (
                                <div>
                                    <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px' }}>CBC Analysis</h4>
                                    <p style={{ margin: '0 0 8px', color: C.lightText }}><strong>Date:</strong> {new Date(selectedReport.created_at).toLocaleString()}</p>
                                    <p style={{ margin: '0 0 16px', color: C.lightText }}><strong>Source:</strong> {selectedReport.source}</p>

                                    <div style={{ marginTop: '24px' }}>
                                        <h5 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px' }}>Key Findings</h5>
                                        {selectedReport.interpretation?.abnormal_findings?.length > 0 ? (
                                            <ul style={{ margin: 0, paddingLeft: '20px', color: C.lightMuted, fontSize: '14px', lineHeight: 1.6 }}>
                                                {selectedReport.interpretation.abnormal_findings.map((f, i) => (
                                                    <li key={i}>{f}</li>
                                                ))}
                                            </ul>
                                        ) : <p style={{ color: C.lightMuted }}>No abnormal findings.</p>}
                                    </div>

                                    <div style={{ marginTop: '24px' }}>
                                        <h5 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px' }}>Full Summary</h5>
                                        <p style={{ margin: 0, color: C.lightMuted, fontSize: '14px', lineHeight: 1.6 }}>{selectedReport.interpretation?.summary}</p>
                                    </div>
                                </div>
                            )}

                            {selectedReport.type === 'heart' && (
                                <div>
                                    <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px' }}>Heart Disease Risk Assessment</h4>
                                    <p style={{ margin: '0 0 16px', color: C.lightText }}><strong>Date:</strong> {new Date(selectedReport.created_at).toLocaleString()}</p>
                                    <div style={{ padding: '12px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '16px', marginBottom: '24px', background: selectedReport.prediction?.includes('High') ? C.crimsonBg : C.emeraldBg, color: selectedReport.prediction?.includes('High') ? C.crimson : C.emerald }}>
                                        {selectedReport.prediction}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                                        <div style={{ background: C.lightBg2, padding: '12px', borderRadius: '8px' }}><div style={{ fontSize: '12px', color: C.lightMuted, marginBottom: '4px' }}>Age</div><div style={{ fontWeight: 600 }}>{selectedReport.age}</div></div>
                                        <div style={{ background: C.lightBg2, padding: '12px', borderRadius: '8px' }}><div style={{ fontSize: '12px', color: C.lightMuted, marginBottom: '4px' }}>Sex</div><div style={{ fontWeight: 600 }}>{selectedReport.sex === 1 ? 'Male' : 'Female'}</div></div>
                                        <div style={{ background: C.lightBg2, padding: '12px', borderRadius: '8px' }}><div style={{ fontSize: '12px', color: C.lightMuted, marginBottom: '4px' }}>BP</div><div style={{ fontWeight: 600 }}>{selectedReport.trestbps} mmHg</div></div>
                                        <div style={{ background: C.lightBg2, padding: '12px', borderRadius: '8px' }}><div style={{ fontSize: '12px', color: C.lightMuted, marginBottom: '4px' }}>Cholesterol</div><div style={{ fontWeight: 600 }}>{selectedReport.chol} mg/dl</div></div>
                                        <div style={{ background: C.lightBg2, padding: '12px', borderRadius: '8px' }}><div style={{ fontSize: '12px', color: C.lightMuted, marginBottom: '4px' }}>Max HR</div><div style={{ fontWeight: 600 }}>{selectedReport.thalach} BPM</div></div>
                                        <div style={{ background: C.lightBg2, padding: '12px', borderRadius: '8px' }}><div style={{ fontSize: '12px', color: C.lightMuted, marginBottom: '4px' }}>Chest Pain</div><div style={{ fontWeight: 600 }}>Type {selectedReport.cp}</div></div>
                                    </div>
                                </div>
                            )}

                            {selectedReport.type === 'hypertension' && (
                                <div>
                                    <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px' }}>Hypertension Risk Profile</h4>
                                    <p style={{ margin: '0 0 16px', color: C.lightText }}><strong>Date:</strong> {new Date(selectedReport.created_at).toLocaleString()}</p>
                                    <div style={{ padding: '12px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '16px', marginBottom: '24px', background: selectedReport.prediction?.includes('High') ? C.crimsonBg : C.emeraldBg, color: selectedReport.prediction?.includes('High') ? C.crimson : C.emerald }}>
                                        {selectedReport.prediction}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                                        <div style={{ background: C.lightBg2, padding: '12px', borderRadius: '8px' }}><div style={{ fontSize: '12px', color: C.lightMuted, marginBottom: '4px' }}>Age</div><div style={{ fontWeight: 600 }}>{selectedReport.age}</div></div>
                                        <div style={{ background: C.lightBg2, padding: '12px', borderRadius: '8px' }}><div style={{ fontSize: '12px', color: C.lightMuted, marginBottom: '4px' }}>Sex</div><div style={{ fontWeight: 600 }}>{selectedReport.sex === 1 ? 'Male' : 'Female'}</div></div>
                                        <div style={{ background: C.lightBg2, padding: '12px', borderRadius: '8px' }}><div style={{ fontSize: '12px', color: C.lightMuted, marginBottom: '4px' }}>BMI</div><div style={{ fontWeight: 600 }}>{selectedReport.bmi}</div></div>
                                        <div style={{ background: C.lightBg2, padding: '12px', borderRadius: '8px' }}><div style={{ fontSize: '12px', color: C.lightMuted, marginBottom: '4px' }}>Heart Rate</div><div style={{ fontWeight: 600 }}>{selectedReport.heart_rate} BPM</div></div>
                                        <div style={{ background: C.lightBg2, padding: '12px', borderRadius: '8px' }}><div style={{ fontSize: '12px', color: C.lightMuted, marginBottom: '4px' }}>Smoker</div><div style={{ fontWeight: 600 }}>{selectedReport.smoker ? 'Yes' : 'No'}</div></div>
                                        <div style={{ background: C.lightBg2, padding: '12px', borderRadius: '8px' }}><div style={{ fontSize: '12px', color: C.lightMuted, marginBottom: '4px' }}>Family History</div><div style={{ fontWeight: 600 }}>{selectedReport.family_history ? 'Yes' : 'No'}</div></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: `1px solid ${C.lightBorder}` }}>
                            <button className="btn-secondary-light" onClick={closeModal}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default History;
