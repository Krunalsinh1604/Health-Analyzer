import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Key, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FloatingCard from '../components/FloatingCard';
import GlowButton from '../components/GlowButton';
import FloatingInput from '../components/FloatingInput';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Loading...',
    email: 'Loading...',
    role: 'Medical Staff',
    department: 'Cardiology'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.email || user.username || 'System User',
        email: user.email || 'user@antigrav.ai',
        role: user.role || 'Lead Diagnostician',
        department: 'Neural Analytics'
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsEditing(false);
  };

  return (
    <div className="profile-page">
      <header className="page-header">
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          User Profile
        </motion.h1>
        <p>Manage your identity and analytical clearances</p>
      </header>

      <div className="profile-grid">
        <FloatingCard delay={0.1} className="profile-card">
          <div className="profile-header-bg"></div>
          <div className="profile-avatar-large">
            <img src="https://i.pravatar.cc/300?u=a042581f4e29026704d" alt="Profile" />
          </div>
          <div className="profile-meta">
            <h2>{formData.name}</h2>
            <p className="role">{formData.role}</p>
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
            <GlowButton 
              variant="outline" 
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </GlowButton>
          </div>

          <form onSubmit={handleSave} className="profile-form">
            <div className="form-grid">
              <FloatingInput
                name="name"
                label="Full Name / Username"
                value={formData.name}
                onChange={handleChange}
                icon={<User size={18} />}
                disabled={!isEditing}
                style={{ opacity: isEditing ? 1 : 0.7 }}
              />

              <FloatingInput
                name="email"
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={handleChange}
                icon={<Mail size={18} />}
                disabled={!isEditing}
                style={{ opacity: isEditing ? 1 : 0.7 }}
              />

              <FloatingInput
                name="role"
                label="Access Role"
                value={formData.role}
                onChange={handleChange}
                icon={<Shield size={18} />}
                disabled={!isEditing}
                style={{ opacity: isEditing ? 1 : 0.7 }}
              />

              <FloatingInput
                name="department"
                label="Department"
                value={formData.department}
                onChange={handleChange}
                icon={<Key size={18} />}
                disabled={!isEditing}
                style={{ opacity: isEditing ? 1 : 0.7 }}
              />
            </div>

            {isEditing && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="form-actions"
                style={{ marginTop: '32px' }}
              >
                <GlowButton type="submit" icon={<Save size={18} />} className="w-full">
                  Save Changes
                </GlowButton>
              </motion.div>
            )}
          </form>
        </FloatingCard>
      </div>
    </div>
  );
};

export default Profile;
