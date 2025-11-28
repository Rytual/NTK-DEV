/**
 * ConnectWise Company Manager
 * Comprehensive company and contact management
 *
 * Features:
 * - Company CRUD operations
 * - Contact management
 * - Company hierarchy (parent/child relationships)
 * - Company types and statuses
 * - Contact search and filtering
 * - Communication items (emails, phone calls)
 * - Address management
 * - Custom field support
 * - Company merging
 * - EventEmitter integration
 */

const { EventEmitter } = require('events');

/**
 * Company Manager Class
 */
class CompanyManager extends EventEmitter {
  constructor(connectWiseClient) {
    super();

    if (!connectWiseClient) {
      throw new Error('ConnectWise client is required');
    }

    this.client = connectWiseClient;

    // Cache for company types, statuses
    this.cache = {
      companyTypes: null,
      companyStatuses: null,
      contactDepartments: null,
      contactRelationships: null,
      lastUpdate: null
    };

    // Active companies/contacts
    this.activeCompanies = new Map();
    this.activeContacts = new Map();

    // Statistics
    this.stats = {
      companiesCreated: 0,
      companiesUpdated: 0,
      companiesDeleted: 0,
      contactsCreated: 0,
      contactsUpdated: 0,
      contactsDeleted: 0,
      communicationsLogged: 0
    };

    this._log('Company Manager initialized');
  }

  /**
   * Log debug information
   */
  _log(message, data = null) {
    console.log(`[CompanyManager] ${message}`, data || '');
    this.emit('log', { message, data, timestamp: Date.now() });
  }

  /**
   * Initialize cache - fetch company types, statuses, etc.
   */
  async initialize() {
    try {
      this._log('Initializing company manager...');

      // Fetch company types
      await this.refreshCompanyTypes();

      // Fetch company statuses
      await this.refreshCompanyStatuses();

      // Fetch contact departments
      await this.refreshContactDepartments();

      // Fetch contact relationships
      await this.refreshContactRelationships();

      this.cache.lastUpdate = Date.now();

      this._log('Company manager initialized successfully');
      this.emit('initialized', { cache: this.cache });

      return true;
    } catch (error) {
      this._log('Failed to initialize company manager', error);
      this.emit('initializationError', error);
      throw error;
    }
  }

  /**
   * Refresh company types cache
   */
  async refreshCompanyTypes() {
    try {
      const types = await this.client.get('/company/companies/types');
      this.cache.companyTypes = types;

      this._log(`Refreshed ${types.length} company types`);
      return types;
    } catch (error) {
      this._log('Failed to refresh company types', error);
      throw error;
    }
  }

  /**
   * Refresh company statuses cache
   */
  async refreshCompanyStatuses() {
    try {
      const statuses = await this.client.get('/company/companies/statuses');
      this.cache.companyStatuses = statuses;

      this._log(`Refreshed ${statuses.length} company statuses`);
      return statuses;
    } catch (error) {
      this._log('Failed to refresh company statuses', error);
      throw error;
    }
  }

  /**
   * Refresh contact departments cache
   */
  async refreshContactDepartments() {
    try {
      const departments = await this.client.get('/company/contacts/departments');
      this.cache.contactDepartments = departments;

      this._log(`Refreshed ${departments.length} contact departments`);
      return departments;
    } catch (error) {
      this._log('Failed to refresh contact departments', error);
      throw error;
    }
  }

  /**
   * Refresh contact relationships cache
   */
  async refreshContactRelationships() {
    try {
      const relationships = await this.client.get('/company/contacts/relationships');
      this.cache.contactRelationships = relationships;

      this._log(`Refreshed ${relationships.length} contact relationships`);
      return relationships;
    } catch (error) {
      this._log('Failed to refresh contact relationships', error);
      throw error;
    }
  }

  /**
   * Get company types
   */
  async getCompanyTypes(forceRefresh = false) {
    if (forceRefresh || !this.cache.companyTypes) {
      return this.refreshCompanyTypes();
    }
    return this.cache.companyTypes;
  }

  /**
   * Get company statuses
   */
  async getCompanyStatuses(forceRefresh = false) {
    if (forceRefresh || !this.cache.companyStatuses) {
      return this.refreshCompanyStatuses();
    }
    return this.cache.companyStatuses;
  }

