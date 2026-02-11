// ==============================================
// React Query Hooks for GitHub Data
// ==============================================

import { useQuery } from '@tanstack/react-query';
import githubService from '@services/githubService';
import { useAuth } from '@contexts/AuthContext';

/**
 * Fetch all organizations the authenticated user belongs to.
 */
export function useOrganizations() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => githubService.getOrganizations(),
    enabled: isAuthenticated,
  });
}

/**
 * Fetch members of a specific organization.
 */
export function useOrgMembers(org: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['org-members', org],
    queryFn: () => githubService.getOrgMembers(org),
    enabled: isAuthenticated && !!org,
  });
}

/**
 * Fetch members with 2FA disabled for an organization.
 */
export function useOrgMembers2FADisabled(org: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['org-members-2fa-disabled', org],
    queryFn: () => githubService.getOrgMembers2FADisabled(org),
    enabled: isAuthenticated && !!org,
  });
}

/**
 * Fetch repositories (user's own or organization's).
 */
export function useRepositories(org?: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['repositories', org ?? 'user'],
    queryFn: () => (org ? githubService.getOrgRepos(org) : githubService.getUserRepos()),
    enabled: isAuthenticated,
  });
}

/**
 * Fetch Copilot billing information for an organization.
 */
export function useCopilotBilling(org: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['copilot-billing', org],
    queryFn: () => githubService.getCopilotBilling(org),
    enabled: isAuthenticated && !!org,
    retry: 1, // Copilot API may not be available for all orgs
  });
}

/**
 * Fetch Copilot seats for an organization.
 */
export function useCopilotSeats(org: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['copilot-seats', org],
    queryFn: () => githubService.getCopilotSeats(org),
    enabled: isAuthenticated && !!org,
    retry: 1,
  });
}

/**
 * Fetch authenticated user's recent events.
 */
export function useUserEvents() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['user-events'],
    queryFn: () => githubService.getUserEvents(),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes for activity
  });
}
