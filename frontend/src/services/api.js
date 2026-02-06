const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.apiKey = localStorage.getItem('apiKey') || '';
  }

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('apiKey', key);
  }

  getApiKey() {
    return this.apiKey;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data;
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Statistics
  async getStats() {
    return this.request('/stats');
  }

  async getCountries() {
    return this.request('/stats/countries');
  }

  // Credentials
  async getCredentials() {
    return this.request('/credentials');
  }

  async getCredential(id) {
    return this.request(`/credentials/${id}`);
  }

  async createCredential(data) {
    return this.request('/credentials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCredential(id, data) {
    return this.request(`/credentials/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCredential(id) {
    return this.request(`/credentials/${id}`, {
      method: 'DELETE',
    });
  }

  async deactivateCredential(id) {
    return this.request(`/credentials/${id}/deactivate`, {
      method: 'POST',
    });
  }

  // G Suite Accounts
  async getGSuiteAccounts(filters = {}) {
    const params = new URLSearchParams(filters);
    const query = params.toString() ? `?${params}` : '';
    return this.request(`/gsuite-accounts${query}`);
  }

  async getGSuiteAccount(id) {
    return this.request(`/gsuite-accounts/${id}`);
  }

  async getGSuiteAccountsByCountry(country) {
    return this.request(`/gsuite-accounts/country/${country}`);
  }

  async createGSuiteAccount(data) {
    return this.request('/gsuite-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGSuiteAccount(id, data) {
    return this.request(`/gsuite-accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteGSuiteAccount(id) {
    return this.request(`/gsuite-accounts/${id}`, {
      method: 'DELETE',
    });
  }

  async deactivateGSuiteAccount(id) {
    return this.request(`/gsuite-accounts/${id}/deactivate`, {
      method: 'POST',
    });
  }

  // Account Selection
  async selectAccount(criteria) {
    return this.request('/account-selection/select', {
      method: 'POST',
      body: JSON.stringify(criteria),
    });
  }

  async matchAccounts(criteria) {
    return this.request('/account-selection/match', {
      method: 'POST',
      body: JSON.stringify(criteria),
    });
  }

  async getAccountWithCredentials(id) {
    return this.request(`/account-selection/${id}/with-credentials`);
  }

  async getLoadBalancedAccount(criteria) {
    return this.request('/account-selection/load-balanced', {
      method: 'POST',
      body: JSON.stringify(criteria),
    });
  }

  // Configurations
  async getConfigs() {
    return this.request('/configs');
  }

  async getConfig(key) {
    return this.request(`/configs/${key}`);
  }

  async setConfig(key, value, description) {
    return this.request(`/configs/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value, description }),
    });
  }
}

export default new ApiService();
