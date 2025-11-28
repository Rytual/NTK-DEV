/**
 * ConnectWise Manage REST API Client
 * Direct REST API implementation using Node.js https module + Basic Auth
 * NO npm package - pure Node.js implementation
 *
 * API Version: v2023.4
 * Authentication: Basic Auth with clientId:companyId+publicKey:privateKey
 * Rate Limiting: 200 requests/minute
 * Compression: gzip, deflate
 */

const https = require('https');
const { URL } = require('url');
const zlib = require('zlib');
const { EventEmitter } = require('events');
const crypto = require('crypto');

/**
 * ConnectWise Manage REST API Client
 * Implements direct HTTPS communication with ConnectWise API
 */
class ConnectWiseClient extends EventEmitter {
  constructor(config) {
    super();

    if (!config || !config.companyId || !config.publicKey || !config.privateKey || !config.clientId || !config.apiUrl) {
      throw new Error('ConnectWise configuration incomplete. Required: companyId, publicKey, privateKey, clientId, apiUrl');
    }

    this.config = {
      companyId: config.companyId,
      publicKey: config.publicKey,
      privateKey: config.privateKey,
      clientId: config.clientId,
      apiUrl: config.apiUrl.replace(/\/$/, ''), // Remove trailing slash
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      rateLimit: config.rateLimit || 200, // requests per minute
      debug: config.debug || false
    };

    // Rate limiting
    this.rateLimiter = {
      requests: [],
      maxRequests: this.config.rateLimit,
      windowMs: 60000 // 1 minute
    };

    // Request queue for rate limiting
    this.requestQueue = [];
    this.isProcessingQueue = false;

    // Statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      rateLimitHits: 0,
      averageResponseTime: 0,
      responseTimes: []
    };

    // Generate auth header
    this.authHeader = this._generateAuthHeader();

