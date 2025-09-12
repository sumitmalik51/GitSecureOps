// Shared validation utilities for GitHub-related inputs

/**
 * Validates GitHub username format
 * GitHub usernames can only contain alphanumeric characters and hyphens,
 * cannot start or end with a hyphen, and are limited to 39 characters
 */
export function validateGitHubUsername(username: string): boolean {
  if (!username || typeof username !== 'string') {
    return false;
  }

  // Check length (GitHub usernames are max 39 characters)
  if (username.length === 0 || username.length > 39) {
    return false;
  }

  // GitHub username regex: alphanumeric and hyphens, cannot start/end with hyphen
  const regex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
  return regex.test(username);
}

/**
 * Checks if a string looks like an email address
 * This helps provide better error messages when users accidentally enter emails instead of usernames
 */
export function isEmailAddress(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }
  
  // Simple email detection - contains @ symbol
  return input.includes('@');
}

/**
 * Validates email address format
 * Basic email validation to ensure it looks like a valid email
 */
export function validateEmailAddress(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic email regex - checks for @ symbol and basic structure
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates and sanitizes a list of GitHub usernames and email addresses
 * Returns both valid inputs and validation errors
 */
export function validateGitHubUsernames(usernames: string[]): {
  validUsernames: string[];
  validEmails: string[];
  errors: string[];
} {
  const validUsernames: string[] = [];
  const validEmails: string[] = [];
  const errors: string[] = [];

  for (const input of usernames) {
    const trimmed = input.trim();
    
    if (trimmed.length === 0) {
      continue; // Skip empty inputs
    }

    if (isEmailAddress(trimmed)) {
      // Validate email format
      if (validateEmailAddress(trimmed)) {
        validEmails.push(trimmed);
      } else {
        errors.push(`"${trimmed}" is not a valid email address format.`);
      }
    } else if (!validateGitHubUsername(trimmed)) {
      errors.push(`"${trimmed}" is not a valid GitHub username format.`);
    } else {
      validUsernames.push(trimmed);
    }
  }

  return { validUsernames, validEmails, errors };
}

/**
 * Parses GitHub repository URL and extracts owner and repository name
 * Supports various GitHub URL formats
 */
export interface ParsedGitHubRepo {
  owner: string;
  repo: string;
  isValid: boolean;
  originalUrl: string;
  error?: string;
}

export function parseGitHubRepoUrl(url: string): ParsedGitHubRepo {
  const result: ParsedGitHubRepo = {
    owner: '',
    repo: '',
    isValid: false,
    originalUrl: url.trim()
  };

  if (!url || typeof url !== 'string') {
    result.error = 'URL is required';
    return result;
  }

  const trimmedUrl = url.trim();
  
  if (trimmedUrl.length === 0) {
    result.error = 'URL is required';
    return result;
  }

  try {
    // Support various GitHub URL formats
    let cleanUrl = trimmedUrl;
    
    // Remove trailing slashes
    cleanUrl = cleanUrl.replace(/\/$/, '');
    
    // Try to match GitHub repository patterns
    const patterns = [
      // https://github.com/owner/repo
      /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?$/i,
      // github.com/owner/repo
      /^github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?$/i,
      // owner/repo format
      /^([^\/\s]+)\/([^\/\s]+)$/
    ];

    let match: RegExpMatchArray | null = null;
    
    for (const pattern of patterns) {
      match = cleanUrl.match(pattern);
      if (match) {
        break;
      }
    }

    if (!match) {
      result.error = 'Invalid GitHub repository URL format. Expected formats: https://github.com/owner/repo, github.com/owner/repo, or owner/repo';
      return result;
    }

    const [, owner, repo] = match;
    
    // Validate owner and repository names
    if (!owner || !repo) {
      result.error = 'Could not extract owner and repository name from URL';
      return result;
    }

    // Basic validation for GitHub names (alphanumeric, hyphens, underscores, dots)
    const githubNamePattern = /^[a-zA-Z0-9._-]+$/;
    
    if (!githubNamePattern.test(owner)) {
      result.error = `Invalid owner name: "${owner}". Owner names can only contain alphanumeric characters, hyphens, underscores, and dots.`;
      return result;
    }
    
    if (!githubNamePattern.test(repo)) {
      result.error = `Invalid repository name: "${repo}". Repository names can only contain alphanumeric characters, hyphens, underscores, and dots.`;
      return result;
    }

    // Remove common suffixes
    let cleanRepo = repo.replace(/\.git$/i, '');
    
    result.owner = owner;
    result.repo = cleanRepo;
    result.isValid = true;
    
    return result;
    
  } catch (error) {
    result.error = 'Failed to parse URL';
    return result;
  }
}

/**
 * Validates GitHub repository URL and returns a user-friendly error message
 */
export function validateGitHubRepoUrl(url: string): { isValid: boolean; error?: string } {
  const parsed = parseGitHubRepoUrl(url);
  return {
    isValid: parsed.isValid,
    error: parsed.error
  };
}