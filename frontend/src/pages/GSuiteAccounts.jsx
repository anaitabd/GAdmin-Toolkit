import { useState, useEffect } from 'react';
import api from '../services/api';

function GSuiteAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCountry, setFilterCountry] = useState('');
  const [formData, setFormData] = useState({
    credentialId: '',
    adminEmail: '',
    domain: '',
    country: '',
    region: '',
    city: '',
    timezone: '',
    quotaLimit: '1200000',
    requestsPerEmail: '300',
  });

  useEffect(() => {
    loadData();
  }, [filterCountry]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [accountsData, credentialsData, countriesData] = await Promise.all([
        api.getGSuiteAccounts(filterCountry ? { country: filterCountry } : {}),
        api.getCredentials(),
        api.getCountries(),
      ]);
      setAccounts(accountsData);
      setCredentials(credentialsData);
      setCountries(countriesData);
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
      await api.createGSuiteAccount({
        ...formData,
        credentialId: parseInt(formData.credentialId),
        quotaLimit: parseInt(formData.quotaLimit),
        requestsPerEmail: parseInt(formData.requestsPerEmail),
      });
      setShowForm(false);
      setFormData({
        credentialId: '',
        adminEmail: '',
        domain: '',
        country: '',
        region: '',
        city: '',
        timezone: '',
        quotaLimit: '1200000',
        requestsPerEmail: '300',
      });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this G Suite account?')) {
      return;
    }
    try {
      await api.deleteGSuiteAccount(id);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await api.deactivateGSuiteAccount(id);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading G Suite accounts...</div>;
  }

  return (
    <div className="card">
      <div className="flex space-between">
        <h2>G Suite Accounts</h2>
        <button className="button" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Account'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>Filter by Country:</label>
        <select
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="">All Countries</option>
          {countries.map((c) => (
            <option key={c.country} value={c.country}>
              {c.country} ({c.account_count})
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label>Credential *</label>
            <select
              value={formData.credentialId}
              onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
              required
            >
              <option value="">Select a credential</option>
              {credentials.map((cred) => (
                <option key={cred.id} value={cred.id}>
                  {cred.name} ({cred.client_email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Admin Email *</label>
            <input
              type="email"
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Domain *</label>
            <input
              type="text"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Country</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="e.g., US, FR, UK"
            />
          </div>

          <div className="form-group">
            <label>Region</label>
            <input
              type="text"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              placeholder="e.g., California, Île-de-France"
            />
          </div>

          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g., San Francisco, Paris"
            />
          </div>

          <div className="form-group">
            <label>Timezone</label>
            <input
              type="text"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              placeholder="e.g., America/Los_Angeles, Europe/Paris"
            />
          </div>

          <div className="form-group">
            <label>Quota Limit</label>
            <input
              type="number"
              value={formData.quotaLimit}
              onChange={(e) => setFormData({ ...formData, quotaLimit: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Requests Per Email</label>
            <input
              type="number"
              value={formData.requestsPerEmail}
              onChange={(e) => setFormData({ ...formData, requestsPerEmail: e.target.value })}
            />
          </div>

          <button type="submit" className="button">Create Account</button>
        </form>
      )}

      {accounts.length === 0 ? (
        <p style={{ marginTop: '20px' }}>
          No G Suite accounts found. {filterCountry && 'Try selecting a different country or '}
          Add your first account to get started.
        </p>
      ) : (
        <table className="table" style={{ marginTop: '20px' }}>
          <thead>
            <tr>
              <th>Admin Email</th>
              <th>Domain</th>
              <th>Location</th>
              <th>Credential</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td>{account.admin_email}</td>
                <td>{account.domain}</td>
                <td>
                  {account.country && (
                    <>
                      {account.country}
                      {account.region && `, ${account.region}`}
                      {account.city && `, ${account.city}`}
                    </>
                  ) || 'N/A'}
                </td>
                <td>{account.credential_name}</td>
                <td>
                  <span className={`badge ${account.is_active ? 'active' : 'inactive'}`}>
                    {account.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  {account.is_active && (
                    <button
                      className="button secondary"
                      style={{ marginRight: '8px' }}
                      onClick={() => handleDeactivate(account.id)}
                    >
                      Deactivate
                    </button>
                  )}
                  <button
                    className="button danger"
                    onClick={() => handleDelete(account.id)}
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

export default GSuiteAccounts;
