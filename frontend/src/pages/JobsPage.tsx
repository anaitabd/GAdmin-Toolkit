import React from 'react';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface JobInfo {
  id: string;
  scriptKey: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  durationMs?: number;
}

export function JobsPage() {
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState(localStorage.getItem('api_token') || '');

  useEffect(() => {
    if (!token) {
      setError('No API token configured');
      setLoading(false);
      return;
    }

    // Fetch job history (would need endpoint)
    setLoading(false);
  }, [token]);

  return (
    <div className="jobs-page">
      <h1>Job History</h1>
      {loading && <p>Loading jobs...</p>}
      {error && <p className="error">{error}</p>}
      {jobs.length === 0 && !loading && <p>No jobs found</p>}

      <table className="jobs-table">
        <thead>
          <tr>
            <th>Job ID</th>
            <th>Script</th>
            <th>Status</th>
            <th>Created</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>{job.id.slice(0, 8)}...</td>
              <td>{job.scriptKey}</td>
              <td className={`status-${job.status}`}>{job.status}</td>
              <td>{new Date(job.createdAt).toLocaleString()}</td>
              <td>{job.durationMs ? `${job.durationMs}ms` : '-'}</td>
              <td>
                <button>View Logs</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

