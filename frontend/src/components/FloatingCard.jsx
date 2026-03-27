import React from 'react';
import { motion } from 'framer-motion';
import './FloatingCard.css';

const FloatingCard = ({ children, className = '', delay = 0, hover = true, padding = '32px' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.8, 0.25, 1] }}
      whileHover={hover ? { y: -8, scale: 1.01, rotateX: 2, rotateY: -2 } : {}}
      className={`glass-panel floating-card ${className}`}
      style={{ padding }}
    >
      <div className="floating-card-glow"></div>
      <div className="floating-card-content">
        {children}
      </div>
    </motion.div>
  );
};

export default FloatingCard;
