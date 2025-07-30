# GitSecureOps 🔒

**Enterprise GitHub Access Controls with Built-in Automation**

GitSecureOps is a professional React-based web application that streamlines GitHub repository management with enterprise-grade security. Manage repository access, automate permissions, maintain compliance, and ensure security across all your GitHub organizations and repositories from one sleek dashboard.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19.1.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)

## ✨ Key Features

### 🔒 **Two-Factor Authentication Compliance**
- **Organization Scanning**: Comprehensive 2FA compliance monitoring for entire organizations
- **Repository Analysis**: Automatic inclusion of repository collaborators in organization scans
- **Compliance Reports**: Detailed reports showing 2FA status across all users
- **Export Capabilities**: Export compliance data for security auditing
- **Real-time Status**: Live updates on user compliance status

### 🔑 **Grant GitHub Access**
- **User Invitations**: Invite users to organizations and repositories
- **Role Management**: Assign specific roles (admin, write, read) with precision
- **Bulk Operations**: Invite multiple users across multiple repositories
- **Validation**: Username and repository path validation
- **Smart Workflow**: Step-by-step guided invitation process

### 🧬 **GitHub Actions Management**
- **Workflow Overview**: Monitor GitHub Actions across all repositories
- **Security Controls**: Manage action permissions and secrets
- **Performance Insights**: Track workflow performance and success rates
- **Automation**: Streamline CI/CD pipeline management

### 🗑️ **Delete User Access**
- **Bulk Removal**: Remove collaborators from multiple repositories simultaneously
- **Organization Management**: Remove users from entire organizations
- **Safety Checks**: Confirmation dialogs prevent accidental removals
- **Audit Trail**: Complete logging of all access changes

### 📊 **Repository Management**
- **Unified View**: List all accessible repositories (personal and organization)
- **Smart Filtering**: Filter by public/private status, search by name
- **Collaborator Overview**: View and manage collaborators across all repositories
- **Permission Details**: Detailed permission levels for each collaborator

### 🤖 **Smart Recommendations**
- **AI-Powered Insights**: Intelligent suggestions for repository security
- **Best Practices**: Automated recommendations for access control
- **Security Alerts**: Proactive identification of potential security issues
- **Optimization Tips**: Performance and efficiency recommendations

### 📈 **Export & Analytics**
- **Data Export**: Export username data and access reports
- **CSV/JSON Support**: Multiple export formats for integration
- **Compliance Reports**: Generate detailed compliance documentation
- **Usage Analytics**: Track application usage and performance

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **GitHub Personal Access Token** with appropriate permissions

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sumitmalik51/GitHub-AccessOps.git
   cd GitHub-AccessOps
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

### GitHub Personal Access Token Setup

Create a GitHub Personal Access Token with the following scopes:

**For Organization Management:**
- `repo` (Full control of private repositories)
- `read:org` (Read org and team membership)
- `admin:org` (Full control of orgs and teams)

**For User Management:**
- `user` (Update user information)
- `read:user` (Read user profile data)

**For Actions Management:**
- `workflow` (Update GitHub Actions workflows)

## 🏗️ Project Structure

```
src/
├── components/              # React components
│   ├── Auth.tsx            # Authentication system
│   ├── Dashboard.tsx       # Main dashboard
│   ├── TwoFactorChecker.tsx # 2FA compliance monitoring
│   ├── GrantAccess.tsx     # User invitation system
│   ├── DeleteUserAccess.tsx # User removal system
│   ├── GitHubActionsManager.tsx # Actions management
│   ├── RepositoryListView.tsx # Repository overview
│   ├── ExportUsernames.tsx # Data export functionality
│   ├── SmartRecommendations.tsx # AI recommendations
│   ├── Layout.tsx          # Application layout
│   ├── Sidebar.tsx         # Navigation sidebar
│   ├── Topbar.tsx          # Top navigation
│   └── LandingPage_new.tsx # Marketing landing page
├── services/               # API services
│   ├── githubService.ts    # GitHub API integration
│   ├── oauthService.ts     # OAuth authentication
│   ├── aiService.ts        # AI recommendations
│   ├── notificationService.ts # Notification system
│   └── environmentService.ts # Environment management
├── utils/                  # Utility functions
│   └── helpers.ts          # Common helper functions
├── App.tsx                 # Main application component
└── main.tsx               # Application entry point
```

