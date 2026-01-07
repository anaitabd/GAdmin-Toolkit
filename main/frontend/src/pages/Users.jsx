import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [generateForm, setGenerateForm] = useState({
    domain: 'example.com',
    numRecords: 100,
  });

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await usersAPI.getAll(pagination.page, pagination.limit);
      setUsers(response.data.users || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await usersAPI.generate(generateForm);
      setSuccess(response.data.message || 'Users generated successfully');
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!window.confirm('Create all generated users in Google Workspace?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await usersAPI.create();
      setSuccess(response.data.message || 'Users created successfully in Google Workspace');
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete all users (except admin) from Google Workspace? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await usersAPI.delete();
      setSuccess(response.data.message || 'Users deleted successfully from Google Workspace');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete users');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Generate, create, and manage Google Workspace users</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="section">
        <h2>Generate Users</h2>
        <form onSubmit={handleGenerate} className="generate-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="domain">Domain</label>
              <input
                type="text"
                id="domain"
                value={generateForm.domain}
                onChange={(e) => setGenerateForm({ ...generateForm, domain: e.target.value })}
                placeholder="example.com"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="numRecords">Number of Users</label>
              <input
                type="number"
                id="numRecords"
                value={generateForm.numRecords}
                onChange={(e) => setGenerateForm({ ...generateForm, numRecords: parseInt(e.target.value) })}
                min="1"
                max="1000"
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Users'}
          </button>
        </form>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Generated Users ({pagination.total})</h2>
          <div className="action-buttons">
            <button 
              onClick={handleCreate} 
              className="btn btn-success"
              disabled={loading || users.length === 0}
            >
              Create in Google Workspace
            </button>
            <button 
              onClick={handleDelete} 
              className="btn btn-danger"
              disabled={loading}
            >
              Delete All Users
            </button>
          </div>
        </div>

        {loading && users.length === 0 ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <p>No users generated yet. Use the form above to generate users.</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Password</th>
                    <th>Google Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user._id || index}>
                      <td>{user.email}</td>
                      <td>{user.givenName}</td>
                      <td>{user.familyName}</td>
                      <td><code>{user.password}</code></td>
                      <td>
                        <span className={`badge ${user.googleCreated ? 'badge-success' : 'badge-secondary'}`}>
                          {user.googleCreated ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {pagination.page} of {totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= totalPages}
                  className="btn btn-secondary"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Users;
