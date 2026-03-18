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
                                        Diabetes
                                    </button>
                                    <button
                                        className={activeTab === 'cbc' ? 'active' : ''}
                                        onClick={() => setActiveTab('cbc')}
                                    >
                                        CBC Analysis
                                    </button>
                                    <button
                                        className={activeTab === 'heart' ? 'active' : ''}
                                        onClick={() => setActiveTab('heart')}
                                    >
                                        Heart
                                    </button>
                                    <button
                                        className={activeTab === 'hypertension' ? 'active' : ''}
                                        onClick={() => setActiveTab('hypertension')}
                                    >
                                        Hypertension
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
                                                    <p>No diabetes reports found.</p>
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
                                                        <table>
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
                                                        <table>
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
                    </section>
                </div>
            </main>

            {/* DETAILS MODAL */}
            {selectedReport && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Report Details</h3>
                            <button className="close-btn" onClick={closeModal}>&times;</button>
                        </div>
                        <div className="modal-body">
                            {selectedReport.type === 'cbc' && (
                                <div>
                                    <h4>CBC Analysis</h4>
                                    <p><strong>Date:</strong> {new Date(selectedReport.created_at).toLocaleString()}</p>
                                    <p><strong>Source:</strong> {selectedReport.source}</p>

                                    <div style={{ marginTop: '1rem' }}>
                                        <h5>Key Findings</h5>
                                        {selectedReport.interpretation?.abnormal_findings?.length > 0 ? (
                                            <ul>
                                                {selectedReport.interpretation.abnormal_findings.map((f, i) => (
                                                    <li key={i}>{f}</li>
                                                ))}
                                            </ul>
                                        ) : <p>No abnormal findings.</p>}
                                    </div>

                                    <div style={{ marginTop: '1rem' }}>
                                        <h5>Full Summary</h5>
                                        <p>{selectedReport.interpretation?.summary}</p>
                                    </div>
                                </div>
                            )}

                            {selectedReport.type === 'heart' && (
                                <div>
                                    <h4>Heart Disease Risk Assessment</h4>
                                    <p><strong>Date:</strong> {new Date(selectedReport.created_at).toLocaleString()}</p>
                                    <div className={`status-badge ${selectedReport.prediction?.includes('High') ? 'danger' : 'success'}`} style={{ fontSize: '1.2rem', margin: '1rem 0' }}>
                                        {selectedReport.prediction}
                                    </div>

                                    <div className="grid-2">
                                        <div><strong>Age:</strong> {selectedReport.age}</div>
                                        <div><strong>Sex:</strong> {selectedReport.sex === 1 ? 'Male' : 'Female'}</div>
                                        <div><strong>BP:</strong> {selectedReport.trestbps} mmHg</div>
                                        <div><strong>Cholesterol:</strong> {selectedReport.chol} mg/dl</div>
                                        <div><strong>Max HR:</strong> {selectedReport.thalach} BPM</div>
                                        <div><strong>Chest Pain:</strong> Type {selectedReport.cp}</div>
                                    </div>
                                </div>
                            )}

                            {selectedReport.type === 'hypertension' && (
                                <div>
                                    <h4>Hypertension Risk Profile</h4>
                                    <p><strong>Date:</strong> {new Date(selectedReport.created_at).toLocaleString()}</p>
                                    <div className={`status-badge ${selectedReport.prediction?.includes('High') ? 'danger' : 'success'}`} style={{ fontSize: '1.2rem', margin: '1rem 0' }}>
                                        {selectedReport.prediction}
                                    </div>

                                    <div className="grid-2">
                                        <div><strong>Age:</strong> {selectedReport.age}</div>
                                        <div><strong>Sex:</strong> {selectedReport.sex === 1 ? 'Male' : 'Female'}</div>
                                        <div><strong>BMI:</strong> {selectedReport.bmi}</div>
                                        <div><strong>Heart Rate:</strong> {selectedReport.heart_rate} BPM</div>
                                        <div><strong>Smoker:</strong> {selectedReport.smoker ? 'Yes' : 'No'}</div>
                                        <div><strong>Family History:</strong> {selectedReport.family_history ? 'Yes' : 'No'}</div>
                                        <div><strong>Activity:</strong> {['Sedentary', 'Moderate', 'Active'][selectedReport.activity_level]}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={closeModal}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default History;
