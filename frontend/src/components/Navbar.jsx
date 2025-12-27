import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';

export default function Navbar() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <div className="navbar-brand">
                    🔧 GAdmin Toolkit
                </div>
                <div className="navbar-links">
                    <button 
                        className={location.pathname === '/dashboard' ? 'nav-link active' : 'nav-link'}
                        onClick={() => navigate('/dashboard')}
                    >
                        Dashboard
                    </button>
                    <button 
                        className={location.pathname === '/email' ? 'nav-link active' : 'nav-link'}
                        onClick={() => navigate('/email')}
                    >
                        Email Sending
                    </button>
                </div>
                {user && (
                    <div className="navbar-actions">
                        <span style={{ color: '#5f6368', fontSize: '14px' }}>
                            Welcome, {user.username}
                        </span>
                        <button
                            className="button button-secondary"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
