# GitHub Repository Manager (GitHub AccessOps)

A modern React-based web application for managing GitHub repository access and user permissions with a clean, intuitive interface.

## 🚀 Features

### 🔐 Security & Access Management
- **User Access Removal**: Remove specific users' access from repositories by username across multiple scopes
- **Multi-User Support**: Process multiple users simultaneously for bulk access management
- **Scope-Based Operations**: Target personal repositories, specific organizations, or all accessible repositories
- **Multi-Organization Support**: Select and process multiple organizations in a single operation
- **Real-time Progress Tracking**: Visual progress bars with detailed phase tracking for all operations

### 📊 Repository Management
- **Private Repository Listing**: Comprehensive view of all private repositories with detailed metadata
- **Public Repository Listing**: Complete catalog of public repositories across selected scopes
- **Repository Discovery**: Automatic discovery across personal repos and organization repositories
- **Batch Processing**: Efficient handling of large repository sets with optimized API usage

### 👥 User Analytics & Export
- **User Access Export**: Export all users with repository access to Excel format
- **Comprehensive User Details**: Include user permissions, roles, and repository associations
- **Cross-Repository Analysis**: Identify users across multiple repositories and organizations
- **Bulk User Operations**: Process and analyze thousands of user-repository relationships

### 🎯 Advanced Search & Filtering
- **Smart User Search**: Intelligent search for users across repositories with permission validation
- **Repository Filtering**: Filter repositories by visibility (private/public), organization, and access levels
- **Collaborative Detection**: Automatically detect direct collaborators and organization members
- **Permission Analysis**: Detailed permission breakdown (admin, write, read, triage, maintain)

### 🔄 Multi-Scope Operations
- **Personal Repositories**: Target your personal GitHub repositories
- **Organization-Specific**: Focus on specific organization repositories
- **Multi-Organization**: Process multiple organizations simultaneously
- **Global Scope**: Operate across all accessible repositories and organizations

### 🎨 User Experience
- **Dark/Light Theme**: Fully responsive design with automatic theme switching
- **Modern UI**: Built with React 19, TypeScript, and TailwindCSS 4.x
- **Animated Interface**: Smooth animations and transitions for better user experience
- **Progress Visualization**: Real-time progress bars with detailed status messages
- **Error Handling**: Comprehensive error reporting with actionable feedback

### 🔗 GitHub Integration
- **OAuth Authentication**: Secure GitHub OAuth integration for seamless login
- **API Rate Limiting**: Smart API usage with respect to GitHub rate limits
- **Organization Discovery**: Automatic detection of user's organization memberships
- **Repository Access Validation**: Real-time validation of repository permissions

### 🛠️ Technical Features
- **TypeScript Support**: Full type safety and enhanced developer experience
- **Vite Build System**: Fast development and optimized production builds
- **Azure Deployment**: Ready-to-deploy configuration for Azure Static Web Apps
- **CI/CD Pipeline**: Complete GitHub Actions workflow for automated deployment
- **Environment Management**: Secure environment variable handling for different deployment stages

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS 4.x with dark mode support
- **Icons**: React Icons
- **Build Tool**: Vite 4.5.0 (Node.js 18 compatible)
- **Deployment**: Azure Static Web Apps
- **CI/CD**: GitHub Actions

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sumitmalik51/GitHub-AccessOps.git
   cd GitHub-AccessOps/github-repo-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the `github-repo-manager` directory:
   ```env
   VITE_GITHUB_CLIENT_ID=your_github_client_id
   VITE_GITHUB_REDIRECT_URI=your_redirect_uri
   VITE_GITHUB_CLIENT_SECRET=your_github_client_secret
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run check-config` - Validate environment configuration

## 🌐 Deployment

This application is configured for deployment to Azure Static Web Apps using GitHub Actions.

### Prerequisites

1. **Azure Static Web App**: Create a static web app in Azure Portal
2. **GitHub Secrets**: Add the following secrets to your GitHub repository:
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - `VITE_GITHUB_CLIENT_ID`
   - `VITE_GITHUB_REDIRECT_URI`
   - `VITE_GITHUB_CLIENT_SECRET`

### Deployment Process

1. **Automatic Deployment**: Push to `main` branch triggers automatic deployment
2. **Manual Deployment**: Use GitHub Actions "workflow_dispatch" trigger

The deployment workflow:
- Uses Node.js 18.x (compatible with Azure Static Web Apps)
- Builds the React application with Vite
- Deploys to Azure Static Web Apps with OIDC authentication

## 🔐 GitHub OAuth Setup

1. **Create GitHub OAuth App**:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create a new OAuth App
   - Set Authorization callback URL to your deployment URL

2. **Configure Environment Variables**:
   - `VITE_GITHUB_CLIENT_ID`: Your OAuth app client ID
   - `VITE_GITHUB_REDIRECT_URI`: Your callback URL
   - `VITE_GITHUB_CLIENT_SECRET`: Your OAuth app client secret

## 📁 Project Structure

