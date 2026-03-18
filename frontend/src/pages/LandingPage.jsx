import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

// --- COMPONENTS ---

const Navbar = () => (
  <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '16px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
      <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, var(--accent), var(--accent-soft))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>H</div>
      <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em' }}>HealthAnalyzer<span style={{color: 'var(--accent)'}}>.</span></span>
    </Link>
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <a href="#features" style={{ color: 'var(--content-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Features</a>
      <a href="#how-it-works" style={{ color: 'var(--content-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Workflow</a>
      <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>Sign In</Link>
      <Link to="/register" className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 13, borderRadius: '12px' }}>Get Started</Link>
    </div>
  </nav>
);

const MappedDashboard = () => (
  <div style={{ padding: '24px', background: 'var(--content-bg)', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px' }}>
    <div style={{ borderRight: '1px solid var(--border)', paddingRight: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ padding: '10px 16px', background: 'rgba(20, 184, 166, 0.1)', borderRadius: '10px', color: 'var(--accent)', fontSize: '13px', fontWeight: 800 }}>Clinical Workspace</div>
      {['Diagnostic Registry', 'Biolink Sync', 'Risk Trajectories', 'Team Analytics', 'Settings'].map(item => (
        <div key={item} style={{ padding: '8px 16px', color: 'var(--content-muted)', fontSize: '12px', fontWeight: 600 }}>{item}</div>
      ))}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Glucose', val: '94', unit: 'mg/dL', status: 'Optimal', color: '#10b981' },
          { label: 'Blood Pressure', val: '118/78', unit: 'mmHg', status: 'Normal', color: '#10b981' },
          { label: 'Oxygen Sat', val: '99', unit: '%', status: 'Stable', color: '#10b981' },
          { label: 'Diabetes Risk', val: '4.2%', unit: 'Prop', status: 'Minimal', color: '#10b981' }
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--content-card)', border: '1px solid var(--border)', padding: '16px', borderRadius: '16px' }}>
            <div style={{ fontSize: '10px', color: 'var(--content-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '8px' }}>{stat.label}</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>{stat.val}<span style={{ fontSize: '11px', marginLeft: '4px', color: 'var(--content-muted)' }}>{stat.unit}</span></div>
            <div style={{ fontSize: '10px', color: stat.color, marginTop: '8px', fontWeight: 800 }}>• {stat.status}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--content-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', height: '180px', position: 'relative' }}>
        <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 800, marginBottom: '20px' }}>Real-time Biometric Pulse Analysis</div>
        <svg width="100%" height="80" viewBox="0 0 400 100" preserveAspectRatio="none">
          <path d="M0,80 Q50,70 100,50 T200,60 T300,20 T400,30" fill="none" stroke="var(--accent)" strokeWidth="3" />
          <path d="M0,90 Q50,85 100,75 T200,80 T300,60 T400,65" fill="none" stroke="var(--accent-soft)" strokeWidth="2" strokeDasharray="6" />
        </svg>
      </div>
    </div>
  </div>
);

const FeatureCard = ({ icon, title, desc }) => (
  <div className="bento-card scroll-reveal">
    <div className="card-icon">{icon}</div>
    <h3 style={{ fontSize: '20px', margin: '0 0 12px' }}>{title}</h3>
    <p style={{ color: 'var(--content-muted)', fontSize: '15px', lineHeight: '1.5', margin: 0 }}>{desc}</p>
  </div>
);

// --- MAIN PAGE ---

export default function LandingPage() {
  const revealRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-root">
      <Navbar />

      {/* HERO SECTION */}
      <header className="hero">
        <div className="hero-grid" />
        <div className="hero-glow" />
        <div className="hero-inner scroll-reveal visible">
          <span className="hero-tag">ENTERPRISE CLINICAL ANALYTICS</span>
          <h1>Clinical Intelligence,<br /><span className="gradient-highlight">Zero Compromise.</span></h1>
          <p>
            Unified healthcare OS for predictive multi-disease stratification, automated CBC extraction, and real-time patient telemetry.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link to="/register" className="btn btn-primary">Launch Workspace</Link>
            <a href="#how-it-works" className="btn btn-glass">Explore Documentation</a>
          </div>

          <div className="hero-mockup animate-float">
            <div style={{ background: 'var(--content-bg)', padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
            </div>
            <MappedDashboard />
          </div>
        </div>
      </header>

      {/* STATS BAR */}
      <div className="stats-bar scroll-reveal">
        <div className="stats-inner">
          <div className="stat-item">
            <h3>99.9%</h3>
            <p>DIAGNOSTIC ACCURACY</p>
          </div>
          <div className="stat-item">
            <h3>&lt; 2s</h3>
            <p>EXTRACTION LATENCY</p>
          </div>
          <div className="stat-item">
            <h3>500k+</h3>
            <p>RECORDS ANALYZED</p>
          </div>
          <div className="stat-item">
            <h3>HIPAA</h3>
            <p>SECURITY COMPLIANT</p>
          </div>
        </div>
      </div>

      {/* FEATURES SECTION */}
      <section id="features" className="section">
        <div className="hero-inner">
          <div className="section-header">
            <span className="section-tag">Capabilities</span>
            <h2>Every clinical vector. <br />One unified platform.</h2>
            <p className="desc">Deeply integrated algorithms mapping precise patient trajectories across chronic and acute conditions.</p>
          </div>
          <div className="card-grid">
            <FeatureCard 
              icon="🧬" 
              title="Predictive Stratification" 
              desc="ML models actively assess incoming parameters to flag pre-diabetic or hypertensive escalations before they occur."
            />
            <FeatureCard 
              icon="🩸" 
              title="Automated CBC Extraction" 
              desc="Proprietary Vision AI normalizes unstructured PDF reports into structured clinical datasets in seconds."
            />
            <FeatureCard 
              icon="🛡️" 
              title="Enterprise Security" 
              desc="Military-grade encryption for all patient data, ensuring full HIPAA and GDPR compliance at scale."
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="section section-grey">
        <div className="hero-inner">
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1fr', gap: '80px', alignItems: 'center', textAlign: 'left' }}>
            <div className="scroll-reveal">
              <span className="section-tag">Clinical Workflow</span>
              <h2>Seamless Data Transformation</h2>
              <p className="desc" style={{ marginBottom: '32px' }}>We've replaced scattered spreadsheets with a single pane of glass for clinical decision making.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {[
                  { step: '01', t: 'Data Ingestion', d: 'Securely upload clinical PDFs or stream real-time vitals.' },
                  { step: '02', t: 'AI Processing', d: 'Models run multi-variable risk stratification against global benchmarks.' },
                  { step: '03', t: 'Clinical Insight', d: 'Actionable reports with prediction confidence and historical trends.' }
                ].map(item => (
                  <div key={item.step} style={{ display: 'flex', gap: '20px' }}>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent)' }}>{item.step}</span>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '16px' }}>{item.t}</h4>
                      <p style={{ margin: 0, fontSize: '14px', color: 'var(--content-muted)' }}>{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="scroll-reveal bento-card" style={{ padding: 0, overflow: 'hidden', border: 'none', boxShadow: 'var(--shadow-xl)' }}>
              <div style={{ background: 'var(--bg-main)', padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--primary)' }}>Patient Risk Factor Map</span>
                <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>CRITICAL</span>
              </div>
              <div style={{ padding: '32px', background: 'var(--content-card)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { l: 'BP Complexity', w: '85%' },
                    { l: 'Glucose Stability', w: '40%' },
                    { l: 'Cardiac Elasticity', w: '72%' }
                  ].map(line => (
                    <div key={line.l}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px', color: '#64748b' }}>
                        <span>{line.l}</span>
                        <span>{line.w}</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--bg-main)', borderRadius: '3px' }}>
                        <div style={{ height: '100%', width: line.w, background: 'var(--accent)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section" style={{ textAlign: 'center', background: 'var(--accent)', color: 'white' }}>
        <div className="hero-inner scroll-reveal">
          <h2 style={{ color: 'white', marginBottom: '24px' }}>Ready to transform your clinical workflow?</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px', fontWeight: 500 }}>Join hundreds of practitioners using Health Analyzer to deliver precise, data-driven patient care.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link to="/register" className="btn btn-glass" style={{ background: 'var(--primary)', color: 'var(--bg-main)', fontWeight: 800 }}>Start Free Trial</Link>
            <Link to="/login" className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Platform Access</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '60px 5% 30px', background: 'var(--content-bg)', borderTop: '1px solid var(--border)' }}>
        <div className="hero-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 24, height: 24, background: 'var(--accent)', borderRadius: 6 }} />
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Health Analyzer</span>
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: '14px', color: 'var(--content-muted)' }}>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>© 2026 Health Analyzer Systems</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
