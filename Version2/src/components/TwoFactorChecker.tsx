import { useState, useEffect, useCallback } from 'react';
import githubService from '../services/githubService';
import type { GitHubOrg } from '../services/githubService';
import { motion } from 'framer-motion';
import Card from './ui/Card';
import Button from './ui/Button';
import { 
  Shield, 
  Users, 
  RefreshCw, 
  Download, 
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  X
} from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface TwoFactorCheckerProps {
  token: string;
  onBack: () => void;
}

interface OrgMember {
  login: string;
  id: number;
  avatar_url: string;
  type: string;
  site_admin: boolean;
  role: 'admin' | 'member';
  two_factor_authentication: boolean;
  access_type: 'organization' | 'repository';
  repository_name?: string;
  permission?: string;
}

interface RawMemberData {
  login: string;
  id: number;
  avatar_url: string;
  type: string;
  site_admin: boolean;
}

interface OrganizationData {
  org: GitHubOrg;
  requiresTwoFactor: boolean;
  members: OrgMember[];
  loading: boolean;
  error: string | null;
}

interface FilterOptions {
  showCompliant: boolean;
  showNonCompliant: boolean;
  roleFilter: 'all' | 'admin' | 'member';
}

interface ScanProgress {
  isScanning: boolean;
  currentOrg: string;
  totalOrgs: number;
  completedOrgs: number;
  startTime: number;
}