```
github-repo-manager/
├── src/
│   ├── components/          # React components
│   │   ├── Auth.tsx                    # GitHub OAuth authentication
│   │   ├── Dashboard.tsx               # Main control panel
│   │   ├── DeleteUserAccess.tsx        # User access removal tool
│   │   ├── ExportUsernames.tsx         # User data export functionality
│   │   ├── LandingPage.tsx             # Application landing page
│   │   ├── Layout.tsx                  # Main app layout wrapper
│   │   ├── OrganizationSelector.tsx    # Org/scope selection interface
│   │   ├── ProgressBar.tsx             # Progress visualization component
│   │   ├── RepositoryList.tsx          # Repository listing component
│   │   ├── RepositoryListView.tsx      # Repository view manager
│   │   └── ui/                         # Reusable UI components
│   ├── services/           # API and utility services
│   │   ├── environmentService.ts       # Environment variable management
│   │   ├── githubService.ts           # GitHub API integration
│   │   └── oauthService.ts            # OAuth flow management
│   ├── config/             # Application configuration
│   │   └── constants.ts               # UI constants and dashboard options
│   ├── App.tsx             # Main application component with routing
│   └── main.tsx           # Application entry point
├── public/                 # Static assets
├── .github/workflows/      # GitHub Actions workflows
│   └── azure-static-web-apps.yml      # Azure deployment pipeline
├── vite.config.ts         # Vite configuration (Node.js 18 compatible)
├── tailwind.config.js     # TailwindCSS configuration with dark mode
├── debug-build.js         # Build environment validation
├── check-config.js        # Environment configuration checker
└── package.json           # Dependencies and scripts
```

## 🚀 Key Application Workflows

### 1. User Access Removal Workflow
1. **Authentication**: User logs in via GitHub OAuth
2. **Scope Selection**: Choose personal repos, specific org, or multi-org
3. **User Input**: Enter target usernames (supports multiple users)
4. **Discovery Phase**: Search across repositories for user access
5. **Analysis Phase**: Identify permissions and access levels
6. **Removal Phase**: Remove access with progress tracking
7. **Reporting**: Display success/failure results with error details

### 2. Repository Listing Workflow
1. **Scope Selection**: Choose which repositories to list
2. **Discovery**: Fetch repositories from selected sources
3. **Classification**: Separate private and public repositories
4. **Display**: Present organized repository list with metadata

### 3. User Export Workflow
1. **Scope Selection**: Choose repositories to analyze
2. **User Discovery**: Find all users with access
3. **Data Compilation**: Gather user details and permissions
4. **Excel Generation**: Create downloadable Excel report
5. **Download**: Provide file download to user

## 🎨 Core Components & Features

### 🎛️ Dashboard
- **Centralized Control Panel**: Main hub for accessing all repository management features
- **4 Primary Operations**:
  - 🗑️ **Delete User Access**: Remove specific users from repositories
  - 🔒 **Private Repository Listing**: View and manage private repositories
  - 🌍 **Public Repository Listing**: Access public repository information
  - 📊 **User Export**: Export user access data to Excel

### 🔍 Organization Selector
- **Flexible Scope Selection**: Choose between personal repos, specific orgs, or multi-org operations
- **Smart Organization Discovery**: Automatically detects your organization memberships
- **Multi-Selection Support**: Process multiple organizations simultaneously
- **Scope Validation**: Ensures proper permissions before operations

### 🗑️ Delete User Access Component
- **Multi-User Input**: Add/remove user fields dynamically for bulk operations
- **Intelligent Search**: Searches across repositories to find user access
- **Permission Analysis**: Identifies exact permissions (admin, write, read, etc.)
- **Batch Processing**: Processes repositories in optimized batches
- **Real-time Progress**: Live updates during search and removal phases
- **Error Recovery**: Continues processing even if individual operations fail
- **Detailed Reporting**: Shows success/failure counts with specific error details

### 📊 Export Functionality
- **Excel Export**: Generates comprehensive Excel files with user access data
- **Repository Metadata**: Includes repository names, owners, visibility, and permissions
- **User Details**: Complete user information with access levels
- **Cross-Reference Data**: Shows user-repository relationships clearly

### 🔐 Authentication System
- **GitHub OAuth Integration**: Secure login using GitHub credentials
- **Token Management**: Secure handling of GitHub personal access tokens
- **Session Management**: Maintains authentication state across app usage
- **Automatic Logout**: Clears tokens and resets state on logout

## 🔄 Development Workflow

1. **Local Development**: Use `npm run dev` for hot-reload development
2. **Environment Check**: Run `npm run check-config` to validate configuration
3. **Type Checking**: TypeScript compilation with `npx tsc -b`
4. **Build Testing**: Test production build with `npm run build`

## 🐛 Troubleshooting

### Common Issues

1. **Node.js Version**: Ensure Node.js 18.x for Azure Static Web Apps compatibility
2. **Environment Variables**: Verify all `VITE_` prefixed variables are set
3. **Build Errors**: Check TypeScript compilation with `npx tsc -b`

### Debug Scripts

- `debug-build.js`: Validates build environment and configuration
- `check-config.js`: Verifies environment variable setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [Your Azure Static Web App URL]
- **Repository**: [https://github.com/sumitmalik51/GitHub-AccessOps](https://github.com/sumitmalik51/GitHub-AccessOps)
- **Issues**: [Report Issues](https://github.com/sumitmalik51/GitHub-AccessOps/issues)

## 📞 Support

For support, please open an issue in the GitHub repository or contact the maintainers.

---

**Built with ❤️ using React, TypeScript, and Azure Static Web Apps**
