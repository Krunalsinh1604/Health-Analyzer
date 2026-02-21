import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import medicalHero from "../assets/medical-hero.svg";

function HomePage() {
  const { user } = useAuth();

  return (
    <div className="app">
      <Navbar />

      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-label">New v2.0 Release</span>
          <h1>Advanced Clinical Analytics & AI</h1>
          <p>
            Empower your practice with real-time risk assessment.
            Analyze patient data for diabetes, heart disease, and hypertension with
            our state-of-the-art machine learning models.
          </p>
          <div className="cta-group">
            <Link to="/diabetes" className="btn-primary">Start Analysis</Link>
            <Link to="/cbc" className="btn-secondary">Upload Report</Link>
          </div>
        </div>
        <div className="hero-visual">
          <img src={medicalHero} alt="Medical Analytics" />
        </div>
      </section>

      <div className="section-header">
        <h2>Available Modules</h2>
        <p>Select a specialized diagnostic tool to begin your session.</p>
      </div>

      <section className="feature-grid">
        <Link to="/diabetes" className="feature-card">
          <div className="icon-wrapper">🩸</div>
          <h3>Diabetes Prediction</h3>
          <p>
            ML-driven risk scoring based on glucose, BMI, and insulin levels.
            Includes PDF report extraction.
          </p>
          <span className="card-link">Launch Module</span>
        </Link>

        <Link to="/hypertension" className="feature-card">
          <div className="icon-wrapper">🩺</div>
          <h3>Hypertension Monitor</h3>
          <p>
            Track and analyze blood pressure trends against clinical thresholds.
            Visualize systolic and diastolic patterns.
          </p>
          <span className="card-link">Launch Module</span>
        </Link>

        <Link to="/heart-disease" className="feature-card">
          <div className="icon-wrapper">🫀</div>
          <h3>Heart Disease Risk</h3>
          <p>
            Comprehensive cardiac risk assessment using age, cp, and metabolic
            indicators.
          </p>
          <span className="card-link">Launch Module</span>
        </Link>

        <Link to="/cbc" className="feature-card">
          <div className="icon-wrapper">📄</div>
          <h3>CBC Analyzer</h3>
          <p>
            Upload blood reports (PDF) to automatically extract and interpret
            Complete Blood Count parameters.
          </p>
          <span className="card-link">Launch Module</span>
        </Link>
      </section>

      <Footer />
    </div>
  );
}

export default HomePage;