  /**
   * Create a new company
   */
  async createCompany(companyData) {
    try {
      this._log('Creating company', companyData);

      // Validate required fields
      if (!companyData.name) {
        throw new Error('Company name is required');
      }

      // Set defaults
      const data = {
        ...companyData,
        status: companyData.status || { id: 1 }, // Default status
        type: companyData.type || { id: 1 } // Default type
      };

      const company = await this.client.createCompany(data);

      this.stats.companiesCreated++;
      this.activeCompanies.set(company.id, company);

      this._log(`Company created: ${company.name} (ID: ${company.id})`, company);
      this.emit('companyCreated', { company });

      return company;
    } catch (error) {
      this._log('Failed to create company', error);
      this.emit('companyCreationError', { companyData, error });
      throw error;
    }
  }

  /**
   * Get company by ID
   */
  async getCompany(companyId) {
    try {
      const company = await this.client.getCompany(companyId);
      this.activeCompanies.set(companyId, company);

      this.emit('companyFetched', { company });
      return company;
    } catch (error) {
      this._log(`Failed to get company ${companyId}`, error);
      throw error;
    }
  }

  /**
   * Update company
   */
  async updateCompany(companyId, updates) {
    try {
      this._log(`Updating company ${companyId}`, updates);

      const company = await this.client.updateCompany(companyId, updates);

      this.stats.companiesUpdated++;
      this.activeCompanies.set(companyId, company);

      this._log(`Company updated: ${company.name} (ID: ${company.id})`);
      this.emit('companyUpdated', { company, updates });

      return company;
    } catch (error) {
      this._log(`Failed to update company ${companyId}`, error);
      this.emit('companyUpdateError', { companyId, updates, error });
      throw error;
    }
  }

  /**
   * Delete company
   */
  async deleteCompany(companyId) {
    try {
      await this.client.deleteCompany(companyId);

      this.stats.companiesDeleted++;
      this.activeCompanies.delete(companyId);

      this._log(`Company deleted: ${companyId}`);
      this.emit('companyDeleted', { companyId });

      return true;
    } catch (error) {
      this._log(`Failed to delete company ${companyId}`, error);
      throw error;
    }
  }

  /**
   * Search companies
   */
  async searchCompanies(searchParams) {
    try {
      const {
        conditions,
        orderBy = 'name',
        page = 1,
        pageSize = 25
      } = searchParams;

      this._log('Searching companies', searchParams);

      const companies = await this.client.getCompanies(conditions, orderBy, page, pageSize);

      this.emit('companiesSearched', { searchParams, count: companies.length });

      return companies;
    } catch (error) {
      this._log('Failed to search companies', error);
      throw error;
    }
  }

  /**
   * Search companies by name
   */
  async searchCompaniesByName(name, page = 1, pageSize = 25) {
    const conditions = `name contains "${name}"`;
    return this.searchCompanies({ conditions, page, pageSize });
  }

  /**
   * Get companies by type
   */
  async getCompaniesByType(typeId, page = 1, pageSize = 25) {
    const conditions = `type/id=${typeId}`;
    return this.searchCompanies({ conditions, page, pageSize });
  }

  /**
   * Get companies by status
   */
  async getCompaniesByStatus(statusId, page = 1, pageSize = 25) {
    const conditions = `status/id=${statusId}`;
    return this.searchCompanies({ conditions, page, pageSize });
  }

  /**
   * Get child companies (subsidiaries)
   */
  async getChildCompanies(parentCompanyId, page = 1, pageSize = 25) {
    const conditions = `parentCompany/id=${parentCompanyId}`;
    return this.searchCompanies({ conditions, page, pageSize });
  }

  /**
   * Get company hierarchy (parent and children)
   */
  async getCompanyHierarchy(companyId) {
    try {
      const company = await this.getCompany(companyId);
      const hierarchy = {
        company: company,
        parent: null,
        children: []
      };

      // Get parent if exists
      if (company.parentCompany && company.parentCompany.id) {
        hierarchy.parent = await this.getCompany(company.parentCompany.id);
      }

      // Get children
      hierarchy.children = await this.getChildCompanies(companyId, 1, 100);

      this.emit('hierarchyFetched', { companyId, hierarchy });
      return hierarchy;
    } catch (error) {
      this._log(`Failed to get hierarchy for company ${companyId}`, error);
      throw error;
    }
  }

