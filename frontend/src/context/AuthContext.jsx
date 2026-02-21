import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Configure base URL for Python API
  const API_URL = "http://localhost:8000";

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else if (response.status === 401 || response.status === 403) {
          // Token invalid or expired
          console.warn("Session expired, logging out.");
          logout();
        } else {
          console.error("Server error fetching user:", response.status);
          // Do NOT logout on 500 errors to prevent loops during transient failures
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        // Do NOT logout on network errors
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = useCallback(async (loginId, password) => {
    const formData = new FormData();
    formData.append("username", loginId);
    formData.append("password", password);

    const response = await fetch(`${API_URL}/token`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Login failed");
    }

    const data = await response.json();
    const accessToken = data.access_token;

    localStorage.setItem("token", accessToken);
    setToken(accessToken);
    setLoading(true); // Prevent race condition in ProtectedRoute
    return true;
  }, []);

  const requestPasswordResetOtp = useCallback(async (email) => {
    const response = await fetch(`${API_URL}/password/forgot/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to send login OTP");
    }

    return data;
  }, []);

  const resetPasswordWithOtp = useCallback(async (email, otp, newPassword) => {
    const response = await fetch(`${API_URL}/password/forgot/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp, new_password: newPassword }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Password reset failed");
    }

    return data;
  }, []);

  const register = useCallback(async (email, password, fullName, mobileNo) => {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        mobile_no: mobileNo,
        password,
        full_name: fullName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Registration failed");
    }

    const data = await response.json();
    const accessToken = data.access_token;

    // Auto login after register
    localStorage.setItem("token", accessToken);
    setToken(accessToken);
    setLoading(true); // Prevent race condition in ProtectedRoute
    return true;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    navigate("/login");
  }, [navigate]);

  const authFetch = useCallback(async (endpoint, options = {}) => {
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      logout();
      throw new Error("Session expired");
    }

    return response;
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ user, login, requestPasswordResetOtp, resetPasswordWithOtp, register, logout, loading, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
