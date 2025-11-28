/**
 * Microsoft Authentication Library (MSAL) Integration
 * Full MSAL 3.x implementation with OAuth 2.0 flows
 * Supports authorization code, device code, and client credentials flows
 *
 * @module msal-auth
 * @version 3.0.0
 */

const msal = require('@azure/msal-node');
const msalBrowser = require('@azure/msal-browser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

/**
 * MSAL Authentication Manager
 * Handles all authentication flows for Microsoft 365 and Azure AD
 */
class MSALAuthManager extends EventEmitter {
  constructor(config) {
    super();
    this.config = config || this.loadDefaultConfig();
    this.publicClientApp = null;
    this.confidentialClientApp = null;
    this.tokenCache = new Map();
    this.accountCache = new Map();
    this.refreshTimers = new Map();
    this.authState = 'unauthenticated';
    this.currentAccount = null;

    this.initializeClients();
  }

  /**
   * Load default MSAL configuration
   */
  loadDefaultConfig() {
    const configPath = path.join(__dirname, '../../config/msal-config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    return {
      auth: {
        clientId: process.env.MSAL_CLIENT_ID || 'your-client-id',
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: 'http://localhost:3000/auth/redirect',
        postLogoutRedirectUri: 'http://localhost:3000',
        navigateToLoginRequestUrl: true,
        clientSecret: process.env.MSAL_CLIENT_SECRET || null,
        knownAuthorities: ['login.microsoftonline.com']
      },
      cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: false,
        secureCookies: true
      },
      system: {
        loggerOptions: {
          loggerCallback: this.loggerCallback.bind(this),
          piiLoggingEnabled: false,
          logLevel: msal.LogLevel.Info
        },
        windowHashTimeout: 60000,
        iframeHashTimeout: 6000,
        loadFrameTimeout: 0,
        asyncPopups: false
      },
      telemetry: {
        application: {
          appName: 'NinjaToolkit',
          appVersion: '7.0.0'
        }
      }
    };
  }

  /**
   * Initialize MSAL client applications
   */
  initializeClients() {
    try {
      // Initialize Public Client Application (for user flows)
      const publicClientConfig = {
        auth: {
          clientId: this.config.auth.clientId,
          authority: this.config.auth.authority,
          knownAuthorities: this.config.auth.knownAuthorities
        },
        cache: {
          cachePlugin: this.createCachePlugin()
        },
        system: this.config.system
      };

      this.publicClientApp = new msal.PublicClientApplication(publicClientConfig);

      // Initialize Confidential Client Application (for service apps)
      if (this.config.auth.clientSecret) {
        const confidentialClientConfig = {
          auth: {
            clientId: this.config.auth.clientId,
            authority: this.config.auth.authority,
            clientSecret: this.config.auth.clientSecret
          },
          cache: {
            cachePlugin: this.createCachePlugin()
          },
          system: this.config.system
        };

        this.confidentialClientApp = new msal.ConfidentialClientApplication(confidentialClientConfig);
      }

      this.emit('initialized', { publicClient: !!this.publicClientApp, confidentialClient: !!this.confidentialClientApp });
    } catch (error) {
      this.emit('error', { operation: 'initialize', error });
      throw new Error(`Failed to initialize MSAL clients: ${error.message}`);
    }
  }

  /**
   * Create cache plugin for token persistence
   */
  createCachePlugin() {
    const cacheDir = path.join(__dirname, '../../.cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const cachePath = path.join(cacheDir, 'msal-cache.json');

    const beforeCacheAccess = async (cacheContext) => {
      try {
        if (fs.existsSync(cachePath)) {
          const cacheData = fs.readFileSync(cachePath, 'utf8');
          cacheContext.tokenCache.deserialize(cacheData);
        }
      } catch (error) {
        console.error('Error loading cache:', error);
      }
    };

    const afterCacheAccess = async (cacheContext) => {
      try {
        if (cacheContext.cacheHasChanged) {
          const cacheData = cacheContext.tokenCache.serialize();
          fs.writeFileSync(cachePath, cacheData);
        }
      } catch (error) {
        console.error('Error saving cache:', error);
      }
    };

    return {
      beforeCacheAccess,
      afterCacheAccess
    };
  }

  /**
   * Logger callback for MSAL events
   */
  loggerCallback(level, message, containsPii) {
    if (containsPii) return;

    const logLevel = {
      [msal.LogLevel.Error]: 'error',
      [msal.LogLevel.Warning]: 'warn',
      [msal.LogLevel.Info]: 'info',
      [msal.LogLevel.Verbose]: 'debug'
    }[level] || 'log';

    console[logLevel](`[MSAL] ${message}`);
    this.emit('log', { level: logLevel, message });
  }

  /**
   * Authorization Code Flow - Interactive login
   * @param {Array<string>} scopes - Permission scopes to request
   * @param {Object} options - Additional options
   */
  async loginWithAuthorizationCode(scopes = ['User.Read'], options = {}) {
    try {
      this.authState = 'authenticating';
      this.emit('authStateChanged', { state: 'authenticating', flow: 'authorizationCode' });

      const authCodeUrlParameters = {
        scopes: scopes,
        redirectUri: this.config.auth.redirectUri,
        prompt: options.prompt || 'select_account',
        state: this.generateState(),
        loginHint: options.loginHint || undefined,
        domainHint: options.domainHint || undefined,
        extraScopesToConsent: options.extraScopes || undefined,
        codeChallenge: await this.generateCodeChallenge(),
        codeChallengeMethod: 'S256'
      };

      const authCodeUrl = await this.publicClientApp.getAuthCodeUrl(authCodeUrlParameters);

      this.emit('authCodeUrlGenerated', { url: authCodeUrl });

      // In a real implementation, this would open a browser window
      // For now, we'll simulate the redirect
      console.log('Navigate to:', authCodeUrl);

      return {
        authCodeUrl,
        state: authCodeUrlParameters.state,
        codeVerifier: this.codeVerifier
      };
    } catch (error) {
      this.authState = 'error';
      this.emit('authStateChanged', { state: 'error', error });
      throw new Error(`Authorization code flow failed: ${error.message}`);
    }
  }

  /**
   * Complete authorization code flow with code from redirect
   */
  async acquireTokenByCode(code, codeVerifier, scopes = ['User.Read']) {
    try {
      const tokenRequest = {
        code: code,
        scopes: scopes,
        redirectUri: this.config.auth.redirectUri,
        codeVerifier: codeVerifier
      };

      const response = await this.publicClientApp.acquireTokenByCode(tokenRequest);

      this.handleTokenResponse(response);

      return response;
    } catch (error) {
      this.authState = 'error';
      this.emit('authStateChanged', { state: 'error', error });
      throw new Error(`Token acquisition by code failed: ${error.message}`);
    }
  }

  /**
   * Device Code Flow - For headless/CLI authentication
   * @param {Array<string>} scopes - Permission scopes to request
   */
  async loginWithDeviceCode(scopes = ['User.Read', 'offline_access']) {
    try {
      this.authState = 'authenticating';
      this.emit('authStateChanged', { state: 'authenticating', flow: 'deviceCode' });

      const deviceCodeRequest = {
        deviceCodeCallback: (response) => {
          console.log('\n=== DEVICE CODE AUTHENTICATION ===');
          console.log(`1. Open browser to: ${response.verificationUri}`);
          console.log(`2. Enter code: ${response.userCode}`);
          console.log(`3. Code expires in ${response.expiresIn} seconds`);
          console.log('==================================\n');

          this.emit('deviceCodePrompt', {
            verificationUri: response.verificationUri,
            userCode: response.userCode,
            message: response.message,
            expiresIn: response.expiresIn
          });
        },
        scopes: scopes,
        timeout: 120000 // 2 minutes
      };

      const response = await this.publicClientApp.acquireTokenByDeviceCode(deviceCodeRequest);

      this.handleTokenResponse(response);

      return response;
    } catch (error) {
      this.authState = 'error';
      this.emit('authStateChanged', { state: 'error', error });
      throw new Error(`Device code flow failed: ${error.message}`);
    }
  }

  /**
   * Client Credentials Flow - For service-to-service authentication
   * @param {Array<string>} scopes - Permission scopes (should end with .default)
   */
  async loginWithClientCredentials(scopes = ['https://graph.microsoft.com/.default']) {
    try {
      if (!this.confidentialClientApp) {
        throw new Error('Client credentials flow requires a client secret');
      }

      this.authState = 'authenticating';
      this.emit('authStateChanged', { state: 'authenticating', flow: 'clientCredentials' });

      const clientCredentialRequest = {
        scopes: scopes,
        skipCache: false
      };

      const response = await this.confidentialClientApp.acquireTokenByClientCredential(clientCredentialRequest);

      this.handleTokenResponse(response, 'service');

      return response;
    } catch (error) {
      this.authState = 'error';
      this.emit('authStateChanged', { state: 'error', error });
      throw new Error(`Client credentials flow failed: ${error.message}`);
    }
  }

  /**
   * Silent Token Acquisition - Try to get token without user interaction
   * @param {Array<string>} scopes - Permission scopes to request
   * @param {Object} account - Account object from previous authentication
   */
  async acquireTokenSilent(scopes = ['User.Read'], account = null) {
    try {
      const targetAccount = account || this.currentAccount;

      if (!targetAccount) {
        throw new Error('No account available for silent authentication');
      }

      const silentRequest = {
        scopes: scopes,
        account: targetAccount,
        forceRefresh: false
      };

      const response = await this.publicClientApp.acquireTokenSilent(silentRequest);

      this.handleTokenResponse(response);

      return response;
    } catch (error) {
      if (error.name === 'InteractionRequiredAuthError') {
        this.emit('interactionRequired', { scopes, error });
        throw new Error('Interaction required - silent authentication failed');
      }

      throw new Error(`Silent token acquisition failed: ${error.message}`);
    }
  }

  /**
   * Refresh Token Flow - Manually refresh access token
   * @param {string} refreshToken - Refresh token from previous authentication
   * @param {Array<string>} scopes - Permission scopes to request
   */
  async acquireTokenByRefreshToken(refreshToken, scopes = ['User.Read']) {
    try {
      const refreshTokenRequest = {
        refreshToken: refreshToken,
        scopes: scopes
      };

      const response = await this.publicClientApp.acquireTokenByRefreshToken(refreshTokenRequest);

      this.handleTokenResponse(response);

      return response;
    } catch (error) {
      throw new Error(`Refresh token flow failed: ${error.message}`);
    }
  }

  /**
   * Handle token response and cache management
   */
  handleTokenResponse(response, accountType = 'user') {
    if (!response || !response.accessToken) {
      throw new Error('Invalid token response');
    }

    // Cache the token
    const cacheKey = this.generateCacheKey(response.scopes);
    this.tokenCache.set(cacheKey, {
      accessToken: response.accessToken,
      idToken: response.idToken,
      refreshToken: response.refreshToken,
      expiresOn: response.expiresOn,
      scopes: response.scopes,
      tokenType: response.tokenType,
      cachedAt: new Date()
    });

    // Cache the account
    if (response.account) {
      this.currentAccount = response.account;
      this.accountCache.set(response.account.homeAccountId, response.account);

      this.emit('accountUpdated', { account: response.account });
    }

    // Set up automatic token refresh
    this.setupTokenRefresh(cacheKey, response.expiresOn, response.scopes);

    this.authState = 'authenticated';
    this.emit('authStateChanged', {
      state: 'authenticated',
      accountType,
      account: response.account
    });

    this.emit('tokenAcquired', {
      expiresOn: response.expiresOn,
      scopes: response.scopes,
      accountType
    });
  }

  /**
   * Set up automatic token refresh
   */
  setupTokenRefresh(cacheKey, expiresOn, scopes) {
    // Clear existing timer if any
    if (this.refreshTimers.has(cacheKey)) {
      clearTimeout(this.refreshTimers.get(cacheKey));
    }

    // Calculate refresh time (5 minutes before expiry)
    const expiryTime = new Date(expiresOn).getTime();
    const refreshTime = expiryTime - (5 * 60 * 1000);
    const timeUntilRefresh = refreshTime - Date.now();

    if (timeUntilRefresh > 0) {
      const timer = setTimeout(async () => {
        try {
          await this.acquireTokenSilent(scopes);
          this.emit('tokenRefreshed', { scopes, time: new Date() });
        } catch (error) {
          this.emit('tokenRefreshFailed', { scopes, error });
        }
      }, timeUntilRefresh);

      this.refreshTimers.set(cacheKey, timer);
    }
  }

  /**
   * Get all cached accounts
   */
  async getAllAccounts() {
    try {
      const accounts = await this.publicClientApp.getAllAccounts();
      return accounts;
    } catch (error) {
      throw new Error(`Failed to get accounts: ${error.message}`);
    }
  }

  /**
   * Get account by home account ID
   */
  async getAccountByHomeId(homeAccountId) {
    try {
      const account = await this.publicClientApp.getAccountByHomeId(homeAccountId);
      return account;
    } catch (error) {
      throw new Error(`Failed to get account: ${error.message}`);
    }
  }

  /**
   * Get account by username
   */
  async getAccountByUsername(username) {
    try {
      const account = await this.publicClientApp.getAccountByUsername(username);
      return account;
    } catch (error) {
      throw new Error(`Failed to get account: ${error.message}`);
    }
  }

  /**
   * Sign out user
   */
  async logout(account = null) {
    try {
      const targetAccount = account || this.currentAccount;

      if (targetAccount) {
        const logoutRequest = {
          account: targetAccount,
          postLogoutRedirectUri: this.config.auth.postLogoutRedirectUri
        };

        await this.publicClientApp.getLogoutUri(logoutRequest);

        // Clear caches
        const cacheKey = this.generateCacheKey(['all']);
        this.tokenCache.delete(cacheKey);
        this.accountCache.delete(targetAccount.homeAccountId);

        // Clear refresh timers
        this.refreshTimers.forEach((timer) => clearTimeout(timer));
        this.refreshTimers.clear();

        this.currentAccount = null;
        this.authState = 'unauthenticated';

        this.emit('authStateChanged', { state: 'unauthenticated' });
        this.emit('logout', { account: targetAccount });
      }

      return true;
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  /**
   * Get cached access token
   */
  getCachedToken(scopes = ['User.Read']) {
    const cacheKey = this.generateCacheKey(scopes);
    const cachedToken = this.tokenCache.get(cacheKey);

    if (!cachedToken) {
      return null;
    }

    // Check if token is expired
    if (new Date(cachedToken.expiresOn) <= new Date()) {
      this.tokenCache.delete(cacheKey);
      return null;
    }

    return cachedToken.accessToken;
  }

  /**
   * Validate access token
   */
  async validateToken(accessToken) {
    try {
      // Decode JWT token
      const tokenParts = accessToken.split('.');
      if (tokenParts.length !== 3) {
        return { valid: false, error: 'Invalid token format' };
      }

      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return { valid: false, error: 'Token expired' };
      }

      // Check not before
      if (payload.nbf && payload.nbf > now) {
        return { valid: false, error: 'Token not yet valid' };
      }

      return {
        valid: true,
        claims: payload,
        expiresAt: new Date(payload.exp * 1000),
        issuedAt: new Date(payload.iat * 1000)
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Handle Conditional Access challenges
   */
  async handleConditionalAccess(claims) {
    try {
      if (!this.currentAccount) {
        throw new Error('No account available for conditional access challenge');
      }

      const authRequest = {
        scopes: ['User.Read'],
        account: this.currentAccount,
        claims: claims,
        forceRefresh: true
      };

      const response = await this.publicClientApp.acquireTokenSilent(authRequest);
      this.handleTokenResponse(response);

      return response;
    } catch (error) {
      if (error.name === 'InteractionRequiredAuthError') {
        this.emit('conditionalAccessRequired', { claims, error });
      }
      throw new Error(`Conditional access handling failed: ${error.message}`);
    }
  }

  /**
   * Request additional scopes
   */
  async requestAdditionalScopes(additionalScopes = []) {
    try {
      if (!this.currentAccount) {
        throw new Error('No account available');
      }

      const currentScopes = this.getCurrentScopes();
      const allScopes = [...new Set([...currentScopes, ...additionalScopes])];

      const response = await this.acquireTokenSilent(allScopes);

      return response;
    } catch (error) {
      if (error.name === 'InteractionRequiredAuthError') {
        // Need interactive authentication for new scopes
        this.emit('interactionRequired', { scopes: additionalScopes, error });
      }
      throw new Error(`Failed to request additional scopes: ${error.message}`);
    }
  }

  /**
   * Get current scopes from cached tokens
   */
  getCurrentScopes() {
    const scopes = new Set();

    this.tokenCache.forEach((token) => {
      if (token.scopes) {
        token.scopes.forEach(scope => scopes.add(scope));
      }
    });

    return Array.from(scopes);
  }

  /**
   * Generate cache key for token storage
   */
  generateCacheKey(scopes) {
    return `token:${scopes.sort().join(':')}`;
  }

  /**
   * Generate random state for CSRF protection
   */
  generateState() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate PKCE code challenge
   */
  async generateCodeChallenge() {
    this.codeVerifier = crypto.randomBytes(32).toString('base64url');
    const hash = crypto.createHash('sha256').update(this.codeVerifier).digest();
    return hash.toString('base64url');
  }

  /**
   * Get authentication state
   */
  getAuthState() {
    return {
      state: this.authState,
      isAuthenticated: this.authState === 'authenticated',
      currentAccount: this.currentAccount,
      scopes: this.getCurrentScopes(),
      tokenCount: this.tokenCache.size,
      accountCount: this.accountCache.size
    };
  }

  /**
   * Multi-tenant account switching
   */
  async switchTenant(tenantId, scopes = ['User.Read']) {
    try {
      if (!this.currentAccount) {
        throw new Error('No account available');
      }

      // Update authority to specific tenant
      const tenantAuthority = `https://login.microsoftonline.com/${tenantId}`;

      const tokenRequest = {
        scopes: scopes,
        account: this.currentAccount,
        authority: tenantAuthority,
        forceRefresh: true
      };

      const response = await this.publicClientApp.acquireTokenSilent(tokenRequest);
      this.handleTokenResponse(response);

      this.emit('tenantSwitched', { tenantId, account: response.account });

      return response;
    } catch (error) {
      throw new Error(`Tenant switch failed: ${error.message}`);
    }
  }

  /**
   * Clear all caches and state
   */
  clearAllCaches() {
    this.tokenCache.clear();
    this.accountCache.clear();
    this.refreshTimers.forEach((timer) => clearTimeout(timer));
    this.refreshTimers.clear();
    this.currentAccount = null;
    this.authState = 'unauthenticated';

    this.emit('cachesCleared');
  }

  /**
   * Export authentication state for persistence
   */
  exportAuthState() {
    return {
      tokens: Array.from(this.tokenCache.entries()),
      accounts: Array.from(this.accountCache.entries()),
      currentAccount: this.currentAccount,
      authState: this.authState,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import authentication state from persistence
   */
  importAuthState(authState) {
    try {
      if (authState.tokens) {
        this.tokenCache = new Map(authState.tokens);
      }

      if (authState.accounts) {
        this.accountCache = new Map(authState.accounts);
      }

      if (authState.currentAccount) {
        this.currentAccount = authState.currentAccount;
      }

      if (authState.authState) {
        this.authState = authState.authState;
      }

      // Re-setup token refresh timers
      this.tokenCache.forEach((token, cacheKey) => {
        if (token.expiresOn && token.scopes) {
          this.setupTokenRefresh(cacheKey, token.expiresOn, token.scopes);
        }
      });

      this.emit('authStateImported', { tokenCount: this.tokenCache.size });
    } catch (error) {
      throw new Error(`Failed to import auth state: ${error.message}`);
    }
  }
}

/**
 * Scope management utilities
 */
class ScopeManager {
  static COMMON_SCOPES = {
    // User and profile
    USER_READ: 'User.Read',
    USER_READ_ALL: 'User.Read.All',
    USER_READ_WRITE: 'User.ReadWrite',
    USER_READ_WRITE_ALL: 'User.ReadWrite.All',

    // Mail
    MAIL_READ: 'Mail.Read',
    MAIL_READ_WRITE: 'Mail.ReadWrite',
    MAIL_SEND: 'Mail.Send',

    // Calendar
    CALENDARS_READ: 'Calendars.Read',
    CALENDARS_READ_WRITE: 'Calendars.ReadWrite',

    // Contacts
    CONTACTS_READ: 'Contacts.Read',
    CONTACTS_READ_WRITE: 'Contacts.ReadWrite',

    // Files
    FILES_READ: 'Files.Read',
    FILES_READ_ALL: 'Files.Read.All',
    FILES_READ_WRITE: 'Files.ReadWrite',
    FILES_READ_WRITE_ALL: 'Files.ReadWrite.All',

    // Groups
    GROUP_READ_ALL: 'Group.Read.All',
    GROUP_READ_WRITE_ALL: 'Group.ReadWrite.All',

    // Directory
    DIRECTORY_READ_ALL: 'Directory.Read.All',
    DIRECTORY_READ_WRITE_ALL: 'Directory.ReadWrite.All',

    // Teams
    TEAM_READ_BASIC_ALL: 'Team.ReadBasic.All',
    TEAMWORK_MIGRATE_ALL: 'Teamwork.Migrate.All',

    // Sites (SharePoint)
    SITES_READ_ALL: 'Sites.Read.All',
    SITES_READ_WRITE_ALL: 'Sites.ReadWrite.All',

    // Offline access
    OFFLINE_ACCESS: 'offline_access',
    OPENID: 'openid',
    PROFILE: 'profile',
    EMAIL: 'email'
  };

  /**
   * Get scopes for specific scenarios
   */
  static getScopesForScenario(scenario) {
    const scenarioScopes = {
      basicProfile: [this.COMMON_SCOPES.USER_READ, this.COMMON_SCOPES.OPENID, this.COMMON_SCOPES.PROFILE],
      mail: [this.COMMON_SCOPES.MAIL_READ, this.COMMON_SCOPES.MAIL_SEND],
      calendar: [this.COMMON_SCOPES.CALENDARS_READ_WRITE],
      files: [this.COMMON_SCOPES.FILES_READ_WRITE_ALL],
      admin: [this.COMMON_SCOPES.USER_READ_WRITE_ALL, this.COMMON_SCOPES.DIRECTORY_READ_WRITE_ALL],
      teams: [this.COMMON_SCOPES.TEAM_READ_BASIC_ALL, this.COMMON_SCOPES.GROUP_READ_WRITE_ALL]
    };

    return scenarioScopes[scenario] || [];
  }

  /**
   * Validate scope format
   */
  static validateScope(scope) {
    const scopePattern = /^[A-Za-z0-9\.\-_]+$/;
    return scopePattern.test(scope);
  }

  /**
   * Parse scope string into array
   */
  static parseScopes(scopeString) {
    if (Array.isArray(scopeString)) {
      return scopeString;
    }

    return scopeString.split(' ').filter(s => s.trim().length > 0);
  }

  /**
   * Merge scopes without duplicates
   */
  static mergeScopes(...scopeArrays) {
    const allScopes = scopeArrays.flat();
    return [...new Set(allScopes)];
  }
}

module.exports = {
  MSALAuthManager,
  ScopeManager
};
