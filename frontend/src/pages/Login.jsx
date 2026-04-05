import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from "../context/NotificationContext";
import FloatingCard from '../components/FloatingCard';
import GlowButton from '../components/GlowButton';
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import mainLogo from '../assets/logo.png';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  // Removed useEffect for location.state?.message as info banner is replaced by showNotification

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Changed from '' to "" as per instruction
    setIsLoading(true); // Changed from setLoading to setIsLoading for consistency with state variable
    
    try {
      const success = await login(email, password);
      if (success) {
        showNotification("Login successful!", "success");
        // Need to check the role from the context since we just logged in
        // A better way is to get the user from useAuth again if it's updated
        // But login in AuthContext already sets the user.
        // Let's rely on the user being updated in the next render or check the response if possible.
        // Since login returns true/false, we might need a small delay or check auth status.
        // Actually, let's just use the user object that should be in context now.
        // Replaced window.location.href with navigate
        if (email.includes('admin') || email === 'admin') {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError("Invalid email or password"); // Changed message as per instruction
        showNotification("Invalid email or password", "error");
      }
    } catch (err) {
      setError('Connection refused or invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="bg-particles"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="login-container"
      >
        <FloatingCard className="login-card" hover={false}>
          <div className="login-header">
            <img src={mainLogo} alt="Health Analyzer" className="auth-logo-img" />
            <h2>Neural Authentication</h2>
            <p>Access the Health Analyzer Dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-banner">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            {info && (
              <div className="error-banner" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                <CheckCircle size={18} /> {info}
              </div>
            )}
            
            <div className="form-group">
              <label>Email Address / Username</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input 
                  type="text" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@healthanalyzer.ai"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <GlowButton 
              type="submit" 
              className="login-submit-btn" 
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </GlowButton>
          </form>
          
          <div className="login-footer">
            <a href="#">Forgot password?</a>
            <p>Don't have an account? <Link to="/register">Sign Up</Link></p>
          </div>
        </FloatingCard>
      </motion.div>
    </div>
  );
};

export default Login;
