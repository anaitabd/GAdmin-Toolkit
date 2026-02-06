import { useState, useEffect } from 'react';
import api from '../services/api';

function Credentials() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    clientEmail: '',
    privateKey: '',
    projectId: '',
  });

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCredentials();
      setCredentials(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await api.createCredential(formData);
      setShowForm(false);
      setFormData({ name: '', clientEmail: '', privateKey: '', projectId: '' });
      await loadCredentials();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this credential?')) {
      return;
    }
    try {
      await api.deleteCredential(id);
      await loadCredentials();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await api.deactivateCredential(id);
      await loadCredentials();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading credentials...</div>;
  }

  return (
    <div className="card">
      <div className="flex space-between">
        <h2>Credentials</h2>
        <button className="button" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Credential'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Client Email *</label>
            <input
              type="email"
              value={formData.clientEmail}
              onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Project ID</label>
            <input
              type="text"
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label>Private Key *</label>
            <textarea
              value={formData.privateKey}
              onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
              rows="5"
              required
            />
          </div>
          
          <button type="submit" className="button">Create Credential</button>
        </form>
      )}

      {credentials.length === 0 ? (
        <p style={{ marginTop: '20px' }}>No credentials found. Add your first credential to get started.</p>
      ) : (
        <table className="table" style={{ marginTop: '20px' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Client Email</th>
              <th>Project ID</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {credentials.map((cred) => (
              <tr key={cred.id}>
                <td>{cred.name}</td>
                <td>{cred.client_email}</td>
                <td>{cred.project_id || 'N/A'}</td>
                <td>
                  <span className={`badge ${cred.is_active ? 'active' : 'inactive'}`}>
                    {cred.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  {cred.is_active && (
                    <button
                      className="button secondary"
                      style={{ marginRight: '8px' }}
                      onClick={() => handleDeactivate(cred.id)}
                    >
                      Deactivate
                    </button>
                  )}
                  <button
                    className="button danger"
                    onClick={() => handleDelete(cred.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Credentials;
