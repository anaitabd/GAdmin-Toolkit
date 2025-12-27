import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmailSendingPage from './pages/EmailSendingPage';
import { useAuthStore } from './store';

function App() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    return (
        <BrowserRouter>
            {isAuthenticated && <Navbar />}
            <Routes>
                <Route 
                    path="/login" 
                    element={
                        isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
                    } 
                />
                <Route 
                    path="/dashboard" 
                    element={
                        <PrivateRoute>
                            <DashboardPage />
                        </PrivateRoute>
                    } 
                />
                <Route 
                    path="/email" 
                    element={
                        <PrivateRoute>
                            <EmailSendingPage />
                        </PrivateRoute>
                    } 
                />
                <Route 
                    path="/" 
                    element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
                />
                <Route 
                    path="*" 
                    element={<Navigate to="/" replace />} 
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
