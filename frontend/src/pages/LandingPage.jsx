import React from 'react';
import { Link } from 'react-router-dom';
import heroHand from "../assets/hero-hand.png";
import heartEcg from "../assets/heart-ecg.png";
import beHealthy from "../assets/be-healthy.png";
import medicalIcons from "../assets/medical-icons.png"; // Assuming the blue icons image
import Footer from "../components/Footer";

const LandingPage = () => {
  return (
    <div className="landing-page">
      <div className="background-pattern"></div>

      <header className="landing-header">
        <div className="logo">
          <span className="logo-icon">⚕️</span>
          <span className="logo-text">Health Analyzer</span>
        </div>
        <nav>
          <Link to="/login" className="nav-link">Log In</Link>
          <Link to="/register" className="btn-primary">Get Started</Link>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <span className="pill-label">AI-Powered Diagnostics</span>
            <h1>The Future of <br /> <span className="highlight">Personal Health</span></h1>
            <p>
              Advanced machine learning models for real-time risk assessment.
              Predict diabetes, heart disease, and hypertension with clinical precision.
            </p>
            <div className="cta-buttons">
              <Link to="/register" className="btn-primary big">Start Free Analysis</Link>
              <Link to="/login" className="btn-secondary big">Access Dashboard</Link>
            </div>
            <div className="stats-row">
              <div className="stat">
                <strong>98%</strong>
                <span>Accuracy</span>
              </div>
              <div className="stat">
                <strong>Instant</strong>
                <span>Results</span>
              </div>
              <div className="stat">
                <strong>Secure</strong>
                <span>Data</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="image-container tilt-effect">
              <img src={heroHand} alt="Futuristic Health Interface" className="hero-img" />
              <div className="glow-effect"></div>
            </div>
          </div>
        </section>

        <section className="features-preview">
          <div className="feature-card">
            <div className="card-image">
              <img src={heartEcg} alt="Heart Health" />
            </div>
            <div className="card-content">
              <h3>Heart Health</h3>
              <p>ECG-grade predictive modeling for cardiac risk.</p>
              <Link to="/heart-disease" className="card-link">Learn more &rarr;</Link>
            </div>
          </div>

          <div className="feature-card">
            <div className="card-image">
              <img src={beHealthy} alt="General Wellness" />
            </div>
            <div className="card-content">
              <h3>Vitals Monitoring</h3>
              <p>Comprehensive tracking for blood pressure & BMI.</p>
              <Link to="/hypertension" className="card-link">Track now &rarr;</Link>
            </div>
          </div>

          <div className="feature-card" style={{ background: 'linear-gradient(145deg, rgba(37, 99, 235, 0.1), rgba(15, 23, 42, 0.6))' }}>
            <div className="card-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
              <div className="icon-large">📄</div>
              <h3>Smart OCR</h3>
              <p>Upload reports (PDF/Photo) for instant digitization.</p>
              <Link to="/cbc" className="card-link">Try Demo &rarr;</Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        :root {
            --primary-glow: #2563eb;
            --secondary-glow: #ec4899;
            --bg-dark: #020617;
            --text-light: #f8fafc;
        }

        .landing-page {
            background-color: var(--bg-dark);
            color: var(--text-light);
            min-height: 100vh;
            font-family: 'Inter', sans-serif;
            overflow-x: hidden;
            position: relative;
        }

        .background-pattern {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url(${medicalIcons}); /* Fallback if image missing */
            background-size: 600px;
            opacity: 0.03;
            pointer-events: none;
            z-index: 0;
        }

        .landing-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 8%;
            backdrop-filter: blur(12px);
            background: rgba(2, 6, 23, 0.8);
            position: sticky;
            top: 0;
            z-index: 100;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .logo { 
            display: flex; 
            align-items: center; 
            gap: 12px; 
            font-size: 1.5rem; 
            font-weight: 700; 
            letter-spacing: -0.5px;
        }

        .nav-link {
            color: #94a3b8;
            text-decoration: none;
            margin-right: 30px;
            font-weight: 500;
            transition: color 0.2s;
        }
        .nav-link:hover { color: white; }

        .btn-primary {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
            padding: 12px 28px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.3);
            transition: all 0.2s ease;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
        }

        .btn-secondary {
            background: rgba(255,255,255,0.05);
            color: white;
            padding: 12px 28px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            border: 1px solid rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            transition: all 0.2s ease;
        }
        .btn-secondary:hover {
             background: rgba(255,255,255,0.1);
             transform: translateY(-2px);
        }

        .hero {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 5rem 8% 8rem;
            position: relative;
            z-index: 1;
        }
        
        .hero::before {
             content: '';
             position: absolute;
             top: -20%;
             left: -10%;
             width: 60vw;
             height: 60vw;
             background: radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%);
             filter: blur(80px);
             z-index: -1;
        }

        .hero-content {
            flex: 1;
            max-width: 600px;
            padding-right: 4rem;
        }

        .pill-label {
            display: inline-block;
            background: rgba(37, 99, 235, 0.1);
            color: #60a5fa;
            padding: 8px 16px;
            border-radius: 100px;
            font-size: 0.875rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            border: 1px solid rgba(37, 99, 235, 0.2);
            margin-bottom: 2rem;
            box-shadow: 0 0 20px rgba(37, 99, 235, 0.1);
        }

        h1 {
            font-size: 4rem;
            line-height: 1.1;
            margin: 0 0 1.5rem;
            font-weight: 800;
            letter-spacing: -1px;
        }

        .highlight {
            background: linear-gradient(to right, #60a5fa, #a78bfa, #ec4899);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        p {
            font-size: 1.25rem;
            color: #94a3b8;
            line-height: 1.6;
            margin-bottom: 2.5rem;
            max-width: 90%;
        }

        .cta-buttons {
            display: flex;
            gap: 1rem;
            margin-bottom: 3.5rem;
        }

        .big {
             padding: 16px 36px;
             font-size: 1.1rem;
        }

        .stats-row {
            display: flex;
            gap: 4rem;
            border-top: 1px solid rgba(255,255,255,0.1);
            padding-top: 2rem;
        }

        .stat strong {
            display: block;
            font-size: 1.75rem;
            font-weight: 700;
            color: white;
            margin-bottom: 0.25rem;
        }
        .stat span {
            color: #64748b;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .hero-visual {
            flex: 1;
            display: flex;
            justify-content: flex-end;
            position: relative;
        }

        .image-container {
             position: relative;
             border-radius: 30px;
             overflow: hidden;
             box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.5);
             transform: perspective(1000px) rotateY(-5deg);
             transition: transform 0.5s ease;
        }
        
        .image-container:hover {
             transform: perspective(1000px) rotateY(0deg);
        }

        .hero-img {
             width: 100%;
             max-width: 600px;
             display: block;
             border-radius: 30px;
        }

        .glow-effect {
             position: absolute;
             top: 0;
             left: 0;
             right: 0;
             bottom: 0;
             background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1), transparent 60%);
             pointer-events: none;
        }

        .features-preview {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            padding: 2rem 8%;
            margin-top: -6rem;
            position: relative;
            z-index: 10;
        }

        .feature-card {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            overflow: hidden;
            transition: transform 0.3s, box-shadow 0.3s;
            display: flex;
            flex-direction: column;
        }

        .feature-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5);
            border-color: rgba(255, 255, 255, 0.2);
        }

        .card-image {
             height: 200px;
             overflow: hidden;
             position: relative;
        }

        .card-image img {
             width: 100%;
             height: 100%;
             object-fit: cover;
             transition: transform 0.5s;
        }

        .feature-card:hover .card-image img {
             transform: scale(1.05);
        }

        .card-content {
             padding: 2rem;
        }

        .card-content h3 {
             font-size: 1.5rem;
             margin-bottom: 0.5rem;
             font-weight: 700;
        }
        
        .card-content p {
             font-size: 1rem;
             margin-bottom: 1.5rem;
             color: #cbd5e1;
        }

        .card-link {
             color: #60a5fa;
             text-decoration: none;
             font-weight: 600;
             font-size: 0.95rem;
             display: inline-flex;
             align-items: center;
             gap: 5px;
        }

        .card-link:hover {
             gap: 8px;
        }
        
        .icon-large {
             font-size: 3rem;
             margin-bottom: 1rem;
        }

        @media (max-width: 1024px) {
            h1 { font-size: 3rem; }
            .hero { padding-bottom: 4rem; }
        }

        @media (max-width: 768px) {
            .hero {
                flex-direction: column;
                text-align: center;
                padding-top: 3rem;
            }
            .hero-content { padding-right: 0; margin-bottom: 4rem; }
            .cta-buttons, .stats-row { justify-content: center; }
            .image-container { transform: none; }
            .features-preview { margin-top: 0; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
