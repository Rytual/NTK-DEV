/**
 * TypeScript Type Definitions for Ninja Toolkit Prompt 7
 * Complete type definitions for MSAL, Graph API, Pricing, and Script Runner
 *
 * @module types
 * @version 3.0.0
 */

// ==================== MSAL AUTHENTICATION TYPES ====================

export interface MSALConfiguration {
  auth: {
    clientId: string;
    authority: string;
    redirectUri: string;
    postLogoutRedirectUri: string;
    navigateToLoginRequestUrl: boolean;
    clientSecret?: string;
    knownAuthorities: string[];
  };
  cache: {
    cacheLocation: 'localStorage' | 'sessionStorage' | 'memoryStorage';
    storeAuthStateInCookie: boolean;
    secureCookies: boolean;
  };
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => void;
      piiLoggingEnabled: boolean;
      logLevel: LogLevel;
    };
    windowHashTimeout: number;
    iframeHashTimeout: number;
    loadFrameTimeout: number;
    asyncPopups: boolean;
  };
  telemetry: {
    application: {
      appName: string;
      appVersion: string;
    };
  };
}

export enum LogLevel {
  Error = 0,
  Warning = 1,
  Info = 2,
  Verbose = 3
}

export interface AuthenticationResult {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresOn: Date;
  scopes: string[];
  tokenType: string;
  account: AccountInfo;
}

export interface AccountInfo {
  homeAccountId: string;
  environment: string;
  tenantId: string;
  username: string;
  localAccountId: string;
  name?: string;
  idTokenClaims?: IdTokenClaims;
}

export interface IdTokenClaims {
  aud: string;
  iss: string;
  iat: number;
  nbf: number;
  exp: number;
  email?: string;
  name?: string;
  oid: string;
  preferred_username?: string;
  sub: string;
  tid: string;
  ver: string;
}

export interface TokenRequest {
  scopes: string[];
  account?: AccountInfo;
  authority?: string;
  correlationId?: string;
  forceRefresh?: boolean;
  claims?: string;
}

export interface DeviceCodeResponse {
  userCode: string;
  deviceCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
  message: string;
}

export interface AuthCodeUrlParameters {
  scopes: string[];
  redirectUri: string;
  state: string;
  prompt?: 'login' | 'select_account' | 'consent' | 'none';
  loginHint?: string;
  domainHint?: string;
  codeChallenge: string;
  codeChallengeMethod: 'plain' | 'S256';
  extraScopesToConsent?: string[];
}

export type AuthenticationFlow =
  | 'authorizationCode'
  | 'deviceCode'
  | 'clientCredentials'
  | 'refreshToken'
  | 'silent';

export interface AuthState {
  state: 'authenticated' | 'unauthenticated' | 'authenticating' | 'error';
  isAuthenticated: boolean;
  currentAccount: AccountInfo | null;
  scopes: string[];
  tokenCount: number;
  accountCount: number;
}

// ==================== MICROSOFT GRAPH API TYPES ====================

export interface GraphClientConfig {
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  batchSize?: number;
}

export interface User {
  id: string;
  displayName: string;
  givenName?: string;
  surname?: string;
  userPrincipalName: string;
  mail?: string;
  mobilePhone?: string;
  officeLocation?: string;
  jobTitle?: string;
  department?: string;
  companyName?: string;
  usageLocation?: string;
  preferredLanguage?: string;
  accountEnabled: boolean;
  createdDateTime: string;
  lastPasswordChangeDateTime?: string;
  assignedLicenses: AssignedLicense[];
}

export interface AssignedLicense {
  skuId: string;
  disabledPlans: string[];
}

export interface Group {
  id: string;
  displayName: string;
  description?: string;
  mail?: string;
  mailEnabled: boolean;
  mailNickname: string;
  securityEnabled: boolean;
  groupTypes: string[];
  visibility?: 'Public' | 'Private' | 'HiddenMembership';
  createdDateTime: string;
  renewedDateTime?: string;
}

export interface Message {
  id: string;
  subject: string;
  body: ItemBody;
  bodyPreview: string;
  from: Recipient;
  toRecipients: Recipient[];
  ccRecipients: Recipient[];
  bccRecipients: Recipient[];
  sentDateTime: string;
  receivedDateTime: string;
  hasAttachments: boolean;
  importance: 'low' | 'normal' | 'high';
  isRead: boolean;
  isDraft: boolean;
  conversationId: string;
}

export interface ItemBody {
  contentType: 'text' | 'html';
  content: string;
}

export interface Recipient {
  emailAddress: EmailAddress;
}

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface Event {
  id: string;
  subject: string;
  body: ItemBody;
  start: DateTimeTimeZone;
  end: DateTimeTimeZone;
  location: Location;
  attendees: Attendee[];
  organizer: Recipient;
  isAllDay: boolean;
  isCancelled: boolean;
  isOrganizer: boolean;
  responseStatus: ResponseStatus;
  showAs: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere' | 'unknown';
  type: 'singleInstance' | 'occurrence' | 'exception' | 'seriesMaster';
  createdDateTime: string;
  lastModifiedDateTime: string;
}

