# 🔧 GitSecureOps Fixes Checklist

## Overview
This checklist covers all identified issues and their fixes for the GitSecureOps project. Work through each section systematically to resolve OAuth issues and improve the overall architecture.

---

## 🚨 **Critical Fixes (High Priority)**

### ✅ **Fix 1: OAuth Architecture Alignment**
**Issue**: Frontend and backend OAuth URLs are misaligned causing 500 errors

#### Sub-tasks:
- [x] **1.1** Choose OAuth strategy:
  - [x] Option A: Use Function App for OAuth (Recommended) ✅ -- use option A
  - [ ] Option B: Use Static Web App Built-in API
- [x] **1.2** Update `src/services/oauthService.ts`:
  - [x] Update `redirectUri` to use Function App URL
  - [x] Ensure environment variable usage: `VITE_FUNCTION_APP_URL`
- [x] **1.3** Update `src/services/environmentService.ts`:
  - [x] Add `VITE_FUNCTION_APP_URL` configuration
  - [x] Ensure proper fallback URLs
- [ ] **1.4** Test OAuth flow locally before deployment

**Files to modify:**
- `src/services/oauthService.ts`
- `src/services/environmentService.ts`
- `.env.local` (for testing)

---

### ✅ **Fix 2: Environment Variables Configuration**
**Issue**: Missing and inconsistent environment variables across deployments

#### Sub-tasks:
- [x] **2.1** Update GitHub Actions workflows:
  - [x] Add `VITE_GITHUB_CLIENT_ID` to Static Web App deployment
  - [x] Add `VITE_FUNCTION_APP_URL` to Static Web App deployment
  - [x] Ensure `GITHUB_CLIENT_SECRET` is available for Function App
- [x] **2.2** Update Bicep templates:
  - [x] Add app settings for Function App
  - [x] Add environment variables for Static Web App
- [x] **2.3** Verify GitHub Secrets:
  - [x] `GITHUB_CLIENT_ID` exists and is correct --Yes it exist
  - [x] `GITHUB_CLIENT_SECRET` exists and is correct ----Yes it exist
  - [x] `AZURE_STATIC_WEB_APPS_API_TOKEN_PROD` exists --it wont need, as its happening directly from cli

**Files to modify:**
- `.github/workflows/deploy-application.yml`
- `.github/workflows/deploy-infrastructure.yml`
- `infra/main-resources.bicep`

---

### ✅ **Fix 3: Key Vault Access Policies**
**Issue**: Bicep template references causing deployment failures

#### Sub-tasks:
- [x] **3.1** Fix Function App identity reference:
  - [x] Use proper resource reference syntax
  - [x] Ensure Function App exists before referencing identity
- [x] **3.2** Add proper access policies:
  - [x] Function App managed identity → Key Vault secrets (get, list)
  - [x] Static Web App managed identity → Key Vault secrets (get, list)
- [ ] **3.3** Test Key Vault access:
  - [ ] Function App can retrieve `github-client-secret`
  - [ ] No permission errors in Function App logs

**Files to modify:**
- `infra/main-resources.bicep`

---

## 🎯 **Medium Priority Fixes**

### ✅ **Fix 4: CORS Configuration**
**Issue**: Browser blocks API calls between Static Web App and Function App

#### Sub-tasks:
- [x] **4.1** Add CORS configuration to Function App in Bicep:
  - [x] Allow Static Web App URL
  - [x] Allow localhost for development
  - [x] Allow Azure portal for testing
- [x] **4.2** Update Function App CORS settings:
  - [x] Set `supportCredentials: false` unless needed
  - [x] Ensure wildcard origins are avoided in production
- [ ] **4.3** Test cross-origin requests:
  - [ ] Frontend can call Function App APIs
  - [ ] OAuth callback works without CORS errors

**Files to modify:**
- `infra/main-resources.bicep`
- `api/github-callback/index.js` (add CORS headers if needed)

---

