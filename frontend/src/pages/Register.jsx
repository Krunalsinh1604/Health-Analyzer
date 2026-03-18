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
          <div className="bento-card animate-up" style={{ maxWidth: '440px', width: '100%', padding: '40px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>⚕️</div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>Create Account</h2>
              <p style={{ color: C.lightMuted, margin: 0, fontSize: '15px' }}>Join Health Analyzer today</p>
            </div>

            {error && <div style={{ background: C.crimsonBg, color: C.crimson, padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px', textAlign: 'center', fontWeight: 500 }}>{error}</div>}

            <form onSubmit={handleSubmit} className="field-light">
              <div style={{ display: 'grid', gap: '20px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: C.lightText }}>Full Name</span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${C.lightBorder}`, width: '100%', outline: 'none' }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: C.lightText }}>Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${C.lightBorder}`, width: '100%', outline: 'none' }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: C.lightText }}>Mobile Number</span>
                  <input
                    type="tel"
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                    required
                    style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${C.lightBorder}`, width: '100%', outline: 'none' }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: C.lightText }}>Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${C.lightBorder}`, width: '100%', outline: 'none' }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: C.lightText }}>Confirm Password</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${C.lightBorder}`, width: '100%', outline: 'none' }}
                  />
                </label>
              </div>

              <div style={{ marginTop: '32px' }}>
                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px' }}>
                  Register
                </button>
              </div>

              <div style={{ textAlign: "center", marginTop: "24px" }}>
                <span style={{ fontSize: "14px", color: C.lightMuted, fontWeight: 500 }}>
                  Already have an account? <Link to="/login" style={{ color: C.primary, textDecoration: 'none', marginLeft: '4px' }}>Login here <span aria-hidden="true">&rarr;</span></Link>
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
