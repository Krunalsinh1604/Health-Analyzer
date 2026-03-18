import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { C } from "../theme";

function Login() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Request OTP, 2: Verify OTP
  const [forgotMobile, setForgotMobile] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!loginId.trim()) {
      setError("Please enter email or mobile number");
      toast.error("Please enter email or mobile number");
      return;
    }

    if (!password.trim()) {
      setError("Please enter password");
      toast.error("Please enter password");
      return;
    }

    setLoggingIn(true);
    try {
      await login(loginId, password);
      toast.success("Welcome back!");

      // Decode JWT to find role for routing
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload.role === "admin") {
            navigate("/admin");
            return;
          }
        } catch (e) {
          console.error("Failed to parse token payload", e);
        }
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid credentials");
      toast.error(err.message || "Invalid credentials");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setError("");

    try {
      if (forgotStep === 1) {
        // Request OTP
        const res = await fetch("http://localhost:8000/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile_no: forgotMobile })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.detail || "Failed to request OTP");

        toast.success("OTP sent successfully!");
        setForgotStep(2);
      } else if (forgotStep === 2) {
        // Verify OTP and reset password
        const res = await fetch("http://localhost:8000/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobile_no: forgotMobile,
            otp: forgotOtp,
            new_password: newPassword
          })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.detail || "Failed to reset password");

        toast.success("Password reset successfully! You can now login.");
        closeForgotModal();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotMobile("");
    setForgotOtp("");
    setNewPassword("");
  };

  return (
    <>
      <div className="page-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
        
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', zIndex: 1 }}>
          <div className="db-card animate-db" style={{ maxWidth: '440px', width: '100%', padding: '48px', border: '1px solid var(--db-border)' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🩺</div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px', color: 'var(--db-text)', letterSpacing: '-0.02em' }}>Secure Login</h2>
              <p style={{ color: 'var(--db-muted)', margin: 0, fontSize: '15px' }}>Access your clinical dashboard</p>
            </div>

            {error && <div style={{ background: '#fef2f2', color: 'var(--db-crimson)', padding: '12px', borderRadius: '12px', fontSize: '14px', marginBottom: '24px', textAlign: 'center', fontWeight: 600, border: '1px solid #fee2e2' }}>{error}</div>}

            <form onSubmit={handlePasswordLogin} className="db-input-group">
              <div style={{ display: 'grid', gap: '20px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--db-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email / Mobile</span>
                  <input
                    type="text"
                    className="db-input"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    required
                    placeholder="clinical@example.com"
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
              </div>

              <div style={{ marginTop: '32px' }}>
                <button type="submit" className="db-btn-primary" disabled={loggingIn} style={{ width: '100%', padding: '16px', fontSize: '16px' }}>
                  {loggingIn ? "VERIFYING..." : "ACCESS DASHBOARD"}
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center', marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  style={{ background: "none", border: "none", color: 'var(--db-accent)', cursor: "pointer", fontSize: "14px", fontWeight: 700 }}
                >
                  Retrieve Access?
                </button>
                <Link to="/register" style={{ fontSize: "14px", color: 'var(--db-muted)', fontWeight: 600, textDecoration: 'none' }}>
                  New Registry <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showForgotModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={closeForgotModal}>
          <div className="db-card animate-db" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', width: '100%', padding: '32px', border: '1px solid var(--db-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--db-text)' }}>{forgotStep === 1 ? "Credential Recovery" : "Override Security Key"}</h2>
              <button onClick={closeForgotModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--db-muted)' }}>&times;</button>
            </div>
            
            <form onSubmit={handleForgotPassword} className="field-light">
              {forgotStep === 1 ? (
                <>
                  <p style={{ marginBottom: "24px", color: C.lightMuted, fontSize: '14px', lineHeight: 1.5 }}>
                    Enter your registered mobile number to receive an OTP.
                  </p>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: C.lightText }}>Mobile Number</span>
                    <input
                      type="text"
                      className="db-input"
                      value={forgotMobile}
                      onChange={(e) => setForgotMobile(e.target.value)}
                      required
                      placeholder="e.g. 1234567890"
                      style={{ width: '100%' }}
                    />
                  </label>
                </>
              ) : (
                <>
                  <p style={{ marginBottom: "24px", color: C.lightMuted, fontSize: '14px', lineHeight: 1.5 }}>
                    Enter the OTP sent to your mobile number and your new password.
                  </p>
                  <div style={{ display: 'grid', gap: '20px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: C.lightText }}>OTP</span>
                      <input
                        type="text"
                        className="db-input"
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value)}
                        required
                        placeholder="6-digit OTP"
                        maxLength="6"
                        style={{ width: '100%', letterSpacing: '4px', textAlign: 'center', fontSize: '18px', fontWeight: 700 }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: C.lightText }}>New Password</span>
                      <input
                        type="password"
                        className="db-input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        style={{ width: '100%' }}
                      />
                    </label>
                  </div>
                </>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px" }}>
                <button type="button" className="db-btn-secondary" onClick={closeForgotModal}>
                  Cancel
                </button>
                <button type="submit" className="db-btn-primary" disabled={forgotLoading}>
                  {forgotLoading ? "Processing..." : forgotStep === 1 ? "Send OTP" : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Login;
