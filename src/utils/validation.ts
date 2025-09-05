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
 * Validates and sanitizes a list of GitHub usernames
 * Returns both valid usernames and validation errors
 */
export function validateGitHubUsernames(usernames: string[]): {
  validUsernames: string[];
  errors: string[];
} {
  const validUsernames: string[] = [];
  const errors: string[] = [];

  for (const username of usernames) {
    const trimmed = username.trim();
    
    if (trimmed.length === 0) {
      continue; // Skip empty usernames
    }

    if (isEmailAddress(trimmed)) {
      errors.push(`"${trimmed}" appears to be an email address. Please use GitHub username instead.`);
    } else if (!validateGitHubUsername(trimmed)) {
      errors.push(`"${trimmed}" is not a valid GitHub username format.`);
    } else {
      validUsernames.push(trimmed);
    }
  }

  return { validUsernames, errors };
}