  /**
   * Get company contacts
   */
  async getCompanyContacts(companyId, page = 1, pageSize = 25) {
    try {
      const conditions = `company/id=${companyId}`;
      const contacts = await this.client.getContacts(conditions, 'lastName,firstName', page, pageSize);

      this.emit('companyContactsFetched', { companyId, count: contacts.length });
      return contacts;
    } catch (error) {
      this._log(`Failed to get contacts for company ${companyId}`, error);
      throw error;
    }
  }

  /**
   * Create a new contact
   */
  async createContact(contactData) {
    try {
      this._log('Creating contact', contactData);

      // Validate required fields
      if (!contactData.firstName && !contactData.lastName) {
        throw new Error('First name or last name is required');
      }
      if (!contactData.company || !contactData.company.id) {
        throw new Error('Company ID is required');
      }

      const contact = await this.client.createContact(contactData);

      this.stats.contactsCreated++;
      this.activeContacts.set(contact.id, contact);

      this._log(`Contact created: ${contact.firstName} ${contact.lastName} (ID: ${contact.id})`, contact);
      this.emit('contactCreated', { contact });

      return contact;
    } catch (error) {
      this._log('Failed to create contact', error);
      this.emit('contactCreationError', { contactData, error });
      throw error;
    }
  }

  /**
   * Get contact by ID
   */
  async getContact(contactId) {
    try {
      const contact = await this.client.getContact(contactId);
      this.activeContacts.set(contactId, contact);

      this.emit('contactFetched', { contact });
      return contact;
    } catch (error) {
      this._log(`Failed to get contact ${contactId}`, error);
      throw error;
    }
  }

  /**
   * Update contact
   */
  async updateContact(contactId, updates) {
    try {
      this._log(`Updating contact ${contactId}`, updates);

      const contact = await this.client.updateContact(contactId, updates);

      this.stats.contactsUpdated++;
      this.activeContacts.set(contactId, contact);

      this._log(`Contact updated: ${contact.firstName} ${contact.lastName} (ID: ${contact.id})`);
      this.emit('contactUpdated', { contact, updates });

      return contact;
    } catch (error) {
      this._log(`Failed to update contact ${contactId}`, error);
      this.emit('contactUpdateError', { contactId, updates, error });
      throw error;
    }
  }

  /**
   * Delete contact
   */
  async deleteContact(contactId) {
    try {
      await this.client.deleteContact(contactId);

      this.stats.contactsDeleted++;
      this.activeContacts.delete(contactId);

      this._log(`Contact deleted: ${contactId}`);
      this.emit('contactDeleted', { contactId });

      return true;
    } catch (error) {
      this._log(`Failed to delete contact ${contactId}`, error);
      throw error;
    }
  }

  /**
   * Search contacts
   */
  async searchContacts(searchParams) {
    try {
      const {
        conditions,
        orderBy = 'lastName,firstName',
        page = 1,
        pageSize = 25
      } = searchParams;

      this._log('Searching contacts', searchParams);

      const contacts = await this.client.getContacts(conditions, orderBy, page, pageSize);

      this.emit('contactsSearched', { searchParams, count: contacts.length });

      return contacts;
    } catch (error) {
      this._log('Failed to search contacts', error);
      throw error;
    }
  }

  /**
   * Search contacts by name
   */
  async searchContactsByName(name, page = 1, pageSize = 25) {
    const conditions = `firstName contains "${name}" or lastName contains "${name}"`;
    return this.searchContacts({ conditions, page, pageSize });
  }

  /**
   * Search contacts by email
   */
  async searchContactsByEmail(email, page = 1, pageSize = 25) {
    const conditions = `defaultEmail contains "${email}"`;
    return this.searchContacts({ conditions, page, pageSize });
  }

  /**
   * Get company communications
   */
  async getCompanyCommunications(companyId, page = 1, pageSize = 25) {
    try {
      const communications = await this.client.get('/company/communications', {
        conditions: `company/id=${companyId}`,
        orderBy: 'timeStart desc',
        page,
        pageSize
      });

      this.emit('communicationsFetched', { companyId, count: communications.length });
      return communications;
    } catch (error) {
      this._log(`Failed to get communications for company ${companyId}`, error);
      throw error;
    }
  }

