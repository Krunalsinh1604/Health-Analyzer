import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth

const Footer = () => {
    const { user } = useAuth(); // Get user from context

    return (
        <footer className="site-footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h3>Health Analyzer</h3>
                    <p>AI-Powered Diagnostics for predictive health analysis and monitoring. Your health, decoded.</p>
                </div>
                <div className="footer-section">
                    <h4>Quick Links</h4>
                    {user ? (
                        <ul>
                            <li><Link to="/dashboard">Dashboard</Link></li>
                            <li><Link to="/history">My History</Link></li>
                            <li><Link to="/diabetes">Diabetes Analysis</Link></li>
                            <li><Link to="/cbc">CBC Analyzer</Link></li>
                            <li><Link to="/hypertension">Hypertension Monitor</Link></li>
                            <li><Link to="/heart-disease">Heart Disease Risk</Link></li>
                        </ul>
                    ) : (
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/login">Login</Link></li>
                            <li><Link to="/register">Register</Link></li>
                        </ul>
                    )}
                </div>
                <div className="footer-section">
                    <h4>Legal</h4>
                    <ul>
                        <li><Link to="#">Privacy Policy</Link></li>
                        <li><Link to="#">Terms of Service</Link></li>
                        <li><Link to="#">Contact Us</Link></li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Health Analyzer. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
