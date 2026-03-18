import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { C } from "../theme";

function HomePage() {
  const { user } = useAuth();

  return (
    <div className="page-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        {/* Dark Theme Hero Section */}
        <section style={{ background: C.heroBg, color: '#fff', padding: '80px 2rem 100px', position: 'relative', overflow: 'hidden' }}>
          <div className="grid-bg" style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.5, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 60%)', filter: 'blur(50px)', zIndex: 0 }} />
          
          <div className="layout animate-up" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
            <span style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', color: C.primary, fontSize: '13px', fontWeight: 700, borderRadius: '20px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '24px' }}>
              Advanced Clinical Analytics & AI
            </span>
            <h1 style={{ fontSize: 'env(safe-area-inset-bottom, 56px)', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Your Intelligent Health Command Center
            </h1>
            <p style={{ fontSize: '18px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '40px', maxWidth: '600px' }}>
              Empower your practice with real-time risk assessment. Analyze patient data for diabetes, heart disease, and hypertension with our state-of-the-art machine learning models.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link to="/diabetes" className="btn-primary" style={{ padding: '14px 28px', fontSize: '16px' }}>Start Analysis</Link>
              <Link to="/cbc" className="btn-glass" style={{ padding: '14px 28px', fontSize: '16px' }}>Upload Report</Link>
            </div>
          </div>
        </section>

        {/* Light Theme Features Grid */}
        <section style={{ padding: '60px 2rem', background: C.lightBg1, position: 'relative' }}>
          <div className="grid-bg-light" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
          
          <div className="layout animate-up" style={{ position: 'relative', zIndex: 1, animationDelay: '0.1s' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 12px' }}>Available Modules</h2>
              <p style={{ color: C.lightMuted, fontSize: '16px', margin: 0 }}>Select a specialized diagnostic tool to begin your session.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              <Link to="/diabetes" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="bento-card" style={{ height: '100%', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = C.shadowCardHover; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = C.shadowCard; }}>
                  <div style={{ width: '48px', height: '48px', background: C.crimsonBg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '20px' }}>🩸</div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 12px' }}>Diabetes Prediction</h3>
                  <p style={{ color: C.lightMuted, fontSize: '15px', lineHeight: 1.5, margin: '0 0 24px' }}>ML-driven risk scoring based on glucose, BMI, and insulin levels. Includes PDF report extraction.</p>
                  <span style={{ color: C.primary, fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>Launch Module <span aria-hidden="true">&rarr;</span></span>
                </div>
              </Link>

              <Link to="/hypertension" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="bento-card" style={{ height: '100%', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = C.shadowCardHover; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = C.shadowCard; }}>
                  <div style={{ width: '48px', height: '48px', background: C.emeraldBg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '20px' }}>🩺</div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 12px' }}>Hypertension Monitor</h3>
                  <p style={{ color: C.lightMuted, fontSize: '15px', lineHeight: 1.5, margin: '0 0 24px' }}>Track and analyze blood pressure trends against clinical thresholds. Visualize patterns over time.</p>
                  <span style={{ color: C.primary, fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>Launch Module <span aria-hidden="true">&rarr;</span></span>
                </div>
              </Link>

              <Link to="/heart-disease" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="bento-card" style={{ height: '100%', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = C.shadowCardHover; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = C.shadowCard; }}>
                  <div style={{ width: '48px', height: '48px', background: 'rgba(234, 179, 8, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '20px' }}>🫀</div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 12px' }}>Heart Disease Risk</h3>
                  <p style={{ color: C.lightMuted, fontSize: '15px', lineHeight: 1.5, margin: '0 0 24px' }}>Comprehensive cardiac risk assessment using age, cp, and metabolic indicators from patients.</p>
                  <span style={{ color: C.primary, fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>Launch Module <span aria-hidden="true">&rarr;</span></span>
                </div>
              </Link>

              <Link to="/cbc" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="bento-card" style={{ height: '100%', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = C.shadowCardHover; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = C.shadowCard; }}>
                  <div style={{ width: '48px', height: '48px', background: 'rgba(168, 85, 247, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '20px' }}>📄</div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 12px' }}>CBC Analyzer</h3>
                  <p style={{ color: C.lightMuted, fontSize: '15px', lineHeight: 1.5, margin: '0 0 24px' }}>Upload blood reports (PDF) to automatically extract and interpret Complete Blood Count parameters.</p>
                  <span style={{ color: C.primary, fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>Launch Module <span aria-hidden="true">&rarr;</span></span>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
