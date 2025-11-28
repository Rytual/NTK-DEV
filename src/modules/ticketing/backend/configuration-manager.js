/**
 * ConnectWise Configuration Manager
 * Comprehensive configuration (asset) management
 *
 * Features:
 * - Configuration (asset) CRUD operations
 * - Configuration types
 * - Configuration statuses
 * - Serial number tracking
 * - Warranty management
 * - Configuration hierarchy
 * - Company association
 * - Custom field support
 * - Asset tagging
 * - Inventory management
 */

const { EventEmitter } = require('events');

/**
 * Configuration Manager Class
 */
class ConfigurationManager extends EventEmitter {
  constructor(connectWiseClient) {
    super();

    if (!connectWiseClient) {
      throw new Error('ConnectWise client is required');
    }

    this.client = connectWiseClient;

    // Cache for configuration types, statuses
    this.cache = {
      configurationTypes: null,
      configurationStatuses: null,
      manufacturers: null,
      lastUpdate: null
    };

    // Active configurations
    this.activeConfigurations = new Map();

    // Statistics
    this.stats = {
      configurationsCreated: 0,
      configurationsUpdated: 0,
      configurationsDeleted: 0,
      warrantyChecks: 0,
      inventoryAdjustments: 0
    };

    this._log('Configuration Manager initialized');
  }

  /**
   * Log debug information
   */
  _log(message, data = null) {
    console.log(`[ConfigurationManager] ${message}`, data || '');
    this.emit('log', { message, data, timestamp: Date.now() });
  }

  /**
   * Initialize cache - fetch configuration types, statuses, etc.
   */
  async initialize() {
    try {
      this._log('Initializing configuration manager...');

      // Fetch configuration types
      await this.refreshConfigurationTypes();

      // Fetch configuration statuses
      await this.refreshConfigurationStatuses();

      // Fetch manufacturers
      await this.refreshManufacturers();

      this.cache.lastUpdate = Date.now();

      this._log('Configuration manager initialized successfully');
      this.emit('initialized', { cache: this.cache });

      return true;
    } catch (error) {
      this._log('Failed to initialize configuration manager', error);
      this.emit('initializationError', error);
      throw error;
    }
  }

  /**
   * Refresh configuration types cache
   */
  async refreshConfigurationTypes() {
    try {
      const types = await this.client.get('/company/configurations/types');
      this.cache.configurationTypes = types;

      this._log(`Refreshed ${types.length} configuration types`);
      return types;
    } catch (error) {
      this._log('Failed to refresh configuration types', error);
      throw error;
    }
  }

  /**
   * Refresh configuration statuses cache
   */
  async refreshConfigurationStatuses() {
    try {
      const statuses = await this.client.get('/company/configurations/statuses');
      this.cache.configurationStatuses = statuses;

      this._log(`Refreshed ${statuses.length} configuration statuses`);
      return statuses;
    } catch (error) {
      this._log('Failed to refresh configuration statuses', error);
      throw error;
    }
  }

  /**
   * Refresh manufacturers cache
   */
  async refreshManufacturers() {
    try {
      const manufacturers = await this.client.get('/procurement/manufacturers');
      this.cache.manufacturers = manufacturers;

      this._log(`Refreshed ${manufacturers.length} manufacturers`);
      return manufacturers;
    } catch (error) {
      this._log('Failed to refresh manufacturers', error);
      throw error;
    }
  }

  /**
   * Get configuration types
   */
  async getConfigurationTypes(forceRefresh = false) {
    if (forceRefresh || !this.cache.configurationTypes) {
      return this.refreshConfigurationTypes();
    }
    return this.cache.configurationTypes;
  }

  /**
   * Get configuration statuses
   */
  async getConfigurationStatuses(forceRefresh = false) {
    if (forceRefresh || !this.cache.configurationStatuses) {
      return this.refreshConfigurationStatuses();
    }
    return this.cache.configurationStatuses;
  }