  /**
   * Get contact communications
   */
  async getContactCommunications(contactId, page = 1, pageSize = 25) {
    try {
      const communications = await this.client.get('/company/communications', {
        conditions: `contact/id=${contactId}`,
        orderBy: 'timeStart desc',
        page,
        pageSize
      });

      this.emit('communicationsFetched', { contactId, count: communications.length });
      return communications;
    } catch (error) {
      this._log(`Failed to get communications for contact ${contactId}`, error);
      throw error;
    }
  }

  /**
   * Log communication (email, phone call, etc.)
   */
  async logCommunication(communicationData) {
    try {
      this._log('Logging communication', communicationData);

      // Validate required fields
      if (!communicationData.type || !communicationData.type.id) {
        throw new Error('Communication type is required');
      }

      const communication = await this.client.post('/company/communications', communicationData);

      this.stats.communicationsLogged++;
      this._log('Communication logged', communication);
      this.emit('communicationLogged', { communication });

      return communication;
    } catch (error) {
      this._log('Failed to log communication', error);
      this.emit('communicationLogError', { communicationData, error });
      throw error;
    }
  }

  /**
   * Get company addresses
   */
  async getCompanyAddresses(companyId) {
    try {
      const addresses = await this.client.get(`/company/companies/${companyId}/sites`);

      this.emit('addressesFetched', { companyId, count: addresses.length });
      return addresses;
    } catch (error) {
      this._log(`Failed to get addresses for company ${companyId}`, error);
      throw error;
    }
  }

  /**
   * Add company address
   */
  async addCompanyAddress(companyId, addressData) {
    try {
      this._log(`Adding address to company ${companyId}`, addressData);

      const address = await this.client.post(`/company/companies/${companyId}/sites`, addressData);

      this._log('Address added', address);
      this.emit('addressAdded', { companyId, address });

      return address;
    } catch (error) {
      this._log(`Failed to add address to company ${companyId}`, error);
      throw error;
    }
  }

  /**
   * Update company address
   */
  async updateCompanyAddress(companyId, siteId, updates) {
    try {
      const address = await this.client.patch(`/company/companies/${companyId}/sites/${siteId}`, updates);

      this._log('Address updated', address);
      this.emit('addressUpdated', { companyId, siteId, address });

      return address;
    } catch (error) {
      this._log(`Failed to update address ${siteId}`, error);
      throw error;
    }
  }

  /**
   * Delete company address
   */
  async deleteCompanyAddress(companyId, siteId) {
    try {
      await this.client.delete(`/company/companies/${companyId}/sites/${siteId}`);

      this._log(`Address ${siteId} deleted`);
      this.emit('addressDeleted', { companyId, siteId });

      return true;
    } catch (error) {
      this._log(`Failed to delete address ${siteId}`, error);
      throw error;
    }
  }

  /**
   * Get company notes
   */
  async getCompanyNotes(companyId) {
    try {
      const notes = await this.client.get(`/company/companies/${companyId}/notes`, {
        orderBy: 'dateCreated desc'
      });

      this.emit('notesFetched', { companyId, count: notes.length });
      return notes;
    } catch (error) {
      this._log(`Failed to get notes for company ${companyId}`, error);
      throw error;
    }
  }

  /**
   * Add company note
   */
  async addCompanyNote(companyId, noteData) {
    try {
      this._log(`Adding note to company ${companyId}`, noteData);

      const note = await this.client.post(`/company/companies/${companyId}/notes`, noteData);

      this._log('Note added', note);
      this.emit('noteAdded', { companyId, note });

      return note;
    } catch (error) {
      this._log(`Failed to add note to company ${companyId}`, error);
      throw error;
    }
  }

