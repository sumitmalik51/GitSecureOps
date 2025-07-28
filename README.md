# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# GitSecureOps

A React-based web application for automating GitHub repository access management. This tool allows you to view all your repositories and their collaborators, and remove access for selected users across multiple repositories with enterprise-grade security.

## Features

- **Simplified Authentication**: Only requires GitHub Personal Access Token (username auto-detected)
- **Repository Discovery**: Lists all accessible repositories (personal and organization)
- **Collaborator Management**: View and manage collaborators across all repositories
- **Bulk Operations**: Remove multiple collaborators from multiple repositories
- **Filtering**: Filter repositories by public/private status and search by name
- **Modern UI**: Clean, responsive interface built with Tailwind CSS

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- GitHub Personal Access Token with `repo` and `read:org` permissions

## Setup

1. **Clone and install dependencies:**
   ```bash
   cd github-repo-manager
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to the local development URL (typically `http://localhost:5173`)

## Creating a GitHub Personal Access Token

1. Go to [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens/new)
2. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `read:org` (Read org and team membership)
3. Generate the token and copy it securely

## Project Structure

```
src/
├── components/           # React components
│   ├── Auth.tsx         # Authentication form
│   └── RepositoryList.tsx # Main repository and collaborator management
├── services/            # API services
│   └── githubService.ts # GitHub API integration
├── utils/               # Utility functions
│   └── helpers.ts       # Common helper functions
├── App.tsx              # Main application component
└── main.tsx             # Application entry point
```

## Security Notes

- Your GitHub token is stored only in memory and never persisted
- All API calls are made directly to GitHub's API from your browser
- No data is sent to any third-party servers

## GitHub API Endpoints Used

- `GET /user` - Get authenticated user information
- `GET /user/orgs` - List user's organizations
- `GET /user/repos` - List user's repositories
- `GET /orgs/{org}/repos` - List organization repositories
- `GET /repos/{owner}/{repo}/collaborators` - List repository collaborators
- `DELETE /repos/{owner}/{repo}/collaborators/{username}` - Remove collaborator

## Technologies Used

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and development server
- **Tailwind CSS** - Styling
- **GitHub REST API** - Data source

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory and can be served by any static web server.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
