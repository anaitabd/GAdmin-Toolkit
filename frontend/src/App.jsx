import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Credentials from './pages/Credentials';
import GSuiteAccounts from './pages/GSuiteAccounts';
import Settings from './pages/Settings';
import './App.css';

function Navigation() {
  const location = useLocation();

  return (
    <nav className="nav">
      <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
        Dashboard
      </Link>
      <Link to="/credentials" className={location.pathname === '/credentials' ? 'active' : ''}>
        Credentials
      </Link>
      <Link to="/gsuite-accounts" className={location.pathname === '/gsuite-accounts' ? 'active' : ''}>
        G Suite Accounts
      </Link>
      <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>
        Settings
      </Link>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <header className="header">
          <div className="container">
            <h1>GAdmin Toolkit</h1>
            <p>Manage Google Workspace accounts with multiple credentials and geographical distribution</p>
            <Navigation />
          </div>
        </header>
        <main className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/credentials" element={<Credentials />} />
            <Route path="/gsuite-accounts" element={<GSuiteAccounts />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
