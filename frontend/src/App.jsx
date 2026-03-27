import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Diabetes from './pages/Diabetes';
import Heart from './pages/Heart';
import Hypertension from './pages/Hypertension';
import Profile from './pages/Profile';
import History from './pages/History';
import CBC from './pages/CBC';
import { ReportProvider } from './context/ReportContext';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const x = (clientX - window.innerWidth / 2) / 100;
    const y = (clientY - window.innerHeight / 2) / 100;
    setParallax({ x, y });
  };

  return (
    <div className="app-container" onMouseMove={handleMouseMove}>
      <motion.div 
        className="bg-particles"
        animate={{ 
          x: parallax.x * -1, 
          y: parallax.y * -1,
          rotate: parallax.x * 0.2
        }}
        transition={{ type: 'tween', ease: 'linear', duration: 0 }}
      ></motion.div>
      
      <div className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="app-main">
        <div className="app-navbar">
          <Navbar onMenuClick={toggleSidebar} />
        </div>
        
        <motion.div 
          className="page-content"
          animate={{ x: parallax.x * 0.5, y: parallax.y * 0.5 }}
          transition={{ type: 'tween', ease: 'linear', duration: 0 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

function App() {
  return (
    <ReportProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/diabetes" element={<ProtectedRoute><DashboardLayout><Diabetes /></DashboardLayout></ProtectedRoute>} />
        <Route path="/heart" element={<ProtectedRoute><DashboardLayout><Heart /></DashboardLayout></ProtectedRoute>} />
        <Route path="/hypertension" element={<ProtectedRoute><DashboardLayout><Hypertension /></DashboardLayout></ProtectedRoute>} />
        <Route path="/cbc" element={<ProtectedRoute><DashboardLayout><CBC /></DashboardLayout></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><DashboardLayout><History /></DashboardLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ReportProvider>
  );
}

export default App;
