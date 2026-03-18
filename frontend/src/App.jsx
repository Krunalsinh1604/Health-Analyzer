import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import HomePage from "./pages/Home.jsx";
import DiabetesPage from "./pages/Dashboard.jsx";
import HypertensionPage from "./pages/Hypertension.jsx";
import HeartDiseasePage from "./pages/HeartDisease.jsx";
import CbcAnalysisPage from "./pages/CbcAnalysis.jsx";
import AdminPage from "./pages/Admin.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import HistoryPage from "./pages/History.jsx";

import LandingPage from "./pages/LandingPage.jsx";

function App() {
  return (
    <AuthProvider>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />

        <Route path="/diabetes" element={
          <ProtectedRoute>
            <DiabetesPage />
          </ProtectedRoute>
        } />
        <Route path="/hypertension" element={
          <ProtectedRoute>
            <HypertensionPage />
          </ProtectedRoute>
        } />
        <Route path="/heart-disease" element={
          <ProtectedRoute>
            <HeartDiseasePage />
          </ProtectedRoute>
        } />
        <Route path="/cbc" element={
          <ProtectedRoute>
            <CbcAnalysisPage />
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminPage />
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;
