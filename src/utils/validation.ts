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