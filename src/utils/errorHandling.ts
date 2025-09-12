// Enhanced error handling utilities
export interface ErrorDetails {
  title: string;
  message: string;
  actionable?: string;
  suggestion?: string;
  type: 'error' | 'warning' | 'info';
  code?: string;
}

export interface GitHubAPIError {
  message: string;
  documentation_url?: string;
  errors?: Array<{
    field: string;
    code: string;
    message: string;
  }>;
}

/**
 * Enhanced GitHub API error handler with actionable suggestions
 */
export function handleGitHubAPIError(error: any, context?: string): ErrorDetails {
  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to GitHub',
      actionable: 'Check your internet connection and try again',
      suggestion: 'If the problem persists, GitHub may be experiencing issues',
      type: 'error',
      code: 'NETWORK_ERROR'
    };
  }

  // Handle GitHub API errors
  if (error.status) {
    switch (error.status) {
      case 401:
        return {
          title: 'Authentication Failed',
          message: 'Your GitHub token is invalid or expired',
          actionable: 'Please re-authenticate with GitHub',
          suggestion: 'Make sure your token has the required permissions',
          type: 'error',
          code: 'AUTH_ERROR'
        };
      
      case 403:
        const isRateLimit = error.message?.includes('rate limit');
        if (isRateLimit) {
          return {
            title: 'Rate Limit Exceeded',
            message: 'You have exceeded GitHub\'s API rate limit',
            actionable: 'Wait for the rate limit to reset or use a different token',
            suggestion: 'Consider using a GitHub App token for higher limits',
            type: 'warning',
            code: 'RATE_LIMIT'
          };
        }
        return {
          title: 'Permission Denied',
          message: 'You don\'t have permission to perform this action',
          actionable: 'Check if your token has the required permissions',
          suggestion: `Required permissions might include: repo, read:org, admin:org`,
          type: 'error',
          code: 'PERMISSION_DENIED'
        };
      
      case 404:
        return {
          title: 'Resource Not Found',
          message: context ? `${context} was not found` : 'The requested resource was not found',
          actionable: 'Verify the repository or organization name is correct',
          suggestion: 'Make sure you have access to this resource',
          type: 'error',
          code: 'NOT_FOUND'
        };
      
      case 422:
        return {
          title: 'Invalid Request',
          message: 'The request contains invalid data',
          actionable: 'Check your input and try again',
          suggestion: 'Verify usernames, repository names, and permissions are valid',
          type: 'error',
          code: 'VALIDATION_ERROR'
        };
      
      case 500:
      case 502:
      case 503:
        return {
          title: 'GitHub Server Error',
          message: 'GitHub is experiencing technical difficulties',
          actionable: 'Please try again in a few minutes',
          suggestion: 'Check GitHub\'s status page if the issue persists',
          type: 'error',
          code: 'SERVER_ERROR'
        };
    }
  }

  // Handle specific GitHub API errors
  if (error.message) {
    // Handle organization membership errors
    if (error.message.includes('Not Found') && context?.includes('organization')) {
      return {
        title: 'Organization Access Required',
        message: 'You don\'t have access to this organization',
        actionable: 'Request access from the organization owner',
        suggestion: 'You may need to be added as a member first',
        type: 'warning',
        code: 'ORG_ACCESS_REQUIRED'
      };
    }

    // Handle repository permission errors
    if (error.message.includes('collaborator') || error.message.includes('permission')) {
      return {
        title: 'Repository Permission Error',
        message: 'Unable to modify repository permissions',
        actionable: 'Check if you have admin access to this repository',
        suggestion: 'Only repository admins can manage collaborators',
        type: 'error',
        code: 'REPO_PERMISSION_ERROR'
      };
    }

    // Handle user not found errors
    if (error.message.includes('user') && error.message.includes('not found')) {
      return {
        title: 'User Not Found',
        message: 'The specified GitHub user does not exist',
        actionable: 'Double-check the username spelling',
        suggestion: 'Make sure the user has a GitHub account',
        type: 'error',
        code: 'USER_NOT_FOUND'
      };
    }
  }

  // Generic error fallback
  return {
    title: 'Unexpected Error',
    message: error.message || 'An unexpected error occurred',
    actionable: 'Please try again',
    suggestion: 'Contact support if the problem continues',
    type: 'error',
    code: 'GENERIC_ERROR'
  };
}

