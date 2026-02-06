import { useState, useEffect } from 'react';
import api from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading statistics...</div>;
  }

  if (error) {
    return (
      <div className="card">
        <div className="error">Error loading statistics: {error}</div>
        {error.includes('API request failed') && (
          <p>Make sure you have configured your API key in Settings.</p>
        )}
      </div>
    );
  }

  if (!stats) {
    return <div className="card">No statistics available</div>;
  }

  return (
    <div>
      <div className="card">
        <h2>System Overview</h2>
        
        <div className="stat-grid">
          <div className="stat-card">
            <h3>Active Credentials</h3>
            <div className="value">{stats.credentials.active}</div>
            <p>{stats.credentials.inactive} inactive</p>
          </div>
          
          <div className="stat-card">
            <h3>Active Accounts</h3>
            <div className="value">{stats.gsuiteAccounts.active}</div>
            <p>{stats.gsuiteAccounts.inactive} inactive</p>
          </div>
          
          <div className="stat-card">
            <h3>Countries</h3>
            <div className="value">{stats.geographicalDistribution.length}</div>
            <p>Geographical coverage</p>
          </div>
          
          <div className="stat-card">
            <h3>Domains</h3>
            <div className="value">{stats.domainDistribution.length}</div>
            <p>Unique domains</p>
          </div>
        </div>
      </div>

      {stats.geographicalDistribution.length > 0 && (
        <div className="card">
          <h2>Geographical Distribution</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Country</th>
                <th>Accounts</th>
              </tr>
            </thead>
            <tbody>
              {stats.geographicalDistribution.map((item) => (
                <tr key={item.country}>
                  <td>{item.country}</td>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {stats.domainDistribution.length > 0 && (
        <div className="card">
          <h2>Domain Distribution</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Accounts</th>
              </tr>
            </thead>
            <tbody>
              {stats.domainDistribution.map((item) => (
                <tr key={item.domain}>
                  <td>{item.domain}</td>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
