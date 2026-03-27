import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import './Navbar.css';

const Navbar = ({ onMenuClick }) => {
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
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="icon-btn">
          <Bell size={20} />
          <span className="badge"></span>
        </motion.button>
        
        <div className="avatar-container">
          <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Profile" className="avatar" />
          <div className="avatar-glow"></div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
