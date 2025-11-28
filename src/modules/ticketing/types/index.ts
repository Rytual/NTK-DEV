/**
 * ConnectWise Manage TypeScript Definitions
 * Comprehensive type definitions for Ninja Toolkit Prompt 9
 */

// ============================================================================
// ConnectWise API Types
// ============================================================================

export interface ConnectWiseConfig {
  companyId: string;
  publicKey: string;
  privateKey: string;
  clientId: string;
  apiUrl: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  rateLimit?: number;
  debug?: boolean;
}

export interface APIResponse<T = any> {
  statusCode: number;
  headers: Record<string, string>;
  data: T;
  responseTime: number;
}

export interface APIError {
  statusCode: number;
  message: string;
  response?: any;
  headers?: Record<string, string>;
}

// ============================================================================
// Board Types
// ============================================================================

export interface Board {
  id: number;
  name: string;
  locationId?: number;
  businessUnitId?: number;
  inactive?: boolean;
  signOffTemplate?: SignOffTemplate;
  sendToContact?: boolean;
  contactEmailTemplate?: EmailTemplate;
  sendToResource?: boolean;
  resourceEmailTemplate?: EmailTemplate;
  projectFlag?: boolean;
  showDependenciesFlag?: boolean;
  showEstimatesFlag?: boolean;
  boardIcon?: BoardIcon;
  billTicketsAfterClosedFlag?: boolean;
  billTicketSeparatelyFlag?: boolean;
  billUnapprovedTimeExpenseFlag?: boolean;
  overrideBillingSetupFlag?: boolean;
  dispatchMember?: Member;
  serviceManagerMember?: Member;
  dutyManagerMember?: Member;
  oncallMember?: Member;
  workRole?: WorkRole;
  workType?: WorkType;
  billTime?: string;
  billExpense?: string;
  billProduct?: string;
  autoAssignNewTicketsFlag?: boolean;
  autoAssignNewECTicketsFlag?: boolean;
  autoAssignNewPortalTicketsFlag?: boolean;
  discussionsLockedFlag?: boolean;
  timeEntryLockedFlag?: boolean;
  notifyEmailFrom?: string;
  notifyEmailFromGuid?: string;
  _info?: EntityInfo;
}

export interface BoardStatus {
  id: number;
  name: string;
  boardId: number;
  sortOrder?: number;
  displayOnBoard?: boolean;
  inactive?: boolean;
  closedStatus?: boolean;
  timeEntryNotAllowedFlag?: boolean;
  defaultFlag?: boolean;
  escalationStatus?: string;
  _info?: EntityInfo;
}

// ============================================================================
// Ticket Types
// ============================================================================

export interface Ticket {
  id: number;
  summary: string;
  recordType?: string;
  board?: BoardReference;
  status?: StatusReference;
  project?: ProjectReference;
  phase?: PhaseReference;
  wbsCode?: string;
  company?: CompanyReference;
  site?: SiteReference;
  siteName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateIdentifier?: string;
  zip?: string;
  country?: CountryReference;
  contact?: ContactReference;
  contactName?: string;
  contactPhoneNumber?: string;
  contactPhoneExtension?: string;
  contactEmailAddress?: string;
  type?: TypeReference;
  subType?: SubTypeReference;
  item?: ItemReference;
  team?: TeamReference;
  owner?: MemberReference;
  priority?: PriorityReference;
  serviceLocation?: ServiceLocationReference;
  source?: SourceReference;
  requiredDate?: string;
  budgetHours?: number;
  opportunity?: OpportunityReference;
  agreement?: AgreementReference;
  severity?: string;
  impact?: string;
  externalXRef?: string;
  poNumber?: string;
  knowledgeBaseCategoryId?: number;
  knowledgeBaseSubCategoryId?: number;
  allowAllClientsPortalView?: boolean;
  customerUpdatedFlag?: boolean;
  automaticEmailContactFlag?: boolean;
  automaticEmailResourceFlag?: boolean;
  automaticEmailCcFlag?: boolean;
  automaticEmailCc?: string;
  initialDescription?: string;
  initialInternalAnalysis?: string;
  initialResolution?: string;
  contactEmailLookup?: string;
  processNotifications?: boolean;
  skipCallback?: boolean;
  closedDate?: string;
  closedBy?: string;
  closedFlag?: boolean;
  actualHours?: number;
  approved?: boolean;
  estimatedExpenseCost?: number;
  estimatedExpenseRevenue?: number;
  estimatedProductCost?: number;
  estimatedProductRevenue?: number;
  estimatedTimeCost?: number;
  estimatedTimeRevenue?: number;
  billingMethod?: string;
  billingAmount?: number;
  hourlyRate?: number;
  subBillingMethod?: string;
  subBillingAmount?: number;
  subDateAccepted?: string;
  dateResolved?: string;
  dateResplan?: string;
  dateResponded?: string;
  resolveMinutes?: number;
  resPlanMinutes?: number;
  respondMinutes?: number;
  isInSla?: boolean;
  knowledgeBaseLinkId?: number;
  resources?: string;
  parentTicketId?: number;
  hasChildTicket?: boolean;
  hasMergedChildTicketFlag?: boolean;
  billTime?: string;
  billExpenses?: string;
  billProducts?: string;
  predecessorType?: string;
  predecessorId?: number;
  predecessorClosedFlag?: boolean;
  lagDays?: number;
  lagNonworkingDaysFlag?: boolean;
  estimatedStartDate?: string;
  duration?: number;
  locationId?: number;
  businessUnitId?: number;
  mobileGuid?: string;
  sla?: SLAReference;
  slaStatus?: string;
  requestedBy?: string;
  createdBy?: string;
  currency?: CurrencyReference;
  _info?: EntityInfo;
  customFields?: CustomField[];
}

