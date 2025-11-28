/**
 * Ninja Toolkit Prompt 7 - O365 / MS Admin Module
 * Main Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  CurrencyDollarIcon,
  PlayIcon,
  Cog6ToothIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

import PricingDashboard from './components/PricingDashboard';
import ScriptRunner from './components/ScriptRunner';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-container">
        <nav className="app-nav">
          <div className="nav-header">
            <h1 className="nav-title">Ninja Toolkit</h1>
            <p className="nav-subtitle">O365 / MS Admin Module</p>
          </div>

          <div className="nav-links">
            <Link to="/" className="nav-link">
              <HomeIcon className="nav-icon" />
              <span>Dashboard</span>
            </Link>
            <Link to="/pricing" className="nav-link">
              <CurrencyDollarIcon className="nav-icon" />
              <span>Pricing Calculator</span>
            </Link>
            <Link to="/scripts" className="nav-link">
              <PlayIcon className="nav-icon" />
              <span>Script Runner</span>
            </Link>
            <Link to="/settings" className="nav-link">
              <Cog6ToothIcon className="nav-icon" />
              <span>Settings</span>
            </Link>
          </div>
        </nav>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/pricing" element={<PricingDashboard />} />
            <Route path="/scripts" element={<ScriptRunner />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .app-container {
          display: flex;
          min-height: 100vh;
        }

        .app-nav {
          width: 250px;
          background: linear-gradient(180deg, #1a202c 0%, #2d3748 100%);
          color: white;
          padding: 2rem 1rem;
        }

        .nav-header {
          margin-bottom: 2rem;
        }

        .nav-title {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .nav-subtitle {
          font-size: 0.875rem;
          color: #a0aec0;
        }

        .nav-links {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          color: #e2e8f0;
          text-decoration: none;
          transition: all 0.2s;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .nav-icon {
          width: 1.5rem;
          height: 1.5rem;
        }

        .app-main {
          flex: 1;
          overflow-y: auto;
        }
      `}</style>
    </Router>
  );
};

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <div className="hero-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="hero-title">Microsoft 365 Administration Suite</h1>
          <p className="hero-description">
            Comprehensive tools for managing Microsoft 365, pricing calculations, and PowerShell automation
          </p>
        </motion.div>
      </div>

      <div className="features-grid">
        <motion.div
          className="feature-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <CurrencyDollarIcon className="feature-icon" />
          <h3>Pricing Calculator</h3>
          <p>Calculate costs for Microsoft 365 licenses with support for multiple currencies and EA discounts</p>
          <Link to="/pricing" className="feature-link">Explore Pricing →</Link>
        </motion.div>

        <motion.div
          className="feature-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <PlayIcon className="feature-icon" />
          <h3>Script Runner</h3>
          <p>Execute PowerShell scripts for user management, licensing, and Exchange administration</p>
          <Link to="/scripts" className="feature-link">Run Scripts →</Link>
        </motion.div>

        <motion.div
          className="feature-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <ChartBarIcon className="feature-icon" />
          <h3>Cost Analysis</h3>
          <p>Project future costs with growth rate calculations and optimize license allocation</p>
          <Link to="/pricing" className="feature-link">Analyze Costs →</Link>
        </motion.div>

        <motion.div
          className="feature-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Cog6ToothIcon className="feature-icon" />
          <h3>Automation</h3>
          <p>Automate repetitive tasks with pre-built script templates and custom workflows</p>
          <Link to="/scripts" className="feature-link">Automate Now →</Link>
        </motion.div>
      </div>

      <style jsx>{`
        .home-page {
          padding: 3rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }

        .hero-section {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 1rem;
          margin-bottom: 3rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .hero-title {
          font-size: 3rem;
          font-weight: bold;
          color: #1a202c;
          margin-bottom: 1rem;
        }

        .hero-description {
          font-size: 1.25rem;
          color: #718096;
          max-width: 600px;
          margin: 0 auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .feature-card {
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }

        .feature-card:hover {
          transform: translateY(-5px);
        }

        .feature-icon {
          width: 3rem;
          height: 3rem;
          color: #667eea;
          margin-bottom: 1rem;
        }

        .feature-card h3 {
          font-size: 1.5rem;
          color: #1a202c;
          margin-bottom: 0.5rem;
        }

        .feature-card p {
          color: #718096;
          margin-bottom: 1rem;
        }

        .feature-link {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }

        .feature-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-description">Configure your Microsoft 365 administration preferences</p>

        <div className="settings-sections">
          <div className="settings-section">
            <h2>Authentication</h2>
            <div className="settings-field">
              <label>Tenant ID</label>
              <input type="text" placeholder="Enter your tenant ID" />
            </div>
            <div className="settings-field">
              <label>Client ID</label>
              <input type="text" placeholder="Enter your client ID" />
            </div>
          </div>

          <div className="settings-section">
            <h2>Preferences</h2>
            <div className="settings-field">
              <label>Default Currency</label>
              <select>
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
              </select>
            </div>
            <div className="settings-field">
              <label>PowerShell Path</label>
              <input type="text" placeholder="/usr/bin/pwsh" />
            </div>
          </div>
        </div>

        <button className="save-button">Save Settings</button>
      </div>

      <style jsx>{`
        .settings-page {
          padding: 3rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }

        .settings-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .settings-title {
          font-size: 2rem;
          font-weight: bold;
          color: #1a202c;
          margin-bottom: 0.5rem;
        }

        .settings-description {
          color: #718096;
          margin-bottom: 2rem;
        }

        .settings-sections {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .settings-section h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 1rem;
        }

        .settings-field {
          margin-bottom: 1rem;
        }

        .settings-field label {
          display: block;
          font-weight: 500;
          color: #1a202c;
          margin-bottom: 0.5rem;
        }

        .settings-field input,
        .settings-field select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 1rem;
        }

        .save-button {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
