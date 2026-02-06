import { useState, useEffect } from 'react';
import api from '../services/api';

function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);

  useEffect(() => {
    setApiKey(api.getApiKey());
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const health = await api.healthCheck();
      setHealthStatus(health);
    } catch (err) {
      setHealthStatus(null);
    }
  };

  const handleSaveApiKey = () => {
    api.setApiKey(apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    checkHealth();
  };

  const loadConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getConfigs();
      setConfigs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Settings</h2>

        <div className="form-group">
          <label>API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
          />
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            The API key is stored in your browser's local storage and is sent with every request.
          </p>
        </div>

        <button className="button" onClick={handleSaveApiKey}>
          Save API Key
        </button>

        {saved && <div className="success" style={{ marginTop: '16px' }}>API key saved successfully!</div>}

        {healthStatus && (
          <div className="success" style={{ marginTop: '16px' }}>
            ✓ API connection successful
          </div>
        )}
        {!healthStatus && apiKey && (
          <div className="error" style={{ marginTop: '16px' }}>
            Unable to connect to API. Check your API key and ensure the server is running.
          </div>
        )}
      </div>

      <div className="card">
        <h2>System Configuration</h2>
        
        <button className="button" onClick={loadConfigs} disabled={loading}>
          {loading ? 'Loading...' : 'Load Configurations'}
        </button>

        {error && <div className="error" style={{ marginTop: '16px' }}>{error}</div>}

        {configs.length > 0 && (
          <table className="table" style={{ marginTop: '20px' }}>
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((config) => (
                <tr key={config.id}>
                  <td><code>{config.key}</code></td>
                  <td>{config.value}</td>
                  <td>{config.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>About</h2>
        <p>
          <strong>GAdmin Toolkit</strong> is a comprehensive management system for Google Workspace accounts
          with support for multiple credentials and geographical distribution.
        </p>
        <p style={{ marginTop: '12px' }}>
          <strong>Features:</strong>
        </p>
        <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
          <li>Manage multiple Google Service Account credentials</li>
          <li>Store G Suite accounts with geographical data</li>
          <li>Dynamic configuration management</li>
          <li>API-based credential rotation</li>
          <li>Load balancing across accounts</li>
        </ul>
      </div>
    </div>
  );
}

export default Settings;