export interface TicketNote {
  id: number;
  ticketId: number;
  text: string;
  detailDescriptionFlag?: boolean;
  internalAnalysisFlag?: boolean;
  resolutionFlag?: boolean;
  issueFlag?: boolean;
  member?: MemberReference;
  contact?: ContactReference;
  customerUpdatedFlag?: boolean;
  processNotifications?: boolean;
  dateCreated?: string;
  createdBy?: string;
  internalFlag?: boolean;
  externalFlag?: boolean;
  _info?: EntityInfo;
}

export interface TimeEntry {
  id: number;
  company?: CompanyReference;
  chargeToId?: number;
  chargeToType?: string;
  member?: MemberReference;
  locationId?: number;
  businessUnitId?: number;
  workType?: WorkTypeReference;
  workRole?: WorkRoleReference;
  agreement?: AgreementReference;
  timeStart?: string;
  timeEnd?: string;
  hoursDeduct?: number;
  actualHours?: number;
  billableOption?: string;
  notes?: string;
  internalNotes?: string;
  addToDetailDescriptionFlag?: boolean;
  addToInternalAnalysisFlag?: boolean;
  addToResolutionFlag?: boolean;
  emailResourceFlag?: boolean;
  emailContactFlag?: boolean;
  emailCcFlag?: boolean;
  emailCc?: string;
  hoursBilled?: number;
  enteredBy?: string;
  dateEntered?: string;
  invoice?: InvoiceReference;
  mobileGuid?: string;
  hourlyRate?: number;
  timeSheet?: TimeSheetReference;
  status?: string;
  _info?: EntityInfo;
}

// ============================================================================
// Company Types
// ============================================================================

export interface Company {
  id: number;
  identifier: string;
  name: string;
  status?: CompanyStatusReference;
  type?: CompanyTypeReference;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: CountryReference;
  phoneNumber?: string;
  faxNumber?: string;
  website?: string;
  territoryId?: number;
  marketId?: number;
  accountNumber?: string;
  defaultContact?: ContactReference;
  dateAcquired?: string;
  sicCode?: SicCodeReference;
  parentCompany?: CompanyReference;
  annualRevenue?: number;
  numberOfEmployees?: number;
  timeZone?: TimeZoneReference;
  leadSource?: string;
  leadFlag?: boolean;
  unsubscribeFlag?: boolean;
  userDefinedField1?: string;
  userDefinedField2?: string;
  userDefinedField3?: string;
  userDefinedField4?: string;
  userDefinedField5?: string;
  taxIdentifier?: string;
  taxCode?: TaxCodeReference;
  billingTerms?: BillingTermsReference;
  billToCompany?: CompanyReference;
  billingSite?: SiteReference;
  billingContact?: ContactReference;
  invoiceTemplate?: InvoiceTemplateReference;
  pricingSchedule?: PricingScheduleReference;
  companyEntityType?: CompanyEntityTypeReference;
  billToAddressFormat?: string;
  shipToAddressFormat?: string;
  invoiceDeliveryMethod?: InvoiceDeliveryMethodReference;
  invoiceToEmailAddress?: string;
  invoiceCCEmailAddress?: string;
  deletedFlag?: boolean;
  dateDeleted?: string;
  deletedBy?: string;
  mobileGuid?: string;
  currency?: CurrencyReference;
  _info?: EntityInfo;
  customFields?: CustomField[];
}

