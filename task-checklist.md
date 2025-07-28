# ✅ GitHub Repo Access Manager – Task List

This task list outlines the steps to build a static UI app that:
- Accepts a GitHub PAT and username
- Lists all repositories (public/private)
- Displays collaborators
- Allows removing access via checkboxes

---

## 🔧 Phase 1: Project Setup
- [x] Set up a static frontend project (React.js with Vite/CRA or plain HTML/JS)
- [x] Add Tailwind CSS or Bootstrap for styling (optional)
- [x] Create folder structure:
  - `components/`
  - `services/`
  - `utils/`
  - `App.js` or `index.html`

---

## 🔐 Phase 2: Authentication
- [x] Create input field for GitHub Personal Access Token (PAT)
- [x] ~~Create input field for GitHub username~~ (Not needed - username auto-detected from PAT)
- [x] Store PAT securely in local state (do not persist)

---

## 🏢 Phase 3: GitHub Org & Repo Discovery
- [x] Call `GET /user/orgs` to list organizations
- [x] Call `GET /user/repos` to list personal and accessible repos
- [x] Call `GET /orgs/{org}/repos` for org-specific repos
- [x] Provide UI toggle for:
  - [x] Show only public repos
  - [x] Show only private repos

---

## 📋 Phase 4: Repo Display & Access Selection
- [x] Display all repositories in a list/table with checkboxes
- [x] Display collaborators for each repo
- [x] Provide "Remove Access" checkbox for each collaborator
- [x] Provide repo filter/search bar
- [x] Add "Remove Selected Access" button

---

## 👥 Phase 5: Collaborator Access Listing
- [x] Call `GET /repos/{owner}/{repo}/collaborators` for each repo
- [x] Aggregate and deduplicate collaborators across repos
- [x] Display unique list of users with access

---

## ❌ Phase 6: Remove Access Logic
- [x] On action, call `DELETE /repos/{owner}/{repo}/collaborators/{username}`
- [x] Confirm before removing access
- [x] Show status (success/failure) per operation
- [x] Handle API errors (permissions, rate limits)

---

## 🧪 Phase 7: Testing and UX Enhancements
- [x] Add loading indicators for API calls
- [x] Show API error messages (e.g., invalid PAT)
- [x] Show success/failure banners/toasts
- [x] Test with real GitHub accounts and tokens

---

## 🧼 Phase 8: Optional Enhancements
- [x] Add dark/light mode toggle
- [x] Export list of collaborators to CSV
- [x] Persist UI settings (theme, filters)
- [x] Retry logic for rate-limited operations
- [x] Add org/repo search capability

---

## 🎯 Phase 9: New Dashboard Flow (COMPLETED)
- [x] Create dashboard with options after authentication
- [x] Add "Delete User Access by Username" feature
- [x] Add "List Private Repositories" feature
- [x] Add "List Public Repositories" feature  
- [x] Add "Export All Usernames" feature with Excel export
- [x] Implement improved error handling and progress indicators
- [x] Add CSV export functionality for all features

---

## 🎯 Phase 10: Performance & Scope Enhancements (COMPLETED)
- [x] Add organization selection step before each feature
- [x] Allow users to choose scope: Personal repos, specific org, or all repos
- [x] Optimize delete user access with batched API calls and progress tracking
- [x] Implement scope-based repository filtering for better performance
- [x] Add detailed error reporting for failed access removal operations
- [x] Enhance UI with real-time progress indicators and scope display
- [x] Fix access removal functionality with better error handling
- [x] Add helpful error explanations for common failure scenarios

---

