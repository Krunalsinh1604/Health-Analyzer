import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Droplets, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FloatingCard from '../components/FloatingCard';
import FloatingInput from '../components/FloatingInput';
import api from '../services/api';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bloodGroup: '',
    phone: ''
  });

  const fetchUserDetails = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users/me');
      const data = response.data;
      setFormData({
        name: data.full_name || 'System User',
        email: data.email || 'user@healthanalyzer.ai',
        bloodGroup: data.blood_group || 'O+',
        phone: data.mobile_no || '+1 234 567 890'
      });
    } catch (err) {
      console.error("Failed to fetch user details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  return (
    <div className="profile-page">
      <header className="page-header">
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          User Profile
        </motion.h1>
        <p>Your clinical profile and Identity parameters</p>
      </header>

      <div className="profile-grid">
        <FloatingCard delay={0.1} className="profile-card">
          <div className="profile-header-bg"></div>
          <div className="profile-avatar-large">
            <img src="https://i.pravatar.cc/300?u=a042581f4e29026704d" alt="Profile" />
          </div>
          <div className="profile-meta">
            <h2>{formData.name}</h2>
            <div className="status-badge">
              <span className="dot"></span> Online
            </div>
          </div>
          
          <div className="profile-stats">
            <div className="p-stat">
              <h4>142</h4>
              <p>Reports</p>
            </div>
            <div className="p-stat">
              <h4>12</h4>
              <p>Models</p>
            </div>
            <div className="p-stat">
              <h4>99%</h4>
              <p>Accuracy</p>
            </div>
          </div>
        </FloatingCard>

        <FloatingCard delay={0.2} className="details-card">
          <div className="details-header" style={{ marginBottom: '24px' }}>
            <h3>Identity Settings</h3>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Verified Profile</span>
          </div>

          <div className="profile-form">
            <div className="form-grid">
              <FloatingInput
                name="name"
                label="Full Name / Username"
                value={formData.name}
                icon={<User size={18} />}
                readOnly
                style={{ opacity: 0.9 }}
              />

              <FloatingInput
                name="email"
                type="email"
                label="Email Address"
                value={formData.email}
                icon={<Mail size={18} />}
                readOnly
                style={{ opacity: 0.9 }}
              />

              <FloatingInput
                name="bloodGroup"
                label="Blood Group"
                value={formData.bloodGroup}
                icon={<Droplets size={18} />}
                readOnly
                style={{ opacity: 0.9 }}
              />

              <FloatingInput
                name="phone"
                label="Mobile No"
                value={formData.phone}
                icon={<Phone size={18} />}
                readOnly
                style={{ opacity: 0.9 }}
              />
            </div>
          </div>
        </FloatingCard>
      </div>
    </div>
  );
};

export default Profile;
