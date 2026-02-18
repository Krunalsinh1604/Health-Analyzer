import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function History() {
    const { authFetch } = useAuth();
    const [activeTab, setActiveTab] = useState('general'); // 'general' or 'cbc'
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'trends'

    const [generalReports, setGeneralReports] = useState([]);
    const [cbcReports, setCbcReports] = useState([]);
    const [loading, setLoading] = useState(true);

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
        <div className="app">
            <Navbar />

            <main className="main-content" style={{ marginTop: '2rem' }}>
                <div className="layout">
                    <section className="panel" style={{ width: '100%' }}>

                        <div className="card">
                            <div className="card-header">
                                <div>
                                    <h3>Health History</h3>
                                    <p>Track your health trends over time.</p>
                                </div>
                                <div className="tabs">
                                    <button
                                        className={activeTab === 'general' ? 'active' : ''}
                                        onClick={() => setActiveTab('general')}
                                    >
                                        General Health
                                    </button>
                                    <button
                                        className={activeTab === 'cbc' ? 'active' : ''}
                                        onClick={() => setActiveTab('cbc')}
                                    >
                                        CBC Analysis
                                    </button>
                                </div>
                            </div>

                            <div className="card-body">
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                    <div className="tabs" style={{ fontSize: '0.9rem' }}>
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

                                {loading ? (
                                    <p>Loading history...</p>
                                ) : (
                                    <>
                                        {/* GENERAL REPORTS VIEW */}
                                        {activeTab === 'general' && (
                                            <>
                                                {generalReports.length === 0 ? (
                                                    <p>No general health reports found.</p>
                                                ) : (
                                                    <>
                                                        {viewMode === 'table' ? (
                                                            <div className="table-wrap">
                                                                <table>
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
                                                                <table>
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
                                                                                <td>{r.source || 'Manual'}</td>
                                                                                <td>
                                                                                    {/* Safe access to nested interpretation data */}
                                                                                    {r.interpretation?.summary ? (
                                                                                        <span>{r.interpretation.summary.substring(0, 50)}...</span>
                                                                                    ) : (
                                                                                        <span className="text-muted">No summary</span>
                                                                                    )}
                                                                                </td>
                                                                                <td>
                                                                                    {/* Placeholder for future "View Details" */}
                                                                                    <span className="text-muted" style={{ fontSize: '0.8em' }}>View Details</span>
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
                                    </>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default History;