### ✅ **Fix 5: Deployment Workflow Improvements**
**Issue**: Workflows have conflicts and missing error handling

#### Sub-tasks:
- [x] **5.1** Fix resource deployment conflicts:
  - [x] Don't deploy API to both Static Web App AND Function App
  - [x] Clear separation: Frontend → SWA, API → Function App
- [x] **5.2** Add error handling:
  - [x] Deployment failure notifications
  - [x] Rollback mechanisms
  - [x] Pre-deployment validation
- [x] **5.3** Improve deployment logging:
  - [x] Add step-by-step progress indicators
  - [x] Log environment variables (excluding secrets)
  - [x] Add deployment success/failure summaries

**Files to modify:**
- `.github/workflows/deploy-application.yml`
- `.github/workflows/deploy-infrastructure.yml`

---

### ✅ **Fix 6: Security Hardening**
**Issue**: Potential security vulnerabilities and best practices

#### Sub-tasks:
- [ ] **6.1** OAuth Security:
  - [ ] Implement CSRF protection with state parameter
  - [ ] Add token expiration handling
  - [ ] Secure session storage
- [ ] **6.2** Key Vault Security:
  - [ ] Principle of least privilege for access policies
  - [ ] Regular secret rotation
  - [ ] Audit logging enabled
- [ ] **6.3** Function App Security:
  - [ ] Enable HTTPS only
  - [ ] Disable FTP access
  - [ ] Enable diagnostic logging

**Files to modify:**
- `src/services/oauthService.ts`
- `api/github-callback/index.js`
- `infra/main-resources.bicep`

---



## 📋 **Implementation Steps**

### Phase 1: Critical Fixes (Week 1)
1. [ ] Complete Fix 1: OAuth Architecture Alignment
2. [ ] Complete Fix 2: Environment Variables Configuration  
3. [ ] Complete Fix 3: Key Vault Access Policies
4. [ ] Deploy and test critical fixes

### Phase 2: Medium Priority (Week 2)
1. [ ] Complete Fix 4: CORS Configuration
2. [ ] Complete Fix 5: Deployment Workflow Improvements
3. [ ] Complete Fix 6: Security Hardening
4. [ ] Deploy and validate improvements

### Phase 3: Enhancements (Week 3)
1. [ ] Complete Fix 7: Monitoring & Observability
2. [ ] Complete Fix 8: Testing & Validation
3. [ ] Final deployment and validation
4. [ ] Documentation updates

---

## 🧪 **Testing Checklist**

### Pre-Deployment Testing
- [ ] **Environment Variables**: All required variables are set and correct
- [ ] **Local Development**: OAuth flow works in development environment
- [ ] **Build Process**: Frontend and Function App build without errors
- [ ] **Bicep Validation**: Infrastructure templates validate successfully

### Post-Deployment Testing
- [ ] **OAuth Flow**: Complete end-to-end authentication works
- [ ] **API Connectivity**: Frontend can communicate with Function App
- [ ] **Key Vault Access**: Function App can retrieve secrets
- [ ] **CORS**: No cross-origin request errors
- [ ] **Error Handling**: Proper error messages for failed authentication
- [ ] **Session Management**: User sessions work correctly
- [ ] **Logout**: Users can successfully log out

### Performance & Security Testing
- [ ] **Response Times**: OAuth flow completes within acceptable time
- [ ] **Security Headers**: Proper security headers are present
- [ ] **HTTPS**: All communication uses HTTPS
- [ ] **Secret Management**: Secrets are not exposed in logs or client-side code

---

## 📊 **Progress Tracking**

### Current Status
- ✅ **Completed**: Critical fixes implemented (Fix 1-5)
- 🔄 **In Progress**: Ready for deployment and testing
- ⏳ **Pending**: Post-deployment validation and security enhancements

### Next Actions
1. **Immediate**: Complete Phase 1 critical fixes
2. **This Week**: Deploy and test critical fixes
3. **Next Week**: Implement medium priority improvements

