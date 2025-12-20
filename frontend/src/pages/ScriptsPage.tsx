import React from 'react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/App.css';

interface Script {
  name: string;
  description: string;
  adminOnly: boolean;
  defaultRunMode: 'sync' | 'async';
  params: Record<string, unknown>;
  timeoutMs: number;
}

export function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState(localStorage.getItem('api_token') || '');

  useEffect(() => {
    if (!token) {
      setError('No API token configured');
      setLoading(false);
      return;
    }

    fetchScripts();
  }, [token]);

  async function fetchScripts() {
    try {
      const response = await axios.get('/api/scripts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setScripts(response.data.scripts || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scripts');
    } finally {
      setLoading(false);
    }
  }

  const handleTokenChange = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('api_token', newToken);
  };

  if (!token) {
    return (
      <div className="auth-panel">
        <h2>GAdmin Toolkit</h2>
        <input
          type="password"
          placeholder="Enter API token"
          value={token}
          onChange={(e) => handleTokenChange(e.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="scripts-page">
      <h1>Available Scripts</h1>
      {loading && <p>Loading scripts...</p>}
      {error && <p className="error">{error}</p>}
      {scripts.length === 0 && !loading && <p>No scripts available</p>}

      <div className="scripts-grid">
        {scripts.map((script) => (
          <ScriptCard key={script.name} script={script} token={token} />
        ))}
      </div>
    </div>
  );
}

function ScriptCard({ script, token }: { script: Script; token: string }) {
  const [showForm, setShowForm] = useState(false);
  const [params, setParams] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleRun() {
    setRunning(true);
    try {
      const response = await axios.post(`/api/run/${script.name}`,
        { params, runAsync: script.defaultRunMode === 'async' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(response.data);
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : 'Failed to run script' });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="script-card">
      <h3>{script.name}</h3>
      <p>{script.description}</p>
      {script.adminOnly && <span className="badge admin">Admin Only</span>}
      <span className={`badge ${script.defaultRunMode}`}>{script.defaultRunMode}</span>

      <button onClick={() => setShowForm(!showForm)} disabled={running}>
        {showForm ? 'Hide Form' : 'Run Script'}
      </button>

      {showForm && (
        <div className="form">
          {Object.entries(script.params).map(([key, schema]) => (
            <div key={key} className="form-field">
              <label>{key}</label>
              <input
                type="text"
                placeholder={`Enter ${key}`}
                value={params[key] || ''}
                onChange={(e) => setParams({ ...params, [key]: e.target.value })}
              />
            </div>
          ))}
          <button onClick={handleRun} disabled={running}>
            {running ? 'Running...' : 'Execute'}
          </button>
        </div>
      )}

      {result && (
        <div className="result">
          {result.error ? (
            <p className="error">{result.error}</p>
          ) : result.stdout ? (
            <pre>{result.stdout}</pre>
          ) : (
            <p>Job queued: {result.jobId}</p>
          )}
        </div>
      )}
    </div>
  );
}

