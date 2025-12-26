import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';

export default function Navbar() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

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