  /**
   * Get manufacturers
   */
  async getManufacturers(forceRefresh = false) {
    if (forceRefresh || !this.cache.manufacturers) {
      return this.refreshManufacturers();
    }
    return this.cache.manufacturers;
  }

  /**
   * Create a new configuration
   */
  async createConfiguration(configData) {
    try {
      this._log('Creating configuration', configData);

      // Validate required fields
      if (!configData.name) {
        throw new Error('Configuration name is required');
      }
      if (!configData.company || !configData.company.id) {
        throw new Error('Company ID is required');
      }
      if (!configData.type || !configData.type.id) {
        throw new Error('Configuration type is required');
      }

      const configuration = await this.client.createConfiguration(configData);

      this.stats.configurationsCreated++;
      this.activeConfigurations.set(configuration.id, configuration);

      this._log(`Configuration created: ${configuration.name} (ID: ${configuration.id})`, configuration);
      this.emit('configurationCreated', { configuration });

      return configuration;
    } catch (error) {
      this._log('Failed to create configuration', error);
      this.emit('configurationCreationError', { configData, error });
      throw error;
    }
  }

  /**
   * Get configuration by ID
   */
  async getConfiguration(configurationId) {
    try {
      const configuration = await this.client.getConfiguration(configurationId);
      this.activeConfigurations.set(configurationId, configuration);

      this.emit('configurationFetched', { configuration });
      return configuration;
    } catch (error) {
      this._log(`Failed to get configuration ${configurationId}`, error);
      throw error;
    }
  }

  /**
   * Update configuration
   */
  async updateConfiguration(configurationId, updates) {
    try {
      this._log(`Updating configuration ${configurationId}`, updates);

      const configuration = await this.client.updateConfiguration(configurationId, updates);

      this.stats.configurationsUpdated++;
      this.activeConfigurations.set(configurationId, configuration);

      this._log(`Configuration updated: ${configuration.name} (ID: ${configuration.id})`);
      this.emit('configurationUpdated', { configuration, updates });

      return configuration;
    } catch (error) {
      this._log(`Failed to update configuration ${configurationId}`, error);
      this.emit('configurationUpdateError', { configurationId, updates, error });
      throw error;
    }
  }

  /**
   * Delete configuration
   */
  async deleteConfiguration(configurationId) {
    try {
      await this.client.deleteConfiguration(configurationId);

      this.stats.configurationsDeleted++;
      this.activeConfigurations.delete(configurationId);

      this._log(`Configuration deleted: ${configurationId}`);
      this.emit('configurationDeleted', { configurationId });

      return true;
    } catch (error) {
      this._log(`Failed to delete configuration ${configurationId}`, error);
      throw error;
    }
  }

  /**
   * Search configurations
   */
  async searchConfigurations(searchParams) {
    try {
      const {
        conditions,
        orderBy = 'name',
        page = 1,
        pageSize = 25
      } = searchParams;

      this._log('Searching configurations', searchParams);

      const configurations = await this.client.getConfigurations(conditions, orderBy, page, pageSize);

      this.emit('configurationsSearched', { searchParams, count: configurations.length });

      return configurations;
    } catch (error) {
      this._log('Failed to search configurations', error);
      throw error;
    }
  }

  /**
   * Search configurations by name
   */
  async searchConfigurationsByName(name, page = 1, pageSize = 25) {
    const conditions = `name contains "${name}"`;
    return this.searchConfigurations({ conditions, page, pageSize });
  }

  /**
   * Search configurations by serial number
   */
  async searchConfigurationsBySerial(serialNumber, page = 1, pageSize = 25) {
    const conditions = `serialNumber contains "${serialNumber}"`;
    return this.searchConfigurations({ conditions, page, pageSize });
  }

