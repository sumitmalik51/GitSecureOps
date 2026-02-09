# GitHub Automation Features

This document provides comprehensive documentation for all GitHub automation workflows and features implemented in GitSecureOps.

## 📋 Table of Contents

- [CI/CD Workflows](#cicd-workflows)
- [Pull Request Automation](#pull-request-automation)
- [Release Management](#release-management)
- [Security & Dependency Management](#security--dependency-management)
- [Repository Health](#repository-health)
- [Issue & PR Templates](#issue--pr-templates)
- [Workflow Triggers](#workflow-triggers)

---

## 🔄 CI/CD Workflows

### 1. CI - Build, Lint, and Test

**File:** `.github/workflows/ci.yml`

**Purpose:** Automated testing and validation on every pull request and push to main branches.

**Features:**
- ✅ Frontend linting with ESLint
- ✅ TypeScript type checking
- ✅ Build verification
- ✅ API function validation
- ✅ Build artifact upload

**Triggers:**
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`
- Manual workflow dispatch

**Example Usage:**
```bash
# Workflow runs automatically on PR creation
# To manually trigger:
# Go to Actions → CI → Run workflow
```

---

### 2. CodeQL Security Analysis

**File:** `.github/workflows/codeql-analysis.yml`

**Purpose:** Automated security vulnerability scanning using GitHub's CodeQL.

**Features:**
- 🔒 Scans JavaScript and TypeScript code
- 🔍 Security-extended and quality queries
- 📊 Results in Security tab
- 🔄 Weekly scheduled scans

**Triggers:**
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`
- Weekly on Mondays at 2 AM UTC
- Manual workflow dispatch

**Viewing Results:**
```
Repository → Security → Code scanning alerts
```

---

### 3. Dependency Review

**File:** `.github/workflows/dependency-review.yml`

**Purpose:** Reviews dependency changes in pull requests for security vulnerabilities and licensing issues.

**Features:**
- 🔍 Scans new dependencies
- 🚫 Blocks GPL-2.0 and GPL-3.0 licenses
- ⚠️ Fails on moderate+ severity vulnerabilities
- 💬 Comments summary in PRs

**Triggers:**
- Pull requests to `main` or `develop`

---

## 🏷️ Pull Request Automation

### 4. PR Labeler

**File:** `.github/workflows/pr-labeler.yml`

**Configuration:** `.github/labeler.yml`

**Purpose:** Automatically labels PRs based on changed files.

**Labels Applied:**
- `frontend` - Changes to src/, Vite config, Tailwind
- `backend` - Changes to api/
- `infrastructure` - Changes to infra/, Azure configs
- `automation` - Changes to .github/workflows/
- `documentation` - Changes to *.md files
- `dependencies` - Changes to package.json
- `security` - Changes to auth/security related files
- `ui` - Changes to components or styles
- `tests` - Changes to test files

**Triggers:**
- PR opened, synchronized, or reopened

**Example:**
```
PR modifying src/components/Dashboard.tsx
→ Automatically labeled: frontend, ui
```

---

### 5. PR Size and Complexity Check

**File:** `.github/workflows/pr-size-check.yml`

**Purpose:** Analyzes and reports PR size to encourage smaller, focused changes.

**Features:**
- 📊 Calculates lines added/deleted
- 🏷️ Assigns size labels (XS, S, M, L, XL)
- 💬 Comments on PR with metrics
- ⚠️ Warns on large PRs

**Size Guidelines:**
- **XS**: < 50 changes
- **S**: 50-199 changes
- **M**: 200-499 changes
- **L**: 500-999 changes
- **XL**: ≥ 1000 changes

**Triggers:**
- PR opened, synchronized, or reopened

---

### 6. Stale PR and Issue Management

**File:** `.github/workflows/stale-management.yml`

**Purpose:** Automatically manages inactive issues and PRs to keep the repository clean.

**Configuration:**
- **Issues:**
  - Marked stale after 60 days of inactivity
  - Closed after 7 additional days
  - Exempt labels: `pinned`, `security`, `bug`, `enhancement`

- **Pull Requests:**
  - Marked stale after 30 days of inactivity
  - Closed after 7 additional days
  - Exempt labels: `pinned`, `security`, `work-in-progress`

**Triggers:**
- Daily at 1 AM UTC
- Manual workflow dispatch

---

## 🚀 Release Management

### 7. Release Management

**File:** `.github/workflows/release.yml`

**Purpose:** Automates release creation with changelog generation.

**Features:**
- 📦 Creates GitHub releases
- 📝 Generates changelog from commits
- 🏷️ Supports semantic versioning
- 📎 Attaches build artifacts
- 🔖 Marks pre-releases (alpha, beta)

**Triggers:**
- Push of version tags (e.g., `v2.1.0`)
- Manual workflow dispatch with version input

**Creating a Release:**

```bash
# Option 1: Create and push a tag
git tag v2.1.0
git push origin v2.1.0

# Option 2: Use GitHub Actions UI
# Go to Actions → Release Management → Run workflow
# Enter version (e.g., v2.1.0)
```

---

### 8. Deployment Status Notifications

**File:** `.github/workflows/deployment-notification.yml`

**Purpose:** Provides deployment status summaries and notifications.

**Features:**
- ✅ Success/failure notifications
- 📊 Deployment metrics
- 🔗 Links to workflow runs
- 📝 Creates job summaries

**Triggers:**
- Completion of "Deploy GitSecureOps Application" workflow

---

## 🔒 Security & Dependency Management

### 9. Dependabot Configuration

**File:** `.github/dependabot.yml`

**Purpose:** Automated dependency updates for security and maintenance.

**Configuration:**
- **Frontend Dependencies:**
  - Weekly updates on Mondays at 9 AM
  - Groups React ecosystem updates
  - Groups dev dependencies
  - Max 10 open PRs

- **API Dependencies:**
  - Weekly updates on Mondays at 9 AM
  - Groups Azure dependencies
  - Max 10 open PRs

- **GitHub Actions:**
  - Weekly updates on Mondays at 9 AM
  - Max 5 open PRs

**Labels Applied:** `dependencies`, `frontend`/`backend`/`automation`

---

## 📊 Repository Health

### 10. Repository Health Check

**File:** `.github/workflows/repo-health-check.yml`

**Purpose:** Weekly repository health and metrics reporting.

**Metrics Tracked:**
- 📁 Total files count
- 📝 TypeScript/JavaScript files
- 📏 Lines of code
- 📈 Commit activity (week/month)
- 📚 Documentation status
- 📦 Outdated dependencies
- 🔒 Security audit results

**Triggers:**
- Weekly on Sundays at 8 AM UTC
- Manual workflow dispatch

**Viewing Reports:**
```
Repository → Actions → Repository Health Check → Latest run → Summary
```

---

## 📝 Issue & PR Templates

### Issue Templates

Located in `.github/ISSUE_TEMPLATE/`:

1. **Bug Report** (`bug_report.md`)
   - Template for reporting bugs
   - Labels: `bug`

2. **Feature Request** (`feature_request.md`)
   - Template for suggesting features
   - Labels: `enhancement`

3. **Security Vulnerability** (`security_vulnerability.md`)
   - Template for security issues
   - Labels: `security`
   - Assignee: Repository maintainer

4. **Question** (`question.md`)
   - Template for asking questions
   - Labels: `question`

### PR Template

**File:** `.github/PULL_REQUEST_TEMPLATE/pull_request_template.md`

**Sections:**
- Description
- Type of change
- Related issues
- Testing checklist
- Screenshots (if UI changes)
- Security considerations
- Deployment notes

---

## 🎯 Workflow Triggers

### Automatic Triggers

| Event | Workflows Triggered |
|-------|-------------------|
| **PR to main/develop** | CI, CodeQL, Dependency Review, PR Labeler, PR Size Check |
| **Push to main/develop** | CI, CodeQL |
| **Tag push (v*.*.*)** | Release Management |
| **Daily (1 AM UTC)** | Stale Management |
| **Weekly (Mon 2 AM UTC)** | CodeQL |
| **Weekly (Mon 9 AM UTC)** | Dependabot updates |
| **Weekly (Sun 8 AM UTC)** | Repository Health Check |
| **Deployment complete** | Deployment Notifications |

### Manual Triggers

All workflows support manual dispatch via GitHub Actions UI:

```
Repository → Actions → [Workflow Name] → Run workflow
```

---

## 🎨 Workflow Status Badges

Add these badges to your README:

```markdown
![CI](https://github.com/sumitmalik51/GitSecureOps/workflows/CI%20-%20Build,%20Lint,%20and%20Test/badge.svg)
![CodeQL](https://github.com/sumitmalik51/GitSecureOps/workflows/CodeQL%20Security%20Analysis/badge.svg)
```

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `.github/workflows/*.yml` | Workflow definitions |
| `.github/labeler.yml` | PR auto-labeling rules |
| `.github/dependabot.yml` | Dependency update config |
| `.github/ISSUE_TEMPLATE/` | Issue templates |
| `.github/PULL_REQUEST_TEMPLATE/` | PR template |

---

## 📈 Best Practices

### For Contributors

1. **Keep PRs Small:** Aim for S or M sized PRs (< 500 changes)
2. **Use Templates:** Fill out issue/PR templates completely
3. **Link Issues:** Reference related issues in PRs
4. **Test Locally:** Run linting and builds before pushing
5. **Review Feedback:** Address automated checks and reviews

### For Maintainers

1. **Monitor Security:** Check CodeQL and dependency alerts weekly
2. **Review Stale Items:** Address or close stale issues/PRs
3. **Update Dependencies:** Review and merge Dependabot PRs
4. **Check Health Reports:** Review weekly health check summaries
5. **Manage Labels:** Keep PR labels organized and meaningful

---

## 🚨 Troubleshooting

### CI Workflow Failing

```bash
# Run locally to debug
npm run lint
npx tsc --noEmit
npm run build
```

### CodeQL Errors

- Check for syntax errors in TypeScript/JavaScript
- Review CodeQL alerts in Security tab
- Fix flagged security issues

### Dependabot PR Failures

- Review breaking changes in dependency
- Update code to accommodate changes
- Test thoroughly before merging

### Stale Bot Issues

- Add `pinned` label to keep important issues open
- Comment on stale items to reactivate them
- Review exempt labels configuration

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## 🙋 Need Help?

- Open an issue using the appropriate template
- Start a discussion in GitHub Discussions
- Contact maintainers via issues

---

*Last updated: February 2026*
