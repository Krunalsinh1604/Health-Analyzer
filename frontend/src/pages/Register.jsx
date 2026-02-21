import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";
import authBg from "../assets/auth-bg.png";

import { toast } from "react-toastify";

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
      <div className="auth-container" style={{ backgroundImage: `url(${authBg})` }}>
        <div className="auth-card">
          <div className="auth-logo">⚕️ Health Analyzer</div>
          <h2>Create Account</h2>
          <p>Join Health Analyzer today</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Mobile Number</label>
              <input
                type="tel"
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value)}
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

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-btn">Register</button>
          </form>

          <p className="auth-link">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Register;