  /**
   * Get configurations by company
   */
  async getConfigurationsByCompany(companyId, page = 1, pageSize = 25) {
    const conditions = `company/id=${companyId}`;
    return this.searchConfigurations({ conditions, page, pageSize });
  }

  /**
   * Get configurations by type
   */
  async getConfigurationsByType(typeId, page = 1, pageSize = 25) {
    const conditions = `type/id=${typeId}`;
    return this.searchConfigurations({ conditions, page, pageSize });
  }

  /**
   * Get configurations by status
   */
  async getConfigurationsByStatus(statusId, page = 1, pageSize = 25) {
    const conditions = `status/id=${statusId}`;
    return this.searchConfigurations({ conditions, page, pageSize });
  }

  /**
   * Get configurations by manufacturer
   */
  async getConfigurationsByManufacturer(manufacturerId, page = 1, pageSize = 25) {
    const conditions = `manufacturer/id=${manufacturerId}`;
    return this.searchConfigurations({ conditions, page, pageSize });
  }

  /**
   * Get child configurations
   */
  async getChildConfigurations(parentConfigurationId, page = 1, pageSize = 25) {
    const conditions = `parentConfiguration/id=${parentConfigurationId}`;
    return this.searchConfigurations({ conditions, page, pageSize });
  }

  /**
   * Get configuration hierarchy
   */
  async getConfigurationHierarchy(configurationId) {
    try {
      const configuration = await this.getConfiguration(configurationId);
      const hierarchy = {
        configuration: configuration,
        parent: null,
        children: []
      };

      // Get parent if exists
      if (configuration.parentConfiguration && configuration.parentConfiguration.id) {
        hierarchy.parent = await this.getConfiguration(configuration.parentConfiguration.id);
      }

      // Get children
      hierarchy.children = await this.getChildConfigurations(configurationId, 1, 100);

      this.emit('hierarchyFetched', { configurationId, hierarchy });
      return hierarchy;
    } catch (error) {
      this._log(`Failed to get hierarchy for configuration ${configurationId}`, error);
      throw error;
    }
  }

  /**
   * Check warranty status
   */
  async checkWarranty(configurationId) {
    try {
      const configuration = await this.getConfiguration(configurationId);

      this.stats.warrantyChecks++;

      const warrantyInfo = {
        configurationId: configuration.id,
        name: configuration.name,
        warrantyExpiration: configuration.warrantyExpiration,
        isUnderWarranty: false,
        daysRemaining: 0,
        status: 'unknown'
      };

      if (configuration.warrantyExpiration) {
        const expirationDate = new Date(configuration.warrantyExpiration);
        const today = new Date();
        const timeDiff = expirationDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        warrantyInfo.daysRemaining = daysDiff;

        if (daysDiff > 0) {
          warrantyInfo.isUnderWarranty = true;
          warrantyInfo.status = daysDiff <= 30 ? 'expiring_soon' : 'active';
        } else {
          warrantyInfo.isUnderWarranty = false;
          warrantyInfo.status = 'expired';
        }
      }

      this._log(`Warranty check: ${configuration.name}`, warrantyInfo);
      this.emit('warrantyChecked', warrantyInfo);

      return warrantyInfo;
    } catch (error) {
      this._log(`Failed to check warranty for configuration ${configurationId}`, error);
      throw error;
    }
  }

