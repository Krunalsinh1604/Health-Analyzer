import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";
import authBg from "../assets/auth-bg.png";

import { toast } from "react-toastify";

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
      <div className="auth-container" style={{ backgroundImage: `url(${authBg})` }}>
        <div className="auth-card">
          <div className="auth-logo">⚕️ Health Analyzer</div>
          <h2>Secure Login</h2>
          <p>Login with email/mobile and password</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handlePasswordLogin}>
            <div className="form-group">
              <label>Email or Mobile Number</label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loggingIn}>
              {loggingIn ? "Logging in..." : "Login"}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => setShowForgotModal(true)}
                style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: "0.9rem" }}
              >
                Forgot Password?
              </button>
              <Link to="/register" style={{ fontSize: "0.9rem" }}>Register here</Link>
            </div>
          </form>
        </div>
      </div>

      {showForgotModal && (
        <div className="modal-overlay" onClick={closeForgotModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>{forgotStep === 1 ? "Forgot Password" : "Reset Password"}</h2>
              <button className="close-btn" onClick={closeForgotModal}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleForgotPassword}>
                {forgotStep === 1 ? (
                  <>
                    <p style={{ marginBottom: "1rem", color: "var(--text-light)" }}>
                      Enter your registered mobile number to receive an OTP.
                    </p>
                    <div className="form-group">
                      <label>Mobile Number</label>
                      <input
                        type="text"
                        value={forgotMobile}
                        onChange={(e) => setForgotMobile(e.target.value)}
                        required
                        placeholder="e.g. 1234567890"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ marginBottom: "1rem", color: "var(--text-light)" }}>
                      Enter the OTP sent to your mobile number and your new password.
                    </p>
                    <div className="form-group">
                      <label>OTP</label>
                      <input
                        type="text"
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value)}
                        required
                        placeholder="6-digit OTP"
                        maxLength="6"
                      />
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1.5rem" }}>
                  <button type="button" className="btn btn-secondary" onClick={closeForgotModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={forgotLoading}>
                    {forgotLoading ? (
                      <span className="spinner"></span>
                    ) : forgotStep === 1 ? (
                      "Send OTP"
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default Login;