## 🔐 Security Features

### **Zero Data Storage**
- GitHub tokens stored only in memory, never persisted
- No data sent to third-party servers
- All operations performed client-side

### **Token Validation**
- Comprehensive token format validation
- Support for multiple GitHub token types
- Secure token handling practices

### **API Security**
- Direct GitHub API integration
- Minimal required permissions
- Secure HTTPS communications

### **Audit Trail**
- Complete logging of all operations
- Detailed operation history
- Export capabilities for compliance

## 🌐 GitHub API Integration

GitSecureOps integrates with the following GitHub API endpoints:

**User Management:**
- `GET /user` - Authenticated user information
- `GET /user/orgs` - User organizations
- `GET /orgs/{org}/members` - Organization members

**Repository Management:**
- `GET /user/repos` - User repositories
- `GET /orgs/{org}/repos` - Organization repositories
- `GET /repos/{owner}/{repo}/collaborators` - Repository collaborators

**Access Control:**
- `PUT /repos/{owner}/{repo}/collaborators/{username}` - Add collaborator
- `DELETE /repos/{owner}/{repo}/collaborators/{username}` - Remove collaborator
- `GET /repos/{owner}/{repo}/collaborators/{username}/permission` - Check permissions

**2FA Compliance:**
- `GET /orgs/{org}/members?filter=2fa_disabled` - 2FA status checking
- `GET /user` - User 2FA status

## 🛠️ Development

### **Available Scripts**

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run check-config # Validate configuration
```

### **Technology Stack**

- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom animations
- **Build Tool**: Vite with optimized configuration
- **Code Quality**: ESLint with TypeScript rules
- **API**: GitHub REST API integration

### **Development Guidelines**

1. **Code Style**: Follow TypeScript best practices
2. **Components**: Use functional components with hooks
3. **State Management**: React Context for global state
4. **Error Handling**: Comprehensive error boundaries
5. **Testing**: Component and integration testing

## 🚀 Deployment

### **Build for Production**

```bash
npm run build
```

The built files will be in the `dist/` directory.

### **Azure Static Web Apps**

The project includes Azure deployment configuration:

```yaml
# azure.yaml
name: GitSecureOps
infra:
  provider: bicep
services:
  gitsecureops-web:
    project: ./
    host: staticwebapp
    language: ts
```

### **Environment Variables**

For OAuth integration, create a `.env` file:

```bash
VITE_GITHUB_CLIENT_ID=your-github-client-id
VITE_GITHUB_CLIENT_SECRET=your-github-client-secret
```

## 📖 API Documentation

### **GitHub Service**

The `githubService.ts` provides comprehensive GitHub API integration:

```typescript
// Key interfaces
interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  permissions?: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
    triage: boolean;
    pull: boolean;
  };
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubUser;
  collaborators?: GitHubUser[];
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Setup**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **GitHub API** for comprehensive repository management
- **React Team** for the excellent framework
- **Tailwind CSS** for beautiful styling
- **Vite** for lightning-fast development

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/sumitmalik51/GitHub-AccessOps/wiki)
- **Issues**: [GitHub Issues](https://github.com/sumitmalik51/GitHub-AccessOps/issues)
- **Developer**: [Sumit Malik](https://github.com/sumitmalik51)
- **Portfolio**: [sumitmalik51.github.io](https://sumitmalik51.github.io/sumitmalik51/)

---

**Built with ❤️ using React & TypeScript**

*Enterprise GitHub Access Controls • Version 1.0.0*
