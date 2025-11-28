/**
 * Microsoft Graph API Client
 * Full implementation of Graph API v5 with comprehensive endpoint coverage
 * Supports users, groups, mail, calendar, Teams, SharePoint, OneDrive, and more
 *
 * @module graph-client
 * @version 5.0.0
 */

const axios = require('axios');
const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');

/**
 * Microsoft Graph API Client
 * Comprehensive client for interacting with Microsoft 365 services
 */
class GraphClient extends EventEmitter {
  constructor(authManager, config = {}) {
    super();
    this.authManager = authManager;
    this.baseUrl = config.baseUrl || 'https://graph.microsoft.com/v1.0';
    this.betaUrl = 'https://graph.microsoft.com/beta';
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.batchSize = config.batchSize || 20;

    this.initializeAxiosClient();
    this.loadEndpoints();
  }

  /**
   * Initialize Axios client with interceptors
   */
  initializeAxiosClient() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Request interceptor for authentication
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getAccessToken(config.scopes || ['User.Read']);
        config.headers['Authorization'] = `Bearer ${token}`;

        this.emit('requestStarted', {
          method: config.method,
          url: config.url,
          timestamp: new Date()
        });

        return config;
      },
      (error) => {
        this.emit('requestError', { error });
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        this.emit('requestCompleted', {
          method: response.config.method,
          url: response.config.url,
          status: response.status,
          timestamp: new Date()
        });

        return response;
      },
      async (error) => {
        return this.handleResponseError(error);
      }
    );
  }

  /**
   * Load Graph API endpoint definitions
   */
  loadEndpoints() {
    const endpointsPath = path.join(__dirname, '../../config/graph-endpoints.json');
    if (fs.existsSync(endpointsPath)) {
      this.endpoints = JSON.parse(fs.readFileSync(endpointsPath, 'utf8'));
    } else {
      this.endpoints = this.getDefaultEndpoints();
    }
  }

  /**
   * Get default endpoint definitions
   */
  getDefaultEndpoints() {
    return {
      users: '/users',
      me: '/me',
      groups: '/groups',
      applications: '/applications',
      servicePrincipals: '/servicePrincipals',
      devices: '/devices',
      sites: '/sites',
      drives: '/drives',
      teams: '/teams',
      chats: '/chats'
    };
  }

  /**
   * Get access token from auth manager
   */
  async getAccessToken(scopes) {
    try {
      const cachedToken = this.authManager.getCachedToken(scopes);
      if (cachedToken) {
        return cachedToken;
      }

      const response = await this.authManager.acquireTokenSilent(scopes);
      return response.accessToken;
    } catch (error) {
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  /**
   * Handle response errors with retry logic
   */
  async handleResponseError(error, retryCount = 0) {
    const { response, config } = error;

    if (!response) {
      this.emit('requestError', { error: 'Network error', retryCount });
      throw error;
    }

    // Handle throttling (429)
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers['retry-after'] || '5', 10);
      this.emit('throttled', { retryAfter, retryCount });

      if (retryCount < this.maxRetries) {
        await this.delay(retryAfter * 1000);
        return this.client.request(config);
      }
    }

    // Handle service unavailable (503)
    if (response.status === 503 && retryCount < this.maxRetries) {
      this.emit('serviceUnavailable', { retryCount });
      await this.delay(this.retryDelay * Math.pow(2, retryCount));
      return this.client.request(config);
    }

    // Handle authentication errors (401)
    if (response.status === 401) {
      this.emit('authenticationError', { error: response.data });
      // Clear cached token and retry
      if (retryCount === 0) {
        this.authManager.clearAllCaches();
        return this.client.request(config);
      }
    }

    this.emit('requestError', {
      status: response.status,
      error: response.data,
      retryCount
    });

    throw error;
  }

  /**
   * Delay utility for retry logic
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== USER OPERATIONS ====================

  /**
   * Get current user profile
   */
  async getMe(select = null) {
    try {
      const params = {};
      if (select) {
        params.$select = Array.isArray(select) ? select.join(',') : select;
      }

      const response = await this.client.get('/me', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }

  /**
   * Get all users (requires admin permission)
   */
  async getUsers(options = {}) {
    try {
      const params = {
        $top: options.top || 100,
        $skip: options.skip || 0
      };

      if (options.select) {
        params.$select = Array.isArray(options.select) ? options.select.join(',') : options.select;
      }

      if (options.filter) {
        params.$filter = options.filter;
      }

      if (options.orderBy) {
        params.$orderby = options.orderBy;
      }

      if (options.search) {
        params.$search = `"${options.search}"`;
        params.ConsistencyLevel = 'eventual';
      }

      const response = await this.client.get('/users', {
        params,
        scopes: ['User.Read.All']
      });

      return {
        users: response.data.value,
        nextLink: response.data['@odata.nextLink'],
        count: response.data['@odata.count']
      };
    } catch (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId, select = null) {
    try {
      const params = {};
      if (select) {
        params.$select = Array.isArray(select) ? select.join(',') : select;
      }

      const response = await this.client.get(`/users/${userId}`, {
        params,
        scopes: ['User.Read.All']
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    try {
      const response = await this.client.post('/users', userData, {
        scopes: ['User.ReadWrite.All']
      });

      this.emit('userCreated', { userId: response.data.id });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Update user
   */
  async updateUser(userId, updates) {
    try {
      await this.client.patch(`/users/${userId}`, updates, {
        scopes: ['User.ReadWrite.All']
      });

      this.emit('userUpdated', { userId });
      return true;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId) {
    try {
      await this.client.delete(`/users/${userId}`, {
        scopes: ['User.ReadWrite.All']
      });

      this.emit('userDeleted', { userId });
      return true;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  // ==================== GROUP OPERATIONS ====================

  /**
   * Get all groups
   */
  async getGroups(options = {}) {
    try {
      const params = {
        $top: options.top || 100,
        $skip: options.skip || 0
      };

      if (options.select) {
        params.$select = Array.isArray(options.select) ? options.select.join(',') : options.select;
      }

      if (options.filter) {
        params.$filter = options.filter;
      }

      const response = await this.client.get('/groups', {
        params,
        scopes: ['Group.Read.All']
      });

      return {
        groups: response.data.value,
        nextLink: response.data['@odata.nextLink']
      };
    } catch (error) {
      throw new Error(`Failed to get groups: ${error.message}`);
    }
  }

  /**
   * Get group by ID
   */
  async getGroupById(groupId) {
    try {
      const response = await this.client.get(`/groups/${groupId}`, {
        scopes: ['Group.Read.All']
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get group: ${error.message}`);
    }
  }

  /**
   * Create new group
   */
  async createGroup(groupData) {
    try {
      const response = await this.client.post('/groups', groupData, {
        scopes: ['Group.ReadWrite.All']
      });

      this.emit('groupCreated', { groupId: response.data.id });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create group: ${error.message}`);
    }
  }

  /**
   * Get group members
   */
  async getGroupMembers(groupId) {
    try {
      const response = await this.client.get(`/groups/${groupId}/members`, {
        scopes: ['Group.Read.All']
      });

      return response.data.value;
    } catch (error) {
      throw new Error(`Failed to get group members: ${error.message}`);
    }
  }

  /**
   * Add member to group
   */
  async addGroupMember(groupId, userId) {
    try {
      await this.client.post(`/groups/${groupId}/members/$ref`, {
        '@odata.id': `${this.baseUrl}/directoryObjects/${userId}`
      }, {
        scopes: ['Group.ReadWrite.All']
      });

      this.emit('memberAdded', { groupId, userId });
      return true;
    } catch (error) {
      throw new Error(`Failed to add group member: ${error.message}`);
    }
  }

  /**
   * Remove member from group
   */
  async removeGroupMember(groupId, userId) {
    try {
      await this.client.delete(`/groups/${groupId}/members/${userId}/$ref`, {
        scopes: ['Group.ReadWrite.All']
      });

      this.emit('memberRemoved', { groupId, userId });
      return true;
    } catch (error) {
      throw new Error(`Failed to remove group member: ${error.message}`);
    }
  }

  // ==================== MAIL OPERATIONS ====================

  /**
   * Get messages from mailbox
   */
  async getMessages(options = {}) {
    try {
      const params = {
        $top: options.top || 50,
        $skip: options.skip || 0
      };

      if (options.select) {
        params.$select = Array.isArray(options.select) ? options.select.join(',') : options.select;
      }

      if (options.filter) {
        params.$filter = options.filter;
      }

      if (options.orderBy) {
        params.$orderby = options.orderBy;
      }

      const response = await this.client.get('/me/messages', {
        params,
        scopes: ['Mail.Read']
      });

      return {
        messages: response.data.value,
        nextLink: response.data['@odata.nextLink']
      };
    } catch (error) {
      throw new Error(`Failed to get messages: ${error.message}`);
    }
  }

  /**
   * Get message by ID
   */
  async getMessageById(messageId) {
    try {
      const response = await this.client.get(`/me/messages/${messageId}`, {
        scopes: ['Mail.Read']
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get message: ${error.message}`);
    }
  }

  /**
   * Send email
   */
  async sendMail(mailData) {
    try {
      await this.client.post('/me/sendMail', {
        message: mailData,
        saveToSentItems: true
      }, {
        scopes: ['Mail.Send']
      });

      this.emit('mailSent', { subject: mailData.subject });
      return true;
    } catch (error) {
      throw new Error(`Failed to send mail: ${error.message}`);
    }
  }

  /**
   * Reply to message
   */
  async replyToMessage(messageId, replyData) {
    try {
      await this.client.post(`/me/messages/${messageId}/reply`, replyData, {
        scopes: ['Mail.Send']
      });

      this.emit('mailReplied', { messageId });
      return true;
    } catch (error) {
      throw new Error(`Failed to reply to message: ${error.message}`);
    }
  }

  /**
   * Get mail folders
   */
  async getMailFolders() {
    try {
      const response = await this.client.get('/me/mailFolders', {
        scopes: ['Mail.Read']
      });

      return response.data.value;
    } catch (error) {
      throw new Error(`Failed to get mail folders: ${error.message}`);
    }
  }

  // ==================== CALENDAR OPERATIONS ====================

  /**
   * Get calendar events
   */
  async getCalendarEvents(options = {}) {
    try {
      const params = {
        $top: options.top || 50
      };

      if (options.startDateTime && options.endDateTime) {
        params.startDateTime = options.startDateTime;
        params.endDateTime = options.endDateTime;
      }

      if (options.select) {
        params.$select = Array.isArray(options.select) ? options.select.join(',') : options.select;
      }

      if (options.orderBy) {
        params.$orderby = options.orderBy;
      }

      const response = await this.client.get('/me/calendar/events', {
        params,
        scopes: ['Calendars.Read']
      });

      return {
        events: response.data.value,
        nextLink: response.data['@odata.nextLink']
      };
    } catch (error) {
      throw new Error(`Failed to get calendar events: ${error.message}`);
    }
  }

  /**
   * Create calendar event
   */
  async createCalendarEvent(eventData) {
    try {
      const response = await this.client.post('/me/calendar/events', eventData, {
        scopes: ['Calendars.ReadWrite']
      });

      this.emit('eventCreated', { eventId: response.data.id });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  /**
   * Update calendar event
   */
  async updateCalendarEvent(eventId, updates) {
    try {
      const response = await this.client.patch(`/me/calendar/events/${eventId}`, updates, {
        scopes: ['Calendars.ReadWrite']
      });

      this.emit('eventUpdated', { eventId });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update calendar event: ${error.message}`);
    }
  }

  /**
   * Delete calendar event
   */
  async deleteCalendarEvent(eventId) {
    try {
      await this.client.delete(`/me/calendar/events/${eventId}`, {
        scopes: ['Calendars.ReadWrite']
      });

      this.emit('eventDeleted', { eventId });
      return true;
    } catch (error) {
      throw new Error(`Failed to delete calendar event: ${error.message}`);
    }
  }

  // ==================== TEAMS OPERATIONS ====================

  /**
   * Get all teams
   */
  async getTeams() {
    try {
      const response = await this.client.get('/me/joinedTeams', {
        scopes: ['Team.ReadBasic.All']
      });

      return response.data.value;
    } catch (error) {
      throw new Error(`Failed to get teams: ${error.message}`);
    }
  }

  /**
   * Get team by ID
   */
  async getTeamById(teamId) {
    try {
      const response = await this.client.get(`/teams/${teamId}`, {
        scopes: ['Team.ReadBasic.All']
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get team: ${error.message}`);
    }
  }

  /**
   * Get team channels
   */
  async getTeamChannels(teamId) {
    try {
      const response = await this.client.get(`/teams/${teamId}/channels`, {
        scopes: ['Channel.ReadBasic.All']
      });

      return response.data.value;
    } catch (error) {
      throw new Error(`Failed to get team channels: ${error.message}`);
    }
  }

  /**
   * Get channel messages
   */
  async getChannelMessages(teamId, channelId, options = {}) {
    try {
      const params = {
        $top: options.top || 50
      };

      const response = await this.client.get(`/teams/${teamId}/channels/${channelId}/messages`, {
        params,
        scopes: ['ChannelMessage.Read.All']
      });

      return response.data.value;
    } catch (error) {
      throw new Error(`Failed to get channel messages: ${error.message}`);
    }
  }

  /**
   * Send message to channel
   */
  async sendChannelMessage(teamId, channelId, message) {
    try {
      const response = await this.client.post(`/teams/${teamId}/channels/${channelId}/messages`, {
        body: {
          content: message
        }
      }, {
        scopes: ['ChannelMessage.Send']
      });

      this.emit('channelMessageSent', { teamId, channelId });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send channel message: ${error.message}`);
    }
  }

  // ==================== SHAREPOINT OPERATIONS ====================

  /**
   * Get SharePoint sites
   */
  async getSites(options = {}) {
    try {
      const params = {};

      if (options.search) {
        params.search = options.search;
      }

      const response = await this.client.get('/sites', {
        params,
        scopes: ['Sites.Read.All']
      });

      return response.data.value;
    } catch (error) {
      throw new Error(`Failed to get sites: ${error.message}`);
    }
  }

  /**
   * Get site by ID
   */
  async getSiteById(siteId) {
    try {
      const response = await this.client.get(`/sites/${siteId}`, {
        scopes: ['Sites.Read.All']
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get site: ${error.message}`);
    }
  }

  /**
   * Get site lists
   */
  async getSiteLists(siteId) {
    try {
      const response = await this.client.get(`/sites/${siteId}/lists`, {
        scopes: ['Sites.Read.All']
      });

      return response.data.value;
    } catch (error) {
      throw new Error(`Failed to get site lists: ${error.message}`);
    }
  }

  /**
   * Get list items
   */
  async getListItems(siteId, listId) {
    try {
      const response = await this.client.get(`/sites/${siteId}/lists/${listId}/items`, {
        params: {
          $expand: 'fields'
        },
        scopes: ['Sites.Read.All']
      });

      return response.data.value;
    } catch (error) {
      throw new Error(`Failed to get list items: ${error.message}`);
    }
  }

  // ==================== ONEDRIVE OPERATIONS ====================

  /**
   * Get user's drive
   */
  async getMyDrive() {
    try {
      const response = await this.client.get('/me/drive', {
        scopes: ['Files.Read']
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get drive: ${error.message}`);
    }
  }

  /**
   * Get drive items (files and folders)
   */
  async getDriveItems(itemId = 'root', options = {}) {
    try {
      const params = {};

      if (options.select) {
        params.$select = Array.isArray(options.select) ? options.select.join(',') : options.select;
      }

      const response = await this.client.get(`/me/drive/items/${itemId}/children`, {
        params,
        scopes: ['Files.Read']
      });

      return response.data.value;
    } catch (error) {
      throw new Error(`Failed to get drive items: ${error.message}`);
    }
  }

  /**
   * Download file content
   */
  async downloadFile(itemId) {
    try {
      const response = await this.client.get(`/me/drive/items/${itemId}/content`, {
        scopes: ['Files.Read'],
        responseType: 'arraybuffer'
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Upload file
   */
  async uploadFile(parentId, fileName, content) {
    try {
      const response = await this.client.put(
        `/me/drive/items/${parentId}:/${fileName}:/content`,
        content,
        {
          scopes: ['Files.ReadWrite'],
          headers: {
            'Content-Type': 'application/octet-stream'
          }
        }
      );

      this.emit('fileUploaded', { itemId: response.data.id, fileName });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Create folder
   */
  async createFolder(parentId, folderName) {
    try {
      const response = await this.client.post(`/me/drive/items/${parentId}/children`, {
        name: folderName,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename'
      }, {
        scopes: ['Files.ReadWrite']
      });

      this.emit('folderCreated', { itemId: response.data.id, folderName });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create folder: ${error.message}`);
    }
  }

  // ==================== LICENSING OPERATIONS ====================

  /**
   * Get subscribed SKUs
   */
  async getSubscribedSkus() {
    try {
      const response = await this.client.get('/subscribedSkus', {
        scopes: ['Directory.Read.All']
      });

      return response.data.value;
    } catch (error) {
      throw new Error(`Failed to get subscribed SKUs: ${error.message}`);
    }
  }

  /**
   * Get user licenses
   */
  async getUserLicenses(userId = 'me') {
    try {
      const response = await this.client.get(`/users/${userId}/licenseDetails`, {
        scopes: ['User.Read.All']
      });

      return response.data.value;
    } catch (error) {
      throw new Error(`Failed to get user licenses: ${error.message}`);
    }
  }

  /**
   * Assign license to user
   */
  async assignLicense(userId, addLicenses, removeLicenses = []) {
    try {
      const response = await this.client.post(`/users/${userId}/assignLicense`, {
        addLicenses: addLicenses,
        removeLicenses: removeLicenses
      }, {
        scopes: ['Directory.ReadWrite.All']
      });

      this.emit('licenseAssigned', { userId, licenses: addLicenses });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to assign license: ${error.message}`);
    }
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * Execute batch request
   */
  async executeBatch(requests) {
    try {
      const batchRequests = requests.map((req, index) => ({
        id: String(index + 1),
        method: req.method || 'GET',
        url: req.url,
        headers: req.headers || {},
        body: req.body || undefined
      }));

      const response = await this.client.post('/$batch', {
        requests: batchRequests
      });

      this.emit('batchExecuted', { requestCount: requests.length });
      return response.data.responses;
    } catch (error) {
      throw new Error(`Failed to execute batch: ${error.message}`);
    }
  }

  // ==================== DELTA QUERY OPERATIONS ====================

  /**
   * Get delta changes for users
   */
  async getUsersDelta(deltaLink = null) {
    try {
      const url = deltaLink || '/users/delta';

      const response = await this.client.get(url, {
        scopes: ['User.Read.All']
      });

      return {
        values: response.data.value,
        deltaLink: response.data['@odata.deltaLink'],
        nextLink: response.data['@odata.nextLink']
      };
    } catch (error) {
      throw new Error(`Failed to get users delta: ${error.message}`);
    }
  }

  /**
   * Get delta changes for groups
   */
  async getGroupsDelta(deltaLink = null) {
    try {
      const url = deltaLink || '/groups/delta';

      const response = await this.client.get(url, {
        scopes: ['Group.Read.All']
      });

      return {
        values: response.data.value,
        deltaLink: response.data['@odata.deltaLink'],
        nextLink: response.data['@odata.nextLink']
      };
    } catch (error) {
      throw new Error(`Failed to get groups delta: ${error.message}`);
    }
  }

  // ==================== PAGINATION HELPERS ====================

  /**
   * Get all pages from paginated response
   */
  async getAllPages(initialUrl, scopes = ['User.Read']) {
    const allResults = [];
    let nextLink = initialUrl;

    while (nextLink) {
      const response = await this.client.get(nextLink, { scopes });
      allResults.push(...response.data.value);
      nextLink = response.data['@odata.nextLink'];
    }

    return allResults;
  }
}

module.exports = GraphClient;
