// Utility functions for GitSecureOps

export const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export const isValidGitHubToken = (token: string): boolean => {
  // GitHub personal access tokens start with 'ghp_' for fine-grained tokens
  // or 'github_pat_' for fine-grained personal access tokens
  // Classic tokens are 40 characters of alphanumeric characters
  const patterns = [
    /^ghp_[a-zA-Z0-9]{36}$/, // Fine-grained token
    /^github_pat_[a-zA-Z0-9_]{82}$/, // Fine-grained personal access token
    /^[a-f0-9]{40}$/, // Classic token
    /^gho_[a-zA-Z0-9]{36}$/, // OAuth token
  ];
  
  return patterns.some(pattern => pattern.test(token));
};

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};
