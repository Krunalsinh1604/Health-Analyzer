import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FloatingCard from '../components/FloatingCard';
import GlowButton from '../components/GlowButton';
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      setInfo(location.state.message);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid credentials');
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
            <div className="logo-glow"><div className="logo-core"></div></div>
            <h2>Neural Authentication</h2>
            <p>Access the AntiGrav AI Dashboard</p>
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
                  placeholder="doctor@antigrav.ai"
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