export interface DateTimeTimeZone {
  dateTime: string;
  timeZone: string;
}

export interface Location {
  displayName: string;
  address?: PhysicalAddress;
  coordinates?: GeoCoordinates;
}

export interface PhysicalAddress {
  street?: string;
  city?: string;
  state?: string;
  countryOrRegion?: string;
  postalCode?: string;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface Attendee extends Recipient {
  type: 'required' | 'optional' | 'resource';
  status: ResponseStatus;
}

export interface ResponseStatus {
  response: 'none' | 'organizer' | 'tentativelyAccepted' | 'accepted' | 'declined' | 'notResponded';
  time: string;
}

export interface Team {
  id: string;
  displayName: string;
  description?: string;
  internalId: string;
  classification?: string;
  visibility: 'public' | 'private' | 'hiddenMembership';
  webUrl: string;
  isArchived: boolean;
  createdDateTime: string;
}

export interface Channel {
  id: string;
  displayName: string;
  description?: string;
  email?: string;
  webUrl: string;
  membershipType: 'standard' | 'private' | 'shared';
  createdDateTime: string;
}

export interface ChatMessage {
  id: string;
  replyToId?: string;
  from: IdentitySet;
  body: ItemBody;
  messageType: 'message' | 'chatEvent' | 'typing' | 'unknownFutureValue';
  createdDateTime: string;
  lastModifiedDateTime: string;
  deletedDateTime?: string;
  subject?: string;
  summary?: string;
  importance: 'normal' | 'high' | 'urgent';
}

export interface IdentitySet {
  application?: Identity;
  device?: Identity;
  user?: Identity;
}

export interface Identity {
  id: string;
  displayName: string;
}

export interface Site {
  id: string;
  displayName: string;
  name: string;
  description?: string;
  webUrl: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  root?: Root;
  sharepointIds: SharepointIds;
  siteCollection?: SiteCollection;
}

export interface Root {}

export interface SharepointIds {
  listId?: string;
  listItemId?: string;
  listItemUniqueId?: string;
  siteId?: string;
  siteUrl?: string;
  tenantId?: string;
  webId?: string;
}

export interface SiteCollection {
  hostname: string;
  dataLocationCode?: string;
  root?: Root;
}

export interface List {
  id: string;
  displayName: string;
  description?: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  webUrl: string;
  list: ListInfo;
}

export interface ListInfo {
  contentTypesEnabled: boolean;
  hidden: boolean;
  template: string;
}

export interface DriveItem {
  id: string;
  name: string;
  size: number;
  webUrl: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  file?: File;
  folder?: Folder;
  parentReference: ItemReference;
  createdBy: IdentitySet;
  lastModifiedBy: IdentitySet;
}

export interface File {
  mimeType: string;
  hashes: Hashes;
}

export interface Hashes {
  quickXorHash?: string;
  sha1Hash?: string;
  sha256Hash?: string;
}

export interface Folder {
  childCount: number;
  view?: FolderView;
}

export interface FolderView {
  sortBy: string;
  sortOrder: string;
  viewType: string;
}

export interface ItemReference {
  driveId: string;
  driveType: string;
  id: string;
  name: string;
  path: string;
  shareId?: string;
  sharepointIds?: SharepointIds;
  siteId?: string;
}

export interface SubscribedSku {
  id: string;
  skuId: string;
  skuPartNumber: string;
  consumedUnits: number;
  prepaidUnits: LicenseUnitsDetail;
  appliesTo: string;
  capabilityStatus: string;
  servicePlans: ServicePlanInfo[];
}

export interface LicenseUnitsDetail {
  enabled: number;
  suspended: number;
  warning: number;
}

export interface ServicePlanInfo {
  servicePlanId: string;
  servicePlanName: string;
  provisioningStatus: string;
  appliesTo: string;
}

export interface GraphResponse<T> {
  value: T[];
  '@odata.nextLink'?: string;
  '@odata.count'?: number;
  '@odata.deltaLink'?: string;
}

export interface BatchRequest {
  id: string;
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: any;
}

export interface BatchResponse {
  id: string;
  status: number;
  headers: Record<string, string>;
  body: any;
}

// ==================== PRICING ENGINE TYPES ====================

export interface PricingConfiguration {
  defaultCurrency?: string;
  defaultBillingCycle?: 'monthly' | 'annual';
}

export interface SkuInfo {
  name: string;
  skuId: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  userMin: number | null;
  userMax: number | null;
  category: string;
}

export interface PricingData {
  microsoft365: Record<string, SkuInfo>;
  exchange: Record<string, SkuInfo>;
  azureAD: Record<string, SkuInfo>;
  security: Record<string, SkuInfo>;
  sharepoint: Record<string, SkuInfo>;
  powerPlatform: Record<string, SkuInfo>;
  teams: Record<string, SkuInfo>;
  compliance: Record<string, SkuInfo>;
}

export interface CostCalculation {
  skuId: string;
  name: string;
  userCount: number;
  pricePerUser: number;
  totalCost: number;
  currency: string;
  billingCycle: 'monthly' | 'annual';
  category: string;
  features: string[];
}

export interface MultiSkuCalculation {
  items: CostCalculation[];
  grandTotal: number;
  currency: string;
  billingCycle: 'monthly' | 'annual';
  totalUsers: number;
}

export interface EADiscount {
  originalCost: number;
  discountPercentage: number;
  discountAmount: number;
  finalCost: number;
}

export interface CSPPricing {
  baseCost: number;
  marginPercentage: number;
  marginAmount: number;
  cspPrice: number;
}

export interface AnnualSavings {
  monthlyTotal: number;
  annualizedMonthly: number;
  annualTotal: number;
  savings: number;
  savingsPercentage: number;
}

export interface LicenseRequirement {
  userType: string;
  userCount: number;
  requiredFeatures: string[];
}

export interface LicenseRecommendation {
  userType: string;
  userCount: number;
  requiredFeatures: string[];
  recommendedSku: string;
  reason: string;
}

export interface CostProjection {
  month: number;
  cost: number;
  growth: number;
}

export interface ProjectionResult {
  currentCost: number;
  growthRate: number;
  months: number;
  projections: CostProjection[];
  finalCost: number;
}

export interface LicenseComparison {
  userCount: number;
  billingCycle: 'monthly' | 'annual';
  currency: string;
  options: CostCalculation[];
  cheapest: CostCalculation;
  mostExpensive: CostCalculation;
}

export interface BundleSavings {
  individualSkus: string[];
  bundleSku: string;
  individualTotal: number;
  bundleTotal: number;
  savings: number;
  savingsPercentage: number;
  recommendation: string;
}

export interface PricingReport {
  summary: {
    totalUsers: number;
    totalSkus: number;
    billingCycle: 'monthly' | 'annual';
    currency: string;
  };
  costs: MultiSkuCalculation & { eaDiscount?: EADiscount };
  annualSavings: AnnualSavings | null;
  generatedAt: string;
}

// ==================== SCRIPT RUNNER TYPES ====================

export interface ScriptRunnerConfig {
  powerShellPath?: string;
  scriptsDir?: string;
  logsDir?: string;
  maxExecutionTime?: number;
}

export interface ScriptParameter {
  name: string;
  type: 'string' | 'int' | 'boolean' | 'array' | 'securestring' | 'datetime';
  required: boolean;
  default?: any;
  description?: string;
}

export interface ScriptTemplate {
  name: string;
  description: string;
  category: string;
  parameters: ScriptParameter[];
  script: string;
}

export interface ExecutionResult {
  executionId: string;
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  startTime: Date;
  endTime: Date;
  logPath: string;
  scriptPath: string;
  templateName?: string;
}

export interface ExecutionStatus {
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  executionId: string;
  startTime: Date;
  duration: number;
  success?: boolean;
  exitCode?: number;
}

export interface ScriptExecutionOptions {
  executionId?: string;
  templateName?: string;
  keepScript?: boolean;
  timeout?: number;
}

export interface ExecutionHistoryOptions {
  templateName?: string;
  successOnly?: boolean;
  limit?: number;
}

export interface ActiveExecution {
  process: any;
  startTime: number;
  scriptPath: string;
  logPath: string;
}

// ==================== COMMON TYPES ====================

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    innerError?: {
      'request-id': string;
      date: string;
    };
  };
}

