import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI, emailsAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    emailsSent: 0,
    bouncedEmails: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [usersResponse, logsResponse, bouncedResponse] = await Promise.all([
        usersAPI.getAll(1, 1),
        emailsAPI.getLogs(1, 1),
        emailsAPI.getBounced(),
      ]);

      setStats({
        totalUsers: usersResponse.data.pagination?.total || 0,
        emailsSent: logsResponse.data.pagination?.total || 0,
        bouncedEmails: bouncedResponse.data.bounced?.length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { 
      title: 'Generate Users', 
      description: 'Create new user data for Google Workspace',
      link: '/users',
      icon: '➕',
      color: '#0d6efd'
    },
    { 
      title: 'Send Emails', 
      description: 'Send emails via Gmail API or SMTP',
      link: '/emails',
      icon: '📧',
      color: '#198754'
    },
    { 
      title: 'View Users', 
      description: 'Browse and manage generated users',
      link: '/users',
      icon: '👥',
      color: '#6f42c1'
    },
    { 
      title: 'Email Logs', 
      description: 'View email sending history',
      link: '/emails',
      icon: '📊',
      color: '#fd7e14'
    },
  ];

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome to GAdmin Toolkit - Manage your Google Workspace efficiently</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e7f1ff' }}>
            <span style={{ color: '#0d6efd' }}>👥</span>
          </div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Generated Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#d1e7dd' }}>
            <span style={{ color: '#198754' }}>📧</span>
          </div>
          <div className="stat-content">
            <h3>{stats.emailsSent}</h3>
            <p>Emails Sent</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f8d7da' }}>
            <span style={{ color: '#dc3545' }}>⚠️</span>
          </div>
          <div className="stat-content">
            <h3>{stats.bouncedEmails}</h3>
            <p>Bounced Emails</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          {quickActions.map((action, index) => (
            <Link to={action.link} key={index} className="action-card">
              <div className="action-icon" style={{ background: `${action.color}15` }}>
                <span style={{ color: action.color, fontSize: '2rem' }}>{action.icon}</span>
              </div>
              <h3>{action.title}</h3>
              <p>{action.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
