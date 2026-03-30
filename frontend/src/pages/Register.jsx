import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FloatingCard from '../components/FloatingCard';
import GlowButton from '../components/GlowButton';
import { Mail, Lock, User, AlertCircle, Phone, Droplets } from 'lucide-react';
import mainLogo from '../assets/logo.png';
import './Login.css'; // Reuse Login styles

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await register(fullName, email, mobileNo, bloodGroup, password);
      if (success) {
        navigate('/login', { state: { message: 'Registration successful! Please login.' } });
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Connection refused or server error.');
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
            <h2>Create Account</h2>
            <p>Join the Health Analyzer Medical Platform</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-banner">
                <AlertCircle size={18} /> {error}
              </div>
            )}
            
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  required 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Mobile Number</label>
              <div className="input-wrapper">
                <Phone size={18} className="input-icon" />
                <input 
                  type="tel" 
                  required 
                  value={mobileNo} 
                  onChange={(e) => setMobileNo(e.target.value)}
                  placeholder="9876543210"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Blood Group</label>
              <div className="input-wrapper">
                <Droplets size={18} className="input-icon" />
                <select 
                  required 
                  value={bloodGroup} 
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="select-input"
                >
                  <option value="" disabled>Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input 
                  type="email" 
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
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </GlowButton>
          </form>
          
          <div className="login-footer">
            <p>Already have an account? <Link to="/login">Sign In</Link></p>
          </div>
        </FloatingCard>
      </motion.div>
    </div>
  );
};

export default Register;