  /**
   * Merge companies
   */
  async mergeCompanies(sourceCompanyId, targetCompanyId, mergeOptions = {}) {
    try {
      this._log(`Merging company ${sourceCompanyId} into ${targetCompanyId}`, mergeOptions);

      // Get source company data
      const sourceCompany = await this.getCompany(sourceCompanyId);

      // Merge options
      const {
        mergeContacts = true,
        mergeTickets = true,
        mergeConfigurations = true,
        mergeNotes = true,
        deleteSource = false
      } = mergeOptions;

      const mergeResults = {
        sourceCompany,
        targetCompanyId,
        contactsMerged: 0,
        ticketsMerged: 0,
        configurationsMerged: 0,
        notesMerged: 0,
        sourceDeleted: false
      };

      // Merge contacts
      if (mergeContacts) {
        const contacts = await this.getCompanyContacts(sourceCompanyId, 1, 1000);
        for (const contact of contacts) {
          await this.updateContact(contact.id, {
            company: { id: targetCompanyId }
          });
          mergeResults.contactsMerged++;
        }
      }

      // Merge tickets (if ticket manager available)
      if (mergeTickets) {
        try {
          const tickets = await this.client.get('/service/tickets', {
            conditions: `company/id=${sourceCompanyId}`,
            pageSize: 1000
          });

          for (const ticket of tickets) {
            await this.client.updateTicket(ticket.id, {
              company: { id: targetCompanyId }
            });
            mergeResults.ticketsMerged++;
          }
        } catch (error) {
          this._log('Failed to merge tickets', error);
        }
      }

      // Merge configurations
      if (mergeConfigurations) {
        try {
          const configurations = await this.client.get('/company/configurations', {
            conditions: `company/id=${sourceCompanyId}`,
            pageSize: 1000
          });

          for (const config of configurations) {
            await this.client.updateConfiguration(config.id, {
              company: { id: targetCompanyId }
            });
            mergeResults.configurationsMerged++;
          }
        } catch (error) {
          this._log('Failed to merge configurations', error);
        }
      }

      // Merge notes
      if (mergeNotes) {
        try {
          const notes = await this.getCompanyNotes(sourceCompanyId);
          for (const note of notes) {
            await this.addCompanyNote(targetCompanyId, {
              text: `[Merged from ${sourceCompany.name}] ${note.text}`,
              flag: note.flag
            });
            mergeResults.notesMerged++;
          }
        } catch (error) {
          this._log('Failed to merge notes', error);
        }
      }

      // Delete source company if requested
      if (deleteSource) {
        await this.deleteCompany(sourceCompanyId);
        mergeResults.sourceDeleted = true;
      }

      this._log('Company merge complete', mergeResults);
      this.emit('companiesMerged', mergeResults);

      return mergeResults;
    } catch (error) {
      this._log(`Failed to merge companies`, error);
      throw error;
    }
  }

  /**
   * Batch create companies
   */
  async batchCreateCompanies(companiesData) {
    const results = [];

    for (const companyData of companiesData) {
      try {
        const company = await this.createCompany(companyData);
        results.push({ success: true, company });
      } catch (error) {
        results.push({ success: false, error: error.message, companyData });
      }
    }

    this.emit('batchCreateComplete', { results });
    return results;
  }

  /**
   * Batch create contacts
   */
  async batchCreateContacts(contactsData) {
    const results = [];

    for (const contactData of contactsData) {
      try {
        const contact = await this.createContact(contactData);
        results.push({ success: true, contact });
      } catch (error) {
        results.push({ success: false, error: error.message, contactData });
      }
    }

    this.emit('batchCreateComplete', { results });
    return results;
  }

  /**
   * Get company statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeCompanies: this.activeCompanies.size,
      activeContacts: this.activeContacts.size,
      cache: {
        companyTypes: this.cache.companyTypes?.length || 0,
        companyStatuses: this.cache.companyStatuses?.length || 0,
        contactDepartments: this.cache.contactDepartments?.length || 0,
        contactRelationships: this.cache.contactRelationships?.length || 0,
        lastUpdate: this.cache.lastUpdate
      }
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = {
      companyTypes: null,
      companyStatuses: null,
      contactDepartments: null,
      contactRelationships: null,
      lastUpdate: null
    };

    this.emit('cacheCleared');
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      companiesCreated: 0,
      companiesUpdated: 0,
      companiesDeleted: 0,
      contactsCreated: 0,
      contactsUpdated: 0,
      contactsDeleted: 0,
      communicationsLogged: 0
    };

    this.emit('statsReset');
  }
}

module.exports = CompanyManager;
