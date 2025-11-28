/**
 * Pricing Dashboard Component
 * Interactive pricing calculator with charts and cost analysis
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  CalculatorIcon,
  ArrowTrendingUpIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface SkuSelection {
  skuId: string;
  userCount: number;
}

interface CostData {
  skuId: string;
  name: string;
  userCount: number;
  pricePerUser: number;
  totalCost: number;
  category: string;
  features: string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AVAILABLE_SKUS = [
  { id: 'M365_BUSINESS_BASIC', name: 'M365 Business Basic', category: 'business', monthlyPrice: 6.00 },
  { id: 'M365_BUSINESS_STANDARD', name: 'M365 Business Standard', category: 'business', monthlyPrice: 12.50 },
  { id: 'M365_BUSINESS_PREMIUM', name: 'M365 Business Premium', category: 'business', monthlyPrice: 22.00 },
  { id: 'OFFICE_365_E1', name: 'Office 365 E1', category: 'enterprise', monthlyPrice: 8.00 },
  { id: 'OFFICE_365_E3', name: 'Office 365 E3', category: 'enterprise', monthlyPrice: 23.00 },
  { id: 'OFFICE_365_E5', name: 'Office 365 E5', category: 'enterprise', monthlyPrice: 38.00 },
  { id: 'M365_E3', name: 'Microsoft 365 E3', category: 'enterprise', monthlyPrice: 36.00 },
  { id: 'M365_E5', name: 'Microsoft 365 E5', category: 'enterprise', monthlyPrice: 57.00 },
  { id: 'M365_F3', name: 'Microsoft 365 F3', category: 'frontline', monthlyPrice: 8.00 },
  { id: 'AZURE_AD_PREMIUM_P1', name: 'Azure AD Premium P1', category: 'identity', monthlyPrice: 6.00 },
  { id: 'AZURE_AD_PREMIUM_P2', name: 'Azure AD Premium P2', category: 'identity', monthlyPrice: 9.00 },
  { id: 'POWER_BI_PRO', name: 'Power BI Pro', category: 'analytics', monthlyPrice: 10.00 }
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', rate: 1.0 },
  { code: 'EUR', symbol: '€', rate: 0.92 },
  { code: 'GBP', symbol: '£', rate: 0.79 },
  { code: 'CAD', symbol: 'C$', rate: 1.36 },
  { code: 'AUD', symbol: 'A$', rate: 1.52 }
];

export const PricingDashboard: React.FC = () => {
  const [selectedSkus, setSelectedSkus] = useState<SkuSelection[]>([]);
  const [currency, setCurrency] = useState('USD');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [eaDiscount, setEaDiscount] = useState(0);
  const [growthRate, setGrowthRate] = useState(0);
  const [projectionMonths, setProjectionMonths] = useState(12);
  const [activeTab, setActiveTab] = useState<'calculator' | 'comparison' | 'projection'>('calculator');

  const currencyInfo = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  // Calculate costs
  const calculations = useMemo(() => {
    return selectedSkus.map(selection => {
      const sku = AVAILABLE_SKUS.find(s => s.id === selection.skuId);
      if (!sku) return null;

      const basePrice = billingCycle === 'annual' ? sku.monthlyPrice * 12 * 0.9 : sku.monthlyPrice;
      const convertedPrice = basePrice * currencyInfo.rate;
      const totalCost = convertedPrice * selection.userCount;

      return {
        skuId: sku.id,
        name: sku.name,
        userCount: selection.userCount,
        pricePerUser: convertedPrice,
        totalCost: totalCost,
        category: sku.category
      };
    }).filter(Boolean) as CostData[];
  }, [selectedSkus, currency, billingCycle, currencyInfo]);

  const totalCost = calculations.reduce((sum, calc) => sum + calc.totalCost, 0);
  const totalUsers = calculations.reduce((sum, calc) => sum + calc.userCount, 0);

  // Apply EA discount
  const discountedTotal = totalCost * (1 - eaDiscount / 100);
  const discountAmount = totalCost - discountedTotal;

  // Calculate projections
  const projections = useMemo(() => {
    const data = [];
    for (let i = 0; i <= projectionMonths; i++) {
      const growthMultiplier = Math.pow(1 + growthRate / 100 / 12, i);
      data.push({
        month: i,
        cost: totalCost * growthMultiplier,
        discountedCost: discountedTotal * growthMultiplier
      });
    }
    return data;
  }, [totalCost, discountedTotal, growthRate, projectionMonths]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const breakdown = new Map<string, number>();
    calculations.forEach(calc => {
      const current = breakdown.get(calc.category) || 0;
      breakdown.set(calc.category, current + calc.totalCost);
    });

    return Array.from(breakdown.entries()).map(([category, value]) => ({
      name: category,
      value: value
    }));
  }, [calculations]);

  const addSku = () => {
    setSelectedSkus([...selectedSkus, { skuId: AVAILABLE_SKUS[0].id, userCount: 1 }]);
  };

  const removeSku = (index: number) => {
    setSelectedSkus(selectedSkus.filter((_, i) => i !== index));
  };

  const updateSku = (index: number, updates: Partial<SkuSelection>) => {
    const updated = [...selectedSkus];
    updated[index] = { ...updated[index], ...updates };
    setSelectedSkus(updated);
  };

  const formatCurrency = (amount: number) => {
    return `${currencyInfo.symbol}${amount.toFixed(2)}`;
  };

  return (
    <div className="pricing-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <CurrencyDollarIcon className="title-icon" />
            Microsoft 365 Pricing Calculator
          </h1>
          <p className="dashboard-subtitle">
            Calculate costs, compare plans, and project future expenses
          </p>
        </div>

        <div className="header-actions">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="currency-select"
          >
            {CURRENCIES.map(curr => (
              <option key={curr.code} value={curr.code}>
                {curr.symbol} {curr.code}
              </option>
            ))}
          </select>

          <div className="billing-toggle">
            <button
              className={`toggle-button ${billingCycle === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              className={`toggle-button ${billingCycle === 'annual' ? 'active' : ''}`}
              onClick={() => setBillingCycle('annual')}
            >
              Annual (Save 10%)
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          <CalculatorIcon className="tab-icon" />
          Calculator
        </button>
        <button
          className={`tab-button ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          <ChartBarIcon className="tab-icon" />
          Comparison
        </button>
        <button
          className={`tab-button ${activeTab === 'projection' ? 'active' : ''}`}
          onClick={() => setActiveTab('projection')}
        >
          <ArrowTrendingUpIcon className="tab-icon" />
          Projection
        </button>
      </div>

      <div className="dashboard-content">
        <AnimatePresence mode="wait">
          {activeTab === 'calculator' && (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="tab-content"
            >
              <div className="calculator-grid">
                <div className="calculator-section">
                  <h2 className="section-title">License Selection</h2>

                  <div className="sku-list">
                    {selectedSkus.map((selection, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="sku-item"
                      >
                        <select
                          value={selection.skuId}
                          onChange={(e) => updateSku(index, { skuId: e.target.value })}
                          className="sku-select"
                        >
                          {AVAILABLE_SKUS.map(sku => (
                            <option key={sku.id} value={sku.id}>
                              {sku.name} - {formatCurrency(sku.monthlyPrice * currencyInfo.rate)}/user
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          value={selection.userCount}
                          onChange={(e) => updateSku(index, { userCount: parseInt(e.target.value) || 0 })}
                          min="1"
                          className="user-count-input"
                          placeholder="Users"
                        />

                        <button
                          onClick={() => removeSku(index)}
                          className="remove-button"
                        >
                          Remove
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  <button onClick={addSku} className="add-button">
                    + Add License
                  </button>

                  <div className="discount-section">
                    <label className="discount-label">
                      EA Discount (%):
                      <input
                        type="number"
                        value={eaDiscount}
                        onChange={(e) => setEaDiscount(parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        className="discount-input"
                      />
                    </label>
                  </div>
                </div>

                <div className="summary-section">
                  <h2 className="section-title">Cost Summary</h2>

                  <div className="summary-cards">
                    <div className="summary-card">
                      <div className="card-label">Total Users</div>
                      <div className="card-value">{totalUsers.toLocaleString()}</div>
                    </div>

                    <div className="summary-card">
                      <div className="card-label">Subtotal ({billingCycle})</div>
                      <div className="card-value">{formatCurrency(totalCost)}</div>
                    </div>

                    {eaDiscount > 0 && (
                      <div className="summary-card highlight">
                        <div className="card-label">EA Discount ({eaDiscount}%)</div>
                        <div className="card-value">-{formatCurrency(discountAmount)}</div>
                      </div>
                    )}

                    <div className="summary-card primary">
                      <div className="card-label">Total Cost</div>
                      <div className="card-value large">{formatCurrency(discountedTotal)}</div>
                    </div>
                  </div>

                  {calculations.length > 0 && (
                    <div className="breakdown-table">
                      <h3 className="breakdown-title">License Breakdown</h3>
                      <table>
                        <thead>
                          <tr>
                            <th>License</th>
                            <th>Users</th>
                            <th>Per User</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {calculations.map((calc, index) => (
                            <tr key={index}>
                              <td>{calc.name}</td>
                              <td>{calc.userCount}</td>
                              <td>{formatCurrency(calc.pricePerUser)}</td>
                              <td>{formatCurrency(calc.totalCost)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'comparison' && (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="tab-content"
            >
              <div className="comparison-grid">
                <div className="chart-container">
                  <h3>Cost by Category</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-container">
                  <h3>License Costs Comparison</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={calculations}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="totalCost" fill="#0088FE" name="Total Cost" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'projection' && (
            <motion.div
              key="projection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="tab-content"
            >
              <div className="projection-controls">
                <label>
                  Monthly Growth Rate (%):
                  <input
                    type="number"
                    value={growthRate}
                    onChange={(e) => setGrowthRate(parseFloat(e.target.value) || 0)}
                    step="0.1"
                    className="projection-input"
                  />
                </label>

                <label>
                  Projection Period (months):
                  <input
                    type="number"
                    value={projectionMonths}
                    onChange={(e) => setProjectionMonths(parseInt(e.target.value) || 12)}
                    min="1"
                    max="60"
                    className="projection-input"
                  />
                </label>
              </div>

              <div className="chart-container large">
                <h3>Cost Projection</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={projections}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" label={{ value: 'Months', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Cost', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="cost" stroke="#0088FE" name="Base Cost" strokeWidth={2} />
                    <Line type="monotone" dataKey="discountedCost" stroke="#00C49F" name="With EA Discount" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="projection-summary">
                <div className="projection-card">
                  <div className="card-label">Current Cost</div>
                  <div className="card-value">{formatCurrency(discountedTotal)}</div>
                </div>
                <div className="projection-card">
                  <div className="card-label">Projected Cost ({projectionMonths} months)</div>
                  <div className="card-value">
                    {formatCurrency(projections[projections.length - 1]?.discountedCost || 0)}
                  </div>
                </div>
                <div className="projection-card">
                  <div className="card-label">Total Growth</div>
                  <div className="card-value">
                    {((projections[projections.length - 1]?.discountedCost || 0) / discountedTotal * 100 - 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .pricing-dashboard {
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .dashboard-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 2rem;
          font-weight: bold;
          color: #1a202c;
          margin: 0;
        }

        .title-icon {
          width: 2.5rem;
          height: 2.5rem;
          color: #667eea;
        }

        .dashboard-subtitle {
          color: #718096;
          margin: 0.5rem 0 0 0;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .currency-select {
          padding: 0.5rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 1rem;
          cursor: pointer;
        }

        .billing-toggle {
          display: flex;
          background: #f7fafc;
          border-radius: 0.5rem;
          padding: 0.25rem;
        }

        .toggle-button {
          padding: 0.5rem 1rem;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 0.375rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .toggle-button.active {
          background: #667eea;
          color: white;
        }

        .dashboard-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          background: white;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .tab-button.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .tab-icon {
          width: 1.5rem;
          height: 1.5rem;
        }

        .dashboard-content {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .calculator-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 1.5rem;
          color: #1a202c;
        }

        .sku-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .sku-item {
          display: grid;
          grid-template-columns: 2fr 1fr auto;
          gap: 0.5rem;
          align-items: center;
        }

        .sku-select, .user-count-input {
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 1rem;
        }

        .remove-button, .add-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .remove-button {
          background: #fed7d7;
          color: #c53030;
        }

        .add-button {
          background: #667eea;
          color: white;
          width: 100%;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .summary-card {
          padding: 1.5rem;
          background: #f7fafc;
          border-radius: 0.5rem;
          border-left: 4px solid #667eea;
        }

        .summary-card.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .card-label {
          font-size: 0.875rem;
          opacity: 0.8;
          margin-bottom: 0.5rem;
        }

        .card-value {
          font-size: 1.5rem;
          font-weight: bold;
        }

        .card-value.large {
          font-size: 2rem;
        }

        .breakdown-table {
          margin-top: 2rem;
        }

        .breakdown-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .breakdown-table th,
        .breakdown-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        .breakdown-table th {
          background: #f7fafc;
          font-weight: 600;
        }

        .chart-container {
          background: #f7fafc;
          padding: 1.5rem;
          border-radius: 0.5rem;
        }

        .chart-container h3 {
          margin-bottom: 1rem;
          color: #1a202c;
        }

        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .projection-controls {
          display: flex;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .projection-controls label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .projection-input {
          padding: 0.5rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.5rem;
        }

        .projection-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-top: 2rem;
        }

        .projection-card {
          padding: 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 0.5rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default PricingDashboard;