    this._log('ConnectWise Client initialized', {
      apiUrl: this.config.apiUrl,
      companyId: this.config.companyId,
      rateLimit: this.config.rateLimit
    });
  }

  /**
   * Generate Basic Auth header
   * Format: Basic base64(companyId+publicKey:privateKey)
   */
  _generateAuthHeader() {
    const authString = `${this.config.companyId}+${this.config.publicKey}:${this.config.privateKey}`;
    const base64Auth = Buffer.from(authString).toString('base64');
    return `Basic ${base64Auth}`;
  }

  /**
   * Log debug information
   */
  _log(message, data = null) {
    if (this.config.debug) {
      const timestamp = new Date().toISOString();
      console.log(`[ConnectWise] ${timestamp} - ${message}`, data || '');
    }
    this.emit('log', { message, data, timestamp: Date.now() });
  }

  /**
   * Check rate limit and add to queue if necessary
   */
  async _checkRateLimit() {
    const now = Date.now();

    // Remove requests outside the time window
    this.rateLimiter.requests = this.rateLimiter.requests.filter(
      timestamp => now - timestamp < this.rateLimiter.windowMs
    );

    // Check if we're at the rate limit
    if (this.rateLimiter.requests.length >= this.rateLimiter.maxRequests) {
      this.stats.rateLimitHits++;
      const oldestRequest = this.rateLimiter.requests[0];
      const waitTime = this.rateLimiter.windowMs - (now - oldestRequest);

      this._log(`Rate limit reached. Waiting ${waitTime}ms`);
      this.emit('rateLimitHit', { waitTime, currentRequests: this.rateLimiter.requests.length });

      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this._checkRateLimit(); // Re-check after waiting
    }

    // Add this request to the rate limiter
    this.rateLimiter.requests.push(now);
  }

  /**
   * Make HTTP request using Node.js https module
   */
  _makeRequest(method, path, body = null, customHeaders = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      // Parse URL
      const url = new URL(`${this.config.apiUrl}${path}`);

      // Prepare request body
      let requestBody = null;
      if (body) {
        requestBody = typeof body === 'string' ? body : JSON.stringify(body);
      }

      // Prepare headers
      const headers = {
        'Authorization': this.authHeader,
        'clientId': this.config.clientId,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        ...customHeaders
      };

      if (requestBody) {
        headers['Content-Length'] = Buffer.byteLength(requestBody);
      }

      // Request options
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: method,
        headers: headers,
        timeout: this.config.timeout
      };

      this._log(`Request: ${method} ${path}`, { body: body || null });

      // Make request
      const req = https.request(options, (res) => {
        const chunks = [];
        let stream = res;

        // Handle compression
        const encoding = res.headers['content-encoding'];
        if (encoding === 'gzip') {
          stream = res.pipe(zlib.createGunzip());
        } else if (encoding === 'deflate') {
          stream = res.pipe(zlib.createInflate());
        }

        stream.on('data', (chunk) => {
          chunks.push(chunk);
        });

        stream.on('end', () => {
          const responseTime = Date.now() - startTime;
          this.stats.responseTimes.push(responseTime);
          if (this.stats.responseTimes.length > 100) {
            this.stats.responseTimes.shift();
          }
          this.stats.averageResponseTime =
            this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length;

          const buffer = Buffer.concat(chunks);
          const responseText = buffer.toString('utf-8');

          this._log(`Response: ${res.statusCode}`, {
            responseTime,
            size: buffer.length,
            headers: res.headers
          });

          // Parse response
          let data = null;
          if (responseText) {
            try {
              data = JSON.parse(responseText);
            } catch (e) {
              data = responseText;
            }
          }

          // Handle HTTP status codes
          if (res.statusCode >= 200 && res.statusCode < 300) {
            this.stats.successfulRequests++;
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: data,
              responseTime: responseTime
            });
          } else {
            this.stats.failedRequests++;
            const error = new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`);
            error.statusCode = res.statusCode;
            error.response = data;
            error.headers = res.headers;
            reject(error);
          }
        });

        stream.on('error', (err) => {
          this.stats.failedRequests++;
          this._log('Stream error', err);
          reject(err);
        });
      });

      req.on('error', (err) => {
        this.stats.failedRequests++;
        this._log('Request error', err);
        reject(err);
      });

      req.on('timeout', () => {
        this.stats.failedRequests++;
        const err = new Error(`Request timeout after ${this.config.timeout}ms`);
        this._log('Request timeout', err);
        req.destroy();
        reject(err);
      });

      // Write body if present
      if (requestBody) {
        req.write(requestBody);
      }

      req.end();
    });
  }

  /**
   * Make request with retry logic and exponential backoff
   */
  async _requestWithRetry(method, path, body = null, customHeaders = {}, retryCount = 0) {
    try {
      this.stats.totalRequests++;

      // Check rate limit before making request
      await this._checkRateLimit();

      const response = await this._makeRequest(method, path, body, customHeaders);

      this.emit('requestComplete', {
        method,
        path,
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        retryCount
      });

      return response;
    } catch (error) {
      this._log(`Request failed (attempt ${retryCount + 1}/${this.config.maxRetries + 1})`, error);

      // Check if we should retry
      const shouldRetry = retryCount < this.config.maxRetries &&
                         (error.code === 'ECONNRESET' ||
                          error.code === 'ETIMEDOUT' ||
                          error.statusCode === 429 ||
                          error.statusCode >= 500);

      if (shouldRetry) {
        this.stats.retriedRequests++;

        // Calculate exponential backoff delay
        const delay = this.config.retryDelay * Math.pow(2, retryCount);

        this._log(`Retrying in ${delay}ms...`);
        this.emit('requestRetry', { method, path, retryCount, delay, error });

        await new Promise(resolve => setTimeout(resolve, delay));

        return this._requestWithRetry(method, path, body, customHeaders, retryCount + 1);
      }

      this.emit('requestError', { method, path, error, retryCount });
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    let path = endpoint;

    // Add query parameters
    if (Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      path += `?${queryString}`;
    }

    const response = await this._requestWithRetry('GET', path);
    return response.data;
  }

  /**
   * POST request
   */
  async post(endpoint, data) {
    const response = await this._requestWithRetry('POST', endpoint, data);
    return response.data;
  }

  /**
   * PUT request
   */
  async put(endpoint, data) {
    const response = await this._requestWithRetry('PUT', endpoint, data);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data) {
    const response = await this._requestWithRetry('PATCH', endpoint, data);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    const response = await this._requestWithRetry('DELETE', endpoint);
    return response.data;
  }

  /**
   * Paginated GET request
   * Automatically fetches all pages
   */
  async getPaginated(endpoint, params = {}, pageSize = 100) {
    const allResults = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const pageParams = {
        ...params,
        page: page,
        pageSize: pageSize
      };

      this._log(`Fetching page ${page}`, pageParams);

      const results = await this.get(endpoint, pageParams);

      if (Array.isArray(results)) {
        allResults.push(...results);

        // Check if there are more pages
        if (results.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        // Single result or no pagination
        allResults.push(results);
        hasMore = false;
      }

      this.emit('paginationProgress', {
        endpoint,
        page,
        pageSize,
        totalFetched: allResults.length
      });
    }

    this._log(`Pagination complete: ${allResults.length} total results`);

    return allResults;
  }

  /**
   * Service Boards API
   */
  async getBoards(conditions = null) {
    const params = {};
    if (conditions) {
      params.conditions = conditions;
    }
    return this.get('/service/boards', params);
  }

  async getBoard(boardId) {
    return this.get(`/service/boards/${boardId}`);
  }

  async getBoardStatuses(boardId) {
    return this.get(`/service/boards/${boardId}/statuses`);
  }

  /**
   * Service Tickets API
   */
  async getTickets(conditions = null, orderBy = null, page = 1, pageSize = 25) {
    const params = { page, pageSize };
    if (conditions) {
      params.conditions = conditions;
    }
    if (orderBy) {
      params.orderBy = orderBy;
    }
    return this.get('/service/tickets', params);
  }

  async getTicket(ticketId) {
    return this.get(`/service/tickets/${ticketId}`);
  }

  async createTicket(ticketData) {
    return this.post('/service/tickets', ticketData);
  }

  async updateTicket(ticketId, updates) {
    return this.patch(`/service/tickets/${ticketId}`, updates);
  }

  async deleteTicket(ticketId) {
    return this.delete(`/service/tickets/${ticketId}`);
  }

  /**
   * Service Ticket Notes API
   */
  async getTicketNotes(ticketId, orderBy = 'dateCreated desc') {
    return this.get(`/service/tickets/${ticketId}/notes`, { orderBy });
  }

  async createTicketNote(ticketId, noteData) {
    return this.post(`/service/tickets/${ticketId}/notes`, noteData);
  }

  async updateTicketNote(ticketId, noteId, updates) {
    return this.patch(`/service/tickets/${ticketId}/notes/${noteId}`, updates);
  }

  async deleteTicketNote(ticketId, noteId) {
    return this.delete(`/service/tickets/${ticketId}/notes/${noteId}`);
  }

  /**
   * Service Time Entries API
   */
  async getTicketTimeEntries(ticketId) {
    return this.get(`/service/tickets/${ticketId}/timeentries`);
  }

  async createTimeEntry(ticketId, timeEntryData) {
    return this.post(`/service/tickets/${ticketId}/timeentries`, timeEntryData);
  }

  async updateTimeEntry(timeEntryId, updates) {
    return this.patch(`/time/entries/${timeEntryId}`, updates);
  }

  async deleteTimeEntry(timeEntryId) {
    return this.delete(`/time/entries/${timeEntryId}`);
  }

  /**
   * Company API
   */
  async getCompanies(conditions = null, orderBy = null, page = 1, pageSize = 25) {
    const params = { page, pageSize };
    if (conditions) {
      params.conditions = conditions;
    }
    if (orderBy) {
      params.orderBy = orderBy;
    }
    return this.get('/company/companies', params);
  }

  async getCompany(companyId) {
    return this.get(`/company/companies/${companyId}`);
  }

  async createCompany(companyData) {
    return this.post('/company/companies', companyData);
  }

  async updateCompany(companyId, updates) {
    return this.patch(`/company/companies/${companyId}`, updates);
  }

  async deleteCompany(companyId) {
    return this.delete(`/company/companies/${companyId}`);
  }

  /**
   * Company Contacts API
   */
  async getContacts(conditions = null, orderBy = null, page = 1, pageSize = 25) {
    const params = { page, pageSize };
    if (conditions) {
      params.conditions = conditions;
    }
    if (orderBy) {
      params.orderBy = orderBy;
    }
    return this.get('/company/contacts', params);
  }

  async getContact(contactId) {
    return this.get(`/company/contacts/${contactId}`);
  }

  async createContact(contactData) {
    return this.post('/company/contacts', contactData);
  }

  async updateContact(contactId, updates) {
    return this.patch(`/company/contacts/${contactId}`, updates);
  }

  async deleteContact(contactId) {
    return this.delete(`/company/contacts/${contactId}`);
  }

  /**
   * Company Configurations API
   */
  async getConfigurations(conditions = null, orderBy = null, page = 1, pageSize = 25) {
    const params = { page, pageSize };
    if (conditions) {
      params.conditions = conditions;
    }
    if (orderBy) {
      params.orderBy = orderBy;
    }
    return this.get('/company/configurations', params);
  }

  async getConfiguration(configurationId) {
    return this.get(`/company/configurations/${configurationId}`);
  }

  async createConfiguration(configurationData) {
    return this.post('/company/configurations', configurationData);
  }

  async updateConfiguration(configurationId, updates) {
    return this.patch(`/company/configurations/${configurationId}`, updates);
  }

  async deleteConfiguration(configurationId) {
    return this.delete(`/company/configurations/${configurationId}`);
  }

  /**
   * Service Ticket Documents API
   */
  async getTicketDocuments(ticketId) {
    return this.get(`/service/tickets/${ticketId}/documents`);
  }

  async getTicketDocument(ticketId, documentId) {
    return this.get(`/service/tickets/${ticketId}/documents/${documentId}`);
  }

  async downloadTicketDocument(ticketId, documentId) {
    // Download returns binary data
    const response = await this._requestWithRetry(
      'GET',
      `/service/tickets/${ticketId}/documents/${documentId}/download`
    );
    return response.data;
  }

  /**
   * Upload document to ticket
   * Uses multipart/form-data
   */
  async uploadTicketDocument(ticketId, file) {
    return new Promise((resolve, reject) => {
      const boundary = `----ConnectWiseBoundary${Date.now()}`;
      const url = new URL(`${this.config.apiUrl}/service/tickets/${ticketId}/documents`);

      // Prepare multipart body
      const parts = [];

      // Add file part
      parts.push(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${file.name}"\r\n` +
        `Content-Type: ${file.mimeType || 'application/octet-stream'}\r\n\r\n`
      );
      parts.push(file.data);
      parts.push(`\r\n--${boundary}--\r\n`);

      const body = Buffer.concat([
        Buffer.from(parts[0]),
        file.data,
        Buffer.from(parts[2])
      ]);

      // Prepare headers
      const headers = {
        'Authorization': this.authHeader,
        'clientId': this.config.clientId,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      };

      // Request options
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: headers,
        timeout: this.config.timeout * 3 // Triple timeout for uploads
      };

      this._log(`Uploading document: ${file.name} (${body.length} bytes)`);

      const req = https.request(options, (res) => {
        const chunks = [];

        res.on('data', (chunk) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          const responseText = Buffer.concat(chunks).toString('utf-8');
          let data = null;

          try {
            data = JSON.parse(responseText);
          } catch (e) {
            data = responseText;
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            this._log('Document uploaded successfully', data);
            resolve(data);
          } else {
            const error = new Error(`Upload failed: HTTP ${res.statusCode}`);
            error.statusCode = res.statusCode;
            error.response = data;
            reject(error);
          }
        });
      });

      req.on('error', (err) => {
        this._log('Upload error', err);
        reject(err);
      });

      req.on('timeout', () => {
        const err = new Error('Upload timeout');
        req.destroy();
        reject(err);
      });

      req.write(body);
      req.end();
    });
  }

  /**
   * Search API - generic search across entities
   */
  async search(entity, searchString, fields = null) {
    const params = {
      search: searchString
    };

    if (fields) {
      params.fields = fields.join(',');
    }

    return this.get(`/${entity}`, params);
  }

  /**
   * Batch operations - execute multiple operations in sequence
   */
  async batch(operations) {
    const results = [];

    for (const operation of operations) {
      try {
        const result = await this[operation.method](
          operation.endpoint,
          ...operation.args
        );
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Get client statistics
   */
  getStats() {
    return {
      ...this.stats,
      rateLimiter: {
        currentRequests: this.rateLimiter.requests.length,
        maxRequests: this.rateLimiter.maxRequests,
        windowMs: this.rateLimiter.windowMs
      },
      config: {
        apiUrl: this.config.apiUrl,
        companyId: this.config.companyId,
        rateLimit: this.config.rateLimit,
        maxRetries: this.config.maxRetries
      }
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      rateLimitHits: 0,
      averageResponseTime: 0,
      responseTimes: []
    };

    this.emit('statsReset');
  }

  /**
   * Test connection to ConnectWise API
   */
  async testConnection() {
    try {
      const boards = await this.get('/service/boards', { pageSize: 1 });
      return {
        success: true,
        message: 'Connection successful',
        data: boards
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  /**
   * Get API info
   */
  async getApiInfo() {
    return this.get('/system/info');
  }

  /**
   * Get company info (member API)
   */
  async getMembers(conditions = null) {
    const params = {};
    if (conditions) {
      params.conditions = conditions;
    }
    return this.get('/system/members', params);
  }

  async getMember(memberId) {
    return this.get(`/system/members/${memberId}`);
  }
}

module.exports = ConnectWiseClient;
