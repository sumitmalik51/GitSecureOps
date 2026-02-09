# Contributing to GitSecureOps

Thank you for your interest in contributing to GitSecureOps! This document provides guidelines and instructions for contributing to the project.

## 🌟 Ways to Contribute

- 🐛 **Report bugs** - Help us identify and fix issues
- ✨ **Suggest features** - Share ideas for new functionality
- 📚 **Improve documentation** - Help make our docs clearer and more comprehensive
- 🔧 **Submit pull requests** - Contribute code improvements
- 💬 **Help others** - Answer questions in discussions and issues
- 🔍 **Review pull requests** - Provide feedback on proposed changes

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Azure Functions Core Tools 4.x
- Git installed and configured
- GitHub account
- Basic knowledge of React, TypeScript, and Azure

### Setup Development Environment

1. **Fork the repository**
   ```bash
   # Click the 'Fork' button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/GitSecureOps.git
   cd GitSecureOps
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/sumitmalik51/GitSecureOps.git
   ```

4. **Install dependencies**
   ```bash
   # Frontend dependencies
   npm install
   
   # API dependencies
   cd api
   npm install
   cd ..
   ```

5. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your GitHub OAuth credentials
   ```

6. **Start development servers**
   ```bash
   # Terminal 1 - Frontend
   npm run dev
   
   # Terminal 2 - API
   cd api
   npm start
   ```

## 📝 Development Workflow

### Branch Naming Convention

Use descriptive branch names following this pattern:

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates
- `chore/description` - Maintenance tasks

**Examples:**
- `feature/add-user-settings`
- `fix/oauth-callback-error`
- `docs/update-readme`

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation as needed

3. **Test your changes**
   ```bash
   # Run linting
   npm run lint
   
   # Check TypeScript types
   npx tsc --noEmit
   
   # Build to ensure no errors
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add user settings page"
   ```

### Commit Message Convention

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks
- `perf` - Performance improvements
- `ci` - CI/CD changes
- `build` - Build system changes

**Examples:**
```bash
feat(auth): add GitHub OAuth integration
fix(api): resolve callback redirect issue
docs(readme): update installation instructions
refactor(components): simplify dashboard layout
```

### Submitting Pull Requests

1. **Push your changes**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request**
   - Go to the [repository](https://github.com/sumitmalik51/GitSecureOps)
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template completely
   - Link any related issues

3. **PR Requirements**
   - ✅ Clear description of changes
   - ✅ All tests pass
   - ✅ Code is linted
   - ✅ TypeScript compiles without errors
   - ✅ No merge conflicts
   - ✅ Screenshots for UI changes
   - ✅ Updated documentation (if needed)

4. **Review Process**
   - Maintainers will review your PR
   - Address any requested changes
   - Once approved, your PR will be merged

## 🧪 Testing Guidelines

### Frontend Testing

```bash
# Run linting
npm run lint

# Check types
npx tsc --noEmit

# Build
npm run build
```

### API Testing

```bash
cd api

# Validate functions
test -f host.json && echo "✅ Valid"
```

### Manual Testing

1. Test OAuth flow completely
2. Verify UI changes in multiple browsers
3. Check responsive design on mobile
4. Test error handling scenarios
5. Verify API endpoints work correctly

## 📋 Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new code
- Use functional components with hooks
- Prefer const over let
- Use descriptive variable names
- Add JSDoc comments for complex functions
- Use async/await over promises
- Handle errors appropriately

**Example:**
```typescript
/**
 * Fetches user organizations from GitHub API
 * @param token - GitHub OAuth token
 * @returns Array of organization objects
 */
export async function fetchUserOrganizations(token: string): Promise<Organization[]> {
  try {
    const response = await fetch('https://api.github.com/user/orgs', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch organizations: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw error;
  }
}
```

### React Components

- Use functional components
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop types with TypeScript
- Follow React best practices

**Example:**
```typescript
interface UserCardProps {
  name: string;
  avatar: string;
  role: string;
}

export function UserCard({ name, avatar, role }: UserCardProps) {
  return (
    <div className="user-card">
      <img src={avatar} alt={name} />
      <h3>{name}</h3>
      <span>{role}</span>
    </div>
  );
}
```

### CSS/Styling

- Use Tailwind CSS utility classes
- Follow existing design patterns
- Maintain glassmorphism design style
- Ensure responsive design
- Test on multiple screen sizes

## 🔒 Security Guidelines

- **Never commit secrets or API keys**
- Use environment variables for sensitive data
- Validate all user inputs
- Follow OAuth best practices
- Review code for security vulnerabilities
- Report security issues privately

## 📚 Documentation

- Update README.md for major changes
- Add JSDoc comments for functions
- Document API endpoints
- Update type definitions
- Include examples where helpful

## 🎯 Pull Request Checklist

Before submitting your PR, ensure:

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] All tests pass locally
- [ ] Screenshots included for UI changes
- [ ] PR description is clear and complete

## 🐛 Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details
- Error logs

## ✨ Requesting Features

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) and include:

- Clear description of the feature
- Problem it solves
- Proposed solution
- Benefits and use cases
- UI mockups (if applicable)

## ❓ Getting Help

- 📖 Check the [README](README.md)
- 🔍 Search existing [issues](https://github.com/sumitmalik51/GitSecureOps/issues)
- 💬 Start a [discussion](https://github.com/sumitmalik51/GitSecureOps/discussions)
- 📧 Contact maintainers

## 📄 License

By contributing to GitSecureOps, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You

Your contributions make GitSecureOps better for everyone. We appreciate your time and effort! 💙

---

**Questions?** Feel free to open an issue or start a discussion.
