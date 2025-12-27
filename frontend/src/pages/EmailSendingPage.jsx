import React, { useState } from 'react';
import { emailAPI } from '../services/api';

export default function EmailSendingPage() {
    const [activeTab, setActiveTab] = useState('single');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    
    const [singleEmailData, setSingleEmailData] = useState({
        method: 'api',
        user: '',
        password: '',
        recipient: '',
        from: '',
        subject: '',
        htmlContent: ''
    });

    const [bulkEmailData, setBulkEmailData] = useState({
        method: 'api',
        from: '',
        subject: '',
        htmlContent: ''
    });

    const [uploadedUsers, setUploadedUsers] = useState([]);
    const [uploadedRecipients, setUploadedRecipients] = useState([]);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleSingleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await emailAPI.send(singleEmailData);
            showMessage('success', 'Email sent successfully');
            setSingleEmailData({
                ...singleEmailData,
                recipient: '',
                htmlContent: ''
            });
        } catch (error) {
            showMessage('error', error.response?.data?.error?.message || 'Failed to send email');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkEmailSubmit = async (e) => {
        e.preventDefault();
        
        if (uploadedUsers.length === 0) {
            showMessage('error', 'Please upload users CSV file first');
            return;
        }
        
        if (uploadedRecipients.length === 0) {
            showMessage('error', 'Please upload recipients CSV file first');
            return;
        }

        setLoading(true);
        try {
            const response = await emailAPI.sendBulk({
                method: bulkEmailData.method,
                users: uploadedUsers,
                recipients: uploadedRecipients,
                from: bulkEmailData.from,
                subject: bulkEmailData.subject,
                htmlContent: bulkEmailData.htmlContent
            });
            
            const { totalSent, totalFailed } = response.data.data;
            showMessage('success', `Bulk email sending completed. Sent: ${totalSent}, Failed: ${totalFailed}`);
        } catch (error) {
            showMessage('error', error.response?.data?.error?.message || 'Failed to send bulk emails');
        } finally {
            setLoading(false);
        }
    };

    const handleUserFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const response = await emailAPI.uploadUsers(file);
            setUploadedUsers(response.data.data.users);
            showMessage('success', `Uploaded ${response.data.data.count} users`);
        } catch (error) {
            showMessage('error', error.response?.data?.error?.message || 'Failed to upload users');
        } finally {
            setLoading(false);
        }
    };

    const handleRecipientFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const response = await emailAPI.uploadRecipients(file);
            setUploadedRecipients(response.data.data.recipients);
            showMessage('success', `Uploaded ${response.data.data.count} recipients`);
        } catch (error) {
            showMessage('error', error.response?.data?.error?.message || 'Failed to upload recipients');
        } finally {
            setLoading(false);
        }
    };

    const handlePythonScript = async () => {
        setLoading(true);
        try {
            const response = await emailAPI.sendPython();
            showMessage('success', 'Python email script executed successfully');
        } catch (error) {
            showMessage('error', error.response?.data?.error?.message || 'Failed to execute Python script');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1 className="title">Email Sending</h1>

            {message && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="tabs">
                <button 
                    className={activeTab === 'single' ? 'active' : ''} 
                    onClick={() => setActiveTab('single')}
                >
                    Single Email
                </button>
                <button 
                    className={activeTab === 'bulk' ? 'active' : ''} 
                    onClick={() => setActiveTab('bulk')}
                >
                    Bulk Email
                </button>
                <button 
                    className={activeTab === 'python' ? 'active' : ''} 
                    onClick={() => setActiveTab('python')}
                >
                    Python Script
                </button>
            </div>

            {activeTab === 'single' && (
                <div className="tab-content">
                    <h2>Send Single Email</h2>
                    <form onSubmit={handleSingleEmailSubmit}>
                        <div className="form-group">
                            <label>Method</label>
                            <select 
                                value={singleEmailData.method}
                                onChange={(e) => setSingleEmailData({...singleEmailData, method: e.target.value})}
                                required
                            >
                                <option value="api">Google API (SendAPI)</option>
                                <option value="smtp">SMTP</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Sender Email</label>
                            <input 
                                type="email"
                                value={singleEmailData.user}
                                onChange={(e) => setSingleEmailData({...singleEmailData, user: e.target.value})}
                                placeholder="sender@example.com"
                                required
                            />
                        </div>

                        {singleEmailData.method === 'smtp' && (
                            <div className="form-group">
                                <label>Password</label>
                                <input 
                                    type="password"
                                    value={singleEmailData.password}
                                    onChange={(e) => setSingleEmailData({...singleEmailData, password: e.target.value})}
                                    placeholder="Email password"
                                    required
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Recipient Email</label>
                            <input 
                                type="email"
                                value={singleEmailData.recipient}
                                onChange={(e) => setSingleEmailData({...singleEmailData, recipient: e.target.value})}
                                placeholder="recipient@example.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>From Name</label>
                            <input 
                                type="text"
                                value={singleEmailData.from}
                                onChange={(e) => setSingleEmailData({...singleEmailData, from: e.target.value})}
                                placeholder="Sender Name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Subject</label>
                            <input 
                                type="text"
                                value={singleEmailData.subject}
                                onChange={(e) => setSingleEmailData({...singleEmailData, subject: e.target.value})}
                                placeholder="Email subject"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>HTML Content</label>
                            <textarea 
                                value={singleEmailData.htmlContent}
                                onChange={(e) => setSingleEmailData({...singleEmailData, htmlContent: e.target.value})}
                                placeholder="<html>...</html>"
                                rows="10"
                                required
                            />
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'Sending...' : 'Send Email'}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'bulk' && (
                <div className="tab-content">
                    <h2>Send Bulk Emails</h2>
                    
                    <div className="upload-section">
                        <h3>1. Upload Users (CSV)</h3>
                        <p>CSV format: email,password (password required only for SMTP)</p>
                        <input 
                            type="file" 
                            accept=".csv"
                            onChange={handleUserFileUpload}
                            disabled={loading}
                        />
                        {uploadedUsers.length > 0 && (
                            <p className="success-text">✓ {uploadedUsers.length} users loaded</p>
                        )}
                    </div>

                    <div className="upload-section">
                        <h3>2. Upload Recipients (CSV)</h3>
                        <p>CSV format: to (one email per row)</p>
                        <input 
                            type="file" 
                            accept=".csv"
                            onChange={handleRecipientFileUpload}
                            disabled={loading}
                        />
                        {uploadedRecipients.length > 0 && (
                            <p className="success-text">✓ {uploadedRecipients.length} recipients loaded</p>
                        )}
                    </div>

                    <form onSubmit={handleBulkEmailSubmit}>
                        <div className="form-group">
                            <label>Method</label>
                            <select 
                                value={bulkEmailData.method}
                                onChange={(e) => setBulkEmailData({...bulkEmailData, method: e.target.value})}
                                required
                            >
                                <option value="api">Google API (SendAPI)</option>
                                <option value="smtp">SMTP</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>From Name</label>
                            <input 
                                type="text"
                                value={bulkEmailData.from}
                                onChange={(e) => setBulkEmailData({...bulkEmailData, from: e.target.value})}
                                placeholder="Sender Name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Subject</label>
                            <input 
                                type="text"
                                value={bulkEmailData.subject}
                                onChange={(e) => setBulkEmailData({...bulkEmailData, subject: e.target.value})}
                                placeholder="Email subject"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>HTML Content</label>
                            <textarea 
                                value={bulkEmailData.htmlContent}
                                onChange={(e) => setBulkEmailData({...bulkEmailData, htmlContent: e.target.value})}
                                placeholder="<html>...</html>"
                                rows="10"
                                required
                            />
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'Sending...' : 'Send Bulk Emails'}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'python' && (
                <div className="tab-content">
                    <h2>Python Email Script</h2>
                    <p>
                        This will execute the Python email sending script using CSV files from the files/ directory:
                    </p>
                    <ul>
                        <li>files/working_smtp.csv - SMTP credentials</li>
                        <li>files/data.csv - Recipients list</li>
                        <li>files/info.csv - Email info (from, subject)</li>
                        <li>files/html.txt - Email HTML template</li>
                    </ul>
                    <button 
                        onClick={handlePythonScript} 
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Executing...' : 'Execute Python Script'}
                    </button>
                </div>
            )}
        </div>
    );
}
