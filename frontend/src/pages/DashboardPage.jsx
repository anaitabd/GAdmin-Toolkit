import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { useUsersStore } from '../store';

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState('list');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    
    const { users, setUsers } = useUsersStore();

    const [formData, setFormData] = useState({
        email: '',
        password: 'Password123@',
        givenName: '',
        familyName: ''
    });

    const [generateData, setGenerateData] = useState({
        domain: '',
        count: 10
    });

    useEffect(() => {
        if (activeTab === 'list') {
            loadUsers();
        }
    }, [activeTab]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await usersAPI.list();
            setUsers(response.data.data.users);
        } catch (error) {
            showMessage('error', 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await usersAPI.create(formData);
            showMessage('success', 'User created successfully');
            setFormData({
                email: '',
                password: 'Password123@',
                givenName: '',
                familyName: ''
            });
            if (activeTab === 'list') {
                loadUsers();
            }
        } catch (error) {
            showMessage('error', error.response?.data?.error?.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateUsers = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await usersAPI.generate(generateData.domain, generateData.count);
            const generatedUsers = response.data.data.users;
            
            // Create the generated users
            const createResponse = await usersAPI.createBulk(generatedUsers);
            const results = createResponse.data.data;
            
            showMessage('success', 
                `Generated and created ${results.success.length} users. ${results.failed.length} failed.`
            );
            
            if (activeTab === 'list') {
                loadUsers();
            }
        } catch (error) {
            showMessage('error', error.response?.data?.error?.message || 'Failed to generate users');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userKey) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        
        setLoading(true);
        try {
            await usersAPI.delete(userKey);
            showMessage('success', 'User deleted successfully');
            loadUsers();
        } catch (error) {
            showMessage('error', 'Failed to delete user');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('Are you sure you want to delete ALL users (except admin)? This cannot be undone!')) return;
        
        setLoading(true);
        try {
            const response = await usersAPI.deleteAll();
            const results = response.data.data;
            showMessage('success', 
                `Deleted ${results.success.length} users. ${results.failed.length} failed.`
            );
            loadUsers();
        } catch (error) {
            showMessage('error', 'Failed to delete users');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const response = await usersAPI.uploadCSV(file);
            const results = response.data.data;
            showMessage('success', 
                `Created ${results.success.length} users from CSV. ${results.failed.length} failed.`
            );
            if (activeTab === 'list') {
                loadUsers();
            }
        } catch (error) {
            showMessage('error', error.response?.data?.error?.message || 'Failed to upload CSV');
        } finally {
            setLoading(false);
            e.target.value = ''; // Reset file input
        }
    };

    return (
        <div className="container">
            <h1 style={{ marginBottom: '24px', color: '#333' }}>User Management</h1>

            {message && (
                <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
                    {message.text}
                </div>
            )}

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'list' ? 'active' : ''}`}
                    onClick={() => setActiveTab('list')}
                >
                    List Users
                </button>
                <button
                    className={`tab ${activeTab === 'create' ? 'active' : ''}`}
                    onClick={() => setActiveTab('create')}
                >
                    Create User
                </button>
                <button
                    className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
                    onClick={() => setActiveTab('generate')}
                >
                    Generate Users
                </button>
                <button
                    className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
                    onClick={() => setActiveTab('upload')}
                >
                    Upload CSV
                </button>
            </div>

            {activeTab === 'list' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 className="card-header" style={{ marginBottom: 0 }}>All Users</h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className="button button-secondary"
                                onClick={loadUsers}
                                disabled={loading}
                            >
                                Refresh
                            </button>
                            <button
                                className="button button-danger"
                                onClick={handleDeleteAll}
                                disabled={loading}
                            >
                                Delete All
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Name</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#5f6368' }}>
                                                No users found
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user.id}>
                                                <td>{user.primaryEmail}</td>
                                                <td>{user.name?.fullName || '-'}</td>
                                                <td>{new Date(user.creationTime).toLocaleDateString()}</td>
                                                <td>
                                                    <button
                                                        className="button button-danger"
                                                        style={{ padding: '6px 12px', fontSize: '13px' }}
                                                        onClick={() => handleDeleteUser(user.primaryEmail)}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'create' && (
                <div className="card">
                    <h2 className="card-header">Create New User</h2>
                    <form onSubmit={handleCreateUser}>
                        <div className="form-group">
                            <label className="label">Email</label>
                            <input
                                type="email"
                                className="input"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="label">Password</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                                <label className="label">First Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.givenName}
                                    onChange={(e) => setFormData({ ...formData, givenName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="label">Last Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.familyName}
                                    onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="button button-primary"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create User'}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'generate' && (
                <div className="card">
                    <h2 className="card-header">Generate Random Users</h2>
                    <form onSubmit={handleGenerateUsers}>
                        <div className="form-group">
                            <label className="label">Domain</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="example.com"
                                value={generateData.domain}
                                onChange={(e) => setGenerateData({ ...generateData, domain: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="label">Number of Users</label>
                            <input
                                type="number"
                                className="input"
                                min="1"
                                max="1000"
                                value={generateData.count}
                                onChange={(e) => setGenerateData({ ...generateData, count: parseInt(e.target.value) })}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="button button-primary"
                            disabled={loading}
                        >
                            {loading ? 'Generating...' : 'Generate and Create Users'}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'upload' && (
                <div className="card">
                    <h2 className="card-header">Upload CSV File</h2>
                    <div className="alert alert-info">
                        <strong>CSV Format:</strong> The file should contain columns: email, password, givenName, familyName
                    </div>

                    <div className="form-group">
                        <label className="label">Select CSV File</label>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            disabled={loading}
                            style={{
                                padding: '10px',
                                border: '2px dashed #ddd',
                                borderRadius: '4px',
                                width: '100%',
                                cursor: 'pointer'
                            }}
                        />
                    </div>

                    {loading && (
                        <div className="loading">
                            <div className="spinner"></div>
                            <p style={{ marginLeft: '12px' }}>Uploading and creating users...</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
