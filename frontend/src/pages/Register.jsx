import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { C } from "../theme";

const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`;

const buildNetworkError = (endpoint, error) => {
  if (error instanceof TypeError) {
    return new Error(
      `Cannot reach backend at ${API_URL}${endpoint}. Ensure FastAPI is running (uvicorn src.api:app --reload) and CORS allows this frontend origin.`
    );
  }
  return error;
};

const parseResponseData = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { detail: text } : {};
};

function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return setError("Passwords do not match");
    }

    if (!mobileNo.trim()) {
      toast.error("Mobile number is required");
      return setError("Mobile number is required");
    }

    try {
      await register(email, password, fullName, mobileNo);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to register");
      toast.error(err.message || "Failed to register");
    }
  };

  return (
    <>
      <div className="page-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
        
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', zIndex: 1 }}>
          <div className="db-card animate-db" style={{ maxWidth: '440px', width: '100%', padding: '48px', border: '1px solid var(--db-border)' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🩺</div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px', color: 'var(--db-text)', letterSpacing: '-0.02em' }}>Create Account</h2>
              <p style={{ color: 'var(--db-muted)', margin: 0, fontSize: '15px' }}>Join the Health Analyzer registry</p>
            </div>

            {error && <div style={{ background: '#fef2f2', color: 'var(--db-crimson)', padding: '12px', borderRadius: '12px', fontSize: '14px', marginBottom: '24px', textAlign: 'center', fontWeight: 600, border: '1px solid #fee2e2' }}>{error}</div>}

            <form onSubmit={handleSubmit} className="db-input-group">
              <div style={{ display: 'grid', gap: '20px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--db-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</span>
                  <input
                    type="text"
                    className="db-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Dr. John Doe"
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--db-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</span>
                  <input
                    type="email"
                    className="db-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="john@hospital.com"
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--db-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile Registry</span>
                  <input
                    type="tel"
                    className="db-input"
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                    required
                    placeholder="+1 (555) 000-0000"
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--db-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Key</span>
                  <input
                    type="password"
                    className="db-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--db-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm Key</span>
                  <input
                    type="password"
                    className="db-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </label>
              </div>

              <div style={{ marginTop: '32px' }}>
                <button type="submit" className="db-btn-primary" style={{ width: '100%', padding: '16px', fontSize: '16px' }}>
                  INITIALIZE ACCOUNT
                </button>
              </div>

              <div style={{ textAlign: "center", marginTop: "24px" }}>
                <span style={{ fontSize: "14px", color: 'var(--db-muted)', fontWeight: 600 }}>
                  Already registered? <Link to="/login" style={{ color: 'var(--db-accent)', textDecoration: 'none', marginLeft: '4px' }}>Access Login <span aria-hidden="true">&rarr;</span></Link>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default Register;
