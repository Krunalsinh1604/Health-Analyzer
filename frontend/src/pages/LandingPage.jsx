import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

// ─── NEURAL NETWORK BACKGROUND ──────────────────────────────────────────────
function NeuralBackground() {
  // Generate glowing nodes and lines deterministically for the background
  // Using fixed arrays mapped statically to avoid hydration/render mismatches
  const nodeCount = 40;
  
  // Use a pseudo-random generator with a fixed seed so it's consistent
  const seed = 12345;
  const pseudoRandom = (n) => {
     let x = Math.sin(seed + n) * 10000;
     return x - Math.floor(x);
  };

  const nodes = Array.from({ length: nodeCount }).map((_, i) => ({
    id: i,
    x: pseudoRandom(i) * 100,
    y: pseudoRandom(i + 100) * 100,
    r: pseudoRandom(i + 200) * 3 + 1,
    type: pseudoRandom(i + 300) > 0.5 ? 'node' : 'node-purple',
    delay: pseudoRandom(i + 400) * 2
  }));

  const connections = [];
  const activeFlows = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 20) {
        connections.push({ id: `${i}-${j}`, x1: nodes[i].x, y1: nodes[i].y, x2: nodes[j].x, y2: nodes[j].y });
        if (pseudoRandom(i*100+j) > 0.8) {
           activeFlows.push({ ...connections[connections.length-1], flowType: pseudoRandom(i*200+j) > 0.5 ? 'flow-line' : 'flow-line-purple' });
        }
      }
    }
  }

  return (
    <div className="neural-bg">
      <svg className="neural-nodes" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Base Connections */}
        {connections.map(c => (
          <line key={`c-${c.id}`} x1={`${c.x1}%`} y1={`${c.y1}%`} x2={`${c.x2}%`} y2={`${c.y2}%`} className="connection" />
        ))}
        {/* Animated Data Flows */}
        {activeFlows.map(c => (
          <line key={`f-${c.id}`} x1={`${c.x1}%`} y1={`${c.y1}%`} x2={`${c.x2}%`} y2={`${c.y2}%`} className={c.flowType} />
        ))}
        {/* Glowing Nodes */}
        {nodes.map(n => (
          <circle key={`n-${n.id}`} cx={`${n.x}%`} cy={`${n.y}%`} r={n.r} className={n.type} style={{ transformOrigin: `${n.x}% ${n.y}%`, animationDelay: `${n.delay}s` }} />
        ))}
      </svg>
      {/* Dynamic Overlay for blending */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 0%, var(--bg-deep) 100%)' }} />
    </div>
  );
}

