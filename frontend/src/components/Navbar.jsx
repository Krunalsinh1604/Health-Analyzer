import React from 'react';
import { Menu, Bell, Search, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <div className="navbar glass-panel">
      <div className="nav-left">
        <button className="menu-btn" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Access records, patients, models..." />
        </div>
      </div>
      
      <div className="nav-right">
        <motion.button 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.95 }} 
          className="icon-btn relative bg-white/50 border border-gray-200/50 w-10 h-10 rounded-full flex items-center justify-center text-gray-800 cursor-pointer shadow-sm hover:shadow-md transition-all"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm" />
        </motion.button>
        
        {user ? (
          <Link to="/profile" className="avatar-container">
            <img src={`https://i.pravatar.cc/150?u=${user.email}`} alt="Profile" className="avatar" />
            <div className="avatar-glow"></div>
          </Link>
        ) : (
          <Link to="/login" className="avatar-container guest-avatar" title="Login to save reports">
            <UserCircle size={32} color="#64748b" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default Navbar;
