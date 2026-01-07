import { useState, useEffect } from 'react';
import { emailsAPI } from '../services/api';
import './Emails.css';

const Emails = () => {
  const [activeTab, setActiveTab] = useState('send');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logs, setLogs] = useState([]);
  const [bounced, setBounced] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  
  const [emailForm, setEmailForm] = useState({
    recipients: '',
    from: 'Admin',
    subject: '',
    htmlContent: '',
  });

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    } else if (activeTab === 'bounced') {
      loadBounced();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pagination.page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await emailsAPI.getLogs(pagination.page, pagination.limit);
      setLogs(response.data.logs || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const loadBounced = async () => {
    setLoading(true);
    try {
      const response = await emailsAPI.getBounced();
      setBounced(response.data.bounced || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load bounced emails');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (method) => {
    setLoading(true);
    setError('');
    setSuccess('');

    const recipients = emailForm.recipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email);

    if (recipients.length === 0) {
      setError('Please enter at least one recipient email');
      setLoading(false);
      return;
    }

    const payload = {
      ...emailForm,
      recipients,
    };

    try {
      const sendFunc = method === 'api' ? emailsAPI.sendViaAPI : emailsAPI.sendViaSMTP;
      const response = await sendFunc(payload);
      setSuccess(response.data.message || 'Emails sent successfully');
      setEmailForm({
        recipients: '',
        from: 'Admin',
        subject: '',
        htmlContent: '',
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send emails');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="emails-page">
      <div className="page-header">
        <h1>Email Management</h1>
        <p>Send emails and monitor delivery status</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'send' ? 'active' : ''}`}
          onClick={() => setActiveTab('send')}
        >
          📤 Send Email
        </button>
        <button
          className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📊 Email Logs
        </button>
        <button
          className={`tab ${activeTab === 'bounced' ? 'active' : ''}`}
          onClick={() => setActiveTab('bounced')}
        >
          ⚠️ Bounced Emails
        </button>
      </div>

      {activeTab === 'send' && (
        <div className="section">
          <h2>Compose Email</h2>
          <form className="email-form">
            <div className="form-group">
              <label htmlFor="recipients">Recipients (comma-separated)</label>
              <input
                type="text"
                id="recipients"
                value={emailForm.recipients}
                onChange={(e) => setEmailForm({ ...emailForm, recipients: e.target.value })}
                placeholder="user1@example.com, user2@example.com"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="from">From Name</label>
                <input
                  type="text"
                  id="from"
                  value={emailForm.from}
                  onChange={(e) => setEmailForm({ ...emailForm, from: e.target.value })}
                  placeholder="Your Name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  placeholder="Email subject"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="htmlContent">Email Content (HTML)</label>
              <textarea
                id="htmlContent"
                value={emailForm.htmlContent}
                onChange={(e) => setEmailForm({ ...emailForm, htmlContent: e.target.value })}
                placeholder="<h1>Hello!</h1><p>Your email content here...</p>"
                required
              />
            </div>

            <div className="action-buttons">
              <button
                type="button"
                onClick={() => handleSendEmail('api')}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send via Gmail API'}
              </button>
              <button
                type="button"
                onClick={() => handleSendEmail('smtp')}
                className="btn btn-secondary"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send via SMTP'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="section">
          <div className="section-header">
            <h2>Email Logs ({pagination.total})</h2>
          </div>

          {loading && logs.length === 0 ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <p>No email logs found.</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Subject</th>
                      <th>Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <tr key={log._id || index}>
                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                        <td>{log.from}</td>
                        <td>{log.to}</td>
                        <td>{log.subject}</td>
                        <td>
                          <span className="badge badge-info">
                            {log.method === 'gmail_api' ? 'Gmail API' : 'SMTP'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${log.status === 'success' ? 'badge-success' : 'badge-error'}`}>
                            {log.status}
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
      )}

      {activeTab === 'bounced' && (
        <div className="section">
          <div className="section-header">
            <h2>Bounced Emails ({bounced.length})</h2>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading bounced emails...</p>
            </div>
          ) : bounced.length === 0 ? (
            <div className="empty-state">
              <p>No bounced emails found.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>User</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bounced.map((item, index) => (
                    <tr key={item._id || index}>
                      <td>{item.email}</td>
                      <td>{item.user}</td>
                      <td>{new Date(item.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Emails;