// ─── NAVBAR (Glassmorphism dark) ──────────────────────────────────────────────
function Navbar() {
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, background: 'rgba(2, 6, 23, 0.7)', backdropFilter: 'blur(24px)', borderBottom: '1px solid var(--glass-border)', padding: '16px 4%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
        <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20 }}>🧬</div>
        <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', textShadow: '0 0 10px rgba(56,189,248,0.3)' }}>HealthAnalyzer<span style={{color: 'var(--accent-cyan)'}}>.ai</span></span>
      </Link>
      <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        <a href="#features" style={{ color: 'var(--text-muted)', fontSize: 15, fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}>Platform</a>
        <a href="#dashboard" style={{ color: 'var(--text-muted)', fontSize: 15, fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}>Telemetry</a>
        <Link to="/login" style={{ color: 'var(--text-main)', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
        <Link to="/register" className="btn-neon" style={{ padding: '10px 24px', fontSize: '0.95rem' }}>Start Analyzing</Link>
      </div>
    </nav>
  );
}

// ─── HERO ───────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="hero-wrapper">
      <NeuralBackground />
      
      <div className="hero-content fade-up-enter">
        <div style={{ display: 'inline-flex', padding: '6px 16px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: 99, alignItems: 'center', gap: 10, marginBottom: 24, boxShadow: '0 0 20px rgba(56,189,248,0.2)' }}>
          <span style={{ width: 8, height: 8, background: 'var(--accent-cyan)', opacity: 0.8, borderRadius: '50%', boxShadow: '0 0 10px var(--accent-cyan)', animation: 'pulseBorder 2s infinite' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '1px' }}>AI CLINICAL ENGINE V2.0 ACTIVE</span>
        </div>
        
        <h1 style={{ fontSize: 'clamp(3.5rem, 6vw, 5.5rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 24px' }}>
          Intelligent Health Insights <br />
          <span className="text-gradient">Powered by AI</span>
        </h1>
        
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 auto 40px', maxWidth: 680 }}>
          Advanced neural networks for multi-disease risk prediction, automated CBC parsing, and real-time physiological telemetry. The future of data-driven medicine is here.
        </p>
        
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
           <Link to="/register" className="btn-neon">Initialize Workspace</Link>
           <a href="#features" className="btn-outline">View Architecture</a>
        </div>

        {/* Floating Feature Cards */}
        <div className="floating-cards-container">
          {[
            { tag: 'AI Diagnostics', icon: '🧠', color: '#3b82f6' },
            { tag: 'Risk Prediction', icon: '⚠️', color: '#8b5cf6' },
            { tag: 'CBC Analysis', icon: '🩸', color: '#f43f5e' },
            { tag: 'Real-Time Monitoring', icon: '⚡', color: '#00f2fe' }
          ].map((f, i) => (
            <div key={i} className="glass-panel floating-card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12 }}>
               <span style={{ fontSize: '1.25rem', filter: `drop-shadow(0 0 10px ${f.color})` }}>{f.icon}</span>
               <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>{f.tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Massive Realistic Dashboard Mockup */}
      <div id="dashboard" className="glass-panel dashboard-mockup pulsing-border fade-up-enter" style={{ padding: 24, animationDelay: '0.4s' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: 16, marginBottom: 24 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ background: 'rgba(56,189,248,0.1)', padding: 12, borderRadius: 12 }}><span style={{ fontSize: 24 }}>📊</span></div>
              <div>
                 <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>Real-Time Telemetry & Prediction</h3>
                 <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Patient Node: HZ-9921 • Connection: Synchronized</span>
              </div>
           </div>
           <div style={{ display: 'flex', gap: 12 }}>
              <span className="badge-glow">SYSTEM STABLE</span>
              <span className="badge-glow high">CARDIAC RISK DETECTED</span>
           </div>
        </div>

        {/* Dense Telemetry Data */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
          {[
            { label: 'GLUCOSE LEVEL', val: '142', unit: 'mg/dL', status: 'ELEVATED', badgeClass: 'medium', chartColor: '#fbbf24', spark: "M0,15 L10,5 L20,12 L30,2 L40,15 L50,8 L60,18" },
            { label: 'BLOOD PRESSURE', val: '138/88', unit: 'mmHg', status: 'PRE-HYPERTENSION', badgeClass: 'medium', chartColor: '#f87171', spark: "M0,10 L10,12 L20,1 L30,19 L40,8 L50,11 L60,9" },
            { label: 'HEART RATE', val: '72', unit: 'bpm', status: 'NORMAL', badgeClass: '', chartColor: '#34d399', spark: "M0,10 L10,10 L15,2 L25,18 L35,8 L40,10 L60,10" },
            { label: 'CBC ABNORMALITIES', val: '1', unit: 'flagged', status: 'REVIEW REQ', badgeClass: 'high', chartColor: '#8b5cf6', spark: "M0,18 L10,18 L20,18 L30,2 L40,18 L50,18 L60,18" }
          ].map((m, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 20 }}>
               <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>{m.label}</div>
               <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
                 <span style={{ fontSize: 32, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#fff', textShadow: `0 0 20px ${m.chartColor}` }}>{m.val}</span>
                 <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{m.unit}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                 <span className={`badge-glow ${m.badgeClass}`}>{m.status}</span>
                 {/* Mini SVG Sparkline */}
                 <svg width="60" height="20" viewBox="0 0 60 20">
                   <path d={m.spark} fill="none" stroke={m.chartColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                 </svg>
               </div>
            </div>
          ))}
        </div>

        {/* Risk Prediction Chart Area */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 20, '@media (max-width: 900px)': { gridTemplateColumns: '1fr' } }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
             <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--text-muted)' }}>MULTI-DIMENSIONAL RISK TRAJECTORY</h4>
             {/* Chart Visual */}
             <div style={{ height: 200, position: 'relative', borderLeft: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                   <defs>
                      <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="0%" stopColor="rgba(56, 189, 248, 0.4)" />
                         <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                      <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="0%" stopColor="rgba(139, 92, 246, 0.4)" />
                         <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                   </defs>
                   <path d="M0,80 Q20,60 40,70 T80,40 T100,20 L100,100 L0,100 Z" fill="url(#grad1)" />
                   <path d="M0,80 Q20,60 40,70 T80,40 T100,20" fill="none" stroke="var(--accent-cyan)" strokeWidth="3" style={{ filter: 'drop-shadow(0 0 5px var(--accent-cyan))' }} />

                   <path d="M0,90 Q30,80 50,50 T100,60 L100,100 L0,100 Z" fill="url(#grad2)" />
                   <path d="M0,90 Q30,80 50,50 T100,60" fill="none" stroke="var(--accent-purple)" strokeWidth="2" strokeDasharray="4" style={{ filter: 'drop-shadow(0 0 5px var(--accent-purple))' }} />
                </svg>
                <div style={{ position: 'absolute', top: '15%', right: 0, width: 12, height: 12, background: 'var(--accent-cyan)', borderRadius: '50%', boxShadow: '0 0 20px var(--accent-cyan)', animation: 'pulseBorder 1s infinite' }} />
             </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
             <div style={{ flex: 1, background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(0,0,0,0.4) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 16, padding: 24 }}>
                <div className="badge-glow high" style={{ display: 'inline-block', marginBottom: 12 }}>CRITICAL AI ALERT</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#f87171', fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>82% Risk</div>
                <div style={{ fontSize: 14, color: '#fca5a5', lineHeight: 1.5 }}>Diagnostic Engine isolated a high-confidence cardiac event probability based on compounding vitals geometry.</div>
             </div>
             <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🌐</div>
                <div>
                   <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>Neural Link Active</div>
                   <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Live sync from wearable APIs</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── AI FEATURES ─────────────────────────────────────────────────────────────
function Features() {
  return (
    <section id="features" className="ai-features">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 800, margin: '0 0 16px' }}>Deep Intelligence Architecture</h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: 640, margin: '0 auto' }}>Purpose-built healthcare models that process unstructured clinical data into actionable vectors.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
          {[
            { tag: 'OCR Neural Net', title: 'Automated CBC Extraction', desc: 'Upload unstructured PDF reports. Proprietary Vision AI scans and normalizes over 20 parameters instantly.', color: 'var(--accent-cyan)', icon: '👁️' },
            { tag: 'Heuristic Models', title: 'Predictive Triggers', desc: 'Continuous scalar algorithms evaluate cardiac and hypertension probability vectors before symptoms arise.', color: 'var(--accent-purple)', icon: '⚛️' },
            { tag: 'Secure Silos', title: 'Encrypted Telemetry', desc: 'HIPAA-grade data ingestion mapping. Every byte is encrypted at rest and in transit through secure tunnels.', color: 'var(--accent-blue)', icon: '🛡️' }
          ].map((f,i) => (
            <div key={i} className="glass-panel" style={{ padding: 40, borderTop: `2px solid ${f.color}`}}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: `rgba(255,255,255,0.05)`, border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 24, boxShadow: `0 0 20px ${f.color}40`, filter: `drop-shadow(0 0 10px ${f.color})` }}>{f.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1px', color: f.color, marginBottom: 12, textTransform: 'uppercase' }}>{f.tag}</div>
              <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>{f.title}</h3>
              <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: 'var(--bg-deep-blue)', borderTop: '1px solid var(--glass-border)', padding: '60px 4% 30px', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(2rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: 24 }}>Ready to integrate Health Analyzer?</h2>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: 40, maxWidth: 500 }}>Join the future of machine-learning assisted clinical diagnostics.</p>
        <Link to="/register" className="btn-neon" style={{ marginBottom: 60 }}>Initialize Platform</Link>
        
        <div style={{ width: '100%', borderTop: '1px solid var(--glass-border)', paddingTop: 30, display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 14 }}>
          <span>© 2026 Health Analyzer AI. System Online.</span>
          <div style={{ display: 'flex', gap: 24 }}>
             <span style={{ cursor: 'pointer' }}>Privacy Schema</span>
             <span style={{ cursor: 'pointer' }}>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg-deep)', minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>
      <Navbar />
      <Hero />
      <Features />
      <Footer />
    </div>
  );
}