  /**
   * Get expiring warranties
   */
  async getExpiringWarranties(daysThreshold = 30) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysThreshold);

      const conditions = `warrantyExpiration < [${futureDate.toISOString()}] and warrantyExpiration > [${new Date().toISOString()}]`;
      const configurations = await this.searchConfigurations({ conditions, pageSize: 100 });

      const expiringWarranties = [];

      for (const config of configurations) {
        const warrantyInfo = await this.checkWarranty(config.id);
        if (warrantyInfo.status === 'expiring_soon') {
          expiringWarranties.push(warrantyInfo);
        }
      }

      this.emit('expiringWarrantiesFetched', { count: expiringWarranties.length, daysThreshold });
      return expiringWarranties;
    } catch (error) {
      this._log('Failed to get expiring warranties', error);
      throw error;
    }
  }

  /**
   * Set warranty expiration
   */
  async setWarrantyExpiration(configurationId, expirationDate) {
    try {
      const updates = {
        warrantyExpiration: expirationDate
      };

      const configuration = await this.updateConfiguration(configurationId, updates);

      this._log(`Warranty expiration set: ${configuration.name} - ${expirationDate}`);
      this.emit('warrantyExpirationSet', { configurationId, expirationDate });

      return configuration;
    } catch (error) {
      this._log(`Failed to set warranty expiration for ${configurationId}`, error);
      throw error;
    }
  }

  /**
   * Get configuration questions (custom fields)
   */
  async getConfigurationQuestions(configurationId) {
    try {
      const questions = await this.client.get(`/company/configurations/${configurationId}/questions`);

      this.emit('questionsFetched', { configurationId, count: questions.length });
      return questions;
    } catch (error) {
      this._log(`Failed to get questions for configuration ${configurationId}`, error);
      throw error;
    }
  }

  /**
   * Update configuration question (custom field)
   */
  async updateConfigurationQuestion(configurationId, questionId, answer) {
    try {
      const update = {
        answer: answer
      };

      const question = await this.client.patch(
        `/company/configurations/${configurationId}/questions/${questionId}`,
        update
      );

      this._log(`Question updated for configuration ${configurationId}`);
      this.emit('questionUpdated', { configurationId, questionId, question });

      return question;
    } catch (error) {
      this._log(`Failed to update question ${questionId}`, error);
      throw error;
    }
  }

  /**
   * Tag configuration
   */
  async tagConfiguration(configurationId, tagName) {
    try {
      const tag = await this.client.post(`/company/configurations/${configurationId}/tags`, {
        name: tagName
      });

      this._log(`Tag added to configuration ${configurationId}: ${tagName}`);
      this.emit('tagAdded', { configurationId, tagName });

      return tag;
    } catch (error) {
      this._log(`Failed to tag configuration ${configurationId}`, error);
      throw error;
    }
  }

  /**
   * Get configuration tags
   */
  async getConfigurationTags(configurationId) {
    try {
      const tags = await this.client.get(`/company/configurations/${configurationId}/tags`);

      this.emit('tagsFetched', { configurationId, count: tags.length });
      return tags;
    } catch (error) {
      this._log(`Failed to get tags for configuration ${configurationId}`, error);
      throw error;
    }
  }

  /**
   * Remove tag from configuration
   */
  async removeTag(configurationId, tagId) {
    try {
      await this.client.delete(`/company/configurations/${configurationId}/tags/${tagId}`);

      this._log(`Tag ${tagId} removed from configuration ${configurationId}`);
      this.emit('tagRemoved', { configurationId, tagId });

      return true;
    } catch (error) {
      this._log(`Failed to remove tag ${tagId}`, error);
      throw error;
    }
  }

  /**
   * Adjust inventory
   */
  async adjustInventory(configurationId, adjustment) {
    try {
      this._log(`Adjusting inventory for configuration ${configurationId}`, adjustment);

      const configuration = await this.getConfiguration(configurationId);

      // Calculate new quantity
      const currentQuantity = configuration.quantity || 0;
      const newQuantity = currentQuantity + adjustment.quantity;

      if (newQuantity < 0) {
        throw new Error('Inventory quantity cannot be negative');
      }

      const updates = {
        quantity: newQuantity
      };

      const updatedConfiguration = await this.updateConfiguration(configurationId, updates);

      this.stats.inventoryAdjustments++;
      this._log(`Inventory adjusted: ${configuration.name} (${currentQuantity} -> ${newQuantity})`);
      this.emit('inventoryAdjusted', { configurationId, oldQuantity: currentQuantity, newQuantity, adjustment });

      return updatedConfiguration;
    } catch (error) {
      this._log(`Failed to adjust inventory for configuration ${configurationId}`, error);
      throw error;
    }
  }

  /**
   * Get low inventory configurations
   */
  async getLowInventoryConfigurations(threshold = 5) {
    try {
      const conditions = `quantity < ${threshold}`;
      const configurations = await this.searchConfigurations({ conditions, pageSize: 100 });

      this.emit('lowInventoryFetched', { count: configurations.length, threshold });
      return configurations;
    } catch (error) {
      this._log('Failed to get low inventory configurations', error);
      throw error;
    }
  }

  /**
   * Get configuration by asset tag
   */
  async getConfigurationByAssetTag(assetTag) {
    try {
      const conditions = `assetTag="${assetTag}"`;
      const configurations = await this.searchConfigurations({ conditions, pageSize: 1 });

      if (configurations.length === 0) {
        throw new Error(`No configuration found with asset tag: ${assetTag}`);
      }

      return configurations[0];
    } catch (error) {
      this._log(`Failed to get configuration by asset tag ${assetTag}`, error);
      throw error;
    }
  }

  /**
   * Generate asset tag
   */
  generateAssetTag(prefix = 'ASSET', companyId = null) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();

    let tag = `${prefix}-${timestamp}${random}`;

    if (companyId) {
      tag = `${prefix}-${companyId}-${timestamp}${random}`;
    }

    return tag;
  }

  /**
   * Batch create configurations
   */
  async batchCreateConfigurations(configurationsData) {
    const results = [];

    for (const configData of configurationsData) {
      try {
        const configuration = await this.createConfiguration(configData);
        results.push({ success: true, configuration });
      } catch (error) {
        results.push({ success: false, error: error.message, configData });
      }
    }

    this.emit('batchCreateComplete', { results });
    return results;
  }

  /**
   * Batch update configurations
   */
  async batchUpdateConfigurations(updates) {
    const results = [];

    for (const update of updates) {
      try {
        const configuration = await this.updateConfiguration(update.configurationId, update.data);
        results.push({ success: true, configuration });
      } catch (error) {
        results.push({ success: false, error: error.message, update });
      }
    }

    this.emit('batchUpdateComplete', { results });
    return results;
  }

  /**
   * Export configurations to CSV
   */
  async exportConfigurationsToCSV(configurations) {
    try {
      const headers = [
        'ID', 'Name', 'Type', 'Status', 'Company', 'Serial Number',
        'Asset Tag', 'Manufacturer', 'Model', 'Warranty Expiration', 'Quantity'
      ];

      const rows = configurations.map(config => [
        config.id,
        config.name,
        config.type?.name || '',
        config.status?.name || '',
        config.company?.name || '',
        config.serialNumber || '',
        config.assetTag || '',
        config.manufacturer?.name || '',
        config.model || '',
        config.warrantyExpiration || '',
        config.quantity || 0
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      this.emit('configurationsExported', { count: configurations.length });
      return csv;
    } catch (error) {
      this._log('Failed to export configurations', error);
      throw error;
    }
  }

  /**
   * Get configuration statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeConfigurations: this.activeConfigurations.size,
      cache: {
        configurationTypes: this.cache.configurationTypes?.length || 0,
        configurationStatuses: this.cache.configurationStatuses?.length || 0,
        manufacturers: this.cache.manufacturers?.length || 0,
        lastUpdate: this.cache.lastUpdate
      }
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = {
      configurationTypes: null,
      configurationStatuses: null,
      manufacturers: null,
      lastUpdate: null
    };

    this.emit('cacheCleared');
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      configurationsCreated: 0,
      configurationsUpdated: 0,
      configurationsDeleted: 0,
      warrantyChecks: 0,
      inventoryAdjustments: 0
    };

    this.emit('statsReset');
  }
}

module.exports = ConfigurationManager;