export interface PaginationOptions {
  top?: number;
  skip?: number;
  select?: string[] | string;
  filter?: string;
  orderBy?: string;
  search?: string;
  expand?: string;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number;
}

export type BillingCycle = 'monthly' | 'annual';

export type UserCategory = 'business' | 'enterprise' | 'frontline' | 'apps';

export type SkuCategory =
  | 'business'
  | 'enterprise'
  | 'frontline'
  | 'apps'
  | 'exchange'
  | 'identity'
  | 'security'
  | 'collaboration'
  | 'analytics'
  | 'development'
  | 'automation'
  | 'voice'
  | 'compliance';

// ==================== EVENT TYPES ====================

export interface MSALEvent {
  type: 'initialized' | 'authStateChanged' | 'tokenAcquired' | 'tokenRefreshed' | 'logout' | 'error';
  data: any;
  timestamp: Date;
}

export interface GraphEvent {
  type: 'requestStarted' | 'requestCompleted' | 'requestError' | 'throttled' | 'authenticationError';
  data: any;
  timestamp: Date;
}

export interface ScriptRunnerEvent {
  type: 'executionStarted' | 'executionCompleted' | 'executionError' | 'executionCancelled' | 'output';
  data: any;
  timestamp: Date;
}

// ==================== UTILITY TYPES ====================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type Awaitable<T> = T | Promise<T>;

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;
