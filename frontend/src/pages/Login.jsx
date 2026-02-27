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
          </form>

          <p className="auth-link">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Login;
