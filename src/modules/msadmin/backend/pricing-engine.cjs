/**
 * Microsoft 365 Pricing Engine
 * Comprehensive pricing calculations for M365, Azure AD, and related services
 * Supports multiple currencies, EA discounts, CSP pricing models
 *
 * @module pricing-engine
 * @version 3.0.0
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

/**
 * M365 Pricing Engine
 * Handles pricing calculations, license optimization, and cost projections
 */
class PricingEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.pricingData = this.loadPricingData();
    this.currencyRates = this.loadCurrencyRates();
    this.defaultCurrency = config.defaultCurrency || 'USD';
    this.defaultBillingCycle = config.defaultBillingCycle || 'monthly';
  }

  /**
   * Load pricing data from configuration file
   */
  loadPricingData() {
    const pricingPath = path.join(__dirname, '../../config/pricing-data.json');
    if (fs.existsSync(pricingPath)) {
      return JSON.parse(fs.readFileSync(pricingPath, 'utf8'));
    }

    return this.getDefaultPricingData();
  }

  /**
   * Get default pricing database
   */
  getDefaultPricingData() {
    return {
      microsoft365: {
        // Business Plans
        'M365_BUSINESS_BASIC': {
          name: 'Microsoft 365 Business Basic',
          skuId: 'CFQ7TTC0LH18',
          monthlyPrice: 6.00,
          annualPrice: 72.00,
          features: ['Web and mobile apps', 'Teams', 'Exchange', 'OneDrive 1TB', 'SharePoint'],
          userMin: 1,
          userMax: 300,
          category: 'business'
        },
        'M365_BUSINESS_STANDARD': {
          name: 'Microsoft 365 Business Standard',
          skuId: 'CFQ7TTC0LHSL',
          monthlyPrice: 12.50,
          annualPrice: 150.00,
          features: ['Desktop apps', 'Web and mobile apps', 'Teams', 'Exchange', 'OneDrive 1TB', 'SharePoint'],
          userMin: 1,
          userMax: 300,
          category: 'business'
        },
        'M365_BUSINESS_PREMIUM': {
          name: 'Microsoft 365 Business Premium',
          skuId: 'CFQ7TTC0LCHC',
          monthlyPrice: 22.00,
          annualPrice: 264.00,
          features: ['Desktop apps', 'Advanced security', 'Device management', 'Teams', 'Exchange', 'OneDrive 1TB'],
          userMin: 1,
          userMax: 300,
          category: 'business'
        },
        'M365_APPS_BUSINESS': {
          name: 'Microsoft 365 Apps for Business',
          skuId: 'CFQ7TTC0LCPG',
          monthlyPrice: 8.25,
          annualPrice: 99.00,
          features: ['Desktop apps only', 'No email or cloud storage'],
          userMin: 1,
          userMax: 300,
          category: 'business'
        },

        // Enterprise Plans
        'OFFICE_365_E1': {
          name: 'Office 365 E1',
          skuId: 'CFQ7TTC0LH0N',
          monthlyPrice: 8.00,
          annualPrice: 96.00,
          features: ['Web and mobile apps', 'Teams', 'Exchange 50GB', 'OneDrive 1TB', 'SharePoint'],
          userMin: 1,
          userMax: null,
          category: 'enterprise'
        },
        'OFFICE_365_E3': {
          name: 'Office 365 E3',
          skuId: 'CFQ7TTC0LCH0',
          monthlyPrice: 23.00,
          annualPrice: 276.00,
          features: ['Desktop apps', 'Web and mobile apps', 'Teams', 'Exchange 100GB', 'OneDrive unlimited', 'SharePoint'],
          userMin: 1,
          userMax: null,
          category: 'enterprise'
        },
        'OFFICE_365_E5': {
          name: 'Office 365 E5',
          skuId: 'CFQ7TTC0LCKR',
          monthlyPrice: 38.00,
          annualPrice: 456.00,
          features: ['All E3 features', 'Advanced security', 'Analytics', 'Voice', 'Audio conferencing'],
          userMin: 1,
          userMax: null,
          category: 'enterprise'
        },
        'M365_E3': {
          name: 'Microsoft 365 E3',
          skuId: 'CFQ7TTC0LCJN',
          monthlyPrice: 36.00,
          annualPrice: 432.00,
          features: ['Office 365 E3', 'Windows 10/11 Enterprise', 'EMS E3', 'Defender'],
          userMin: 1,
          userMax: null,
          category: 'enterprise'
        },
        'M365_E5': {
          name: 'Microsoft 365 E5',
          skuId: 'CFQ7TTC0LCJQ',
          monthlyPrice: 57.00,
          annualPrice: 684.00,
          features: ['Office 365 E5', 'Windows 10/11 Enterprise', 'EMS E5', 'Advanced Defender'],
          userMin: 1,
          userMax: null,
          category: 'enterprise'
        },
        'M365_F1': {
          name: 'Microsoft 365 F1',
          skuId: 'CFQ7TTC0LH0F',
          monthlyPrice: 4.00,
          annualPrice: 48.00,
          features: ['Frontline workers', 'Web apps', 'Teams', 'Basic security'],
          userMin: 1,
          userMax: null,
          category: 'frontline'
        },
        'M365_F3': {
          name: 'Microsoft 365 F3',
          skuId: 'CFQ7TTC0LH1P',
          monthlyPrice: 8.00,
          annualPrice: 96.00,
          features: ['Frontline workers', 'Office mobile apps', 'Teams', 'Exchange 2GB', 'Enhanced security'],
          userMin: 1,
          userMax: null,
          category: 'frontline'
        },

        // Apps Only Plans
        'M365_APPS_ENTERPRISE': {
          name: 'Microsoft 365 Apps for Enterprise',
          skuId: 'CFQ7TTC0LCRL',
          monthlyPrice: 12.00,
          annualPrice: 144.00,
          features: ['Desktop apps', 'Web apps', 'No email or cloud storage'],
          userMin: 1,
          userMax: null,
          category: 'apps'
        }
      },

      exchange: {
        'EXCHANGE_ONLINE_PLAN1': {
          name: 'Exchange Online Plan 1',
          skuId: 'CFQ7TTC0LHSQ',
          monthlyPrice: 4.00,
          annualPrice: 48.00,
          features: ['50GB mailbox', 'Webmail', 'Mobile access'],
          category: 'exchange'
        },
        'EXCHANGE_ONLINE_PLAN2': {
          name: 'Exchange Online Plan 2',
          skuId: 'CFQ7TTC0LHSR',
          monthlyPrice: 8.00,
          annualPrice: 96.00,
          features: ['100GB mailbox', 'Webmail', 'Mobile access', 'Archiving'],
          category: 'exchange'
        },
        'EXCHANGE_ONLINE_KIOSK': {
          name: 'Exchange Online Kiosk',
          skuId: 'CFQ7TTC0LHSN',
          monthlyPrice: 2.00,
          annualPrice: 24.00,
          features: ['2GB mailbox', 'Webmail only'],
          category: 'exchange'
        }
      },

      azureAD: {
        'AZURE_AD_PREMIUM_P1': {
          name: 'Azure Active Directory Premium P1',
          skuId: 'CFQ7TTC0LCRP',
          monthlyPrice: 6.00,
          annualPrice: 72.00,
          features: ['Self-service password reset', 'MFA', 'Conditional Access', 'Group management'],
          category: 'identity'
        },
        'AZURE_AD_PREMIUM_P2': {
          name: 'Azure Active Directory Premium P2',
          skuId: 'CFQ7TTC0LCRQ',
          monthlyPrice: 9.00,
          annualPrice: 108.00,
          features: ['All P1 features', 'Identity Protection', 'Privileged Identity Management', 'Access Reviews'],
          category: 'identity'
        }
      },

      security: {
        'DEFENDER_365_P1': {
          name: 'Microsoft Defender for Office 365 Plan 1',
          skuId: 'CFQ7TTC0LCRX',
          monthlyPrice: 2.00,
          annualPrice: 24.00,
          features: ['Safe Attachments', 'Safe Links', 'Anti-phishing'],
          category: 'security'
        },
        'DEFENDER_365_P2': {
          name: 'Microsoft Defender for Office 365 Plan 2',
          skuId: 'CFQ7TTC0LCRY',
          monthlyPrice: 5.00,
          annualPrice: 60.00,
          features: ['All P1 features', 'Threat Investigation', 'Automated Response', 'Attack Simulation'],
          category: 'security'
        },
        'DEFENDER_ENDPOINT_P1': {
          name: 'Microsoft Defender for Endpoint Plan 1',
          skuId: 'CFQ7TTC0LCS0',
          monthlyPrice: 3.00,
          annualPrice: 36.00,
          features: ['Next-gen antivirus', 'Attack surface reduction', 'Device control'],
          category: 'security'
        },
        'DEFENDER_ENDPOINT_P2': {
          name: 'Microsoft Defender for Endpoint Plan 2',
          skuId: 'CFQ7TTC0LCS1',
          monthlyPrice: 5.75,
          annualPrice: 69.00,
          features: ['All P1 features', 'EDR', 'Automated investigation', 'Threat hunting'],
          category: 'security'
        }
      },

      sharepoint: {
        'SHAREPOINT_PLAN1': {
          name: 'SharePoint Online Plan 1',
          skuId: 'CFQ7TTC0LHSZ',
          monthlyPrice: 5.00,
          annualPrice: 60.00,
          features: ['1TB storage per org + 10GB per user', 'Team sites', 'Mobile access'],
          category: 'collaboration'
        },
        'SHAREPOINT_PLAN2': {
          name: 'SharePoint Online Plan 2',
          skuId: 'CFQ7TTC0LHT0',
          monthlyPrice: 10.00,
          annualPrice: 120.00,
          features: ['Unlimited storage', 'Advanced compliance', 'Data governance'],
          category: 'collaboration'
        }
      },

      powerPlatform: {
        'POWER_BI_PRO': {
          name: 'Power BI Pro',
          skuId: 'CFQ7TTC0LCSF',
          monthlyPrice: 10.00,
          annualPrice: 120.00,
          features: ['Self-service analytics', 'Collaboration', 'Cloud publishing'],
          category: 'analytics'
        },
        'POWER_BI_PREMIUM_PER_USER': {
          name: 'Power BI Premium Per User',
          skuId: 'CFQ7TTC0LCSG',
          monthlyPrice: 20.00,
          annualPrice: 240.00,
          features: ['All Pro features', 'Advanced AI', 'Large datasets', 'Deployment pipelines'],
          category: 'analytics'
        },
        'POWER_APPS_PER_USER': {
          name: 'Power Apps Per User',
          skuId: 'CFQ7TTC0LCSH',
          monthlyPrice: 20.00,
          annualPrice: 240.00,
          features: ['Unlimited apps', 'On-premises data', 'Custom connectors'],
          category: 'development'
        },
        'POWER_AUTOMATE_PER_USER': {
          name: 'Power Automate Per User',
          skuId: 'CFQ7TTC0LCSI',
          monthlyPrice: 15.00,
          annualPrice: 180.00,
          features: ['Unlimited flows', 'RPA', 'AI Builder'],
          category: 'automation'
        }
      },

      teams: {
        'TEAMS_ESSENTIALS': {
          name: 'Microsoft Teams Essentials',
          skuId: 'CFQ7TTC0LCSK',
          monthlyPrice: 4.00,
          annualPrice: 48.00,
          features: ['Unlimited meetings', '10GB cloud storage', 'Phone and web support'],
          category: 'collaboration'
        },
        'TEAMS_PHONE_STANDARD': {
          name: 'Teams Phone Standard',
          skuId: 'CFQ7TTC0LCSL',
          monthlyPrice: 8.00,
          annualPrice: 96.00,
          features: ['Cloud PBX', 'Call routing', 'Voicemail'],
          category: 'voice'
        }
      },

      compliance: {
        'M365_E5_COMPLIANCE': {
          name: 'Microsoft 365 E5 Compliance',
          skuId: 'CFQ7TTC0LCSM',
          monthlyPrice: 12.00,
          annualPrice: 144.00,
          features: ['Advanced compliance', 'Information protection', 'Data governance', 'eDiscovery'],
          category: 'compliance'
        },
        'M365_E5_INFO_PROTECTION': {
          name: 'Microsoft 365 E5 Information Protection',
          skuId: 'CFQ7TTC0LCSN',
          monthlyPrice: 10.00,
          annualPrice: 120.00,
          features: ['Sensitivity labels', 'DLP', 'Encryption', 'Data classification'],
          category: 'compliance'
        }
      }
    };
  }

  /**
   * Load currency exchange rates
   */
  loadCurrencyRates() {
    return {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
      CAD: 1.36,
      AUD: 1.52,
      JPY: 149.50,
      INR: 83.12,
      BRL: 4.96,
      MXN: 17.15,
      CHF: 0.88,
      CNY: 7.24,
      SGD: 1.34,
      NZD: 1.64,
      ZAR: 18.72,
      SEK: 10.52,
      NOK: 10.68,
      DKK: 6.86,
      PLN: 4.02,
      RUB: 92.50,
      TRY: 28.35
    };
  }

  /**
   * Calculate cost for a single SKU
   */
  calculateSkuCost(skuId, userCount, billingCycle = 'monthly', currency = 'USD') {
    try {
      const sku = this.findSku(skuId);

      if (!sku) {
        throw new Error(`SKU not found: ${skuId}`);
      }

      // Validate user count
      if (sku.userMin && userCount < sku.userMin) {
        throw new Error(`Minimum user count for ${sku.name} is ${sku.userMin}`);
      }

      if (sku.userMax && userCount > sku.userMax) {
        throw new Error(`Maximum user count for ${sku.name} is ${sku.userMax}`);
      }

      // Get base price
      const basePrice = billingCycle === 'annual' ? sku.annualPrice : sku.monthlyPrice;

      // Calculate total
      const totalUSD = basePrice * userCount;

      // Convert currency
      const total = this.convertCurrency(totalUSD, 'USD', currency);

      return {
        skuId: skuId,
        name: sku.name,
        userCount: userCount,
        pricePerUser: this.convertCurrency(basePrice, 'USD', currency),
        totalCost: total,
        currency: currency,
        billingCycle: billingCycle,
        category: sku.category,
        features: sku.features
      };
    } catch (error) {
      throw new Error(`Failed to calculate SKU cost: ${error.message}`);
    }
  }

  /**
   * Calculate cost for multiple SKUs
   */
  calculateMultiSkuCost(skuList, billingCycle = 'monthly', currency = 'USD') {
    try {
      const calculations = [];
      let grandTotal = 0;

      for (const item of skuList) {
        const calc = this.calculateSkuCost(item.skuId, item.userCount, billingCycle, currency);
        calculations.push(calc);
        grandTotal += calc.totalCost;
      }

      return {
        items: calculations,
        grandTotal: grandTotal,
        currency: currency,
        billingCycle: billingCycle,
        totalUsers: skuList.reduce((sum, item) => sum + item.userCount, 0)
      };
    } catch (error) {
      throw new Error(`Failed to calculate multi-SKU cost: ${error.message}`);
    }
  }

  /**
   * Apply Enterprise Agreement (EA) discount
   */
  applyEADiscount(cost, userCount, discountTier = null) {
    let discount = 0;

    if (discountTier !== null) {
      discount = discountTier;
    } else {
      // Auto-calculate discount based on user count
      if (userCount >= 5000) {
        discount = 0.25; // 25% discount
      } else if (userCount >= 2500) {
        discount = 0.20; // 20% discount
      } else if (userCount >= 1000) {
        discount = 0.15; // 15% discount
      } else if (userCount >= 500) {
        discount = 0.10; // 10% discount
      } else if (userCount >= 250) {
        discount = 0.05; // 5% discount
      }
    }

    const discountAmount = cost * discount;
    const finalCost = cost - discountAmount;

    return {
      originalCost: cost,
      discountPercentage: discount * 100,
      discountAmount: discountAmount,
      finalCost: finalCost
    };
  }

  /**
   * Apply CSP (Cloud Solution Provider) pricing
   */
  applyCSPPricing(cost, margin = 0.20) {
    // CSP partners typically add 15-25% margin
    const partnerMargin = cost * margin;
    const cspPrice = cost + partnerMargin;

    return {
      baseCost: cost,
      marginPercentage: margin * 100,
      marginAmount: partnerMargin,
      cspPrice: cspPrice
    };
  }

  /**
   * Calculate annual savings from annual billing
   */
  calculateAnnualSavings(monthlyTotal, annualTotal) {
    const annualizedMonthly = monthlyTotal * 12;
    const savings = annualizedMonthly - annualTotal;
    const savingsPercentage = (savings / annualizedMonthly) * 100;

    return {
      monthlyTotal: monthlyTotal,
      annualizedMonthly: annualizedMonthly,
      annualTotal: annualTotal,
      savings: savings,
      savingsPercentage: savingsPercentage
    };
  }

  /**
   * Optimize license allocation
   */
  optimizeLicenses(requirements) {
    const recommendations = [];

    // Analyze requirements
    for (const req of requirements) {
      const userType = req.userType;
      const features = req.requiredFeatures || [];
      const userCount = req.userCount;

      let recommendation = null;

      // Business users
      if (userCount <= 300) {
        if (features.includes('desktop_apps') && features.includes('advanced_security')) {
          recommendation = 'M365_BUSINESS_PREMIUM';
        } else if (features.includes('desktop_apps')) {
          recommendation = 'M365_BUSINESS_STANDARD';
        } else {
          recommendation = 'M365_BUSINESS_BASIC';
        }
      }
      // Enterprise users
      else {
        if (features.includes('voice') || features.includes('advanced_analytics')) {
          recommendation = 'M365_E5';
        } else if (features.includes('desktop_apps') && features.includes('advanced_security')) {
          recommendation = 'M365_E3';
        } else if (features.includes('desktop_apps')) {
          recommendation = 'OFFICE_365_E3';
        } else {
          recommendation = 'OFFICE_365_E1';
        }
      }

      // Frontline workers
      if (userType === 'frontline') {
        recommendation = 'M365_F3';
      }

      recommendations.push({
        userType: userType,
        userCount: userCount,
        requiredFeatures: features,
        recommendedSku: recommendation,
        reason: this.getRecommendationReason(recommendation, features)
      });
    }

    return recommendations;
  }

  /**
   * Get recommendation reason
   */
  getRecommendationReason(skuId, features) {
    const reasons = [];

    if (features.includes('desktop_apps')) {
      reasons.push('Requires desktop Office applications');
    }
    if (features.includes('advanced_security')) {
      reasons.push('Needs advanced security features');
    }
    if (features.includes('voice')) {
      reasons.push('Requires Teams Phone capabilities');
    }
    if (features.includes('advanced_analytics')) {
      reasons.push('Needs advanced analytics tools');
    }

    return reasons.join('; ');
  }

  /**
   * Calculate cost projection
   */
  calculateProjection(currentCost, growthRate, months) {
    const projections = [];

    for (let i = 1; i <= months; i++) {
      const monthlyGrowth = Math.pow(1 + growthRate / 12, i);
      const projectedCost = currentCost * monthlyGrowth;

      projections.push({
        month: i,
        cost: projectedCost,
        growth: ((projectedCost - currentCost) / currentCost) * 100
      });
    }

    return {
      currentCost: currentCost,
      growthRate: growthRate * 100,
      months: months,
      projections: projections,
      finalCost: projections[projections.length - 1].cost
    };
  }

  /**
   * Compare license options
   */
  compareLicenses(skuIds, userCount, billingCycle = 'monthly', currency = 'USD') {
    const comparisons = [];

    for (const skuId of skuIds) {
      try {
        const cost = this.calculateSkuCost(skuId, userCount, billingCycle, currency);
        comparisons.push(cost);
      } catch (error) {
        console.error(`Error calculating ${skuId}:`, error.message);
      }
    }

    // Sort by total cost
    comparisons.sort((a, b) => a.totalCost - b.totalCost);

    return {
      userCount: userCount,
      billingCycle: billingCycle,
      currency: currency,
      options: comparisons,
      cheapest: comparisons[0],
      mostExpensive: comparisons[comparisons.length - 1]
    };
  }

  /**
   * Calculate bundle savings
   */
  calculateBundleSavings(individualSkus, bundleSku, userCount, billingCycle = 'monthly') {
    try {
      // Calculate individual costs
      let individualTotal = 0;
      for (const skuId of individualSkus) {
        const cost = this.calculateSkuCost(skuId, userCount, billingCycle);
        individualTotal += cost.totalCost;
      }

      // Calculate bundle cost
      const bundleCost = this.calculateSkuCost(bundleSku, userCount, billingCycle);

      const savings = individualTotal - bundleCost.totalCost;
      const savingsPercentage = (savings / individualTotal) * 100;

      return {
        individualSkus: individualSkus,
        bundleSku: bundleSku,
        individualTotal: individualTotal,
        bundleTotal: bundleCost.totalCost,
        savings: savings,
        savingsPercentage: savingsPercentage,
        recommendation: savings > 0 ? 'Use bundle' : 'Use individual licenses'
      };
    } catch (error) {
      throw new Error(`Failed to calculate bundle savings: ${error.message}`);
    }
  }

  /**
   * Generate pricing report
   */
  generatePricingReport(skuList, options = {}) {
    const billingCycle = options.billingCycle || 'monthly';
    const currency = options.currency || 'USD';
    const includeEA = options.includeEA || false;
    const eaDiscount = options.eaDiscount || null;

    // Calculate base costs
    const baseCosts = this.calculateMultiSkuCost(skuList, billingCycle, currency);

    // Apply EA discount if requested
    let finalCosts = baseCosts;
    if (includeEA) {
      const eaResult = this.applyEADiscount(
        baseCosts.grandTotal,
        baseCosts.totalUsers,
        eaDiscount
      );
      finalCosts = {
        ...baseCosts,
        eaDiscount: eaResult
      };
    }

    // Calculate annual savings if monthly billing
    let annualSavings = null;
    if (billingCycle === 'monthly') {
      const annualCosts = this.calculateMultiSkuCost(skuList, 'annual', currency);
      annualSavings = this.calculateAnnualSavings(
        baseCosts.grandTotal,
        annualCosts.grandTotal
      );
    }

    return {
      summary: {
        totalUsers: baseCosts.totalUsers,
        totalSkus: skuList.length,
        billingCycle: billingCycle,
        currency: currency
      },
      costs: finalCosts,
      annualSavings: annualSavings,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Convert currency
   */
  convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const fromRate = this.currencyRates[fromCurrency];
    const toRate = this.currencyRates[toCurrency];

    if (!fromRate || !toRate) {
      throw new Error(`Currency conversion not available for ${fromCurrency} to ${toCurrency}`);
    }

    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    const convertedAmount = usdAmount * toRate;

    return Math.round(convertedAmount * 100) / 100;
  }

  /**
   * Find SKU in pricing database
   */
  findSku(skuId) {
    for (const category of Object.values(this.pricingData)) {
      if (category[skuId]) {
        return category[skuId];
      }
    }
    return null;
  }

  /**
   * Get all SKUs by category
   */
  getSkusByCategory(category) {
    const skus = [];

    for (const [categoryName, categorySkus] of Object.entries(this.pricingData)) {
      for (const [skuId, skuData] of Object.entries(categorySkus)) {
        if (skuData.category === category) {
          skus.push({
            id: skuId,
            ...skuData
          });
        }
      }
    }

    return skus;
  }

  /**
   * Get all available SKUs
   */
  getAllSkus() {
    const allSkus = [];

    for (const [categoryName, categorySkus] of Object.entries(this.pricingData)) {
      for (const [skuId, skuData] of Object.entries(categorySkus)) {
        allSkus.push({
          id: skuId,
          category: categoryName,
          ...skuData
        });
      }
    }

    return allSkus;
  }

  /**
   * Search SKUs by name or features
   */
  searchSkus(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const [categoryName, categorySkus] of Object.entries(this.pricingData)) {
      for (const [skuId, skuData] of Object.entries(categorySkus)) {
        const nameMatch = skuData.name.toLowerCase().includes(lowerQuery);
        const featureMatch = skuData.features.some(f =>
          f.toLowerCase().includes(lowerQuery)
        );

        if (nameMatch || featureMatch) {
          results.push({
            id: skuId,
            category: categoryName,
            ...skuData
          });
        }
      }
    }

    return results;
  }
}

module.exports = PricingEngine;
