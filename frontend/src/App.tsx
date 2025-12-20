import React from 'react';
import { useState } from 'react';
import { ScriptsPage } from './pages/ScriptsPage';
import { JobsPage } from './pages/JobsPage';
import './styles/App.css';

export function App() {
  const [currentPage, setCurrentPage] = useState<'scripts' | 'jobs'>('scripts');

  return (
    <div className="app">
      <nav className="navbar">
        <h1>GAdmin Toolkit</h1>
        <ul>
          <li>
            <button
              onClick={() => setCurrentPage('scripts')}
              className={currentPage === 'scripts' ? 'active' : ''}
            >
              Scripts
            </button>
          </li>
          <li>
            <button
              onClick={() => setCurrentPage('jobs')}
              className={currentPage === 'jobs' ? 'active' : ''}
            >
              Jobs
            </button>
          </li>
        </ul>
      </nav>

      <main className="content">
        {currentPage === 'scripts' && <ScriptsPage />}
        {currentPage === 'jobs' && <JobsPage />}
      </main>
    </div>
  );
}

export default App;

