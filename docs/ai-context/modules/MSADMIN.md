# MS Admin (Azure) Module - AI Context Documentation

## Module Overview

**MS Admin / Azure Module** provides Microsoft 365 and Azure administration capabilities including user management, license administration, Graph API integration, and cloud resource monitoring.

### Core Purpose
- Microsoft 365 administration
- Azure resource management
- User and license management
- Graph API integration

---

## File Structure

```
src/pages/Azure.tsx            # Main frontend component
```

*Note: Azure module is primarily a frontend module designed for Microsoft Graph API integration.*

---

## Planned Capabilities

### Microsoft 365 Administration
- User management (create, modify, delete)
- License assignment and tracking
- Group management
- Security group membership
- Distribution lists
- Shared mailbox management

### Azure Resource Management
- Resource group overview
- Virtual machine management
- Storage account monitoring
- Network resource management
- Cost monitoring

### Graph API Integration
- User profiles
- Directory operations
- Mail and calendar access
- Teams management
- SharePoint sites

---

## IPC Channels (Planned)

### User Management
| Channel | Direction | Parameters | Returns |
|---------|-----------|------------|---------|
| `azure:getUsers` | Renderer → Main | `{filter?, top?}` | `User[]` |
| `azure:getUser` | Renderer → Main | `{userId}` | `User` |
| `azure:createUser` | Renderer → Main | `{user}` | `User` |
| `azure:updateUser` | Renderer → Main | `{userId, updates}` | `User` |
| `azure:deleteUser` | Renderer → Main | `{userId}` | `boolean` |
| `azure:resetPassword` | Renderer → Main | `{userId, password}` | `void` |

### License Management
| Channel | Direction | Parameters | Returns |
|---------|-----------|------------|---------|
| `azure:getLicenses` | Renderer → Main | none | `License[]` |
| `azure:getUserLicenses` | Renderer → Main | `{userId}` | `License[]` |
| `azure:assignLicense` | Renderer → Main | `{userId, skuId}` | `void` |
| `azure:removeLicense` | Renderer → Main | `{userId, skuId}` | `void` |

### Group Management
| Channel | Direction | Parameters | Returns |
|---------|-----------|------------|---------|
| `azure:getGroups` | Renderer → Main | `{filter?}` | `Group[]` |
| `azure:getGroupMembers` | Renderer → Main | `{groupId}` | `User[]` |
| `azure:addGroupMember` | Renderer → Main | `{groupId, userId}` | `void` |
| `azure:removeGroupMember` | Renderer → Main | `{groupId, userId}` | `void` |

---

## Graph API Integration

### Authentication
```javascript
// Azure AD App Registration required
const msalConfig = {
  auth: {
    clientId: 'your-app-client-id',
    authority: 'https://login.microsoftonline.com/your-tenant-id',
    redirectUri: 'http://localhost'
  }
};

// Required scopes
const scopes = [
  'User.Read.All',
  'User.ReadWrite.All',
  'Directory.Read.All',
  'Directory.ReadWrite.All',
  'Group.Read.All',
  'Group.ReadWrite.All',
  'Mail.Read',
  'Sites.Read.All'
];
```

### User Object Structure
```typescript
interface M365User {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mail: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  accountEnabled: boolean;
  assignedLicenses: License[];
  memberOf: Group[];
  createdDateTime: string;
  lastSignInDateTime?: string;
}
```

### License Object Structure
```typescript
interface License {
  skuId: string;
  skuPartNumber: string;  // e.g., 'ENTERPRISEPACK', 'SPE_E3'
  servicePlans: ServicePlan[];
  consumedUnits: number;
  prepaidUnits: {
    enabled: number;
    suspended: number;
    warning: number;
  };
}
```

---

## Integration Points

### With KageChat
- Natural language user queries
- "Create a new user for John Smith"
- "What licenses does jane@company.com have?"

### With Ticketing
- Ticket-driven user operations
- Service request automation

### With Security
- Security posture assessment
- Conditional access policies
- Sign-in risk detection

### With KageForge
- AI-assisted bulk operations
- License optimization suggestions

---

## Current State

### Implemented
- Basic page structure
- UI placeholder

### Placeholder/Mock
- Graph API integration
- User management operations
- License administration
- Group management

---

## Backend Requirements (For Full Implementation)

### GraphService
```javascript
class GraphService {
  constructor(authProvider) {}

  // Authentication
  async authenticate() {}
  async getToken(scopes) {}

  // Users
  async getUsers(filter, top) {}
  async getUser(userId) {}
  async createUser(user) {}
  async updateUser(userId, updates) {}
  async deleteUser(userId) {}
  async resetPassword(userId, password) {}

  // Licenses
  async getOrganizationLicenses() {}
  async getUserLicenses(userId) {}
  async assignLicense(userId, skuId) {}
  async removeLicense(userId, skuId) {}

  // Groups
  async getGroups(filter) {}
  async getGroupMembers(groupId) {}
  async addGroupMember(groupId, userId) {}
  async removeGroupMember(groupId, userId) {}

  // Mail
  async getUserMail(userId, top) {}
  async sendMail(userId, message) {}

  // Reports
  async getUserActivityReport(period) {}
  async getMailActivityReport(period) {}
}
```

### AzureResourceService
```javascript
class AzureResourceService {
  constructor(credentials) {}

  // Subscriptions
  async getSubscriptions() {}

  // Resource Groups
  async getResourceGroups(subscriptionId) {}

  // Virtual Machines
  async getVMs(resourceGroupName) {}
  async startVM(resourceGroupName, vmName) {}
  async stopVM(resourceGroupName, vmName) {}

  // Storage
  async getStorageAccounts(resourceGroupName) {}

  // Cost
  async getCostByResourceGroup(subscriptionId, period) {}
}
```

---

## Improvement Opportunities

1. **Full Graph Integration**: Complete Microsoft Graph API coverage
2. **Azure Portal**: Azure resource management
3. **Bulk Operations**: CSV import/export for users
4. **License Optimizer**: AI-powered license recommendations
5. **Conditional Access**: Policy management
6. **MFA Management**: Multi-factor authentication setup
7. **Service Health**: M365 service status dashboard
8. **Audit Logs**: Sign-in and audit log viewing
9. **PowerShell Bridge**: Run PowerShell scripts via Graph
10. **Tenant Comparison**: Multi-tenant management