/**
 * Format error for user-friendly display
 */
export function formatErrorMessage(errorDetails: ErrorDetails): string {
  let message = `${errorDetails.title}: ${errorDetails.message}`;
  
  if (errorDetails.actionable) {
    message += `\n\n💡 What to do: ${errorDetails.actionable}`;
  }
  
  if (errorDetails.suggestion) {
    message += `\n\n💭 Tip: ${errorDetails.suggestion}`;
  }
  
  return message;
}

/**
 * Validation error handler for form inputs
 */
export function handleValidationError(field: string, value: string): ErrorDetails | null {
  switch (field) {
    case 'username':
      if (!value.trim()) {
        return {
          title: 'Username Required',
          message: 'Please enter a GitHub username',
          actionable: 'Enter a valid GitHub username or email address',
          type: 'error',
          code: 'REQUIRED_FIELD'
        };
      }
      if (value.length > 39) {
        return {
          title: 'Username Too Long',
          message: 'GitHub usernames cannot exceed 39 characters',
          actionable: 'Use a shorter username',
          type: 'error',
          code: 'USERNAME_LENGTH'
        };
      }
      break;
    
    case 'repository':
      if (!value.trim()) {
        return {
          title: 'Repository Required',
          message: 'Please enter a repository name',
          actionable: 'Enter a valid repository name',
          type: 'error',
          code: 'REQUIRED_FIELD'
        };
      }
      if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
        return {
          title: 'Invalid Repository Name',
          message: 'Repository names can only contain letters, numbers, dots, hyphens, and underscores',
          actionable: 'Remove special characters from the repository name',
          type: 'error',
          code: 'INVALID_REPO_NAME'
        };
      }
      break;
    
    case 'organization':
      if (!value.trim()) {
        return {
          title: 'Organization Required',
          message: 'Please select an organization',
          actionable: 'Choose an organization from the dropdown',
          type: 'error',
          code: 'REQUIRED_FIELD'
        };
      }
      break;
  }
  
  return null;
}

/**
 * Success message handler
 */
export interface SuccessDetails {
  title: string;
  message: string;
  nextStep?: string;
  type: 'success';
}

export function createSuccessMessage(action: string, details?: string): SuccessDetails {
  const messages: Record<string, SuccessDetails> = {
    'user_invited': {
      title: 'Invitation Sent Successfully',
      message: details || 'The user has been invited to the repository',
      nextStep: 'They will receive an email invitation to collaborate',
      type: 'success'
    },
    'access_granted': {
      title: 'Access Granted',
      message: details || 'User access has been successfully granted',
      nextStep: 'The user can now access the repository',
      type: 'success'
    },
    'user_removed': {
      title: 'Access Removed',
      message: details || 'User access has been successfully removed',
      nextStep: 'The user can no longer access the repository',
      type: 'success'
    },
    'export_completed': {
      title: 'Export Completed',
      message: details || 'Data has been successfully exported',
      nextStep: 'Check your downloads folder for the file',
      type: 'success'
    }
  };

  return messages[action] || {
    title: 'Operation Successful',
    message: details || 'The operation completed successfully',
    type: 'success'
  };
}

/**
 * Loading state messages
 */
export function getLoadingMessage(action: string): string {
  const messages: Record<string, string> = {
    'fetching_repos': 'Loading repositories...',
    'fetching_users': 'Loading users...',
    'fetching_orgs': 'Loading organizations...',
    'inviting_user': 'Sending invitation...',
    'removing_access': 'Removing access...',
    'granting_access': 'Granting access...',
    'checking_permissions': 'Checking permissions...',
    'exporting_data': 'Preparing export...',
    'parsing_url': 'Parsing repository URL...',
    'validating_input': 'Validating input...'
  };

  return messages[action] || 'Please wait...';
}