// Local storage keys
const STORAGE_KEYS = {
  ORG_DATA: 'twofa-org-data',
  ORGANIZATIONS: 'twofa-organizations',
  SCAN_PROGRESS: 'twofa-scan-progress',
  LAST_SCAN: 'twofa-last-scan'
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function TwoFactorChecker({ token, onBack: _onBack }: TwoFactorCheckerProps) {
  const { toast, toasts } = useToast();
  const [organizations, setOrganizations] = useState<GitHubOrg[]>([]);
  const [orgData, setOrgData] = useState<Record<string, OrganizationData>>({});
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [error, setError] = useState('');
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    isScanning: false,
    currentOrg: '',
    totalOrgs: 0,
    completedOrgs: 0,
    startTime: 0
  });
  const [lastScanTime, setLastScanTime] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    showCompliant: true,
    showNonCompliant: true,
    roleFilter: 'all'
  });

  // Load user's organizations
  useEffect(() => {
    console.log('TwoFactorChecker mounted with token:', token ? 'Token present' : 'No token');
    if (token) {
      loadFromLocalStorage();
      loadOrganizations();
    } else {
      setError('No GitHub token provided');
    }
  }, [token]);

  // Local storage functions
  const saveToLocalStorage = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }, []);

  const loadFromLocalStorage = useCallback(() => {
    try {
      // Load cached organizations
      const cachedOrgs = localStorage.getItem(STORAGE_KEYS.ORGANIZATIONS);
      if (cachedOrgs) {
        setOrganizations(JSON.parse(cachedOrgs));
      }

      // Load cached org data
      const cachedOrgData = localStorage.getItem(STORAGE_KEYS.ORG_DATA);
      if (cachedOrgData) {
        setOrgData(JSON.parse(cachedOrgData));
      }

      // Load scan progress
      const cachedProgress = localStorage.getItem(STORAGE_KEYS.SCAN_PROGRESS);
      if (cachedProgress) {
        const progress = JSON.parse(cachedProgress);
        setScanProgress(progress);
        
        // If there was a scan in progress, resume it
        if (progress.isScanning) {
          toast.info('Resuming background scan', 'Previous scan was interrupted and will continue');
          resumeBackgroundScan();
        }
      }

      // Load last scan time
      const lastScan = localStorage.getItem(STORAGE_KEYS.LAST_SCAN);
      if (lastScan) {
        setLastScanTime(parseInt(lastScan));
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  }, [toast]);

  const resumeBackgroundScan = useCallback(async () => {
    // This will resume scanning for organizations that haven't been completed yet
    const cachedOrgs = localStorage.getItem(STORAGE_KEYS.ORGANIZATIONS);
    if (cachedOrgs) {
      const orgs = JSON.parse(cachedOrgs);
      const cachedOrgData = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORG_DATA) || '{}');
      
      // Find organizations that need scanning
      const orgsToScan = orgs.filter((org: GitHubOrg) => 
        !cachedOrgData[org.login] || cachedOrgData[org.login].members.length === 0
      );
      
      if (orgsToScan.length > 0) {
        await startBackgroundScan(orgs, orgsToScan);
      }
    }
  }, []);

  // Background scanning functionality
  const startBackgroundScan = useCallback(async (allOrgs: GitHubOrg[], orgsToScan?: GitHubOrg[]) => {
    const targetOrgs = orgsToScan || allOrgs;
    
    if (targetOrgs.length === 0) {
      toast.success('Scan Complete', 'All organizations have been scanned');
      return;
    }

    const progress: ScanProgress = {
      isScanning: true,
      currentOrg: '',
      totalOrgs: targetOrgs.length,
      completedOrgs: 0,
      startTime: Date.now()
    };

    setScanProgress(progress);
    saveToLocalStorage(STORAGE_KEYS.SCAN_PROGRESS, progress);

    toast.info('Background Scan Started', 
      `Scanning ${targetOrgs.length} organization(s). This will take a few minutes. You can navigate away and come back later.`
    );

    // Scan organizations one by one
    for (let i = 0; i < targetOrgs.length; i++) {
      const org = targetOrgs[i];
      
      const currentProgress: ScanProgress = {
        ...progress,
        currentOrg: org.login,
        completedOrgs: i
      };
      
      setScanProgress(currentProgress);
      saveToLocalStorage(STORAGE_KEYS.SCAN_PROGRESS, currentProgress);

      try {
        await fetchOrganizationData(org.login, false); // Don't show individual loading states
        
        // Small delay between organizations to avoid rate limiting
        if (i < targetOrgs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Failed to scan organization ${org.login}:`, error);
      }
    }

    // Scan completed
    const completedProgress: ScanProgress = {
      ...progress,
      isScanning: false,
      currentOrg: '',
      completedOrgs: targetOrgs.length
    };

    setScanProgress(completedProgress);
    setLastScanTime(Date.now());
    saveToLocalStorage(STORAGE_KEYS.SCAN_PROGRESS, completedProgress);
    saveToLocalStorage(STORAGE_KEYS.LAST_SCAN, Date.now().toString());

    toast.success('Scan Complete!', 
      `Successfully scanned ${targetOrgs.length} organization(s). Data is now available.`
    );
  }, [toast, saveToLocalStorage]);

  const loadOrganizations = async () => {
    console.log('Loading organizations...');
    setIsLoadingOrgs(true);
    setError('');
    
    try {
      if (!token) {
        throw new Error('No GitHub token provided');
      }
      
      console.log('Setting GitHub token...');
      githubService.setToken(token);
      
      console.log('Fetching user organizations...');
      const orgs = await githubService.getUserOrganizations();
      console.log('Organizations loaded:', orgs.length);
      setOrganizations(orgs);
      saveToLocalStorage(STORAGE_KEYS.ORGANIZATIONS, orgs);
      
      // Initialize org data only for new organizations
      const currentOrgData = { ...orgData };
      orgs.forEach(org => {
        if (!currentOrgData[org.login]) {
          currentOrgData[org.login] = {
            org,
            requiresTwoFactor: false,
            members: [],
            loading: false,
            error: null
          };
        }
      });
      setOrgData(currentOrgData);
      saveToLocalStorage(STORAGE_KEYS.ORG_DATA, currentOrgData);
      console.log('Organization data initialized');
      
    } catch (err) {
      console.error('Error loading organizations:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch organizations';
      setError(errorMessage);
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  const fetchOrganizationData = async (orgLogin: string, showLoading = true) => {
    if (showLoading) {
      setOrgData(prev => ({
        ...prev,
        [orgLogin]: {
          ...prev[orgLogin],
          loading: true,
          error: null
        }
      }));
    }

    try {
      // Fetch organization details to check 2FA requirement
      const orgResponse = await fetch(`https://api.github.com/orgs/${orgLogin}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!orgResponse.ok) {
        throw new Error('Failed to fetch organization details');
      }

      const orgDetails = await orgResponse.json();
      const requiresTwoFactor = orgDetails.two_factor_requirement_enabled || false;

      // Fetch organization members with 2FA status
      const membersResponse = await fetch(`https://api.github.com/orgs/${orgLogin}/members?filter=2fa_disabled&per_page=100`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      let nonCompliantMembers: OrgMember[] = [];
      if (membersResponse.ok) {
        nonCompliantMembers = await membersResponse.json();
        // Add 2FA status and access type
        nonCompliantMembers = nonCompliantMembers.map(member => ({
          ...member,
          role: 'member' as 'admin' | 'member',
          two_factor_authentication: false,
          access_type: 'organization' as 'organization' | 'repository'
        }));
      }

      // Fetch all members to get complete list and roles
      const allMembersResponse = await fetch(`https://api.github.com/orgs/${orgLogin}/members?per_page=100`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      let allMembers: OrgMember[] = [];
      if (allMembersResponse.ok) {
        const allMembersData = await allMembersResponse.json();
        
        // For each member, get their role and 2FA status
        const membersWithDetails = await Promise.all(
          allMembersData.map(async (member: RawMemberData) => {
            // Check if user is in non-compliant list
            const isNonCompliant = nonCompliantMembers.some(nc => nc.login === member.login);
            
            // Get member role
            try {
              const membershipResponse = await fetch(`https://api.github.com/orgs/${orgLogin}/memberships/${member.login}`, {
                headers: {
                  'Authorization': `token ${token}`,
                  'Accept': 'application/vnd.github.v3+json',
                },
              });
              
              let role: 'admin' | 'member' = 'member';
              if (membershipResponse.ok) {
                const membershipData = await membershipResponse.json();
                role = membershipData.role === 'admin' ? 'admin' : 'member';
              }

              return {
                ...member,
                role,
                two_factor_authentication: !isNonCompliant,
                access_type: 'organization' as 'organization' | 'repository'
              };
            } catch {
              return {
                ...member,
                role: 'member' as 'admin' | 'member',
                two_factor_authentication: !isNonCompliant,
                access_type: 'organization' as 'organization' | 'repository'
              };
            }
          })
        );

        allMembers = membersWithDetails;
      }

      // Fetch organization repositories and their collaborators
      const reposResponse = await fetch(`https://api.github.com/orgs/${orgLogin}/repos?per_page=100`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (reposResponse.ok) {
        const repos = await reposResponse.json();
        
        // For each repository, fetch collaborators
        for (const repo of repos) {
          try {
            const collaboratorsResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/collaborators`, {
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            });

            if (collaboratorsResponse.ok) {
              const collaborators = await collaboratorsResponse.json();
              
              for (const collaborator of collaborators) {
                // Only add if not already in organization members
                const existingMember = allMembers.find(m => m.login === collaborator.login);
                if (!existingMember) {
                  // Check 2FA status for this collaborator
                  let twoFactorEnabled = true;
                  try {
                    const userResponse = await fetch(`https://api.github.com/users/${collaborator.login}`, {
                      headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                      },
                    });
                    
                    if (userResponse.ok) {
                      const userData = await userResponse.json();
                      twoFactorEnabled = userData.two_factor_authentication !== false;
                    }
                  } catch {
                    twoFactorEnabled = true;
                  }

                  allMembers.push({
                    login: collaborator.login,
                    id: collaborator.id,
                    avatar_url: collaborator.avatar_url,
                    type: collaborator.type,
                    site_admin: collaborator.site_admin || false,
                    role: collaborator.permissions?.admin ? 'admin' : 'member',
                    two_factor_authentication: twoFactorEnabled,
                    access_type: 'repository',
                    repository_name: repo.name,
                    permission: collaborator.permissions?.admin ? 'admin' : 
                               collaborator.permissions?.push ? 'push' : 
                               collaborator.permissions?.pull ? 'pull' : 'unknown'
                  });
                }
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch collaborators for ${repo.full_name}:`, err);
          }
        }
      }

      const updatedOrgData = {
        ...orgData,
        [orgLogin]: {
          ...orgData[orgLogin],
          requiresTwoFactor,
          members: allMembers,
          loading: false,
          error: null
        }
      };

      setOrgData(updatedOrgData);
      saveToLocalStorage(STORAGE_KEYS.ORG_DATA, updatedOrgData);

    } catch (err) {
      const updatedOrgData = {
        ...orgData,
        [orgLogin]: {
          ...orgData[orgLogin],
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch organization data'
        }
      };

      setOrgData(updatedOrgData);
      saveToLocalStorage(STORAGE_KEYS.ORG_DATA, updatedOrgData);
    }
  };

  const getFilteredMembers = (members: OrgMember[]) => {
    return members.filter(member => {
      // Role filter
      if (filters.roleFilter !== 'all' && member.role !== filters.roleFilter) {
        return false;
      }

      // Compliance filter
      if (!filters.showCompliant && member.two_factor_authentication) {
        return false;
      }
      if (!filters.showNonCompliant && !member.two_factor_authentication) {
        return false;
      }

      return true;
    });
  };

  const exportToCSV = (name: string, data: OrgMember[]) => {
    const filteredMembers = getFilteredMembers(data);
    
    const headers = ['Username', 'Role', '2FA Enabled', 'Access Type', 'Repository', 'Permission', 'User ID'];
    const csvContent = [
      headers.join(','),
      ...filteredMembers.map(member => [
        `"${member.login}"`,
        `"${member.role}"`,
        member.two_factor_authentication ? 'Yes' : 'No',
        `"${member.access_type}"`,
        `"${member.repository_name || 'N/A'}"`,
        `"${member.permission || 'N/A'}"`,
        member.id
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${name}-2fa-compliance-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getComplianceStats = (data: OrgMember[]) => {
    const total = data.length;
    const compliant = data.filter(item => item.two_factor_authentication).length;
    const nonCompliant = total - compliant;
    const compliancePercentage = total > 0 ? Math.round((compliant / total) * 100) : 0;

    return {
      total,
      compliant,
      nonCompliant,
      compliancePercentage
    };
  };

  const stopScanning = () => {
    console.log('Stop scanning requested...');
    
    // Update scan progress to stop
    setScanProgress({
      isScanning: false,
      currentOrg: '',
      completedOrgs: scanProgress.completedOrgs,
      totalOrgs: organizations.length,
      startTime: scanProgress.startTime
    });
    
    // Save current progress to localStorage
    localStorage.setItem(STORAGE_KEYS.SCAN_PROGRESS, JSON.stringify({
      isScanning: false,
      currentOrg: '',
      completedOrgs: scanProgress.completedOrgs,
      totalOrgs: organizations.length,
      startTime: scanProgress.startTime
    }));
    
    // Show toast notification
    toast.info('Scan Stopped', 'Background scanning has been stopped. Partial results are available.');
  };

  const resetData = () => {
    console.log('Reset scan clicked - starting background scan...');
    
    // Clear current data
    setExpandedOrg(null);
    setOrgData({});
    setError('');
    
    // Clear localStorage
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Load fresh organizations and start background scan
    loadOrganizations().then(() => {
      // Start background scan after organizations are loaded
      const orgsFromStorage = localStorage.getItem(STORAGE_KEYS.ORGANIZATIONS);
      if (orgsFromStorage) {
        const orgs = JSON.parse(orgsFromStorage);
        startBackgroundScan(orgs);
      }
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full"
      >
      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={resetData}
            disabled={scanProgress.isScanning}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${scanProgress.isScanning ? 'animate-spin' : ''}`} />
            {scanProgress.isScanning ? 'Scanning...' : 'Start New Scan'}
          </Button>
          
          {scanProgress.isScanning && (
            <Button
              variant="outline"
              onClick={stopScanning}
              className="flex items-center gap-2 text-red-400 border-red-500/20 hover:bg-red-500/10"
            >
              <X className="w-4 h-4" />
              Stop Scanning
            </Button>
          )}
          
          {scanProgress.isScanning && (
            <Card className="px-4 py-2 bg-blue-500/10 border-blue-500/20 flex items-center gap-3">
              <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
              <div className="text-sm">
                <span className="text-blue-400 font-medium">
                  Scanning {scanProgress.currentOrg || '...'}
                </span>
                <span className="text-dark-text-muted ml-2">
                  ({scanProgress.completedOrgs}/{scanProgress.totalOrgs})
                </span>
              </div>
              <div className="w-16 bg-dark-border rounded-full h-2">
                <div 
                  className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(scanProgress.completedOrgs / scanProgress.totalOrgs) * 100}%` 
                  }}
                />
              </div>
            </Card>
          )}

          {lastScanTime && !scanProgress.isScanning && (
            <Card className="px-4 py-2 bg-green-500/10 border-green-500/20 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">
                Last scan: {new Date(lastScanTime).toLocaleTimeString()}
              </span>
            </Card>
          )}
        </div>
      </motion.div>

      {/* Error Banner */}
      {error && (
        <motion.div variants={itemVariants} className="mb-6">
          <Card className="p-4 bg-red-500/10 border-red-500/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-brand-primary" />
            <h3 className="text-lg font-semibold text-dark-text">Filters</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {/* Compliance Filter */}
            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Show Members
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showCompliant}
                    onChange={(e) => setFilters(prev => ({ ...prev, showCompliant: e.target.checked }))}
                    className="mr-2 rounded border-dark-border bg-dark-card text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-sm text-dark-text-muted">2FA Enabled</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showNonCompliant}
                    onChange={(e) => setFilters(prev => ({ ...prev, showNonCompliant: e.target.checked }))}
                    className="mr-2 rounded border-dark-border bg-dark-card text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-sm text-dark-text-muted">2FA Disabled</span>
                </label>
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Role Filter
              </label>
              <select
                value={filters.roleFilter}
                onChange={(e) => setFilters(prev => ({ ...prev, roleFilter: e.target.value as 'all' | 'admin' | 'member' }))}
                className="w-full px-3 py-2 border border-dark-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-dark-card text-dark-text"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins Only</option>
                <option value="member">Members Only</option>
              </select>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Organizations List */}
      {isLoadingOrgs ? (
        <motion.div variants={itemVariants}>
          <Card className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            <p className="text-dark-text-muted mt-4">Loading organizations...</p>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          className="space-y-4"
        >
          {organizations.map((org) => {
            const data = orgData[org.login];
            const isExpanded = expandedOrg === org.login;
            const stats = data?.members ? getComplianceStats(data.members) : null;
            
            return (
              <motion.div key={org.login} variants={itemVariants}>
                <Card className="overflow-hidden">
                  {/* Organization Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-dark-card/50 transition-colors"
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedOrg(null);
                      } else {
                        setExpandedOrg(org.login);
                        if (!data?.members.length && !data?.loading) {
                          fetchOrganizationData(org.login);
                        }
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={org.avatar_url} 
                          alt={org.login}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-dark-text">
                            {org.login}
                          </h3>
                          <p className="text-sm text-dark-text-muted">
                            {org.description || 'No description available'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {data?.requiresTwoFactor && (
                          <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded border border-green-500/30">
                            2FA Required
                          </span>
                        )}
                        {data?.members && data.members.length > 0 && (
                          <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded border border-blue-500/30 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Cached Data
                          </span>
                        )}
                        {stats && (
                          <div className="text-right">
                            <div className={`text-sm font-medium ${
                              stats.compliancePercentage >= 95 ? 'text-green-400' :
                              stats.compliancePercentage >= 80 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {stats.compliancePercentage}% Compliant
                            </div>
                            <div className="text-xs text-dark-text-muted">
                              {stats.compliant}/{stats.total} users
                            </div>
                          </div>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-dark-text-muted" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-dark-text-muted" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Organization Details */}
                  {isExpanded && (
                    <div className="border-t border-dark-border p-4">
                      {data?.loading ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
                          <p className="text-dark-text-muted mt-2">Loading organization data...</p>
                        </div>
                      ) : data?.error ? (
                        <div className="text-center py-4 text-red-400">
                          <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                          <p>Error: {data.error}</p>
                          <Button
                            variant="outline"
                            onClick={() => fetchOrganizationData(org.login)}
                            className="mt-2"
                          >
                            Retry
                          </Button>
                        </div>
                      ) : data?.members ? (
                        <div className="space-y-4">
                          {/* Compliance Overview */}
                          {(() => {
                            const overallStats = getComplianceStats(data.members);
                            const orgMembers = data.members.filter(m => m.access_type === 'organization');
                            const repoCollaborators = data.members.filter(m => m.access_type === 'repository');
                            const orgStats = getComplianceStats(orgMembers);
                            const repoStats = getComplianceStats(repoCollaborators);
                            
                            return (
                              <div className="space-y-4">
                                {/* Overall Stats */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                  <Card className="p-4 text-center bg-blue-500/10 border-blue-500/20">
                                    <div className="text-2xl font-bold text-blue-400">
                                      {overallStats.total}
                                    </div>
                                    <div className="text-sm text-blue-300">Total Users</div>
                                  </Card>
                                  <Card className="p-4 text-center bg-green-500/10 border-green-500/20">
                                    <div className="text-2xl font-bold text-green-400">
                                      {overallStats.compliant}
                                    </div>
                                    <div className="text-sm text-green-300">2FA Enabled</div>
                                  </Card>
                                  <Card className="p-4 text-center bg-red-500/10 border-red-500/20">
                                    <div className="text-2xl font-bold text-red-400">
                                      {overallStats.nonCompliant}
                                    </div>
                                    <div className="text-sm text-red-300">2FA Disabled</div>
                                  </Card>
                                  <Card className={`p-4 text-center ${
                                    overallStats.compliancePercentage >= 95 ? 'bg-green-500/10 border-green-500/20' :
                                    overallStats.compliancePercentage >= 80 ? 'bg-yellow-500/10 border-yellow-500/20' :
                                    'bg-red-500/10 border-red-500/20'
                                  }`}>
                                    <div className={`text-2xl font-bold ${
                                      overallStats.compliancePercentage >= 95 ? 'text-green-400' :
                                      overallStats.compliancePercentage >= 80 ? 'text-yellow-400' :
                                      'text-red-400'
                                    }`}>
                                      {overallStats.compliancePercentage}%
                                    </div>
                                    <div className={`text-sm ${
                                      overallStats.compliancePercentage >= 95 ? 'text-green-300' :
                                      overallStats.compliancePercentage >= 80 ? 'text-yellow-300' :
                                      'text-red-300'
                                    }`}>
                                      Compliance Rate
                                    </div>
                                  </Card>
                                </div>

                                {/* Breakdown by Access Type */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                                  <Card className="p-3">
                                    <h4 className="font-medium text-dark-text mb-2">Organization Members</h4>
                                    <div className="text-sm text-dark-text-muted">
                                      {orgStats.compliant}/{orgStats.total} compliant ({orgStats.compliancePercentage}%)
                                    </div>
                                  </Card>
                                  <Card className="p-3">
                                    <h4 className="font-medium text-dark-text mb-2">Repository Collaborators</h4>
                                    <div className="text-sm text-dark-text-muted">
                                      {repoStats.compliant}/{repoStats.total} compliant ({repoStats.compliancePercentage}%)
                                    </div>
                                  </Card>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Action Buttons */}
                          <div className="flex justify-between items-center mb-4">
                            <Button
                              variant="secondary"
                              onClick={() => fetchOrganizationData(org.login)}
                              className="flex items-center gap-2"
                            >
                              <RefreshCw className="w-4 h-4" />
                              Rescan Organization
                            </Button>
                            <Button
                              variant="primary"
                              onClick={() => exportToCSV(org.login, data.members)}
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Export CSV
                            </Button>
                          </div>

                          {/* Members List */}
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {getFilteredMembers(data.members).map((member) => (
                              <Card key={`${member.login}-${member.access_type}-${member.repository_name || 'org'}`} className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <img 
                                      src={member.avatar_url} 
                                      alt={member.login}
                                      className="w-8 h-8 rounded-full"
                                    />
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <span className="font-medium text-dark-text">
                                          {member.login}
                                        </span>
                                        <span className={`px-2 py-1 text-xs rounded ${
                                          member.role === 'admin' 
                                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                        }`}>
                                          {member.role}
                                        </span>
                                        <span className={`px-2 py-1 text-xs rounded ${
                                          member.access_type === 'organization'
                                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                            : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                        }`}>
                                          {member.access_type}
                                        </span>
                                      </div>
                                      <div className="text-sm text-dark-text-muted">
                                        {member.access_type === 'repository' ? (
                                          <>Repository: {member.repository_name} ({member.permission})</>
                                        ) : (
                                          <>ID: {member.id}</>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <span className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 ${
                                      member.two_factor_authentication
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    }`}>
                                      {member.two_factor_authentication ? (
                                        <>
                                          <CheckCircle className="w-3 h-3" />
                                          2FA Enabled
                                        </>
                                      ) : (
                                        <>
                                          <AlertTriangle className="w-3 h-3" />
                                          2FA Disabled
                                        </>
                                      )}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => window.open(`https://github.com/${member.login}`, '_blank')}
                                      className="text-blue-400 hover:text-blue-300"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                            {getFilteredMembers(data.members).length === 0 && (
                              <Card className="p-8 text-center">
                                <p className="text-dark-text-muted">No users match the current filters</p>
                              </Card>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Button
                            variant="primary"
                            onClick={() => fetchOrganizationData(org.login)}
                            className="flex items-center gap-2 mx-auto"
                          >
                            <Shield className="w-4 h-4" />
                            Load Organization Data
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {organizations.length === 0 && !isLoadingOrgs && (
        <motion.div variants={itemVariants}>
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 text-dark-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-text mb-2">No Organizations Found</h3>
            <p className="text-dark-text-muted mb-6">
              {error ? (
                <>Error loading organizations: {error}</>
              ) : (
                <>You don't have access to any organizations, or they might be private.</>
              )}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="primary"
                onClick={resetData}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.open('https://github.com/settings/organizations', '_blank')}
                className="flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Manage Organizations
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
    
    {/* Toast Notifications */}
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.length > 0 && (
        <div>
          {/* Toast notifications would render here in a real implementation */}
        </div>
      )}
    </div>
    </>
  );
}