export interface Contact {
  id: number;
  firstName?: string;
  lastName?: string;
  type?: ContactTypeReference;
  company?: CompanyReference;
  site?: SiteReference;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: CountryReference;
  relationship?: RelationshipReference;
  department?: DepartmentReference;
  inactiveFlag?: boolean;
  defaultMergeContactId?: number;
  securityIdentifier?: string;
  managerContactId?: number;
  assistantContactId?: number;
  title?: string;
  school?: string;
  nickName?: string;
  marriedFlag?: boolean;
  childrenFlag?: boolean;
  significantOther?: string;
  portalPassword?: string;
  portalSecurityLevel?: number;
  disablePortalLoginFlag?: boolean;
  unsubscribeFlag?: boolean;
  gender?: string;
  birthDay?: string;
  anniversary?: string;
  presence?: string;
  mobileGuid?: string;
  defaultPhoneType?: string;
  defaultPhoneNbr?: string;
  defaultBillingFlag?: boolean;
  defaultFlag?: boolean;
  communicationItems?: CommunicationItem[];
  _info?: EntityInfo;
  customFields?: CustomField[];
}

export interface CompanyType {
  id: number;
  name: string;
  vendorFlag?: boolean;
  defaultFlag?: boolean;
  _info?: EntityInfo;
}

