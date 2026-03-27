import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Activity, Heart, FileText, Clock, User, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { path: '/diabetes', name: 'Diabetes', icon: <Activity size={20} /> },
  { path: '/heart', name: 'Heart', icon: <Heart size={20} /> },
  { path: '/hypertension', name: 'Hypertension', icon: <Activity size={20} /> },
  { path: '/cbc', name: 'CBC Analysis', icon: <FileText size={20} /> },
  { path: '/history', name: 'History', icon: <Clock size={20} /> },
  { path: '/profile', name: 'Profile', icon: <User size={20} /> },
];

const Sidebar = ({ onClose }) => {
  const { logout } = useAuth();
  
  return (
    <div className="sidebar glass-panel">
      <div className="sidebar-header">
        <div className="logo-glow">
          <div className="logo-core"></div>
        </div>
        <h2>AntiGrav AI</h2>
        <button className="mobile-close" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="active-indicator"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-name">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="nav-link logout-btn" onClick={logout} style={{cursor: 'pointer', marginTop: '16px'}}>
          <span className="nav-icon"><LogOut size={20} /></span>
          <span className="nav-name">Sign Out</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
