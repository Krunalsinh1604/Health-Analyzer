import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="topbar">
            <div className="brand">
                <p className="eyebrow">Clinical Intelligence Suite</p>
                <h1>Health Analyzer</h1>
            </div>

            <nav className="nav-links">
                <NavLink to="/dashboard" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>
                    Home
                </NavLink>
                <NavLink to="/diabetes" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>
                    Diabetes
                </NavLink>
                <NavLink to="/heart-disease" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>
                    Heart Disease
                </NavLink>
                <NavLink to="/hypertension" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>
                    Hypertension
                </NavLink>
                <NavLink to="/cbc" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>
                    Report Analyzer
                </NavLink>
                <NavLink to="/history" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>
                    History
                </NavLink>
                {user?.role === "admin" && (
                    <NavLink to="/admin" className={({ isActive }) => `tab${isActive ? " active" : ""}`}>
                        Admin
                    </NavLink>
                )}
            </nav>

            <div className="user-actions">
                {user && (
                    <button onClick={handleLogout} className="logout-btn">
                        Logout <span className="user-name">({user.full_name})</span>
                    </button>
                )}
            </div>
        </header>
    );
}

export default Navbar;