export interface CompanyStatus {
  id: number;
  name: string;
  defaultFlag?: boolean;
  inactiveFlag?: boolean;
  notifyFlag?: boolean;
  disallowSavingFlag?: boolean;
  notificationMessage?: string;
  customNoteFlag?: boolean;
  cancelOpenTracksFlag?: boolean;
  _info?: EntityInfo;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface Configuration {
  id: number;
  name: string;
  type?: ConfigurationTypeReference;
  status?: ConfigurationStatusReference;
  company?: CompanyReference;
  contact?: ContactReference;
  site?: SiteReference;
  locationId?: number;
  businessUnitId?: number;
  department?: DepartmentReference;
  serialNumber?: string;
  modelNumber?: string;
  tagNumber?: string;
  purchaseDate?: string;
  installationDate?: string;
  installedBy?: MemberReference;
  warrantyExpirationDate?: string;
  vendorCompany?: CompanyReference;
  vendorNotes?: string;
  notes?: string;
  macAddress?: string;
  lastLoginName?: string;
  billFlag?: boolean;
  backupSuccesses?: number;
  backupIncomplete?: number;
  backupFailed?: number;
  backupRestores?: number;
  lastBackupDate?: string;
  backupServerName?: string;
  backupProtectedDeviceList?: string;
  backupYear?: number;
  backupMonth?: number;
  ipAddress?: string;
  defaultGateway?: string;
  osType?: string;
  osInfo?: string;
  cpuSpeed?: string;
  ram?: string;
  localHardDrives?: string;
  parentConfigurationId?: number;
  vendor?: string;
  manufacturer?: ManufacturerReference;
  questions?: ConfigurationQuestion[];
  activeFlag?: boolean;
  managementLink?: string;
  remoteLink?: string;
  sla?: SLAReference;
  mobileGuid?: string;
  _info?: EntityInfo;
  customFields?: CustomField[];
}

export interface ConfigurationType {
  id: number;
  name: string;
  inactiveFlag?: boolean;
  systemFlag?: boolean;
  _info?: EntityInfo;
}

export interface ConfigurationStatus {
  id: number;
  description: string;
  closedFlag?: boolean;
  defaultFlag?: boolean;
  inactiveFlag?: boolean;
  _info?: EntityInfo;
}

export interface ConfigurationQuestion {
  id: number;
  question: string;
  answer?: string;
  sequenceNumber?: number;
  numberOfDecimals?: number;
  fieldType?: string;
  requiredFlag?: boolean;
  inactiveFlag?: boolean;
  _info?: EntityInfo;
}

// ============================================================================
// Attachment Types
// ============================================================================

export interface Attachment {
  id: number;
  title: string;
  fileName: string;
  serverFileName?: string;
  url?: string;
  publicFlag?: boolean;
  readOnlyFlag?: boolean;
  _info?: EntityInfo;
}

export interface AttachmentInfo {
  id: number;
  fileName: string;
  size: number;
  mimeType: string;
  uploadDate: string;
  uploadedBy: string;
}

export interface FileUpload {
  name: string;
  data: Buffer;
  size: number;
  mimeType: string;
}

// ============================================================================
// Offline Queue Types
// ============================================================================

export interface QueueOperation {
  id: number;
  operationType: 'CREATE' | 'UPDATE' | 'DELETE' | 'NOTE' | 'TIME_ENTRY';
  entityType: string;
  entityId?: number;
  payload: any;
  retryCount: number;
  status: 'pending' | 'completed' | 'failed' | 'conflict' | 'skipped';
  createdAt: string;
  lastAttempt?: string;
  errorMessage?: string;
  priority: number;
}

export interface SyncStatus {
  pending: number;
  completed: number;
  failed: number;
  conflict: number;
  skipped: number;
}

export interface ConflictInfo {
  operationId: number;
  entityType: string;
  entityId: number;
  clientData: any;
  serverData: any;
}

export interface SyncResult {
  synced: number;
  failed: number;
  duration: number;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface WebhookEvent {
  id: string;
  type: string;
  action: string;
  entity: string;
  entityId: number;
  data: any;
  timestamp: string;
}

export interface WebhookConfig {
  port?: number;
  path?: string;
  secret?: string;
  verifySignature?: boolean;
  enableRateLimit?: boolean;
  rateLimit?: number;
  replayWindow?: number;
  logEvents?: boolean;
  logPath?: string;
}

export interface WebhookSignature {
  signature: string;
  algorithm: 'sha256';
}

// ============================================================================
// Kage AI Types
// ============================================================================

export interface KageAnalysis {
  ticketId: number;
  summary: string;
  keyIssues: string[];
  identifiedProblems: IdentifiedProblem[];
  errorCodes: ErrorCodeInfo[];
  extractedData: ExtractedData;
  solutions: string[];
  diagnosticCommands: string[];
  sentiment: SentimentAnalysis | null;
  priorityRecommendation: PriorityRecommendation | null;
  timeEstimate: TimeEstimate | null;
  similarTickets: number[];
  integrationSuggestions: IntegrationSuggestions;
}

export interface IdentifiedProblem {
  issue: string;
  category: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;
}

export interface ErrorCodeInfo {
  code: string;
  description: string;
  category: string;
  solutions: string[];
}

export interface ExtractedData {
  ipAddresses: string[];
  hostnames: string[];
  emailAddresses: string[];
  filePaths: string[];
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  negativeKeywords: number;
  positiveKeywords: number;
}

export interface PriorityRecommendation {
  priority: string;
  score: number;
  currentPriority: string;
  shouldChange: boolean;
}

export interface TimeEstimate {
  hours: number;
  range: {
    min: number;
    max: number;
  };
}

export interface IntegrationSuggestions {
  powershell: PowerShellSuggestion[];
  remoteAccess: RemoteAccessSuggestion[];
}

export interface PowerShellSuggestion {
  action: string;
  description: string;
  commands: string[];
}

export interface RemoteAccessSuggestion {
  action: string;
  description: string;
  target: string;
  protocol: 'rdp' | 'ssh' | 'vnc';
}

export interface DiagnosticResult {
  command: string;
  output: string;
  exitCode: number;
  duration: number;
}

// ============================================================================
// Reference Types
// ============================================================================

export interface BoardReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface StatusReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface CompanyReference {
  id: number;
  identifier?: string;
  name?: string;
  _info?: EntityInfo;
}

export interface ContactReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface MemberReference {
  id: number;
  identifier?: string;
  name?: string;
  _info?: EntityInfo;
}

export interface PriorityReference {
  id: number;
  name?: string;
  sort?: number;
  _info?: EntityInfo;
}

export interface TypeReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface SubTypeReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface ItemReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface TeamReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface ProjectReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface PhaseReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface SiteReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface ServiceLocationReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface SourceReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface OpportunityReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface AgreementReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface SLAReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface CurrencyReference {
  id: number;
  symbol?: string;
  isoCode?: string;
  name?: string;
  _info?: EntityInfo;
}

export interface CountryReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface WorkTypeReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface WorkRoleReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface InvoiceReference {
  id: number;
  identifier?: string;
  _info?: EntityInfo;
}

export interface TimeSheetReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface CompanyStatusReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface CompanyTypeReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface ContactTypeReference {
  id: number;
  description?: string;
  _info?: EntityInfo;
}

export interface RelationshipReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface DepartmentReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface ConfigurationTypeReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface ConfigurationStatusReference {
  id: number;
  description?: string;
  _info?: EntityInfo;
}

export interface ManufacturerReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface SicCodeReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface TimeZoneReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface TaxCodeReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface BillingTermsReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface InvoiceTemplateReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface PricingScheduleReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface CompanyEntityTypeReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface InvoiceDeliveryMethodReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

// ============================================================================
// Common Types
// ============================================================================

export interface EntityInfo {
  lastUpdated?: string;
  updatedBy?: string;
  dateEntered?: string;
  enteredBy?: string;
  [key: string]: any;
}

export interface CustomField {
  id: number;
  caption: string;
  type: string;
  value: any;
  entryMethod?: string;
  numberOfDecimals?: number;
}

export interface CommunicationItem {
  id: number;
  type?: CommunicationTypeReference;
  value?: string;
  extension?: string;
  defaultFlag?: boolean;
  communicationType?: string;
  _info?: EntityInfo;
}

export interface CommunicationTypeReference {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface SignOffTemplate {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface EmailTemplate {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface BoardIcon {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface WorkRole {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface WorkType {
  id: number;
  name?: string;
  _info?: EntityInfo;
}

export interface Member {
  id: number;
  identifier?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  emailAddress?: string;
  _info?: EntityInfo;
}

// ============================================================================
// Statistics Types
// ============================================================================

export interface ClientStatistics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  retriedRequests: number;
  rateLimitHits: number;
  averageResponseTime: number;
}

export interface TicketManagerStatistics {
  ticketsCreated: number;
  ticketsUpdated: number;
  ticketsClosed: number;
  notesAdded: number;
  timeEntriesAdded: number;
  aiAnalysesRun: number;
}

export interface CompanyManagerStatistics {
  companiesCreated: number;
  companiesUpdated: number;
  companiesDeleted: number;
  contactsCreated: number;
  contactsUpdated: number;
  contactsDeleted: number;
  communicationsLogged: number;
}

export interface ConfigurationManagerStatistics {
  configurationsCreated: number;
  configurationsUpdated: number;
  configurationsDeleted: number;
  warrantyChecks: number;
  inventoryAdjustments: number;
}

export interface AttachmentHandlerStatistics {
  filesUploaded: number;
  filesDownloaded: number;
  bytesUploaded: number;
  bytesDownloaded: number;
  uploadErrors: number;
  downloadErrors: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface OfflineQueueStatistics {
  operationsQueued: number;
  operationsSynced: number;
  operationsFailed: number;
  conflictsDetected: number;
  conflictsResolved: number;
  lastSyncTime: number | null;
  lastSyncDuration: number;
}

export interface WebhookHandlerStatistics {
  eventsReceived: number;
  eventsProcessed: number;
  eventsFailed: number;
  signatureVerificationsFailed: number;
  duplicateEvents: number;
  rateLimitHits: number;
  eventsByType: Record<string, number>;
}

export interface KageAnalyzerStatistics {
  analysesRun: number;
  issuesIdentified: number;
  solutionsSuggested: number;
  priorityRecommendations: number;
  timeEstimations: number;
  similarTicketsFound: number;
}

// ============================================================================
// Integration Types
// ============================================================================

export interface PowerShellIntegration {
  moduleVersion: string;
  executeScript: (script: string, target: string) => Promise<any>;
  getScriptOutput: (executionId: string) => Promise<string>;
}

export interface RemoteAccessIntegration {
  moduleVersion: string;
  connectRDP: (target: string, credentials?: any) => Promise<any>;
  connectSSH: (target: string, credentials?: any) => Promise<any>;
}

export interface KageForgeIntegration {
  moduleVersion: string;
  generateCompletion: (prompt: string, options?: any) => Promise<string>;
  analyzeText: (text: string) => Promise<any>;
}
