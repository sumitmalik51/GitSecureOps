# GitSecureOps Version 2

A modern, secure GitHub organization management application built with React, TypeScript, and Azure Functions.

## Features

- **Modern UI**: Built with React 18, TypeScript, and Tailwind CSS
- **Glassmorphism Design**: Dark mode with beautiful glass-like components
- **GitHub OAuth**: Secure authentication via GitHub
- **Repository Management**: View and manage organization repositories
- **Copilot Management**: Control GitHub Copilot access and usage
- **Real-time Activity**: Track GitHub activity across organizations
- **Responsive Design**: Works on desktop, tablet, and mobile

## Quick Start

### Prerequisites

- Node.js 18+ 
- Azure Functions Core Tools 4.x
- GitHub OAuth App (for authentication)

### Frontend Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment configuration:
   ```bash
   cp .env.example .env.local
   ```

4. Update `.env.local` with your GitHub OAuth credentials:
   ```env
   VITE_GITHUB_CLIENT_ID=your-github-client-id
   VITE_FUNCTION_APP_URL=http://localhost:7071
   VITE_STATIC_WEB_APP_URL=http://localhost:5173
   VITE_GITHUB_REDIRECT_URI=http://localhost:7071/api/github-callback
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to the API directory:
   ```bash
   cd api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure local settings in `api/local.settings.json`:
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "UseDevelopmentStorage=true",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "GH_WEB_APP": "your_github_client_id",
       "GH_WEB_APP_SECRET": "your_github_client_secret",
       "FRONTEND_URL": "http://localhost:5173"
     }
   }
   ```

4. Start the Azure Functions runtime:
   ```bash
   npm start
   ```

### GitHub OAuth Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App with:
   - **Application name**: GitSecureOps
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:7071/api/github-callback`
3. Copy the Client ID and Client Secret to your environment files

## Architecture

### Frontend
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **React Router**: Client-side routing

### Backend
- **Azure Functions**: Serverless functions for API endpoints
- **Node.js**: JavaScript runtime
- **GitHub API**: Integration with GitHub services

### Key Components

- **AuthContext**: Manages user authentication state
- **ProtectedRoute**: Guards private pages
- **OAuth Service**: Handles GitHub OAuth flow
- **GitHub Service**: API wrapper for GitHub operations

## Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend  
- `npm start` - Start Azure Functions locally
- `npm test` - Run tests (when available)

## Deployment

### Azure Static Web Apps

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy using Azure Static Web Apps CLI or GitHub Actions

3. Configure environment variables in Azure:
   - `VITE_GITHUB_CLIENT_ID`
   - `VITE_FUNCTION_APP_URL` 
   - `VITE_STATIC_WEB_APP_URL`

### Environment Variables

#### Frontend
- `VITE_GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `VITE_FUNCTION_APP_URL` - Backend API URL
- `VITE_STATIC_WEB_APP_URL` - Frontend URL
- `VITE_GITHUB_REDIRECT_URI` - OAuth callback URL

#### Backend
- `GH_WEB_APP` - GitHub OAuth client ID
- `GH_WEB_APP_SECRET` - GitHub OAuth client secret
- `FRONTEND_URL` - Frontend URL for CORS

## Security Features

- **OAuth 2.0**: Secure GitHub authentication
- **CSRF Protection**: State parameter validation
- **Token Validation**: Server-side token verification
- **Secure Headers**: Security headers in API responses
- **Rate Limiting**: GitHub API rate limit handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
